import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Ticket } from './core/models';
import { seedTickets } from './core/seed';
import { compliance, dueAt, slaState, timeLeft } from './core/sla';
import { Store } from './core/store';

const H = 3_600_000;
const NOW = 1_800_000_000_000;
const mk = (over: Partial<Ticket>): Ticket => ({
  id: 1, subject: 's', customer: 'c', queue: 'Support', priority: 'high', status: 'open',
  assignee: null, createdAt: NOW, resolvedAt: null, comments: [], ...over,
});

describe('SLA', () => {
  it('computes due date from priority', () => {
    expect(dueAt(mk({ priority: 'urgent' })) - NOW).toBe(4 * H);
    expect(dueAt(mk({ priority: 'low' })) - NOW).toBe(72 * H);
  });

  it('classifies ok / risk / breached', () => {
    expect(slaState(mk({}), NOW + 1 * H)).toBe('ok');
    expect(slaState(mk({}), NOW + 7 * H)).toBe('risk'); // 1h of 8h left (<25%)
    expect(slaState(mk({}), NOW + 9 * H)).toBe('breached');
  });

  it('classifies resolved tickets as met or missed', () => {
    expect(slaState(mk({ resolvedAt: NOW + 5 * H }), NOW + 99 * H)).toBe('met');
    expect(slaState(mk({ resolvedAt: NOW + 9 * H }), NOW + 99 * H)).toBe('missed');
  });

  it('formats time left and overdue', () => {
    expect(timeLeft(mk({}), NOW + 5.5 * H)).toBe('2h 30m left');
    expect(timeLeft(mk({}), NOW + 9 * H)).toBe('Overdue 1h 00m');
    expect(timeLeft(mk({ priority: 'low' }), NOW)).toBe('3d 0h left');
  });

  it('computes compliance over finished tickets and handles empty data', () => {
    expect(compliance([], NOW)).toBeNull();
    const list = [mk({ resolvedAt: NOW + H }), mk({ resolvedAt: NOW + 20 * H }), mk({}), mk({ resolvedAt: NOW + 2 * H })];
    // 2 met, 1 missed; the open ticket is not finished yet at NOW
    expect(compliance(list, NOW)).toBe(67);
  });
});

describe('Store', () => {
  let store: Store;
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    store = TestBed.inject(Store);
  });

  it('seeds demo tickets with some breached and some at risk', () => {
    expect(store.tickets().length).toBe(seedTickets(Date.now()).length);
    expect(store.breached().length).toBeGreaterThan(0);
    expect(store.atRisk().length).toBeGreaterThan(0);
  });

  it('creates a ticket and persists it to localStorage', () => {
    const id = store.create({ subject: ' Printer ', customer: 'Acme', queue: 'Support', priority: 'low', message: 'Jammed' });
    expect(store.get(id)?.subject).toBe('Printer');
    expect(JSON.parse(localStorage.getItem('helpdesk.tickets.v1')!).some((t: Ticket) => t.id === id)).toBe(true);
  });

  it('resolving sets resolvedAt and reopening clears it', () => {
    const id = store.open()[0].id;
    store.setStatus(id, 'resolved');
    expect(store.get(id)?.resolvedAt).not.toBeNull();
    store.setStatus(id, 'open');
    expect(store.get(id)?.resolvedAt).toBeNull();
  });

  it('assigning an open ticket moves it to in progress', () => {
    const id = store.create({ subject: 'x', customer: 'y', queue: 'Billing', priority: 'medium', message: 'm' });
    store.assign(id, 'Marina Costa');
    expect(store.get(id)).toMatchObject({ assignee: 'Marina Costa', status: 'progress' });
  });

  it('adds public and internal comments', () => {
    const id = store.open()[0].id;
    const n = store.get(id)!.comments.length;
    store.comment(id, ' hello ', true);
    const last = store.get(id)!.comments.at(-1)!;
    expect(store.get(id)!.comments.length).toBe(n + 1);
    expect(last).toMatchObject({ text: 'hello', internal: true });
  });

  it('survives corrupted storage', () => {
    localStorage.setItem('helpdesk.tickets.v1', '{oops');
    TestBed.resetTestingModule();
    expect(TestBed.inject(Store).tickets().length).toBeGreaterThan(0);
  });
});

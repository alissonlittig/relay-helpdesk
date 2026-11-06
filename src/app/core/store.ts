import { Injectable, computed, signal } from '@angular/core';
import { Comment, Priority, Queue, Status, Ticket } from './models';
import { seedTickets } from './seed';
import { compliance, slaState } from './sla';

const KEY = 'helpdesk.tickets.v1';

@Injectable({ providedIn: 'root' })
export class Store {
  /** Ticks every 30s so SLA countdowns stay live. */
  readonly now = signal(Date.now());
  readonly tickets = signal<Ticket[]>(this.load());

  readonly open = computed(() => this.tickets().filter((t) => t.status !== 'resolved'));
  readonly breached = computed(() => this.open().filter((t) => slaState(t, this.now()) === 'breached'));
  readonly atRisk = computed(() => this.open().filter((t) => slaState(t, this.now()) === 'risk'));
  readonly compliance = computed(() => compliance(this.tickets(), this.now()));

  constructor() {
    if (typeof window !== 'undefined') setInterval(() => this.now.set(Date.now()), 30_000);
  }

  private load(): Ticket[] {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw) as Ticket[];
    } catch {
      /* corrupted or blocked storage: start from the demo data */
    }
    return seedTickets(Date.now());
  }

  private save(list: Ticket[]) {
    this.tickets.set(list);
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
      /* storage full or blocked: keep working in memory */
    }
  }

  get(id: number) {
    return this.tickets().find((t) => t.id === id);
  }

  private patch(id: number, fn: (t: Ticket) => Ticket) {
    this.save(this.tickets().map((t) => (t.id === id ? fn(t) : t)));
  }

  create(p: { subject: string; customer: string; queue: Queue; priority: Priority; message: string }): number {
    const at = Date.now();
    const id = Math.max(1039, ...this.tickets().map((t) => t.id)) + 1;
    const t: Ticket = {
      id,
      subject: p.subject.trim(),
      customer: p.customer.trim(),
      queue: p.queue,
      priority: p.priority,
      status: 'open',
      assignee: null,
      createdAt: at,
      resolvedAt: null,
      comments: [{ id: `c${id}-0`, author: p.customer.trim(), role: 'customer', at, text: p.message.trim() }],
    };
    this.save([t, ...this.tickets()]);
    return id;
  }

  setStatus(id: number, status: Status) {
    const at = Date.now();
    this.patch(id, (t) => ({
      ...t,
      status,
      resolvedAt: status === 'resolved' ? at : null,
      comments: [...t.comments, { id: `s${at}`, author: 'System', role: 'system', at, text: `Status changed to ${status}.` }],
    }));
  }

  setPriority(id: number, priority: Priority) {
    this.patch(id, (t) => ({ ...t, priority }));
  }

  setQueue(id: number, queue: Queue) {
    this.patch(id, (t) => ({ ...t, queue }));
  }

  assign(id: number, assignee: string | null) {
    this.patch(id, (t) => ({ ...t, assignee, status: assignee && t.status === 'open' ? 'progress' : t.status }));
  }

  comment(id: number, text: string, internal: boolean, author = 'You') {
    const at = Date.now();
    const c: Comment = { id: `m${at}`, author, role: 'agent', at, text: text.trim(), internal };
    this.patch(id, (t) => ({ ...t, comments: [...t.comments, c] }));
  }

  reset() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    this.save(seedTickets(Date.now()));
  }
}

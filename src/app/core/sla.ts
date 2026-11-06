import { Priority, SlaState, Ticket } from './models';

const H = 3_600_000;
/** Resolution target per priority, in hours. */
export const SLA_HOURS: Record<Priority, number> = { urgent: 4, high: 8, medium: 24, low: 72 };

export const dueAt = (t: Pick<Ticket, 'createdAt' | 'priority'>) => t.createdAt + SLA_HOURS[t.priority] * H;

export function slaState(t: Ticket, now: number): SlaState {
  const due = dueAt(t);
  if (t.resolvedAt !== null) return t.resolvedAt <= due ? 'met' : 'missed';
  if (now > due) return 'breached';
  return due - now < (due - t.createdAt) * 0.25 ? 'risk' : 'ok';
}

/** "2h 05m left" / "Overdue 1h 10m" */
export function timeLeft(t: Ticket, now: number): string {
  if (t.resolvedAt !== null) return slaState(t, now) === 'met' ? 'Met' : 'Missed';
  const diff = dueAt(t) - now;
  const m = Math.floor(Math.abs(diff) / 60000);
  const txt =
    m >= 1440
      ? `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`
      : m >= 60
        ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`
        : `${m}m`;
  return diff < 0 ? `Overdue ${txt}` : `${txt} left`;
}

/** Share (0-100) of finished tickets (resolved or already breached) that met their target; null with no data. */
export function compliance(list: Ticket[], now: number): number | null {
  const finished = list.filter((t) => t.resolvedAt !== null || slaState(t, now) === 'breached');
  if (!finished.length) return null;
  const met = finished.filter((t) => slaState(t, now) === 'met').length;
  return Math.round((met / finished.length) * 100);
}

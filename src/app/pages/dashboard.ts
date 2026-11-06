import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlaChip } from '../core/chip';
import { PRIORITIES, QUEUES } from '../core/models';
import { compliance, dueAt } from '../core/sla';
import { Store } from '../core/store';

const DAY = 86_400_000;

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, SlaChip],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  readonly store = inject(Store);

  readonly byQueue = computed(() => {
    const max = Math.max(1, ...QUEUES.map((q) => this.store.open().filter((t) => t.queue === q).length));
    return QUEUES.map((q) => {
      const n = this.store.open().filter((t) => t.queue === q).length;
      return { q, n, w: (n / max) * 100 };
    });
  });

  readonly byPriority = computed(() =>
    PRIORITIES.map((p) => {
      const list = this.store.tickets().filter((t) => t.priority === p);
      return { p, pct: compliance(list, this.store.now()), n: list.length };
    }),
  );

  /** Created vs resolved for the last 7 days (day buckets ending now). */
  readonly week = computed(() => {
    const now = this.store.now();
    const days = Array.from({ length: 7 }, (_, i) => {
      const end = now - (6 - i) * DAY;
      const from = end - DAY;
      const label = new Date(end).toLocaleDateString('en-US', { weekday: 'short' });
      const inb = (x: number | null) => x !== null && x > from && x <= end;
      const ts = this.store.tickets();
      return { label, created: ts.filter((t) => inb(t.createdAt)).length, resolved: ts.filter((t) => inb(t.resolvedAt)).length };
    });
    const max = Math.max(1, ...days.flatMap((d) => [d.created, d.resolved]));
    return { days, max };
  });

  readonly urgent = computed(() =>
    [...this.store.open()]
      .filter((t) => t.priority === 'urgent' || t.priority === 'high' || this.store.breached().includes(t))
      .sort((a, b) => dueAt(a) - dueAt(b))
      .slice(0, 6),
  );

  readonly unassigned = computed(() => this.store.open().filter((t) => !t.assignee).length);
}

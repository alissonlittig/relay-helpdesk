import { Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SlaChip } from '../core/chip';
import { AGENTS, PRIORITIES, QUEUES, STATUSES, STATUS_LABEL } from '../core/models';
import { dueAt } from '../core/sla';
import { Store } from '../core/store';

const RANK = { urgent: 0, high: 1, medium: 2, low: 3 } as const;

@Component({
  selector: 'app-tickets',
  imports: [FormsModule, RouterLink, SlaChip, DatePipe],
  templateUrl: './tickets.html',
})
export class Tickets {
  readonly store = inject(Store);
  private readonly router = inject(Router);
  /** Bound from ?queue= via withComponentInputBinding. */
  readonly queue = input<string>();
  readonly queues = QUEUES;
  readonly priorities = PRIORITIES;
  readonly statuses = STATUSES;
  readonly label = STATUS_LABEL;
  readonly agents = AGENTS;

  readonly q = signal('');
  readonly status = signal('active');
  readonly priority = signal('');
  readonly assignee = signal('');

  readonly rows = computed(() => {
    const q = this.q().trim().toLowerCase();
    const s = this.status();
    const queue = this.queue();
    const asg = this.assignee();
    return this.store
      .tickets()
      .filter((t) => (s === 'active' ? t.status !== 'resolved' : s === 'all' || t.status === s))
      .filter((t) => !queue || t.queue === queue)
      .filter((t) => !this.priority() || t.priority === this.priority())
      .filter((t) => !asg || (asg === 'none' ? t.assignee === null : t.assignee === asg))
      .filter((t) => !q || `${t.subject} ${t.customer} #${t.id}`.toLowerCase().includes(q))
      .sort((a, b) =>
        a.resolvedAt !== null || b.resolvedAt !== null
          ? b.createdAt - a.createdAt
          : dueAt(a) - dueAt(b) || RANK[a.priority] - RANK[b.priority],
      );
  });

  setQueue(v: string) {
    this.router.navigate([], { queryParams: { queue: v || null }, queryParamsHandling: 'merge' });
  }
}

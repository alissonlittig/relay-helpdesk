import { AfterViewChecked, Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SlaChip } from '../core/chip';
import { AGENTS, PRIORITIES, Priority, QUEUES, Queue, STATUSES, STATUS_LABEL, Status } from '../core/models';
import { SLA_HOURS, dueAt } from '../core/sla';
import { Store } from '../core/store';

@Component({
  selector: 'app-ticket-detail',
  imports: [FormsModule, RouterLink, SlaChip, DatePipe],
  templateUrl: './ticket-detail.html',
})
export class TicketDetail implements AfterViewChecked {
  private readonly store = inject(Store);
  readonly id = input.required<string>();
  readonly t = computed(() => this.store.get(Number(this.id())));
  readonly agents = AGENTS;
  readonly queues = QUEUES;
  readonly priorities = PRIORITIES;
  readonly statuses = STATUSES;
  readonly label = STATUS_LABEL;
  readonly sla = SLA_HOURS;
  readonly due = dueAt;

  text = '';
  readonly internal = signal(false);
  private readonly thread = viewChild<ElementRef<HTMLElement>>('thread');
  private seen = 0;

  ngAfterViewChecked() {
    const n = this.t()?.comments.length ?? 0;
    if (n !== this.seen) {
      this.seen = n;
      const el = this.thread()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }

  send() {
    const t = this.t();
    if (!t || !this.text.trim()) return;
    this.store.comment(t.id, this.text, this.internal());
    this.text = '';
  }

  setStatus(v: string) { this.store.setStatus(this.t()!.id, v as Status); }
  setPriority(v: string) { this.store.setPriority(this.t()!.id, v as Priority); }
  setQueue(v: string) { this.store.setQueue(this.t()!.id, v as Queue); }
  assign(v: string) { this.store.assign(this.t()!.id, v || null); }
}

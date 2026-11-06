import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PRIORITIES, Priority, QUEUES, Queue } from './core/models';
import { Store } from './core/store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly store = inject(Store);
  private readonly router = inject(Router);
  readonly queues = QUEUES;
  readonly priorities = PRIORITIES;
  readonly menu = signal(false);
  readonly dialog = signal(false);

  readonly counts = computed(() => {
    const m = new Map<Queue, number>();
    for (const t of this.store.open()) m.set(t.queue, (m.get(t.queue) ?? 0) + 1);
    return m;
  });

  form = { subject: '', customer: '', queue: 'Support' as Queue, priority: 'medium' as Priority, message: '' };

  openDialog() {
    this.menu.set(false);
    this.dialog.set(true);
  }

  submit() {
    const f = this.form;
    if (!f.subject.trim() || !f.customer.trim() || !f.message.trim()) return;
    const id = this.store.create(f);
    this.form = { subject: '', customer: '', queue: 'Support', priority: 'medium', message: '' };
    this.dialog.set(false);
    this.router.navigate(['/tickets', id]);
  }
}

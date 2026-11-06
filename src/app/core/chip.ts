import { Component, computed, inject, input } from '@angular/core';
import { Ticket } from './models';
import { slaState, timeLeft } from './sla';
import { Store } from './store';

@Component({
  selector: 'app-sla',
  template: `<span class="sla" [attr.data-s]="state()"><i aria-hidden="true"></i>{{ label() }}</span>`,
})
export class SlaChip {
  private readonly store = inject(Store);
  readonly ticket = input.required<Ticket>();
  readonly state = computed(() => slaState(this.ticket(), this.store.now()));
  readonly label = computed(() => timeLeft(this.ticket(), this.store.now()));
}

import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', title: 'Dashboard · Relay Helpdesk', loadComponent: () => import('./pages/dashboard').then((m) => m.Dashboard) },
  { path: 'tickets', title: 'Tickets · Relay Helpdesk', loadComponent: () => import('./pages/tickets').then((m) => m.Tickets) },
  { path: 'tickets/:id', title: 'Ticket · Relay Helpdesk', loadComponent: () => import('./pages/ticket-detail').then((m) => m.TicketDetail) },
  { path: '**', redirectTo: 'dashboard' },
];

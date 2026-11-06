import { AGENTS, Comment, Priority, Queue, Status, Ticket } from './models';

const H = 3_600_000;
// [subject, customer, queue, priority, status, age in hours, hours taken to resolve, first customer message]
type Row = [string, string, Queue, Priority, Status, number, number | null, string?];
const rows: Row[] = [
  ['Checkout returns a 502 for card payments', 'Northwind Retail', 'Engineering', 'urgent', 'progress', 3.2, null, 'Since 09:40 every card payment fails with a 502. We are losing orders.'],
  ['Cannot log in after password reset', 'Aster Logistics', 'Support', 'high', 'open', 5.5, null, 'The reset e-mail arrives but the new password is rejected.'],
  ['Invoice 2291 charged twice', 'Lumen Studio', 'Billing', 'high', 'progress', 7.1, null, 'We see two identical charges for invoice 2291 on our statement.'],
  ['Import of 12k contacts stuck at 40%', 'Brightpath Co.', 'Support', 'medium', 'waiting', 20, null, 'The CSV import has been at 40% for an hour.'],
  ['Request: SSO for the whole team', 'Verde Capital', 'Onboarding', 'low', 'open', 30, null, 'We would like to enable SAML SSO. What plan do we need?'],
  ['Webhook signature mismatch', 'Kestrel Labs', 'Engineering', 'medium', 'progress', 22, null, 'Signatures from your webhooks do not validate on our side since Monday.'],
  ['Update billing contact', 'Orchid Foods', 'Billing', 'low', 'open', 12, null, 'Please change the billing contact to finance@orchidfoods.example.'],
  ['Dashboard widgets blank on Safari', 'Pioneer Health', 'Support', 'medium', 'open', 23, null, 'All widgets are empty on Safari 17, Chrome works.'],
  ['Onboarding call: data migration plan', 'Tidal Works', 'Onboarding', 'medium', 'waiting', 40, null, 'Can we schedule a call to plan the migration from our old tool?'],
  ['API rate limit too low for batch jobs', 'Kestrel Labs', 'Engineering', 'high', 'open', 9.4, null, 'Our nightly batch hits 429s after a few minutes.'],
  ['Refund for cancelled annual plan', 'Maple & Co', 'Billing', 'medium', 'resolved', 60, 18, 'We cancelled within the trial window but were billed.'],
  ['Export to PDF cuts off tables', 'Aster Logistics', 'Support', 'low', 'resolved', 80, 30],
  ['Two-factor codes arrive late', 'Verde Capital', 'Support', 'high', 'resolved', 100, 6],
  ['Custom domain not verifying', 'Orchid Foods', 'Onboarding', 'medium', 'resolved', 120, 20],
  ['Database timeout on report builder', 'Northwind Retail', 'Engineering', 'urgent', 'resolved', 50, 3],
  ['Wrong VAT on March invoice', 'Lumen Studio', 'Billing', 'high', 'resolved', 140, 11],
  ['Team seats not syncing', 'Brightpath Co.', 'Support', 'medium', 'resolved', 30, 14],
  ['Slow search on large workspaces', 'Pioneer Health', 'Engineering', 'low', 'resolved', 160, 48],
  ['Welcome e-mails sent twice', 'Tidal Works', 'Support', 'low', 'resolved', 70, 25],
  ['Cannot invite external guests', 'Maple & Co', 'Onboarding', 'high', 'resolved', 26, 5],
  ['Mobile app crashes on launch', 'Northwind Retail', 'Engineering', 'urgent', 'resolved', 90, 7],
  ['Payment method update fails', 'Aster Logistics', 'Billing', 'medium', 'resolved', 10, 4],
];

export function seedTickets(now: number): Ticket[] {
  return rows.map((r, i): Ticket => {
    const [subject, customer, queue, priority, status, age, took, first] = r;
    const createdAt = now - age * H;
    const assignee = status === 'open' && i % 3 === 0 ? null : AGENTS[i % AGENTS.length];
    const comments: Comment[] = [
      { id: `c${i}-0`, author: customer, role: 'customer', at: createdAt, text: first ?? `${subject}. Could you take a look?` },
    ];
    if (assignee) {
      comments.push({ id: `c${i}-1`, author: assignee, role: 'agent', at: createdAt + 0.4 * H, text: 'Thanks for reaching out, I am looking into this now.' });
    }
    if (status === 'progress' || status === 'waiting') {
      comments.push({ id: `c${i}-2`, author: assignee!, role: 'agent', at: createdAt + H, internal: true, text: 'Internal: reproduced on staging, checking logs.' });
    }
    if (status === 'waiting') {
      comments.push({ id: `c${i}-3`, author: assignee!, role: 'agent', at: createdAt + 2 * H, text: 'Could you share a screenshot or the exact error you see?' });
    }
    const resolvedAt = took === null ? null : createdAt + took * H;
    if (resolvedAt !== null) {
      comments.push({ id: `c${i}-9`, author: assignee!, role: 'agent', at: resolvedAt, text: 'This is fixed on our side. Closing the ticket, reply if it comes back.' });
    }
    return { id: 1040 + i, subject, customer, queue, priority, status, assignee, createdAt, resolvedAt, comments };
  });
}

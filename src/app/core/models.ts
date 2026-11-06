export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type Status = 'open' | 'progress' | 'waiting' | 'resolved';
export type Queue = 'Support' | 'Billing' | 'Engineering' | 'Onboarding';

export interface Comment {
  id: string;
  author: string;
  role: 'customer' | 'agent' | 'system';
  text: string;
  at: number;
  internal?: boolean;
}

export interface Ticket {
  id: number;
  subject: string;
  customer: string;
  queue: Queue;
  priority: Priority;
  status: Status;
  assignee: string | null;
  createdAt: number;
  resolvedAt: number | null;
  comments: Comment[];
}

export type SlaState = 'ok' | 'risk' | 'breached' | 'met' | 'missed';

export const PRIORITIES: Priority[] = ['urgent', 'high', 'medium', 'low'];
export const STATUSES: Status[] = ['open', 'progress', 'waiting', 'resolved'];
export const QUEUES: Queue[] = ['Support', 'Billing', 'Engineering', 'Onboarding'];
export const AGENTS = ['Marina Costa', 'Rafael Nunes', 'Helena Prado', 'Tiago Moreira', 'Bianca Lopes'];
export const STATUS_LABEL: Record<Status, string> = {
  open: 'Open',
  progress: 'In progress',
  waiting: 'Waiting on customer',
  resolved: 'Resolved',
};

export const TICKET_EVENTS = {
  CREATED: 'ticket.created',
  UPDATED: 'ticket.updated',
  DELETED: 'ticket.deleted',
  STATUS_CHANGED: 'ticket.status_changed',
  ASSIGNED: 'ticket.assigned',
  COMMENT_ADDED: 'ticket.comment_added',
  ATTACHMENT_ADDED: 'ticket.attachment_added',
} as const;

export type TicketEventType =
  (typeof TICKET_EVENTS)[keyof typeof TICKET_EVENTS];

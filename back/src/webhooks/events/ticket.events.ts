
export const enum TicketEvents {
    default = 'webhook.ticket.*',
    Created = 'webhook.ticket.created',
    CriticalCreated = 'webhook.ticket.critical_created',
    Resolved = 'webhook.ticket.resolved',
}

export interface TicketEventPayload {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    reporterId: string;
    assigneeId?: string;
    projectId: string;
    createdAt: Date;
}

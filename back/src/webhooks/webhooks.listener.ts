import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebhooksService } from './webhooks.service';
import { TicketEvents, type TicketEventPayload } from './events/ticket.events';

@Injectable()
export class WebhooksListener {
    constructor(private readonly webhooksService: WebhooksService) { }

    @OnEvent(TicketEvents.Created)
    async handleTicketCreated(payload: TicketEventPayload) {
        await this.webhooksService.sendTicketCreated(payload);
    }

    @OnEvent(TicketEvents.CriticalCreated)
    async handleTicketCritical(payload: TicketEventPayload) {
        await this.webhooksService.sendTicketCritical(payload);
    }

    @OnEvent(TicketEvents.Resolved)
    async handleTicketResolved(payload: TicketEventPayload) {
        await this.webhooksService.sendTicketResolved(payload);
    }

}

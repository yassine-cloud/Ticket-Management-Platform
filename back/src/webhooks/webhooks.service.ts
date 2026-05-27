import { Injectable } from '@nestjs/common';
import { TicketEventPayload, TicketEvents } from './events/ticket.events';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class WebhooksService {

    constructor(private readonly databaseService: DatabaseService) { }


    TICKET_CREATED_WEBHOOK_URL = process.env.TICKET_CREATED_WEBHOOK_URL;
    TICKET_CRITICAL_WEBHOOK_URL = process.env.TICKET_CRITICAL_WEBHOOK_URL;
    TICKET_RESOLVED_WEBHOOK_URL = process.env.TICKET_RESOLVED_WEBHOOK_URL;

    async sendTicketCreated(payload: TicketEventPayload) {
        const reporterName = await this.getUserName(payload.reporterId);
        const assigneeName = payload.assigneeId ? await this.getUserName(payload.assigneeId) : undefined;
        const embed = this.createEmbed(TicketEvents.Created, payload, reporterName, assigneeName);
        if (this.TICKET_CREATED_WEBHOOK_URL)
            await this.sendWebhook(this.TICKET_CREATED_WEBHOOK_URL, embed);
        else console.warn('TICKET_CREATED_WEBHOOK_URL is not set. Skipping webhook notification.');
    }

    async sendTicketCritical(payload: TicketEventPayload) {
        const reporterName = await this.getUserName(payload.reporterId);
        const assigneeName = payload.assigneeId ? await this.getUserName(payload.assigneeId) : undefined;
        const embed = this.createEmbed(TicketEvents.CriticalCreated, payload, reporterName, assigneeName);
        if (this.TICKET_CRITICAL_WEBHOOK_URL)
            await this.sendWebhook(this.TICKET_CRITICAL_WEBHOOK_URL, embed);
        else console.warn('TICKET_CRITICAL_WEBHOOK_URL is not set. Skipping webhook notification.');
    }

    async sendTicketResolved(payload: TicketEventPayload) {
        const reporterName = await this.getUserName(payload.reporterId);
        const assigneeName = payload.assigneeId ? await this.getUserName(payload.assigneeId) : undefined;
        const embed = this.createEmbed(TicketEvents.Resolved, payload, reporterName, assigneeName);
        if (this.TICKET_RESOLVED_WEBHOOK_URL)
            await this.sendWebhook(this.TICKET_RESOLVED_WEBHOOK_URL, embed);
        else console.warn('TICKET_RESOLVED_WEBHOOK_URL is not set. Skipping webhook notification.');
    }


    private createEmbed(
        event: TicketEvents,
        payload: TicketEventPayload,
        reporterName: string,
        assigneeName?: string
    ) {
        let title = 'Ticket Update';
        let color = 0x3498db; // Blue (Default)

        // Customize title and color based on the specific event
        if (event === TicketEvents.Created) {
            title = '🆕 New Ticket Created';
            color = 0x2ecc71; // Green
        } else if (event === TicketEvents.CriticalCreated) {
            title = '🚨 CRITICAL Ticket Created';
            color = 0xe74c3c; // Red
        } else if (event === TicketEvents.Resolved) {
            title = '✅ Ticket Resolved';
            color = 0x9b59b6; // Purple
        }

        return {
            title: title,
            description: `**[${payload.id}] ${payload.title}**\n${payload.description || '*No description provided.*'}`,
            color: color,
            fields: [
                { name: 'Status', value: payload.status, inline: true },
                { name: 'Priority', value: payload.priority, inline: true },
                { name: 'Project ID', value: payload.projectId, inline: true },
                { name: 'Reporter', value: reporterName, inline: true },
                { name: 'Assignee', value: assigneeName || 'Unassigned', inline: true },
            ],
            timestamp: new Date(payload.createdAt).toISOString(),
            footer: {
                text: 'TicketPlatform Notifications',
            },
        };
    }

    private async sendWebhook(url: string, embed: any) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: 'TicketPlatform Webhook',
                    embeds: [embed], // Webhook expects an array of embeds
                }),
            });

            if (response.ok) {
                console.log('Webhook embed sent successfully!');
            } else {
                console.error('Failed to send webhook:', response.statusText, await response.text());
            }
        } catch (error) {
            console.error('Error broadcasting webhook:', error);
        }
    }

    private async getUserName(userId: string): Promise<string> {
        const user = await this.databaseService.user.findUnique({ where: { id: userId }, select: { displayName: true, username: true } });
        return user ? user.displayName || user.username : `User-${userId.substring(0, 8)}`;
    }
}

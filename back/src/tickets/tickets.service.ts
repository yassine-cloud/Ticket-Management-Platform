import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TICKET_EVENTS } from '../config/ticket-events.config';
import { TicketEventPayload, TicketEvents } from '../webhooks/events/ticket.events';
import { TicketStatus } from '../../generated/prisma/enums';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createTicketDto: CreateTicketDto) {
    const ticket = await this.prisma.ticket.create({
      data: createTicketDto,
    });

    this.eventEmitter.emit(TICKET_EVENTS.CREATED, ticket);
    this.eventEmitter.emit(TicketEvents.Created, ticket);
    if (ticket.priority === 'CRITICAL') {
      this.eventEmitter.emit(TicketEvents.CriticalCreated, ticket);
    }
    return ticket;
  }

  findAll(projectId?: string) {
    return this.prisma.ticket.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        parent: true,
        labels: {
          include: { label: true },
        },
        attachments: true,
      },
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        parent: true,
        labels: {
          include: { label: true },
        },
        attachments: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto) {
    const old = await this.findOne(id); // Ensure exists

    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: updateTicketDto,
    });

    this.eventEmitter.emit(TICKET_EVENTS.UPDATED, ticket);
    if (ticket.status === TicketStatus.RESOLVED && old.status !== TicketStatus.RESOLVED) {
      this.eventEmitter.emit(TicketEvents.Resolved, ticket);
    }
    if (updateTicketDto.priority === 'CRITICAL' && old.priority !== 'CRITICAL' && ticket.status !== TicketStatus.RESOLVED) {
      this.eventEmitter.emit(TicketEvents.CriticalCreated, ticket);
    }
    return ticket;
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure exists
    const ticket = await this.prisma.ticket.delete({
      where: { id },
    });

    this.eventEmitter.emit(TICKET_EVENTS.DELETED, ticket);
    return ticket;
  }
}

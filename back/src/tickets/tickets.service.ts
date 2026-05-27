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

    this.eventEmitter.emit(TICKET_EVENTS.CREATED, ticket);
    return ticket;
  }

  async findAll(projectId?: string, page: number = 1, limit: number = 50, search?: string, statusId?: string, priority?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (projectId) where.projectId = projectId;
    
    if (statusId) {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(statusId)) {
        where.statusId = statusId;
      } else {
        where.status = {
          name: {
            equals: statusId,
            mode: 'insensitive',
          },
        };
      }
    }

    if (priority) where.priority = priority.toUpperCase();
    if (search) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search.trim());
      if (isUuid) {
        where.OR = [
          { id: search.trim() },
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      } else {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        include: {
          status: true,
          parent: true,
          labels: {
            include: { label: true },
          },
          attachments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findStatuses(projectId?: string) {
    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }
    return this.prisma.ticketStatus.findMany({
      where,
      orderBy: { order: 'asc' },
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
      include: {
        status: true,
        parent: true,
        labels: {
          include: { label: true },
        },
        attachments: true,
      },
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

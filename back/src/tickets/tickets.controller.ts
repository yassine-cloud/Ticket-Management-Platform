import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TICKET_EVENTS } from '../config/ticket-events.config';
import { Observable, fromEvent, map, merge } from 'rxjs';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Sse('sse/events')
  @Permissions('assign_ticket')
  sse(): Observable<MessageEvent> {
    const created$ = fromEvent(this.eventEmitter, TICKET_EVENTS.CREATED).pipe(
      map((payload) => ({ type: 'ticket-created', data: payload as object })),
    );

    const updated$ = fromEvent(this.eventEmitter, TICKET_EVENTS.UPDATED).pipe(
      map((payload) => ({ type: 'ticket-updated', data: payload as object })),
    );

    const deleted$ = fromEvent(this.eventEmitter, TICKET_EVENTS.DELETED).pipe(
      map((payload) => ({ type: 'ticket-deleted', data: payload as object })),
    );

    return merge(created$, updated$, deleted$);
  }

  @Post()
  @Permissions('assign_ticket')
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  @Permissions('assign_ticket')
  findAll(
    @Query('projectId') projectId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('statusId') statusId?: string,
    @Query('priority') priority?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.ticketsService.findAll(projectId, pageNum, limitNum, search, statusId, priority);
  }

  @Get('statuses')
  @Permissions('assign_ticket')
  findStatuses(@Query('projectId') projectId?: string) {
    return this.ticketsService.findStatuses(projectId);
  }

  @Get(':id')
  @Permissions('assign_ticket')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('assign_ticket')
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Delete(':id')
  @Permissions('manage_roles')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}

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
} from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TICKET_EVENTS } from '../config/ticket-events.config';
import { Observable, fromEvent, map, merge } from 'rxjs';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Sse('sse/events')
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
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.ticketsService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}

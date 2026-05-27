import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { TicketsService } from './tickets.service';
import { Ticket } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Resolver(() => Ticket)
export class TicketsResolver {
  constructor(private readonly ticketsService: TicketsService) {}

  @Mutation(() => Ticket)
  @Permissions('assign_ticket')
  createTicket(@Args('createTicketDto') createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Query(() => [Ticket], { name: 'tickets' })
  @Permissions('assign_ticket')
  findAll(
    @Args('projectId', { type: () => ID, nullable: true }) projectId?: string,
  ) {
    return this.ticketsService.findAll(projectId);
  }

  @Query(() => Ticket, { name: 'ticket' })
  @Permissions('assign_ticket')
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.ticketsService.findOne(id);
  }

  @Mutation(() => Ticket)
  @Permissions('assign_ticket')
  updateTicket(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateTicketDto') updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Mutation(() => Ticket)
  @Permissions('manage_roles')
  removeTicket(@Args('id', { type: () => ID }) id: string) {
    return this.ticketsService.remove(id);
  }
}

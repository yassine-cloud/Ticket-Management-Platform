import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { TicketsService } from './tickets.service';
import { Ticket } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Resolver(() => Ticket)
export class TicketsResolver {
  constructor(private readonly ticketsService: TicketsService) {}

  @Mutation(() => Ticket)
  createTicket(@Args('createTicketDto') createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Query(() => [Ticket], { name: 'tickets' })
  findAll(
    @Args('projectId', { type: () => ID, nullable: true }) projectId?: string,
  ) {
    return this.ticketsService.findAll(projectId);
  }

  @Query(() => Ticket, { name: 'ticket' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.ticketsService.findOne(id);
  }

  @Mutation(() => Ticket)
  updateTicket(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateTicketDto') updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Mutation(() => Ticket)
  removeTicket(@Args('id', { type: () => ID }) id: string) {
    return this.ticketsService.remove(id);
  }
}

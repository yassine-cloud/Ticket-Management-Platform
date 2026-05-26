import { InputType, PartialType } from '@nestjs/graphql';
import { CreateTicketDto } from './create-ticket.dto';

@InputType()
export class UpdateTicketDto extends PartialType(CreateTicketDto) {}

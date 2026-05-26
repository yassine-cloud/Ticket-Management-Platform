import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { TicketType, TicketPriority } from '../../../generated/prisma/client';

registerEnumType(TicketType, { name: 'TicketType' });
registerEnumType(TicketPriority, { name: 'TicketPriority' });

@ObjectType()
export class Ticket {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  key?: string;

  @Field()
  projectId: string;

  @Field(() => TicketType)
  type: TicketType;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  statusId: string;

  @Field(() => TicketPriority)
  priority: TicketPriority;

  @Field()
  reporterId: string;

  @Field({ nullable: true })
  assigneeId?: string;

  @Field({ nullable: true })
  parentId?: string;

  @Field(() => Int, { nullable: true })
  estimateMinutes?: number;

  @Field(() => Int, { nullable: true })
  storyPoints?: number;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  closedAt?: Date;
}

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { TicketType, TicketPriority, TicketStatus } from '../../../generated/prisma/client';
import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateTicketDto {
  @Field()
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => TicketType, { defaultValue: TicketType.TASK })
  @IsEnum(TicketType)
  @IsOptional()
  type?: TicketType;

  @Field(() => TicketPriority, { defaultValue: TicketPriority.MEDIUM })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @Field(() => TicketStatus, { defaultValue: TicketStatus.OPEN })
  @IsEnum(TicketStatus)
  @IsNotEmpty()
  status?: TicketStatus;

  @Field()
  @IsUUID()
  @IsNotEmpty()
  reporterId!: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  estimateMinutes?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  storyPoints?: number;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

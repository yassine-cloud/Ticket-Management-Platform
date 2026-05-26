import { IsString, IsEnum, IsUUID } from 'class-validator';
import { ChannelType } from '@prisma/client';

export class CreateChannelDTO {
  @IsUUID()
  projectId: string;

  @IsString()
  name: string;

  @IsEnum(ChannelType)
  type: ChannelType;
}

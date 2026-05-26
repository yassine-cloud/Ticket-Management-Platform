import { IsString, IsEnum, IsUUID, IsNotEmpty } from 'class-validator';
import { ChannelType } from 'generated/prisma/enums';

export class CreateChannelDTO {
  @IsUUID()
  projectId!: string;

  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsEnum(ChannelType)
  type!: ChannelType;
}

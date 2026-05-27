import { IsString, IsEnum, IsUUID, IsNotEmpty } from 'class-validator';
import { ChannelType } from '../../../generated/prisma/enums';

export class CreateChannelDTO {
  @IsNotEmpty()
  @IsUUID()
  projectId!: string;

  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsEnum(ChannelType)
  type!: ChannelType;
}

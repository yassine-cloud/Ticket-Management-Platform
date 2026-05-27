import { IsString, IsOptional } from 'class-validator';

export class UpdateChannelDTO {
  @IsString()
  @IsOptional()
  name?: string;
}

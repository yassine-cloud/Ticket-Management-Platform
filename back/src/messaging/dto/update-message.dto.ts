import { IsString, IsOptional } from 'class-validator';

export class UpdateMessageDTO {
  @IsString()
  @IsOptional()
  content?: string;
}

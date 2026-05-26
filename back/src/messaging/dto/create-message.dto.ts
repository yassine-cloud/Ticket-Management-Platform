import { IsString, IsUUID, IsArray, IsOptional } from 'class-validator';

export class CreateMessageDTO {
  @IsUUID()
  channelId: string;

  @IsString()
  content: string;

  @IsArray()
  @IsOptional()
  attachmentUrls?: string[];
}

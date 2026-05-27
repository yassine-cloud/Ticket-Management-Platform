import { IsString, IsUUID, IsArray, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateMessageDTO {
  @IsNotEmpty()
  @IsUUID()
  channelId: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsArray()
  @IsOptional()
  attachmentUrls?: string[];
}

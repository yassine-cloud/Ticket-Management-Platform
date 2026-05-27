import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';

export enum AttachmentType {
  TICKET = 'ticket',
  COMMENT = 'comment',
  MESSAGE = 'message',
  GENERAL = 'general',
}

export class PresignUploadDto {
  @IsEnum(AttachmentType)
  type: AttachmentType;

  @IsUUID()
  @IsOptional()
  ticketId?: string;

  @IsUUID()
  @IsOptional()
  commentId?: string;

  @IsUUID()
  @IsOptional()
  messageId?: string;

  @IsString()
  filename: string;

  @IsString()
  mimeType: string;
}

export class PresignResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  cloudinaryUrl: string;
  uploadToken: string;
}

export class FileMetadataDto {
  cloudinaryPublicId: string;
  secureUrl: string;
  filename: string;
  mimeType: string;
  size: number;
  uploaderId: string;
  ticketId?: string;
  commentId?: string;
  messageId?: string;
}

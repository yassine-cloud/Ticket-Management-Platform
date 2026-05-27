import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { FilesService } from './files.service';
import { PresignUploadDto } from './dto/presign-upload.dto';

@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  /**
   * Generate presigned upload URL for Cloudinary
   * POST /files/presign
   * Required: x-user-id header
   */
  @Post('presign')
  @HttpCode(HttpStatus.OK)
  async generatePresignUrl(@Body() dto: PresignUploadDto) {
    return this.filesService.generatePresignUrl(dto);
  }

  /**
   * Store file metadata after successful Cloudinary upload
   * POST /files/metadata
   * Called by frontend after file is uploaded to Cloudinary
   */
  @Post('metadata')
  @HttpCode(HttpStatus.CREATED)
  async storeFileMetadata(@Body() body: any, @Req() req: Request) {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      throw new Error('x-user-id header is required');
    }

    return this.filesService.storeFileMetadata({
      cloudinaryPublicId: body.cloudinaryPublicId,
      secureUrl: body.secureUrl,
      filename: body.filename,
      mimeType: body.mimeType,
      size: body.size,
      uploaderId: userId,
      ticketId: body.ticketId,
      commentId: body.commentId,
      messageId: body.messageId,
    });
  }

  /**
   * Get file metadata by ID
   * GET /files/:fileId
   */
  @Get(':fileId')
  async getFileMetadata(@Param('fileId') fileId: string) {
    return this.filesService.getFileMetadata(fileId);
  }

  /**
   * Delete file metadata
   * DELETE /files/:fileId
   */
  @Delete(':fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(@Param('fileId') fileId: string) {
    await this.filesService.deleteFile(fileId);
  }

  /**
   * Get all files for a ticket
   * GET /files/ticket/:ticketId
   */
  @Get('ticket/:ticketId')
  async getTicketFiles(@Param('ticketId') ticketId: string) {
    return this.filesService.getTicketFiles(ticketId);
  }

  /**
   * Get all files for a comment
   * GET /files/comment/:commentId
   */
  @Get('comment/:commentId')
  async getCommentFiles(@Param('commentId') commentId: string) {
    return this.filesService.getCommentFiles(commentId);
  }

  /**
   * Get all files for a message
   * GET /files/message/:messageId
   */
  @Get('message/:messageId')
  async getMessageFiles(@Param('messageId') messageId: string) {
    return this.filesService.getMessageFiles(messageId);
  }
}

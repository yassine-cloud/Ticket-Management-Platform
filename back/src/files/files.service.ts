import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import { PresignUploadDto, PresignResponse, FileMetadataDto } from './dto/presign-upload.dto';

@Injectable()
export class FilesService {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(
    private configService: ConfigService,
    private prisma: DatabaseService,
  ) {
    this.cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    this.apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    this.apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error('Cloudinary credentials not configured in environment');
    }
  }

  /**
   * Generate a presigned upload URL and signature for Cloudinary
   * Returns signature and metadata needed for direct client-side upload
   */
  async generatePresignUrl(dto: PresignUploadDto): Promise<PresignResponse> {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `tickets/files/${dto.type}`;

    // Generate signature for Cloudinary
    const signatureString = `folder=${folder}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

    // Generate upload token for tracking
    const uploadToken = crypto.randomBytes(32).toString('hex');

    return {
      signature,
      timestamp,
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      folder,
      cloudinaryUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`,
      uploadToken,
    };
  }

  /**
   * Store file metadata in database after successful upload
   * Called by frontend after Cloudinary upload completes
   */
  async storeFileMetadata(
    fileMetadata: FileMetadataDto,
  ): Promise<Record<string, any>> {
    const { ticketId, commentId, messageId, uploaderId, filename, mimeType, size } = fileMetadata;

    // Validate that at least one parent entity is specified
    if (!ticketId && !commentId && !messageId) {
      throw new BadRequestException(
        'At least one parent entity (ticketId, commentId, or messageId) must be provided',
      );
    }

    // Create attachment record
    const attachment = await this.prisma.attachment.create({
      data: {
        ticketId: ticketId || null,
        commentId: commentId || null,
        messageId: messageId || null,
        uploaderId,
        storagePath: fileMetadata.secureUrl, // Store Cloudinary URL as path
        filename,
        mimeType,
        size,
        checksum: fileMetadata.cloudinaryPublicId, // Store public_id for reference
      },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    return {
      id: attachment.id,
      filename: attachment.filename,
      url: attachment.storagePath,
      mimeType: attachment.mimeType,
      size: attachment.size,
      uploadedBy: attachment.uploader,
      uploadedAt: attachment.createdAt,
      attachedTo: {
        ticketId: attachment.ticketId,
        commentId: attachment.commentId,
        messageId: attachment.messageId,
      },
    };
  }

  /**
   * Get file metadata by ID
   */
  async getFileMetadata(fileId: string): Promise<Record<string, any>> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: fileId },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    if (!attachment) {
      throw new BadRequestException('File not found');
    }

    return {
      id: attachment.id,
      filename: attachment.filename,
      url: attachment.storagePath,
      mimeType: attachment.mimeType,
      size: attachment.size,
      uploadedBy: attachment.uploader,
      uploadedAt: attachment.createdAt,
      attachedTo: {
        ticketId: attachment.ticketId,
        commentId: attachment.commentId,
        messageId: attachment.messageId,
      },
    };
  }

  /**
   * Delete file metadata (soft delete in database)
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.prisma.attachment.delete({
      where: { id: fileId },
    });
  }

  /**
   * Get all files for a ticket
   */
  async getTicketFiles(ticketId: string): Promise<Record<string, any>[]> {
    const attachments = await this.prisma.attachment.findMany({
      where: { ticketId },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return attachments.map((att) => ({
      id: att.id,
      filename: att.filename,
      url: att.storagePath,
      mimeType: att.mimeType,
      size: att.size,
      uploadedBy: att.uploader,
      uploadedAt: att.createdAt,
    }));
  }

  /**
   * Get all files for a comment
   */
  async getCommentFiles(commentId: string): Promise<Record<string, any>[]> {
    const attachments = await this.prisma.attachment.findMany({
      where: { commentId },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return attachments.map((att) => ({
      id: att.id,
      filename: att.filename,
      url: att.storagePath,
      mimeType: att.mimeType,
      size: att.size,
      uploadedBy: att.uploader,
      uploadedAt: att.createdAt,
    }));
  }

  /**
   * Get all files for a message
   */
  async getMessageFiles(messageId: string): Promise<Record<string, any>[]> {
    const attachments = await this.prisma.attachment.findMany({
      where: { messageId },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return attachments.map((att) => ({
      id: att.id,
      filename: att.filename,
      url: att.storagePath,
      mimeType: att.mimeType,
      size: att.size,
      uploadedBy: att.uploader,
      uploadedAt: att.createdAt,
    }));
  }
}

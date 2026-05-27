import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '../../database/database.service';
import { CreateMessageDTO } from '../dto/create-message.dto';
import { UpdateMessageDTO } from '../dto/update-message.dto';
import { MessageResponseDTO } from '../dto/message-response.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: DatabaseService,
    private cloudinaryService: CloudinaryService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new message
   */
  async createMessage(
    dto: CreateMessageDTO,
    userId: string,
  ): Promise<MessageResponseDTO> {
    // Verify channel exists and user is member
    const channel = await this.prisma.channel.findUnique({
      where: { id: dto.channelId },
      include: { members: true },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const isMember = channel.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException(
        'You must be a member of the channel to send messages',
      );
    }

    const hasAttachments = Boolean(dto.attachmentUrls?.length);
    const normalizedContent = dto.content?.trim() ?? '';

    if (!normalizedContent && !hasAttachments) {
      throw new BadRequestException('Message content cannot be empty');
    }

    // Create message
    const message = await this.prisma.message.create({
      data: {
        channelId: dto.channelId,
        authorId: userId,
        content: normalizedContent,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
          },
        },
        attachments: true,
      },
    });

    // Handle attachments if provided
    if (dto.attachmentUrls && dto.attachmentUrls.length > 0) {
      for (const url of dto.attachmentUrls) {
        await this.prisma.attachment.create({
          data: {
            messageId: message.id,
            uploaderId: userId,
            storagePath: url,
            filename: url.split('/').pop() || 'attachment',
            mimeType: 'application/octet-stream',
            size: 0, // TODO: Get actual size from Cloudinary
          },
        });
      }
    }

    const messageWithAttachments = await this.prisma.message.findUnique({
      where: { id: message.id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
          },
        },
        attachments: true,
      },
    });

    if (!messageWithAttachments) {
      throw new NotFoundException('Message not found');
    }

    const formattedMessage = this.formatMessageResponse(messageWithAttachments);
    this.eventEmitter.emit('messaging.message.created', formattedMessage);

    return formattedMessage;
  }

  /**
   * Get messages in a channel (paginated)
   */
  async getMessages(
    channelId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ messages: MessageResponseDTO[]; total: number }> {
    // Verify channel exists and user is member
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: { members: true },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const isMember = channel.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this channel');
    }

    // Get total count
    const total = await this.prisma.message.count({
      where: {
        channelId,
        isDeleted: false,
      },
    });

    // Get messages (newest first, then reverse for display order)
    const messages = await this.prisma.message.findMany({
      where: {
        channelId,
        isDeleted: false,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
          },
        },
        attachments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return {
      messages: messages.reverse().map((m) => this.formatMessageResponse(m)),
      total,
    };
  }

  /**
   * Get single message
   */
  async getMessage(
    messageId: string,
    userId: string,
  ): Promise<MessageResponseDTO> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          include: { members: true },
        },
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
          },
        },
        attachments: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify user has access to channel
    const isMember = message.channel.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this message');
    }

    return this.formatMessageResponse(message);
  }

  /**
   * Update message (only author can update)
   */
  async updateMessage(
    messageId: string,
    dto: UpdateMessageDTO,
    userId: string,
  ): Promise<MessageResponseDTO> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        author: true,
        attachments: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.authorId !== userId) {
      throw new ForbiddenException('Only message author can edit messages');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: dto.content ?? message.content,
        editedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
          },
        },
        attachments: true,
      },
    });

    const formattedMessage = this.formatMessageResponse(updated);
    this.eventEmitter.emit('messaging.message.updated', formattedMessage);

    return formattedMessage;
  }

  /**
   * Soft delete message (only author can delete)
   */
  async deleteMessage(
    messageId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!msg) {
      throw new NotFoundException('Message not found');
    }

    if (msg.authorId !== userId) {
      throw new ForbiddenException('Only message author can delete messages');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
      },
    });

    this.eventEmitter.emit('messaging.message.deleted', {
      channelId: msg.channelId,
      messageId,
    });

    return { message: 'Message deleted successfully' };
  }

  /**
   * Generate Cloudinary upload signature for client-side upload
   */
  async getUploadSignature(): Promise<{
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder: string;
  }> {
    return this.cloudinaryService.generateUploadSignature('messages');
  }

  private formatMessageResponse(message: any): MessageResponseDTO {
    return {
      id: message.id,
      channelId: message.channelId,
      content: message.content,
      author: message.author,
      attachments: message.attachments ?? [],
      editedAt: message.editedAt,
      createdAt: message.createdAt,
      isDeleted: message.isDeleted,
    };
  }
}

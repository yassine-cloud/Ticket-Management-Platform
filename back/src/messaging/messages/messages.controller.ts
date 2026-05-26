import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDTO } from '../dto/create-message.dto';
import { UpdateMessageDTO } from '../dto/update-message.dto';
import { MessageResponseDTO } from '../dto/message-response.dto';

// TODO: Create JwtAuthGuard
// @UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  /**
   * Create a new message
   * POST /messages
   */
  @Post()
  async createMessage(
    @Body() dto: CreateMessageDTO,
    @Req() req: any,
  ): Promise<MessageResponseDTO> {
    const userId = req.user?.id || 'user-id-placeholder';
    return this.messagesService.createMessage(dto, userId);
  }

  /**
   * Get messages in a channel (paginated)
   * GET /messages?channelId=:channelId&limit=50&offset=0
   */
  @Get()
  async getMessages(
    @Query('channelId') channelId: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
    @Req() req: any,
  ): Promise<{ messages: MessageResponseDTO[]; total: number }> {
    const userId = req.user?.id || 'user-id-placeholder';
    return this.messagesService.getMessages(
      channelId,
      userId,
      parseInt(limit),
      parseInt(offset),
    );
  }

  /**
   * Get single message
   * GET /messages/:messageId
   */
  @Get(':messageId')
  async getMessage(
    @Param('messageId') messageId: string,
    @Req() req: any,
  ): Promise<MessageResponseDTO> {
    const userId = req.user?.id || 'user-id-placeholder';
    return this.messagesService.getMessage(messageId, userId);
  }

  /**
   * Update message
   * PATCH /messages/:messageId
   */
  @Patch(':messageId')
  async updateMessage(
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDTO,
    @Req() req: any,
  ): Promise<MessageResponseDTO> {
    const userId = req.user?.id || 'user-id-placeholder';
    return this.messagesService.updateMessage(messageId, dto, userId);
  }

  /**
   * Delete message
   * DELETE /messages/:messageId
   */
  @Delete(':messageId')
  async deleteMessage(
    @Param('messageId') messageId: string,
    @Req() req: any,
  ): Promise<{ message: string }> {
    const userId = req.user?.id || 'user-id-placeholder';
    return this.messagesService.deleteMessage(messageId, userId);
  }

  /**
   * Get Cloudinary upload signature
   * POST /messages/upload-signature
   */
  @Post('upload-signature')
  async getUploadSignature(): Promise<{
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder: string;
  }> {
    return this.messagesService.getUploadSignature();
  }
}

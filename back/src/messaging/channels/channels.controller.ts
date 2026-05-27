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
import { ChannelsService } from './channels.service';
import { CreateChannelDTO } from '../dto/create-channel.dto';
import { UpdateChannelDTO } from '../dto/update-channel.dto';
import { ChannelResponseDTO } from '../dto/channel-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('channels')
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  /**
   * Create a new channel
   * POST /channels
   */
  @Post()
  async createChannel(
    @Body() dto: CreateChannelDTO,
    @Req() req: any,
  ): Promise<ChannelResponseDTO> {
    const userId = req.user.id;
    return this.channelsService.createChannel(dto, userId);
  }

  /**
   * Get all channels in a project
   * GET /channels?projectId=:projectId
   */
  @Get()
  async getChannels(
    @Query('projectId') projectId: string,
    @Req() req: any,
  ): Promise<ChannelResponseDTO[]> {
    const userId = req.user.id;
    return this.channelsService.getChannelsByProject(projectId, userId);
  }

  /**
   * Get single channel
   * GET /channels/:channelId
   */
  @Get(':channelId')
  async getChannel(
    @Param('channelId') channelId: string,
    @Req() req: any,
  ): Promise<ChannelResponseDTO> {
    const userId = req.user.id;
    return this.channelsService.getChannel(channelId, userId);
  }

  /**
   * Update channel
   * PATCH /channels/:channelId
   */
  @Patch(':channelId')
  async updateChannel(
    @Param('channelId') channelId: string,
    @Body() dto: UpdateChannelDTO,
    @Req() req: any,
  ): Promise<ChannelResponseDTO> {
    const userId = req.user.id;
    return this.channelsService.updateChannel(channelId, dto, userId);
  }

  /**
   * Delete channel
   * DELETE /channels/:channelId
   */
  @Delete(':channelId')
  async deleteChannel(
    @Param('channelId') channelId: string,
    @Req() req: any,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    await this.channelsService.deleteChannel(channelId, userId);
    return { message: 'Channel deleted successfully' };
  }

  /**
   * Restore deleted channel (admin only)
   * PATCH /channels/:channelId/restore
   */
  @Patch(':channelId/restore')
  async restoreChannel(
    @Param('channelId') channelId: string,
    @Req() req: any,
  ): Promise<ChannelResponseDTO> {
    const userId = req.user.id;
    return this.channelsService.restoreChannel(channelId, userId);
  }

  /**
   * Add member to channel
   * POST /channels/:channelId/members
   */
  @Post(':channelId/members')
  async addMember(
    @Param('channelId') channelId: string,
    @Body('userId') userId: string,
    @Req() req: any,
  ): Promise<ChannelResponseDTO> {
    const currentUserId = req.user.id;
    return this.channelsService.addChannelMember(
      channelId,
      userId,
      currentUserId,
    );
  }

  /**
   * Remove member from channel
   * DELETE /channels/:channelId/members/:userId
   */
  @Delete(':channelId/members/:userId')
  async removeMember(
    @Param('channelId') channelId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ): Promise<ChannelResponseDTO> {
    const currentUserId = req.user.id;
    return this.channelsService.removeChannelMember(
      channelId,
      userId,
      currentUserId,
    );
  }

  /**
   * Get channel members
   * GET /channels/:channelId/members
   */
  @Get(':channelId/members')
  async getMembers(
    @Param('channelId') channelId: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.channelsService.getChannelMembers(channelId, userId);
  }
}

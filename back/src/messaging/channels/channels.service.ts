import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateChannelDTO } from '../dto/create-channel.dto';
import { UpdateChannelDTO } from '../dto/update-channel.dto';
import { ChannelResponseDTO } from '../dto/channel-response.dto';

@Injectable()
export class ChannelsService {
  constructor(
    private prisma: DatabaseService,
    private cloudinaryService: CloudinaryService,
  ) { }

  /**
   * Create a new channel
   */
  async createChannel(
    dto: CreateChannelDTO,
    userId: string,
  ): Promise<ChannelResponseDTO> {
    // Verify user is member of project

    const projectMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: dto.projectId,
          userId,
        },
      },
    });
    
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { roleAssignments: { include: { role: true } } } });

    if (!projectMember && !user?.roleAssignments.some(ra => ['OWNER', 'ADMIN', 'Super Admin'].includes(ra.role.name))) {
      throw new ForbiddenException(
        'You must be a member of the project to create channels',
      );
    }

    const channel = await this.prisma.channel.create({
      data: {
        projectId: dto.projectId,
        name: dto.name,
        type: dto.type,
        createdById: userId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Add creator as first member
    await this.prisma.channelMember.create({
      data: {
        channelId: channel.id,
        userId,
      },
    });

    return this.formatChannelResponse(channel);
  }

  /**
   * Get all channels in a project (excluding soft-deleted)
   */
  async getChannelsByProject(
    projectId: string,
    userId: string,
  ): Promise<ChannelResponseDTO[]> {
    // Verify user is member of project
    const projectMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { roleAssignments: { include: { role: true } } } });

    if (!projectMember && !user?.roleAssignments.some(ra => ['OWNER', 'ADMIN', 'Super Admin'].includes(ra.role.name))) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const channels = await this.prisma.channel.findMany({
      where: {
        projectId,
        isDeleted: false,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
        messages: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return channels.map((ch) => this.formatChannelResponse(ch));
  }

  /**
   * Get single channel with members (excluding soft-deleted)
   */
  async getChannel(
    channelId: string,
    userId: string,
  ): Promise<ChannelResponseDTO> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
        messages: true,
      },
    });

    if (!channel || channel.isDeleted) {
      throw new NotFoundException('Channel not found');
    }

    // Verify user has access (is member of channel or project)
    const isMember = channel.members.some((m) => m.userId === userId);
    if (!isMember && channel.projectId) {
      const projectMember = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: channel.projectId,
            userId,
          },
        },
      });
      if (!projectMember) {
        throw new ForbiddenException('You do not have access to this channel');
      }
    }

    return this.formatChannelResponse(channel);
  }

  /**
   * Update channel (name, etc)
   */
  async updateChannel(
    channelId: string,
    dto: UpdateChannelDTO,
    userId: string,
  ): Promise<ChannelResponseDTO> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!channel || channel.isDeleted) {
      throw new NotFoundException('Channel not found');
    }

    // Verify user is channel member (for now, any member can update)
    const isMember = channel.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException(
        'Only channel members can update the channel',
      );
    }

    const updated = await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        name: dto.name ?? channel.name,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return this.formatChannelResponse(updated);
  }

  /**
   * Soft delete channel (channel creator or project owner/admin can delete)
   * Deletes all Cloudinary files but preserves channel data for audit trail
   */
  async deleteChannel(channelId: string, userId: string): Promise<void> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        messages: {
          include: { attachments: true },
        },
      },
    });

    if (!channel || channel.isDeleted) {
      throw new NotFoundException('Channel not found');
    }

    // Check if user is channel creator
    const isChannelCreator = channel.createdById === userId;

    // Check if user is project owner/admin
    let isProjectAdmin = false;
    if (channel.projectId) {
      const projectMember = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: channel.projectId,
            userId,
          },
        },
      });

      isProjectAdmin =
        projectMember != null &&
        ['OWNER', 'ADMIN'].includes(projectMember.role);
    }

    // Allow deletion if channel creator OR project admin
    if (!isChannelCreator && !isProjectAdmin) {
      throw new ForbiddenException(
        'Only channel creator or project admin can delete this channel',
      );
    }

    // Delete all Cloudinary files associated with messages in this channel
    for (const message of channel.messages) {
      for (const attachment of message.attachments) {
        try {
          const publicId = this.extractPublicIdFromUrl(attachment.storagePath);
          await this.cloudinaryService.deleteFile(publicId);
        } catch (error) {
          // Log error but don't fail the whole operation
          console.error(
            `Failed to delete Cloudinary file ${attachment.storagePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }
    }

    // Soft delete channel (preserve data for audit trail)
    await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Restore a soft-deleted channel (project admin only)
   */
  async restoreChannel(
    channelId: string,
    userId: string,
  ): Promise<ChannelResponseDTO> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Only project admins can restore
    if (channel.projectId) {
      const projectMember = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: channel.projectId,
            userId,
          },
        },
      });

      if (!projectMember || !['OWNER', 'ADMIN'].includes(projectMember.role)) {
        throw new ForbiddenException('Only project admin can restore channels');
      }
    }

    const restored = await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return this.formatChannelResponse(restored);
  }

  /**
   * Add member to channel
   */
  async addChannelMember(
    channelId: string,
    userId: string,
    currentUserId: string,
  ): Promise<ChannelResponseDTO> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel || channel.isDeleted) {
      throw new NotFoundException('Channel not found');
    }

    // Verify requester is channel member
    const requesterMember = await this.prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: currentUserId,
        },
      },
    });

    if (!requesterMember) {
      throw new ForbiddenException('Only channel members can add new members');
    }

    // Check if user already in channel
    const existing = await this.prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already a member of this channel');
    }

    await this.prisma.channelMember.create({
      data: {
        channelId,
        userId,
      },
    });

    return this.getChannel(channelId, currentUserId);
  }

  /**
   * Remove member from channel
   */
  async removeChannelMember(
    channelId: string,
    userId: string,
    currentUserId: string,
  ): Promise<ChannelResponseDTO> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel || channel.isDeleted) {
      throw new NotFoundException('Channel not found');
    }

    // Allow user to remove themselves, or channel member can remove others
    if (userId !== currentUserId) {
      const requesterMember = await this.prisma.channelMember.findUnique({
        where: {
          channelId_userId: {
            channelId,
            userId: currentUserId,
          },
        },
      });

      if (!requesterMember) {
        throw new ForbiddenException(
          'You do not have permission to remove members',
        );
      }
    }

    await this.prisma.channelMember.delete({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    return this.getChannel(channelId, currentUserId);
  }

  /**
   * Get channel members
   */
  async getChannelMembers(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!channel || channel.isDeleted) {
      throw new NotFoundException('Channel not found');
    }

    // Verify user has access
    const isMember = channel.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this channel');
    }

    return channel.members;
  }

  private formatChannelResponse(channel: any): ChannelResponseDTO {
    return {
      id: channel.id,
      projectId: channel.projectId,
      ticketId: channel.ticketId,
      name: channel.name,
      type: channel.type,
      createdAt: channel.createdAt,
      members: channel.members?.map((m) => m.user) ?? [],
      messageCount: channel.messages?.length ?? 0,
    };
  }

  /**
   * Extract public_id from Cloudinary URL for deletion
   * Example: https://res.cloudinary.com/cloud/image/upload/v123/messages/file.jpg
   * Returns: messages/file
   */
  private extractPublicIdFromUrl(url: string): string {
    try {
      const parts = url.split('/');
      const vIndex = parts.findIndex((p) => p.startsWith('v'));
      if (vIndex === -1) {
        throw new Error('Invalid Cloudinary URL');
      }
      const publicIdWithExtension = parts.slice(vIndex + 1).join('/');
      // Remove file extension
      return publicIdWithExtension.split('.')[0];
    } catch (error) {
      throw new Error(
        `Failed to extract public ID from URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateTicketStatusDto } from './dto/create-ticket-status.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { ProjectRole } from 'generated/prisma/client';

@Injectable()
export class TicketStatusService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Check if user has admin privileges on a project
   */
  async checkProjectAdminAccess(userId: string, projectId: string): Promise<void> {
    const member = await this.db.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!member) {
      throw new ForbiddenException('User is not a member of this project');
    }

    const adminRoles = [ProjectRole.OWNER, ProjectRole.ADMIN];
    if (!adminRoles.includes(member.role)) {
      throw new ForbiddenException('Only project admins or owners can manage statuses');
    }
  }

  /**
   * Get all statuses for a project, ordered by order field
   */
  async getProjectStatuses(projectId: string) {
    const project = await this.db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.db.ticketStatus.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Create a new status for a project
   */
  async createStatus(projectId: string, dto: CreateTicketStatusDto) {
    const project = await this.db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // If this is marked as default, unset default flag from existing status
    if (dto.isDefault) {
      await this.db.ticketStatus.updateMany({
        where: { projectId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Check for duplicate name
    const existing = await this.db.ticketStatus.findFirst({
      where: { projectId, name: dto.name },
    });

    if (existing) {
      throw new BadRequestException(`Status "${dto.name}" already exists in this project`);
    }

    const maxOrder = await this.db.ticketStatus.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (maxOrder?.order ?? -1) + 1;

    return this.db.ticketStatus.create({
      data: {
        projectId,
        name: dto.name,
        slug: dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-'),
        color: dto.color || '#808080',
        order: dto.order ?? nextOrder,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  /**
   * Update an existing status
   */
  async updateStatus(projectId: string, statusId: string, dto: UpdateTicketStatusDto) {
    const status = await this.db.ticketStatus.findUnique({
      where: { id: statusId },
    });

    if (!status) {
      throw new NotFoundException('Status not found');
    }

    if (status.projectId !== projectId) {
      throw new ForbiddenException('Status does not belong to this project');
    }

    // If marking as default, unset other statuses
    if (dto.isDefault === true) {
      await this.db.ticketStatus.updateMany({
        where: { projectId, isDefault: true, id: { not: statusId } },
        data: { isDefault: false },
      });
    }

    // Check for duplicate name if name is being changed
    if (dto.name && dto.name !== status.name) {
      const existing = await this.db.ticketStatus.findFirst({
        where: { projectId, name: dto.name },
      });

      if (existing) {
        throw new BadRequestException(`Status "${dto.name}" already exists in this project`);
      }
    }

    return this.db.ticketStatus.update({
      where: { id: statusId },
      data: {
        name: dto.name,
        slug: dto.slug,
        color: dto.color,
        order: dto.order,
        isDefault: dto.isDefault,
      },
    });
  }

  /**
   * Delete a status from a project
   */
  async deleteStatus(projectId: string, statusId: string) {
    const status = await this.db.ticketStatus.findUnique({
      where: { id: statusId },
    });

    if (!status) {
      throw new NotFoundException('Status not found');
    }

    if (status.projectId !== projectId) {
      throw new ForbiddenException('Status does not belong to this project');
    }

    // Check if any tickets use this status
    const ticketCount = await this.db.ticket.count({
      where: { statusId },
    });

    if (ticketCount > 0) {
      throw new BadRequestException(
        `Cannot delete status: ${ticketCount} ticket(s) are using this status. Reassign tickets first.`
      );
    }

    return this.db.ticketStatus.delete({
      where: { id: statusId },
    });
  }

  /**
   * Get the default status for a project
   * Used when creating new tickets
   */
  async getDefaultStatus(projectId: string) {
    let defaultStatus = await this.db.ticketStatus.findFirst({
      where: { projectId, isDefault: true },
    });

    // If no default is set, use the first status by order
    if (!defaultStatus) {
      defaultStatus = await this.db.ticketStatus.findFirst({
        where: { projectId },
        orderBy: { order: 'asc' },
      });
    }

    return defaultStatus;
  }
}

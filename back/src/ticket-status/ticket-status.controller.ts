import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { TicketStatusService } from './ticket-status.service';
import { CreateTicketStatusDto } from './dto/create-ticket-status.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';

// Placeholder for JWT guard - will be implemented with auth module
@Controller('projects/:projectId/statuses')
export class TicketStatusController {
  constructor(private readonly ticketStatusService: TicketStatusService) {}

  /**
   * GET /projects/:projectId/statuses
   * List all statuses for a project (ordered)
   */
  @Get()
  async listStatuses(@Param('projectId') projectId: string) {
    return this.ticketStatusService.getProjectStatuses(projectId);
  }

  /**
   * POST /projects/:projectId/statuses
   * Create a new status (admin only)
   */
  @Post()
  async createStatus(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTicketStatusDto,
    @Request() req: any,
  ) {
    // TODO: Extract userId from JWT token in auth guard
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('Authentication required');
    }

    await this.ticketStatusService.checkProjectAdminAccess(userId, projectId);
    return this.ticketStatusService.createStatus(projectId, dto);
  }

  /**
   * PUT /projects/:projectId/statuses/:statusId
   * Update a status (admin only)
   */
  @Put(':statusId')
  async updateStatus(
    @Param('projectId') projectId: string,
    @Param('statusId') statusId: string,
    @Body() dto: UpdateTicketStatusDto,
    @Request() req: any,
  ) {
    // TODO: Extract userId from JWT token in auth guard
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('Authentication required');
    }

    await this.ticketStatusService.checkProjectAdminAccess(userId, projectId);
    return this.ticketStatusService.updateStatus(projectId, statusId, dto);
  }

  /**
   * DELETE /projects/:projectId/statuses/:statusId
   * Delete a status (admin only)
   */
  @Delete(':statusId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStatus(
    @Param('projectId') projectId: string,
    @Param('statusId') statusId: string,
    @Request() req: any,
  ) {
    // TODO: Extract userId from JWT token in auth guard
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('Authentication required');
    }

    await this.ticketStatusService.checkProjectAdminAccess(userId, projectId);
    await this.ticketStatusService.deleteStatus(projectId, statusId);
  }
}

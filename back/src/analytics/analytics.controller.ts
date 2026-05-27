import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('tickets/counts')
  @Permissions('assign_ticket')
  getTicketCounts(@Query('projectId') projectId?: string) {
    return this.analyticsService.getTicketCounts(projectId);
  }

  @Get('tickets/average-response-time')
  @Permissions('assign_ticket')
  getAverageResponseTime(@Query('projectId') projectId?: string) {
    return this.analyticsService.getAverageResponseTimeMinutes(projectId);
  }

  @Get('tickets/sla-breaches')
  @Permissions('assign_ticket')
  getSlaBreaches(@Query('projectId') projectId?: string) {
    return this.analyticsService.getSlaBreaches(projectId);
  }
}

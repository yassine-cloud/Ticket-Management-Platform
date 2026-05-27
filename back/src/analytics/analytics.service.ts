import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

type TicketCounts = {
  total: number;
  open: number;
  closed: number;
};

type AverageResponseTime = {
  averageMinutes: number | null;
  sampleSize: number;
};

type SlaBreaches = {
  breaches: number;
  evaluatedTickets: number;
  responseTimeMinutes: number | null;
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: DatabaseService) {}

  async getTicketCounts(projectId?: string): Promise<TicketCounts> {
    const where = projectId ? { projectId } : undefined;

    const [total, closed] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.count({
        where: {
          ...(where ?? {}),
          closedAt: { not: null },
        },
      }),
    ]);

    return {
      total,
      open: Math.max(total - closed, 0),
      closed,
    };
  }

  async getAverageResponseTimeMinutes(
    projectId?: string,
  ): Promise<AverageResponseTime> {
    const where = projectId ? { projectId } : undefined;
    const tickets = await this.prisma.ticket.findMany({
      where,
      select: {
        createdAt: true,
        comments: {
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    const durations = tickets
      .map((ticket) => {
        const firstComment = ticket.comments[0]?.createdAt;
        if (!firstComment) {
          return null;
        }
        const diffMs = firstComment.getTime() - ticket.createdAt.getTime();
        return Math.max(diffMs / 60000, 0);
      })
      .filter((value): value is number => value !== null);

    if (durations.length === 0) {
      return { averageMinutes: null, sampleSize: 0 };
    }

    const totalMinutes = durations.reduce((sum, value) => sum + value, 0);
    return {
      averageMinutes: totalMinutes / durations.length,
      sampleSize: durations.length,
    };
  }

  async getSlaBreaches(projectId?: string): Promise<SlaBreaches> {
    const slaWhere = projectId ? { projectId } : undefined;
    const slas = await this.prisma.sLA.findMany({
      where: slaWhere,
      select: { projectId: true, responseTimeMinutes: true },
    });

    if (slas.length === 0) {
      return { breaches: 0, evaluatedTickets: 0, responseTimeMinutes: null };
    }

    const slaByProject = new Map<string, number>();
    for (const sla of slas) {
      const current = slaByProject.get(sla.projectId);
      if (current === undefined || sla.responseTimeMinutes < current) {
        slaByProject.set(sla.projectId, sla.responseTimeMinutes);
      }
    }

    const where = projectId ? { projectId } : undefined;
    const tickets = await this.prisma.ticket.findMany({
      where,
      select: {
        projectId: true,
        createdAt: true,
        comments: {
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    const now = Date.now();
    let breaches = 0;
    let evaluatedTickets = 0;

    for (const ticket of tickets) {
      const responseTimeMinutes = slaByProject.get(ticket.projectId);
      if (responseTimeMinutes === undefined) {
        continue;
      }

      evaluatedTickets += 1;

      const firstComment = ticket.comments[0]?.createdAt;
      const diffMs =
        (firstComment ? firstComment.getTime() : now) -
        ticket.createdAt.getTime();
      const diffMinutes = diffMs / 60000;

      if (diffMinutes > responseTimeMinutes) {
        breaches += 1;
      }
    }

    const selectedResponseTime = projectId
      ? (slaByProject.get(projectId) ?? null)
      : null;

    return {
      breaches,
      evaluatedTickets,
      responseTimeMinutes: selectedResponseTime,
    };
  }
}

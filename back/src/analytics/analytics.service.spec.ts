import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { DatabaseService } from '../database/database.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const databaseService = {
    ticket: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    sLA: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: DatabaseService,
          useValue: databaseService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns ticket counts with open and closed totals', async () => {
    databaseService.ticket.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(4);

    const result = await service.getTicketCounts();

    expect(result).toEqual({ total: 10, open: 6, closed: 4 });
    expect(databaseService.ticket.count).toHaveBeenCalledTimes(2);
    expect(databaseService.ticket.count).toHaveBeenNthCalledWith(2, {
      where: { status: { in: ['RESOLVED', 'CLOSED'] } },
    });
  });

  it('calculates average response time from first comment', async () => {
    const base = new Date('2026-05-27T10:00:00.000Z');
    databaseService.ticket.findMany.mockResolvedValue([
      {
        createdAt: base,
        comments: [{ createdAt: new Date('2026-05-27T10:30:00.000Z') }],
      },
      {
        createdAt: base,
        comments: [{ createdAt: new Date('2026-05-27T11:00:00.000Z') }],
      },
      {
        createdAt: base,
        comments: [],
      },
    ]);

    const result = await service.getAverageResponseTimeMinutes();

    expect(result.sampleSize).toBe(2);
    expect(result.averageMinutes).toBe(45);
  });

  it('returns sla breaches based on response time minutes', async () => {
    databaseService.sLA.findMany.mockResolvedValue([
      { projectId: 'project-1', responseTimeMinutes: 30 },
    ]);

    databaseService.ticket.findMany.mockResolvedValue([
      {
        projectId: 'project-1',
        createdAt: new Date('2026-05-27T10:00:00.000Z'),
        comments: [{ createdAt: new Date('2026-05-27T10:20:00.000Z') }],
      },
      {
        projectId: 'project-1',
        createdAt: new Date('2026-05-27T10:00:00.000Z'),
        comments: [{ createdAt: new Date('2026-05-27T11:00:00.000Z') }],
      },
    ]);

    const result = await service.getSlaBreaches();

    expect(result.breaches).toBe(1);
    expect(result.evaluatedTickets).toBe(2);
  });

  it('returns zero breaches when no SLA configured', async () => {
    databaseService.sLA.findMany.mockResolvedValue([]);

    const result = await service.getSlaBreaches();

    expect(result).toEqual({ breaches: 0, evaluatedTickets: 0, responseTimeMinutes: null });
  });
});

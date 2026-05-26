import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { DatabaseService } from '../database/database.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: DatabaseService,
          useValue: {}, // Mock DatabaseService
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() }, // Mock EventEmitter2
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

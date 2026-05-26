import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TICKET_EVENTS } from '../config/ticket-events.config';
import { firstValueFrom } from 'rxjs';

describe('TicketsController', () => {
  let controller: TicketsController;
  let eventEmitter: EventEmitter2;

  const mockTicketsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: mockTicketsService,
        },
        // Using the real EventEmitter2 to test RxJS fromEvent mappings
        EventEmitter2,
      ],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sse endpoint', () => {
    it('should map ticket creation events to SSE MessageEvent format', async () => {
      // 1. Get the observable from the controller
      const sse$ = controller.sse();
      
      // 2. Prepare dummy data
      const mockTicket = { id: '123', title: 'New Ticket' };
      
      // 3. Create a promise that waits for the FIRST emitted value on the observable
      const firstEventPromise = firstValueFrom(sse$);

      // 4. Emit the raw event via EventEmitter2 (simulating what the service does)
      eventEmitter.emit(TICKET_EVENTS.CREATED, mockTicket);

      // 5. Await the mapped observable result
      const result = await firstEventPromise;

      // 6. Assert it matches the expected SSE shape
      expect(result).toEqual({
        type: 'ticket-created',
        data: mockTicket,
      });
    });

    it('should map ticket update events', async () => {
      const sse$ = controller.sse();
      const mockTicket = { id: '123', title: 'Updated Ticket' };
      const firstEventPromise = firstValueFrom(sse$);
      eventEmitter.emit(TICKET_EVENTS.UPDATED, mockTicket);
      const result = await firstEventPromise;

      expect(result).toEqual({
        type: 'ticket-updated',
        data: mockTicket,
      });
    });
  });
});

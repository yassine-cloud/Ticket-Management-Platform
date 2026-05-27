import { Module } from '@nestjs/common';
import { TicketStatusService } from './ticket-status.service';
import { TicketStatusController } from './ticket-status.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [TicketStatusService],
  controllers: [TicketStatusController],
  exports: [TicketStatusService],
})
export class TicketStatusModule {}

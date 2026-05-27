import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { TicketStatusModule } from './ticket-status/ticket-status.module';
import { EventEmitterModule } from '@nestjs/event-emitter';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.'
    }),
    DatabaseModule,
    TicketStatusModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

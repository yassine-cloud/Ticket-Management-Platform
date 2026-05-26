import { NestFactory } from '@nestjs/core';
import { TicketSeederService } from './commands/ticket.seeder';
import { SeederModule } from './seeder.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);

  try {
    const seederService = app.get(TicketSeederService);
    await seederService.seed();
    console.log('Database seeding complete!');
  } catch (error) {
    console.error('Database seeding failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [CloudinaryModule, DatabaseModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}

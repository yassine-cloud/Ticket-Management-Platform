import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [CloudinaryModule, DatabaseModule],
  controllers: [ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}

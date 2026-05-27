import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { CloudinaryModule } from '../messaging/cloudinary/cloudinary.module';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';

@Module({
  imports: [DatabaseModule, CloudinaryModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}

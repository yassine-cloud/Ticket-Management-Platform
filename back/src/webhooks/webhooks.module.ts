import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksListener } from './webhooks.listener';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [WebhooksService, WebhooksListener],
  exports: [WebhooksService],
})
export class WebhooksModule {}

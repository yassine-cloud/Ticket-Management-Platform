import { Module } from '@nestjs/common';
import { ChannelsModule } from './channels/channels.module';
import { MessagesModule } from './messages/messages.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MessagingGateway } from './messaging.gateway';

@Module({
  imports: [ChannelsModule, MessagesModule, CloudinaryModule],
  providers: [MessagingGateway],
  exports: [MessagingGateway],
})
export class MessagingModule {}

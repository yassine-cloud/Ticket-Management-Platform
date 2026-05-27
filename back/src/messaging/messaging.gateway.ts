import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';

/**
 * Socket.IO Gateway for real-time messaging
 * TODO: Implement all WebSocket events and handlers
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Join a channel room
   * Client: socket.emit('join-channel', { channelId, userId })
   */
  @SubscribeMessage('join-channel')
  handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; userId: string },
  ) {
    const room = `channel-${data.channelId}`;
    client.join(room);
    console.log(`User ${data.userId} joined channel ${data.channelId}`);
    this.server.to(room).emit('user-joined', {
      channelId: data.channelId,
      userId: data.userId,
      timestamp: new Date(),
    });
  }

  /**
   * Leave a channel room
   * Client: socket.emit('leave-channel', { channelId, userId })
   */
  @SubscribeMessage('leave-channel')
  handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; userId: string },
  ) {
    const room = `channel-${data.channelId}`;
    client.leave(room);
    console.log(`User ${data.userId} left channel ${data.channelId}`);
    this.server.to(room).emit('user-left', {
      channelId: data.channelId,
      userId: data.userId,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast typing indicator
   * Client: socket.emit('typing', { channelId, userId })
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; userId: string },
  ) {
    const room = `channel-${data.channelId}`;
    this.server.to(room).emit('user-typing', {
      channelId: data.channelId,
      userId: data.userId,
      timestamp: new Date(),
    });
  }

  /**
   * Stop typing
   * Client: socket.emit('stop-typing', { channelId, userId })
   */
  @SubscribeMessage('stop-typing')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string; userId: string },
  ) {
    const room = `channel-${data.channelId}`;
    this.server.to(room).emit('user-stopped-typing', {
      channelId: data.channelId,
      userId: data.userId,
      timestamp: new Date(),
    });
  }

  /**
   * Emit message.created event to channel
   */
  @OnEvent('messaging.message.created')
  emitMessageCreated(message: Record<string, any> & { channelId: string }) {
    const room = `channel-${message.channelId}`;
    this.server.to(room).emit('message.created', {
      channelId: message.channelId,
      message,
      timestamp: new Date(),
    });
  }

  /**
   * Emit message.updated event to channel
   */
  @OnEvent('messaging.message.updated')
  emitMessageUpdated(message: Record<string, any> & { channelId: string }) {
    const room = `channel-${message.channelId}`;
    this.server.to(room).emit('message.updated', {
      channelId: message.channelId,
      message,
      timestamp: new Date(),
    });
  }

  /**
   * Emit message.deleted event to channel
   */
  @OnEvent('messaging.message.deleted')
  emitMessageDeleted(event: { channelId: string; messageId: string }) {
    const room = `channel-${event.channelId}`;
    this.server.to(room).emit('message.deleted', {
      channelId: event.channelId,
      messageId: event.messageId,
      timestamp: new Date(),
    });
  }
}

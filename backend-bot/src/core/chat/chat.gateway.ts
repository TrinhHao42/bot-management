import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendToClient(botId: string, userId: string, message: string) {
    // For now we broadcast, or we could track client IDs by userId
    this.server.emit('chat_reply', { botId, userId, message });
  }

  sendTypingStatus(botId: string, userId: string, isTyping: boolean) {
    this.server.emit('typing_status', { botId, userId, isTyping });
  }
}

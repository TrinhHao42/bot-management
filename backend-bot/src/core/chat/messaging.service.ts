import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatLogEntity } from '../../entities/chat-log.entity';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    private readonly chatGateway: ChatGateway,
    @InjectRepository(ChatLogEntity)
    private readonly chatLogRepository: Repository<ChatLogEntity>,
  ) {}

  async sendMessage(botId: string, userId: string, content: string): Promise<void> {
    this.logger.log(`[MessageBroker] Dispatching message from ${botId} to User ${userId}: ${content.substring(0, 50)}...`);
    
    // Save to database
    const saved = await this.chatLogRepository.save({
      botId,
      userId,
      message: content,
      sender: 'bot',
    });
    this.logger.log(`Saved bot response to DB: ${saved.id}`);

    // Simulating message push via websocket
    this.chatGateway.sendToClient(botId, userId, content);
    
    return;
  }

  async sendTypingStatus(botId: string, userId: string, isTyping: boolean): Promise<void> {
    this.chatGateway.sendTypingStatus(botId, userId, isTyping);
  }
}

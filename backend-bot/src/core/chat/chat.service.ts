import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PluginManagerService } from '../plugins/plugin-manager.service';
import { ChatContext } from '../plugins/interfaces/bot-plugin.interface';
import { ChatLogEntity } from '../../entities/chat-log.entity';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly pluginManager: PluginManagerService,
    @InjectRepository(ChatLogEntity)
    private readonly chatLogRepository: Repository<ChatLogEntity>,
  ) {}

  async handleIncomingMessage(botId: string, userId: string, message: string): Promise<string> {
    const plugin = this.pluginManager.getPlugin(botId);
    
    // Log user message
    const saved = await this.chatLogRepository.save({
      botId,
      userId,
      message,
      sender: 'user',
    });
    this.logger.log(`Saved user message to DB: ${saved.id}`);
    
    if (!plugin) {
      this.logger.warn(`Received message for inactive or non-existent bot: ${botId}`);
      return 'Bot is currently inactive or not installed.';
    }

    const context: ChatContext = {
      botId,
      userId,
      message,
    };

    try {
      // Execute in background to prevent HTTP timeout during long crawling tasks
      plugin.messaging.handleMessage(context).catch(error => {
        this.logger.error(`Error in background messaging task for bot ${botId}: ${error.message}`);
      });
      
      return 'Message dispatched successfully.';
    } catch (error) {
      this.logger.error(`Error executing plugin messaging for bot ${botId}: ${error.message}`);
      return 'Internal Error: Bot failed to process message.';
    }
  }

  async getChatHistory(botId: string, userId: string = 'user-1'): Promise<ChatLogEntity[]> {
    this.logger.log(`Fetching chat history for bot: ${botId}, user: ${userId}`);
    const history = await this.chatLogRepository.find({
      where: { botId, userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    this.logger.log(`Found ${history.length} messages in history`);
    
    // Reverse to show in chronological order for the UI
    return history.reverse();
  }
}

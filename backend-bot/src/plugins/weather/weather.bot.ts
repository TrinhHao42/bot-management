import { Injectable, Logger } from '@nestjs/common';
import { IBotPlugin, ChatContext } from '../../core/plugins/interfaces/bot-plugin.interface';
import { MessagingService } from '../../core/chat/messaging.service';

@Injectable()
export class WeatherBot implements IBotPlugin {
  private readonly logger = new Logger(WeatherBot.name);

  constructor(private readonly messagingService: MessagingService) {}

  metadata = {
    id: 'bot-weather-001',
    name: 'WeatherBot',
    version: '1.0.0',
    description: 'A simple bot that tells you the weather.',
  };

  lifecycle = {
    onInstall: async () => {
      this.logger.log(`${this.metadata.name} installed.`);
    },
    onUninstall: async () => {
      this.logger.log(`${this.metadata.name} uninstalled.`);
    },
    onEnable: async () => {
      this.logger.log(`${this.metadata.name} enabled.`);
    },
    onDisable: async () => {
      this.logger.log(`${this.metadata.name} disabled.`);
    },
  };

  messaging = {
    handleMessage: async (context: ChatContext) => {
      this.logger.log(`WeatherBot processing message from ${context.userId}: ${context.message}`);
      const text = context.message.toLowerCase();
      
      const match = text.match(/thời tiết (.+)/i);
      if (match) {
        const city = match[1];
        await this.messagingService.sendMessage(this.metadata.id, context.userId, `[WeatherBot] Thời tiết tại ${city} hiện tại đang là 28 độ C, có mây rải rác.`);
      } else {
        await this.messagingService.sendMessage(this.metadata.id, context.userId, `[WeatherBot] Xin chào! Bạn hãy hỏi "thời tiết <tên thành phố>" nhé.`);
      }
    },
  };
}

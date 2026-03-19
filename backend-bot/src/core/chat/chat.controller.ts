import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post(':botId')
  async sendMessage(
    @Param('botId') botId: string,
    @Body('userId') userId: string,
    @Body('message') message: string,
  ) {
    const result = await this.chatService.handleIncomingMessage(botId, userId, message);
    return { status: result };
  }

  @Get(':botId')
  async getChatHistory(
    @Param('botId') botId: string,
  ) {
    const history = await this.chatService.getChatHistory(botId);
    return history;
  }
}

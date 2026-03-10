import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PluginModule } from '../plugins/plugin.module';
import { MessagingService } from './messaging.service';
import { ChatGateway } from './chat.gateway';
import { ChatLogEntity } from '../../entities/chat-log.entity';

@Module({
  imports: [PluginModule, TypeOrmModule.forFeature([ChatLogEntity])],
  controllers: [ChatController],
  providers: [ChatService, MessagingService, ChatGateway],
  exports: [ChatService, MessagingService, ChatGateway]
})
export class ChatModule {}

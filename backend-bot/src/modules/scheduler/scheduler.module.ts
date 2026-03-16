import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotSchedulerService } from './scheduler.service';
import { CrawlerModule } from '../crawler/crawler.module';
import { BotScheduleEntity } from '../../entities/bot-schedule.entity';
import { ChatModule } from '../../core/chat/chat.module';
import { GoogleSheetsModule } from '../google-sheets/google-sheets.module';
import { SchedulerController } from './scheduler.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BotScheduleEntity]),
    ScheduleModule.forRoot(), 
    CrawlerModule,
    ChatModule,
    GoogleSheetsModule
  ],
  providers: [BotSchedulerService],
  controllers: [SchedulerController],
  exports: [BotSchedulerService]
})
export class AppSchedulerModule { }

import { Module, OnModuleInit } from '@nestjs/common';
import { CareerBot } from './career.bot';
import { AppSchedulerModule } from '../../modules/scheduler/scheduler.module';
import { ChatModule } from '../../core/chat/chat.module';
import { CrawlerModule } from '../../modules/crawler/crawler.module';
import { PluginManagerService } from '../../core/plugins/plugin-manager.service';
import { GoogleSheetsModule } from '../../modules/google-sheets/google-sheets.module';

@Module({
  imports: [AppSchedulerModule, ChatModule, CrawlerModule, GoogleSheetsModule],
  providers: [CareerBot],
  exports: [CareerBot],
})
export class CareerModule implements OnModuleInit {
  constructor(
    private readonly pluginManager: PluginManagerService,
    private readonly careerBot: CareerBot,
  ) {}

  onModuleInit() {
    this.pluginManager.registerPlugin(this.careerBot.metadata.id, CareerBot);
  }
}

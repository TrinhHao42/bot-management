import { Module, OnModuleInit } from '@nestjs/common';
import { WeatherBot } from './weather.bot';
import { PluginManagerService } from '../../core/plugins/plugin-manager.service';
import { ChatModule } from '../../core/chat/chat.module';

@Module({
  imports: [ChatModule],
  providers: [WeatherBot],
  exports: [WeatherBot],
})
export class WeatherModule implements OnModuleInit {
  constructor(
    private readonly pluginManager: PluginManagerService,
    private readonly weatherBot: WeatherBot,
  ) {}

  onModuleInit() {
    this.pluginManager.registerPlugin(this.weatherBot.metadata.id, WeatherBot);
  }
}

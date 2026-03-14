import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotEntity } from '../../entities/bot.entity';
import { PluginManagerService } from './plugin-manager.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([BotEntity])],
  providers: [PluginManagerService],
  exports: [PluginManagerService],
})
export class PluginModule {}

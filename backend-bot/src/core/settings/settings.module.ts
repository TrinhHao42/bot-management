import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotEntity } from '../../entities/bot.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BotEntity])],
  providers: [SettingsService],
  controllers: [SettingsController],
})
export class SettingsModule {}

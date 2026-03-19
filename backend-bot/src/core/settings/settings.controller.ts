import { Controller, Get, Patch, Delete, Post, Param, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { BotEntity } from '../../entities/bot.entity';

@Controller('bots')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getAllBots(): Promise<BotEntity[]> {
    return this.settingsService.getAllBots();
  }

  @Patch(':id/toggle')
  toggleBot(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ): Promise<BotEntity> {
    return this.settingsService.toggleBot(id, isActive);
  }

  @Post('install')
  installBot(@Body() botData: Partial<BotEntity>): Promise<BotEntity> {
    return this.settingsService.installBot(botData);
  }

  @Delete(':id')
  uninstallBot(@Param('id') id: string): Promise<void> {
    return this.settingsService.uninstallBot(id);
  }
}

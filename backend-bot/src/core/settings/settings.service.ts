import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotEntity } from '../../entities/bot.entity';
import { PluginManagerService } from '../plugins/plugin-manager.service';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(BotEntity)
    private readonly botRepository: Repository<BotEntity>,
    private readonly pluginManager: PluginManagerService,
  ) {}

  async getAllBots(): Promise<BotEntity[]> {
    return this.botRepository.find();
  }

  async toggleBot(id: string, isActive: boolean): Promise<BotEntity> {
    const bot = await this.botRepository.findOne({ where: { id } });
    if (!bot) {
      throw new NotFoundException(`Bot with ID ${id} not found.`);
    }

    if (isActive) {
      await this.pluginManager.enableBot(id);
    } else {
      await this.pluginManager.disableBot(id);
    }

    return (await this.botRepository.findOne({ where: { id } }))!;
  }

  async installBot(botData: Partial<BotEntity>): Promise<BotEntity> {
    const bot = this.botRepository.create(botData);
    const savedBot = await this.botRepository.save(bot);
    
    if (bot.isActive) {
      await this.pluginManager.enableBot(bot.id);
    }
    return savedBot;
  }

  async uninstallBot(id: string): Promise<void> {
    const bot = await this.botRepository.findOne({ where: { id } });
    if (!bot) {
      throw new NotFoundException(`Bot with ID ${id} not found.`);
    }

    await this.pluginManager.disableBot(id);
    await this.botRepository.delete(id);
  }
}

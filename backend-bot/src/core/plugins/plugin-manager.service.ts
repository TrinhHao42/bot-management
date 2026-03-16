import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { BotEntity } from '../../entities/bot.entity';
import { IBotPlugin } from './interfaces/bot-plugin.interface';

@Injectable()
export class PluginManagerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PluginManagerService.name);
  private readonly activePlugins = new Map<string, IBotPlugin>();
  private readonly registeredPlugins = new Map<string, any>();

  constructor(
    @InjectRepository(BotEntity)
    private readonly botRepository: Repository<BotEntity>,
    private readonly moduleRef: ModuleRef,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Bootstrapping Plugin Manager...');
    await this.loadActiveBots();
  }

  registerPlugin(botId: string, token: any) {
    this.registeredPlugins.set(botId, token);
    this.logger.log(`Registered plugin token for bot: ${botId}`);
  }

  async loadActiveBots() {
    try {
      const activeBots = await this.botRepository.find({ where: { isActive: true } });
      for (const bot of activeBots) {
        await this.enableBot(bot.id);
      }
    } catch (error) {
      this.logger.warn(`Could not load bots from database: ${error.message}`);
    }
  }

  async enableBot(botId: string) {
    const token = this.registeredPlugins.get(botId);
    if (!token) {
      this.logger.warn(`No token registered for bot ${botId}`);
      return;
    }

    try {
      const pluginInstance = this.moduleRef.get<IBotPlugin>(token, { strict: false });
      if (pluginInstance) {
        await pluginInstance.lifecycle.onEnable();
        this.activePlugins.set(botId, pluginInstance);
        this.logger.log(`Bot ${botId} enabled successfully.`);
        
        await this.botRepository.update({ id: botId }, { isActive: true });
      }
    } catch (error) {
      this.logger.error(`Failed to enable bot ${botId}: ${error.message}`);
    }
  }

  async disableBot(botId: string) {
    const plugin = this.activePlugins.get(botId);
    if (plugin) {
      await plugin.lifecycle.onDisable();
      this.activePlugins.delete(botId);
      this.logger.log(`Bot ${botId} disabled.`);
      
      await this.botRepository.update({ id: botId }, { isActive: false });
    }
  }

  getPlugin(botId: string): IBotPlugin | undefined {
    return this.activePlugins.get(botId);
  }

  getAllRegisteredBots() {
    return Array.from(this.registeredPlugins.keys());
  }

  getActiveBots() {
    return Array.from(this.activePlugins.keys());
  }
}

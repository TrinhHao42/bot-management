import { Controller, Get, Post, Body, Param, Delete, Query, Logger } from '@nestjs/common';
import { BotSchedulerService } from './scheduler.service';

@Controller('automation')
export class SchedulerController {
  private readonly logger = new Logger(SchedulerController.name);
  
  constructor(private readonly schedulerService: BotSchedulerService) {
    this.logger.log('AutomationController initialized and mapped to /automation');
  }

  @Get('health')
  health() {
    return { status: 'ok', service: 'automation' };
  }

  @Get(':botId')
  async getSchedule(
    @Param('botId') botId: string,
    @Query('userId') userId: string = 'user-1'
  ) {
    const schedule = await this.schedulerService.getSchedule(userId, botId);
    return schedule || { isActive: false };
  }

  @Post(':botId')
  async createSchedule(
    @Param('botId') botId: string,
    @Body() body: {
      userId: string;
      intervalValue: number;
      intervalUnit: 'minutes' | 'hours' | 'days';
      keywords: string;
      level?: string;
      salary?: string;
      location?: string;
      company?: string;
    }
  ) {
    const { userId = 'user-1', intervalValue = 1, intervalUnit = 'hours', ...options } = body;
    
    let cronExpression = '';
    const safeValue = intervalValue || 1;
    if (intervalUnit === 'minutes') {
      cronExpression = `0 */${safeValue} * * * *`;
    } else if (intervalUnit === 'days') {
      cronExpression = `0 0 0 */${safeValue} * *`;
    } else {
      // Default to hours
      cronExpression = `0 0 */${safeValue} * * *`;
    }
    
    return this.schedulerService.createSchedule(userId, botId, cronExpression, { 
      intervalValue, 
      intervalUnit, 
      ...options 
    });
  }

  @Delete(':botId')
  async deleteSchedule(
    @Param('botId') botId: string,
    @Query('userId') userId: string = 'user-1'
  ) {
    await this.schedulerService.deleteSchedule(userId, botId);
    return { status: 'deleted' };
  }
}

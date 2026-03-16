import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CronJob } from 'cron';
import { JobCrawlerService } from '../crawler/job-crawler.service';
import { BotScheduleEntity } from '../../entities/bot-schedule.entity';
import { MessagingService } from '../../core/chat/messaging.service';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';

@Injectable()
export class BotSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BotSchedulerService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectRepository(BotScheduleEntity)
    private readonly scheduleRepository: Repository<BotScheduleEntity>,
    private readonly jobCrawler: JobCrawlerService,
    private readonly messagingService: MessagingService,
    private readonly googleSheetsService: GoogleSheetsService
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Loading schedules from DB...');
    const schedules = await this.scheduleRepository.find({ where: { isActive: true } });
    for (const schedule of schedules) {
      // Cleanup invalid cron expressions caused by previous 'undefined' bug
      if (schedule.cronExpression.includes('undefined') || !schedule.cronExpression) {
        this.logger.warn(`Fixing invalid cron for bot ${schedule.botId}. Resetting to default.`);
        schedule.cronExpression = '0 */1 * * *'; // Default to 1 hour
        await this.scheduleRepository.save(schedule);
      }
      this.addCronJob(schedule);
    }
  }

  async createSchedule(userId: string, botId: string, cronExpression: string, options: {
    intervalValue: number,
    intervalUnit: string,
    keywords?: string,
    level?: string,
    salary?: string,
    location?: string,
    company?: string
  }) {
    try {
      let schedule = await this.scheduleRepository.findOne({ where: { userId, botId } });
      if (!schedule) {
        schedule = this.scheduleRepository.create({ 
          ...options,
          userId, 
          botId, 
          cronExpression, 
          intervalValue: options.intervalValue || 1,
          intervalUnit: options.intervalUnit || 'hours'
        });
      } else {
        // Remove old job before updating
        this.removeCronJob(schedule);
        schedule.cronExpression = cronExpression;
        schedule.intervalValue = options.intervalValue || 1;
        schedule.intervalUnit = options.intervalUnit || 'hours';
        schedule.keywords = options.keywords || '';
        schedule.level = options.level || '';
        schedule.salary = options.salary || '';
        schedule.location = options.location || '';
        schedule.company = options.company || '';
        schedule.isActive = true;
      }
      
      const saved = await this.scheduleRepository.save(schedule);
      this.addCronJob(saved);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to create schedule for bot ${botId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  private addCronJob(schedule: BotScheduleEntity) {
    const jobName = `bot_${schedule.botId}_user_${schedule.userId}`;
    try {
      if (this.schedulerRegistry.doesExist('cron', jobName)) {
        this.schedulerRegistry.deleteCronJob(jobName);
      }
    } catch (e) {
      // Job does not exist, ignore
    }

    const job = new CronJob(schedule.cronExpression, async () => {
      this.logger.log(`Triggering scheduled job ${jobName}`);
      try {
        // Send a notification that checking is starting
        await this.messagingService.sendMessage(schedule.botId, schedule.userId, `[Bot] Đang kiểm tra việc làm mới (Keywords: ${schedule.keywords})...`);

        const keywords = schedule.keywords ? schedule.keywords.split(',').map(k => k.trim()) : [];
        const jobs = await this.jobCrawler.crawl({ 
          keywords,
          level: schedule.level,
          salary: schedule.salary,
          location: schedule.location,
          company: schedule.company
        });
        
        if (jobs && jobs.length > 0) {
          const formattedJobs = jobs.slice(0, 10).map(j => {
            const title = j.title.replace(/\s+/g, ' ').trim();
            const company = j.company.replace(/\s+/g, ' ').trim();
            const salary = j.salary.replace(/\s+/g, ' ').trim();
            const levelTag = j.level && j.level !== 'unknown' ? `[${j.level.toUpperCase()}] ` : '';
            
            return `📍 ${levelTag}${title}\n🏢 ${company}\n💰 ${salary}\n👉 [Xem chi tiết tại đây](${j.url})\n`;
          }).join('\n──────────────────\n');

          const header = `🚀 **TÌM THẤY ${jobs.length} VIỆC LÀM MỚI**\n` + 
                         `🔍 Keywords: ${schedule.keywords}\n` +
                         `📅 Cập nhật lúc: ${new Date().toLocaleTimeString('vi-VN')}\n\n`;
          
          const footer = jobs.length > 10 ? `\n... và ${jobs.length - 10} công việc khác.` : '';
          
          await this.messagingService.sendMessage(schedule.botId, schedule.userId, header + formattedJobs + footer);
        } else {
          this.logger.log(`No new jobs found for schedule ${jobName}`);
        }
      } catch (error) {
        this.logger.error(`Error in scheduled job ${jobName}`, error);
      }
    });

    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();
    this.logger.log(`Added cron job ${jobName} with expression ${schedule.cronExpression}`);
  }

  async getSchedule(userId: string, botId: string) {
    return this.scheduleRepository.findOne({ where: { userId, botId } });
  }

  async deleteSchedule(userId: string, botId: string) {
    const schedule = await this.getSchedule(userId, botId);
    if (schedule) {
      this.removeCronJob(schedule);
      await this.scheduleRepository.delete(schedule.id);
    }
  }

  private removeCronJob(schedule: BotScheduleEntity) {
    const jobName = `bot_${schedule.botId}_user_${schedule.userId}`;
    try {
      if (this.schedulerRegistry.doesExist('cron', jobName)) {
        this.schedulerRegistry.deleteCronJob(jobName);
        this.logger.log(`Removed cron job ${jobName}`);
      }
    } catch (e) {
      this.logger.warn(`Could not remove cron job ${jobName}`);
    }
  }
}

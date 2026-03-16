import { Injectable, Logger } from '@nestjs/common';
import { IBotPlugin, ChatContext } from '../../core/plugins/interfaces/bot-plugin.interface';
import { MessagingService } from '../../core/chat/messaging.service';
import { BotSchedulerService } from '../../modules/scheduler/scheduler.service';
import { JobCrawlerService } from '../../modules/crawler/job-crawler.service';
import { GoogleSheetsService } from '../../modules/google-sheets/google-sheets.service';

@Injectable()
export class CareerBot implements IBotPlugin {
  private readonly logger = new Logger(CareerBot.name);

  metadata = {
    id: 'bot-carrer-001',
    name: 'CareerBot',
    version: '1.0.0',
    description: 'A bot that scrapes ITviec/TopCV for job postings and supports scheduling.',
  };

  constructor(
    private readonly messagingService: MessagingService,
    private readonly schedulerService: BotSchedulerService,
    private readonly crawlerService: JobCrawlerService,
    private readonly googleSheetsService: GoogleSheetsService,
  ) { }

  lifecycle = {
    onInstall: async () => {
      this.logger.log(`${this.metadata.name} installed.`);
    },
    onUninstall: async () => {
      this.logger.log(`${this.metadata.name} uninstalled.`);
    },
    onEnable: async () => {
      this.logger.log(`${this.metadata.name} enabled.`);
    },
    onDisable: async () => {
      this.logger.log(`${this.metadata.name} disabled.`);
    },
  };

  messaging = {
    handleMessage: async (context: ChatContext) => {
      this.logger.log(`CareerBot processing message from ${context.userId}: ${context.message}`);
      const text = context.message.toLowerCase();

      // "gửi mỗi 5 giờ" or "mỗi 5 tiếng"
      const scheduleMatch = text.match(/mỗi (\d+) (giờ|tiếng|h)/);
      if (scheduleMatch) {
        const hours = parseInt(scheduleMatch[1], 10);
        const cronExpr = `0 */${hours} * * *`;
        await this.schedulerService.createSchedule(context.userId, this.metadata.id, cronExpr, { 
          intervalValue: hours, 
          intervalUnit: 'hours',
          keywords: 'IT' 
        });
        await this.messagingService.sendMessage(this.metadata.id, context.userId, `Đã thiết lập gửi thông báo việc làm mỗi ${hours} giờ.`);
        return;
      }

      // "tìm việc nodejs tại hồ chí minh mức lương 20 triệu ở công ty fpt"
      const searchPrefix = text.match(/tìm việc (?:làm )?(.+)/);
      if (searchPrefix) {
        const fullQuery = searchPrefix[1];
        
        let keywords = fullQuery;
        let location = '';
        let salary = '';
        let company = '';
        let level = '';

        // Extract location: "tại/ở <city>"
        const locMatch = fullQuery.match(/(?:tại|ở) (?:thành phố |tp\.? )?(hồ chí minh|hcm|hà nội|hn|đà nẵng|dn)/i);
        if (locMatch) {
          location = locMatch[1];
          keywords = keywords.replace(locMatch[0], '');
        }

        // Extract salary: "mức lương/lương <val>" or just range
        const salaryMatch = fullQuery.match(/(?:mức lương|lương|tầm|khoảng)?\s?(\d+(?:\s?đến\s?|-)\d+\s?(?:triệu|tr|m|\$))/i) 
          || fullQuery.match(/(?:mức lương|lương|tầm|khoảng)?\s?(\d+\s?(?:triệu|tr|m|\$))/i);
        
        if (salaryMatch) {
          salary = salaryMatch[1];
          keywords = keywords.replace(salaryMatch[0], '');
        }

        // Extract company: "ở công ty/tại công ty <name>"
        const compMatch = fullQuery.match(/(?:ở công ty|tại công ty) ([\w\s]+)/);
        if (compMatch) {
          company = compMatch[1];
          keywords = keywords.replace(compMatch[0], '');
        }

        // Extract level: "level/trình độ <val>" or just the keyword
        const levelKeywords = 'intern|fresher|junior|middle|senior|lead|manager|architect|director';
        const levelRegex = new RegExp(`(?:level|trình độ)?\\s?\\b(${levelKeywords})\\b`, 'i');
        const levelMatch = fullQuery.match(levelRegex);
        if (levelMatch) {
          level = levelMatch[1].toLowerCase();
          keywords = keywords.replace(levelMatch[0], '');
        }

        const keywordList = keywords.split(' ').map(s => s.trim()).filter(Boolean);
        
        // Show typing indicator instead of a message
        await this.messagingService.sendTypingStatus(this.metadata.id, context.userId, true);

        const jobs = await this.crawlerService.crawl({ 
          keywords: keywordList, 
          limit: 12,
          location,
          salary,
          company,
          level
        });

        // Stop typing indicator
        await this.messagingService.sendTypingStatus(this.metadata.id, context.userId, false);
        
        if (jobs && jobs.length > 0) {
          const formattedJobs = jobs.slice(0, 10).map(j => {
            const title = j.title.replace(/\s+/g, ' ').trim();
            const company = j.company.replace(/\s+/g, ' ').trim();
            const salary = j.salary.replace(/\s+/g, ' ').trim();
            const levelTag = j.level && j.level !== 'unknown' ? `[${j.level.toUpperCase()}] ` : '';
            
            return `📍 ${levelTag}${title}\n🏢 ${company}\n💰 ${salary}\n👉 [Xem chi tiết tại đây](${j.url})\n`;
          }).join('\n──────────────────\n');

          const header = `🔎 **KẾT QUẢ TÌM KIẾM VIỆC LÀM**\n` + 
                         `🎯 Yêu cầu: "${fullQuery}"\n` +
                         `✨ Tìm thấy ${jobs.length} kết quả phù hợp:\n\n`;
          
          const footer = jobs.length > 10 ? `\n... và ${jobs.length - 10} công việc khác.` : '';
          
          await this.messagingService.sendMessage(this.metadata.id, context.userId, header + formattedJobs + footer);
          
          // Optionally save to sheets
          await this.googleSheetsService.appendJobs(jobs);
        } else {
          await this.messagingService.sendMessage(this.metadata.id, context.userId, `Không tìm thấy việc làm nào cho: "${fullQuery}".`);
        }
        return;
      }

      await this.messagingService.sendMessage(this.metadata.id, context.userId, `Xin chào! Tôi là CareerBot. Bạn có thể yêu cầu tôi "tìm việc <tên role>" hoặc đặt lịch "gửi mỗi X giờ".`);
    },
  };
}

import { Injectable, Logger } from '@nestjs/common';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { CrawledJob, JobSearchOptions } from './interfaces/crawler.interface';
import { MockCrawler } from './crawlers/mock.crawler';
import { ICrawlerStrategy } from './strategies/crawler-strategy.interface';
import { TopCVStrategy } from './strategies/topcv.strategy';
import { TopDevStrategy } from './strategies/topdev.strategy';
import { CareerVietStrategy } from './strategies/careerviet.strategy';
import { chromium, Browser } from 'playwright';

@Injectable()
export class JobCrawlerService {
  private readonly logger = new Logger(JobCrawlerService.name);
  private strategies: ICrawlerStrategy[] = [];

  constructor(private readonly sheetsService: GoogleSheetsService) {
    this.strategies = [
      new TopCVStrategy(),
      new TopDevStrategy(),
      new CareerVietStrategy(),
    ];
  }

  async crawl(options: JobSearchOptions): Promise<CrawledJob[]> {
    const { limit = 15, keywords = [] } = options;
    this.logger.log(`Starting Job Crawler for: ${keywords.join(', ')} (Limit: ${limit})...`);

    const useMock = process.env.USE_MOCK_CRAWLER === 'true';
    if (useMock) {
      this.logger.log('Initializing MockCrawler for development');
      const mock = new MockCrawler();
      // Pass keywords only for mock for simplicity or update mock later
      const mockJobs = await mock.crawl({ keywords });
      const limitedJobs = mockJobs.slice(0, limit);
      await this.saveJobs(limitedJobs);
      return limitedJobs;
    }

    this.logger.log('Running real Crawler in parallel...');
    let browserInstance: Browser | undefined;
    try {
      const browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-infobars',
        ]
      });
      browserInstance = browser;

      // Calculate limit per strategy
      const limitPerStrategy = Math.ceil(limit / this.strategies.length);
      const strategyOptions = { ...options, limit: limitPerStrategy };

      const crawlerPromises = this.strategies.map(async (strategy) => {
        const context = await browser.newContext({
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          viewport: { width: 1920, height: 1080 },
          locale: 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          timezoneId: 'Asia/Ho_Chi_Minh',
        });

        // Speed up loading by blocking images/media and analytics/ads
        await context.route('**/*.{png,jpg,jpeg,gif,webp,svg,mp4,webm,woff,woff2}', route => route.abort());
        await context.route(/.*(analytics|google-analytics|doubleclick|facebook|pixel|hotjar|segment|mixpanel|amplitude).*/, route => route.abort());

        const page = await context.newPage();

        // Manual stealth: mask webdriver
        await page.addInitScript(() => {
          Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        try {
          this.logger.log(`Starting strategy: ${strategy.name}`);
          
          let isDone = false;
          const crawlPromise = strategy.crawl(page, strategyOptions)
            .then(res => { isDone = true; return res; })
            .catch(err => {
              if (!isDone) this.logger.debug(`[${strategy.name}] Background error: ${err.message}`);
              return [];
            });

          const jobs = await Promise.race([
            crawlPromise,
            new Promise<CrawledJob[]>((_, reject) =>
              setTimeout(() => reject(new Error(`Strategy ${strategy.name} timed out`)), 90000)
            )
          ]);
          this.logger.log(`Strategy ${strategy.name} finished. Found ${jobs.length} jobs.`);
          return jobs;
        } catch (err) {
          this.logger.error(`Error in strategy ${strategy.name}:`, err.message);
          return [];
        } finally {
          await context.close();
        }
      });

      const results = await Promise.all(crawlerPromises);
      let allScrapedJobs = results.flat();
      
      // Filter by level if specified
      if (options.level) {
        const targetLevel = options.level.toLowerCase();
        allScrapedJobs = allScrapedJobs.filter(job => {
          if (!job.level || job.level === 'unknown') return true; // Keep unknown for safety, or we could be stricter
          
          const jobLevel = job.level.toLowerCase();
          
          // Basic compatibility mapping
          if (targetLevel === 'intern' && (jobLevel === 'intern' || jobLevel === 'fresher')) return true;
          if (targetLevel === 'fresher' && (jobLevel === 'fresher' || jobLevel === 'junior')) return true;
          if (targetLevel === 'junior' && (jobLevel === 'junior' || jobLevel === 'fresher' || jobLevel === 'middle')) return true;
          if (targetLevel === 'middle' && (jobLevel === 'middle' || jobLevel === 'junior' || jobLevel === 'senior')) return true;
          if (targetLevel === 'senior' && (jobLevel === 'senior' || jobLevel === 'middle' || jobLevel === 'lead')) return true;
          
          return jobLevel.includes(targetLevel) || targetLevel.includes(jobLevel);
        });
        this.logger.log(`Filtered jobs by level "${targetLevel}". Remaining: ${allScrapedJobs.length}`);
      }

      // Deduplicate by URL
      const uniqueJobs = Array.from(new Map(allScrapedJobs.map(j => [j.url, j])).values());

      // Sort by date (if available) - newest first
      uniqueJobs.sort((a, b) => {
        const dateA = a.postedDate ? new Date(a.postedDate).getTime() : 0;
        const dateB = b.postedDate ? new Date(b.postedDate).getTime() : 0;
        return dateB - dateA;
      });

      const finalJobs = uniqueJobs.slice(0, limit);

      this.logger.log(`Crawling completed. Found ${finalJobs.length} unique valid jobs across all sources.`);
      await this.saveJobs(finalJobs);

      return finalJobs;
    } catch (error) {
      this.logger.error('Error during crawling process:', error);
      return [];
    } finally {
      if (browserInstance) {
        await browserInstance.close();
      }
    }
  }

  private async saveJobs(jobs: CrawledJob[]) {
    if (jobs.length > 0) {
      await this.sheetsService.appendJobs(jobs).catch((e: Error) => {
        this.logger.warn('Failed to save to Google Sheets, but continuing...', e.message);
      });
    }
  }
}

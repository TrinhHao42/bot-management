import { Injectable, Logger } from '@nestjs/common';
import { BaseCrawler, CrawledJob, JobSearchOptions } from '../interfaces/crawler.interface';
import { generateJobHash } from '../../../shared/utils/hash.util';
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());

@Injectable()
export class PlaywrightCrawler implements BaseCrawler {
  private readonly logger = new Logger(PlaywrightCrawler.name);

  async crawl(options: JobSearchOptions): Promise<CrawledJob[]> {
    const { keywords = [] } = options;
    this.logger.log(`Playwright crawling jobs with keywords: ${keywords?.join(', ') || 'ALL'}`);
    const scrapedJobs: CrawledJob[] = [];

    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
      });

      const page = await context.newPage();
      
      // TopCV example
      const searchUrl = keywords && keywords.length > 0 
        ? `https://www.topcv.vn/tim-viec-lam-${encodeURIComponent(keywords.join('-'))}`
        : 'https://www.topcv.vn/viec-lam';
      
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Wait for job items or handle captcha
      // This is a simplified selector that needs to be updated based on real DOM
      const jobElements = await page.$$('.job-item-2, .job-item'); 
      
      for (const el of jobElements) {
        try {
          const title = await el.$eval('.title a', n => n.textContent?.trim() || '');
          const company = await el.$eval('.company', n => n.textContent?.trim() || '');
          const salary = await el.$eval('.salary', n => n.textContent?.trim() || 'Thỏa thuận');
          const url = await el.$eval('.title a', n => (n as HTMLAnchorElement).href);
          
          if (title && company) {
            scrapedJobs.push({
              uid: generateJobHash(title, company, salary),
              title,
              company,
              salary,
              level: 'unknown',
              url
            });
          }
        } catch (e) {
          // ignore parsing error for single item
        }
      }
      this.logger.log(`Found ${scrapedJobs.length} jobs via Playwright`);
    } catch (error) {
      this.logger.error('Error during Playwright crawl', error);
    } finally {
      await browser.close();
    }

    return scrapedJobs;
  }
}

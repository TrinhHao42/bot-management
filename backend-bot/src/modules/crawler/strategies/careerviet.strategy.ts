import { Page } from 'playwright';
import { Logger } from '@nestjs/common';
import { ICrawlerStrategy } from './crawler-strategy.interface';
import { CrawledJob, JobSearchOptions } from '../interfaces/crawler.interface';
import { generateJobHash } from '../../../shared/utils/hash.util';
import { parseRelativeDate, isWithinLastNDays } from '../../../shared/utils/date.util';
import { refineLevel } from '../../../shared/utils/job.util';

export class CareerVietStrategy implements ICrawlerStrategy {
  private readonly logger = new Logger(CareerVietStrategy.name);
  name = 'CareerViet';

  async crawl(page: Page, options: JobSearchOptions): Promise<CrawledJob[]> {
    const { keywords = [], limit = 10, location, level, salary, company, days = 7 } = options;
    const scrapedJobs: CrawledJob[] = [];
    
    const cityMap: Record<string, string> = { 
      'hồ chí minh': '4', 'hcm': '4', 'tp hcm': '4', 'thành phố hồ chí minh': '4',
      'hà nội': '8', 'hn': '8',
      'đà nẵng': '48', 'dn': '48' 
    };
    
    let searchUrl = keywords && keywords.length > 0 
      ? `https://careerviet.vn/vi/tim-viec-lam/${encodeURIComponent(keywords.join('-'))}.html`
      : 'https://careerviet.vn/vi/tim-viec-lam.html';

    const params = new URLSearchParams();
    const normalizedLocation = location?.toLowerCase().trim();
    if (normalizedLocation && cityMap[normalizedLocation]) {
      params.append('location', cityMap[normalizedLocation]);
    }
    
    // CareerViet salary mapping
    if (salary) {
      if (salary.includes('20') || salary.includes('25')) params.append('salary', '12');
      else if (salary.includes('10')) params.append('salary', '10');
      else if (salary.includes('30')) params.append('salary', '13');
    }

    if (params.toString()) {
      searchUrl += (searchUrl.includes('?') ? '&' : '?') + params.toString();
    }

    this.logger.log(`[CareerViet] Searching with URL: ${searchUrl}`);

    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForSelector('div.job-item, .job-item-search-result', { timeout: 15000 }).catch(() => {});

      const jobElements = page.locator('div.job-item, .job-item-search-result');
      const count = await jobElements.count();

      for (let i = 0; i < count; i++) {
        if (scrapedJobs.length >= limit) break;

        try {
          const el = jobElements.nth(i);
          const titleLinkLocator = el.locator('div.title > h2 > a.job_link, .title a').first();
          if ((await titleLinkLocator.count()) === 0) continue;

          const rawHref = await titleLinkLocator.getAttribute('href') || '';
          const link = rawHref.startsWith('http') ? rawHref : `https://careerviet.vn${rawHref}`;
          const title = await titleLinkLocator.getAttribute('title') || await titleLinkLocator.textContent() || '';

          const company = await el.locator('a.company-name, .company').first().textContent().catch(() => 'Unknown');
          const salary = await el.locator('div.salary > p, .salary').first().textContent().catch(() => 'Thỏa thuận');

          const dateLocator = el.locator('div.time > ul > li:nth-child(2) > time, .time').first();
          const dateStr = await dateLocator.textContent().catch(() => 'hôm nay');

          const parsedDate = parseRelativeDate(dateStr || 'hôm nay');

          if (isWithinLastNDays(parsedDate, days) && title && company) {
            const jobLevel = refineLevel(title);

            scrapedJobs.push({
              uid: generateJobHash(title, company || '', salary || ''),
              title: title.trim(),
              company: company?.trim() || 'Unknown',
              salary: salary?.trim() || 'Thỏa thuận',
              level: jobLevel,
              url: link,
              postedDate: parsedDate
            });
          }
        } catch (e) {
          // ignore single item error
        }
      }
    } catch (error) {
      this.logger.error(`[CareerVietStrategy] Error navigating to ${searchUrl}: ${error.message}`);
    }

    return scrapedJobs;
  }
}

import { Page } from 'playwright';
import { Logger } from '@nestjs/common';
import { ICrawlerStrategy } from './crawler-strategy.interface';
import { CrawledJob, JobSearchOptions } from '../interfaces/crawler.interface';
import { generateJobHash } from '../../../shared/utils/hash.util';
import { parseRelativeDate, isWithinLastNDays } from '../../../shared/utils/date.util';
import { refineLevel } from '../../../shared/utils/job.util';

export class TopCVStrategy implements ICrawlerStrategy {
  private readonly logger = new Logger(TopCVStrategy.name);
  name = 'TopCV';

  async crawl(page: Page, options: JobSearchOptions): Promise<CrawledJob[]> {
    const { keywords = [], limit = 10, location, level, salary, company, days = 7 } = options;
    const scrapedJobs: CrawledJob[] = [];
 
    // Construct search query
    
    // Mapping for TopCV
    const cityMap: Record<string, string> = { 
      'hồ chí minh': '2', 'hcm': '2', 'tp hcm': '2', 'thành phố hồ chí minh': '2',
      'hà nội': '1', 'hn': '1',
      'đà nẵng': '3', 'dn': '3' 
    };
    const expMap: Record<string, string> = { 
      'intern': '1', 'fresher': '1', 
      'junior': '2', 
      'middle': '3', 
      'senior': '4', 
      'lead': '5', 'manager': '5' 
    };
    
    let searchUrl = keywords && keywords.length > 0 
      ? `https://www.topcv.vn/tim-viec-lam-${encodeURIComponent(keywords.join('-'))}`
      : 'https://www.topcv.vn/viec-lam';

    const params = new URLSearchParams();
    const normalizedLocation = location?.toLowerCase().trim();
    if (normalizedLocation && cityMap[normalizedLocation]) {
      params.append('city', cityMap[normalizedLocation]);
    } else if (normalizedLocation) {
      // Try fuzzy match for cities
      for (const [key, val] of Object.entries(cityMap)) {
        if (normalizedLocation.includes(key) || key.includes(normalizedLocation)) {
          params.append('city', val);
          break;
        }
      }
    }

    const normalizedLevel = level?.toLowerCase().trim();
    if (normalizedLevel && expMap[normalizedLevel]) {
      params.append('exp', expMap[normalizedLevel]);
    }
    
    // Simple salary mapping for TopCV
    if (salary) {
      const sal = salary.toLowerCase();
      if (sal.includes('25') || sal.includes('30')) params.append('salary', '6');
      else if (sal.includes('20')) params.append('salary', '5');
      else if (sal.includes('15')) params.append('salary', '4');
      else if (sal.includes('10')) params.append('salary', '3');
    }

    if (params.toString()) {
      searchUrl += (searchUrl.includes('?') ? '&' : '?') + params.toString();
    }

    this.logger.log(`[TopCV] Searching with URL: ${searchUrl}`);

    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForSelector('.job-item-2, .job-item-search-result, .job-list-search-result', { timeout: 30000 }).catch(() => { });

      // Handle potential popups
      const popupSelector = '#popup-community-request-connection, .modal-content';
      if (await page.isVisible(popupSelector).catch(() => false)) {
        await page.click(`${popupSelector} .close, ${popupSelector} .btn-close`).catch(() => { });
      }

      await page.evaluate(() => {
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
        document.body.classList.remove('modal-open');
      }).catch(() => { });

    } catch (error) {
      this.logger.error(`[TopCVStrategy] Error navigating to ${searchUrl}: ${error.message}`);
    }

    const jobElements = await page.$$('.job-item-2, .job-item-search-result, .job-list-search-result');

    for (const el of jobElements) {
      if (scrapedJobs.length >= limit) break;

      try {
        const titleEl = await el.$('h3.title a, .title a');
        if (!titleEl) continue;

        const title = await titleEl.innerText().then(t => t.trim()).catch(() => '');
        const rawHref = await titleEl.getAttribute('href') || '';
        const link = rawHref.startsWith('http') ? rawHref : `https://www.topcv.vn${rawHref}`;
        
        this.logger.debug(`[TopCV] Found: ${title} | Link: ${link}`);

        const company = await el.$eval('.company, .company-name', n => n.textContent?.trim() || '').catch(() => 'Unknown');
        const salary = await el.$eval('.title-salary, .salary', n => n.textContent?.trim() || '').catch(() => 'Thỏa thuận');
        const dateStr = await el.$eval('.label-update, label.label-update', n => n.textContent?.trim() || '').catch(() => 'hôm nay');
        const expStr = await el.$eval('.exp, .label-exp', n => n.textContent?.trim() || '').catch(() => '');

        const jobLevel = refineLevel(title, expStr);
        const parsedDate = parseRelativeDate(dateStr);

        // Filter by recency
        if (isWithinLastNDays(parsedDate, days)) {
          scrapedJobs.push({
            uid: generateJobHash(title, company, salary),
            title,
            company,
            salary,
            level: jobLevel,
            url: link,
            postedDate: parsedDate
          });
        }
      } catch (e) {
        // ignore single item error
      }
    }

    return scrapedJobs;
  }
}

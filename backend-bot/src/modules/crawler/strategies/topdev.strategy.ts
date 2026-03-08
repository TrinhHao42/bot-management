import { Page } from 'playwright';
import { Logger } from '@nestjs/common';
import { ICrawlerStrategy } from './crawler-strategy.interface';
import { CrawledJob, JobSearchOptions } from '../interfaces/crawler.interface';
import { generateJobHash } from '../../../shared/utils/hash.util';
import { parseRelativeDate, isWithinLastNDays } from '../../../shared/utils/date.util';
import { refineLevel } from '../../../shared/utils/job.util';

export class TopDevStrategy implements ICrawlerStrategy {
  private readonly logger = new Logger(TopDevStrategy.name);
  name = 'TopDev';

  async crawl(page: Page, options: JobSearchOptions): Promise<CrawledJob[]> {
    const { keywords = [], limit = 10, location, level, salary, company, days = 7 } = options;
    const scrapedJobs: CrawledJob[] = [];
    
    // Construct search query
    const cityMap: Record<string, string> = { 
      'hồ chí minh': '79', 'hcm': '79', 'tp hcm': '79', 'thành phố hồ chí minh': '79',
      'hà nội': '24', 'hn': '24',
      'đà nẵng': '48', 'dn': '48' 
    };
    
    // TopDev experience mapping
    const expMap: Record<string, string> = {
      'intern': '1', 'fresher': '1',
      'junior': '2',
      'middle': '3',
      'senior': '4',
      'lead': '5', 'manager': '5'
    };
    
    const params = new URLSearchParams();
    if (keywords && keywords.length > 0) params.append('keyword', keywords.join(' '));
    
    const normalizedLocation = location?.toLowerCase().trim();
    if (normalizedLocation && cityMap[normalizedLocation]) {
      params.append('region_ids[]', cityMap[normalizedLocation]);
    }

    const normalizedLevel = level?.toLowerCase().trim();
    if (normalizedLevel && expMap[normalizedLevel]) {
      params.append('experience_ids[]', expMap[normalizedLevel]);
    }
    
    // TopDev salary mapping
    if (salary) {
      if (salary.includes('20') || salary.includes('25')) params.append('salary_id', '5');
      else if (salary.includes('10')) params.append('salary_id', '3');
      else if (salary.includes('30')) params.append('salary_id', '6');
    }

    const searchUrl = `https://topdev.vn/viec-lam/tim-kiem?${params.toString()}`;

    try {
      this.logger.log(`[TopDev] Searching with URL: ${searchUrl}`);
      // Use domcontentloaded for faster initial response
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 50000 });
      
      // Wait for job cards - try multiple common selectors for TopDev
      await Promise.race([
        page.waitForSelector('div.rounded-md.border', { timeout: 20000 }),
        page.waitForSelector('div.text-card-foreground', { timeout: 20000 }),
        page.waitForSelector('a[href*="/viec-lam/"]', { timeout: 20000 }),
        page.waitForTimeout(5000) // Fallback: wait at least 5s
      ]).catch(() => {
        this.logger.warn('[TopDev] Wait for selector timed out, proceeding with evaluation');
      });
      
      // Small additional delay for AJAX content to settle
      await page.waitForTimeout(1000);

      const jobsData = await page.evaluate((limit) => {
        // Updated selectors for TopDev
        const allItems = Array.from(document.querySelectorAll('div.rounded-md.border, div.text-card-foreground, li.mb-4'));
        const results: any[] = [];
        
        for (const el of allItems) {
          if (results.length >= limit) break;
          
          // Try multiple selectors for title and link
          const titleEl = el.querySelector('a.text-brand-500, a[href*="/viec-lam/"], h3 a, h2 a');
          if (!titleEl) continue;
          
          const title = titleEl.textContent?.trim() || '';
          // Skip non-job items
          if (title.length < 5 || title.includes('Top 100') || title.includes('Việc làm lương cao') || title.includes('Blog')) continue;

          const href = (titleEl as HTMLAnchorElement).href || '';
          if (!href || results.some(r => r.link === href)) continue;

          // Company selector
          const companyEl = el.querySelector('a[href*="/cong-ty/"], span.line-clamp-1, p.text-gray-500');
          const company = companyEl?.textContent?.trim() || 'Unknown';
          
          const spans = Array.from(el.querySelectorAll('span'));
          
          // Salary detection
          let salary = 'Thỏa thuận';
          const salarySpan = spans.find(s => 
            s.textContent?.includes('lương') || 
            s.textContent?.includes('$') || 
            s.textContent?.includes('Tr') || 
            s.classList.contains('text-brand-500')
          );
          if (salarySpan) {
            salary = salarySpan.textContent?.trim() || 'Thỏa thuận';
          }
          if (salary.includes('Đăng nhập')) salary = 'Thỏa thuận';
          
          // Date detection
          let dateStr = 'hôm nay';
          const dateSpan = spans.find(s => s.textContent?.includes('trước') || s.textContent?.includes('ngày') || s.textContent?.includes('tháng'));
          if (dateSpan) {
            dateStr = dateSpan.textContent?.trim() || 'hôm nay';
          }

          // Metadata for level/experience
          const metadataContainer = el.querySelector('div.flex.flex-wrap.gap-2, div.mt-2, div.flex.items-center.gap-x-2');
          let possibleLevels = '';
          if (metadataContainer) {
            possibleLevels = Array.from(metadataContainer.querySelectorAll('span'))
              .map(s => s.textContent?.trim())
              .filter(Boolean)
              .join(', ');
          }
          
          results.push({ title, company, salary, link: href, dateStr, possibleLevels });
        }
        return results;
      }, limit);

      this.logger.log(`[TopDev] Parsed ${jobsData.length} raw items`);

      for (const job of jobsData) {
        const parsedDate = parseRelativeDate(job.dateStr);
        const jobLevel = refineLevel(job.title, job.possibleLevels);
        
        if (isWithinLastNDays(parsedDate, days)) {
          scrapedJobs.push({
            uid: generateJobHash(job.title, job.company, job.salary),
            title: job.title,
            company: job.company,
            salary: job.salary,
            level: jobLevel,
            url: job.link,
            postedDate: parsedDate
          });
        }
      }

    } catch (error) {
      this.logger.error(`[TopDevStrategy] Error during crawl: ${error.message}`);
    }

    return scrapedJobs;
  }
}

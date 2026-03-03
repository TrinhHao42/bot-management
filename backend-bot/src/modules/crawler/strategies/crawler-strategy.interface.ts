import { Page } from 'playwright';
import { CrawledJob, JobSearchOptions } from '../interfaces/crawler.interface';

export interface ICrawlerStrategy {
  name: string;
  crawl(page: Page, options: JobSearchOptions): Promise<CrawledJob[]>;
}

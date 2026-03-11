export interface JobSearchOptions {
  keywords?: string[];
  level?: string;
  location?: string;
  salary?: string;
  company?: string;
  limit?: number;
  days?: number;
}

export interface CrawledJob {
  uid: string;
  title: string;
  company: string;
  salary: string;
  level: string;
  url: string;
  postedDate?: Date;
}

export interface BaseCrawler {
  crawl(options: JobSearchOptions): Promise<CrawledJob[]>;
}

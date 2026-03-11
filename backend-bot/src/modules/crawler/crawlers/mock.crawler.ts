import { Injectable, Logger } from '@nestjs/common';
import { BaseCrawler, CrawledJob, JobSearchOptions } from '../interfaces/crawler.interface';
import { generateJobHash } from '../../../shared/utils/hash.util';

@Injectable()
export class MockCrawler implements BaseCrawler {
  private readonly logger = new Logger(MockCrawler.name);

  async crawl(options: JobSearchOptions): Promise<CrawledJob[]> {
    const { keywords = [] } = options;
    this.logger.log(`Mock crawling jobs with keywords: ${keywords?.join(', ') || 'ALL'}`);
    
    const mockJobs = [
      { title: 'Backend Nodejs Developer', company: 'Tech Corp', salary: '15-20M', level: 'middle', url: 'https://topcv.vn/job/1' },
      { title: 'Senior Flutter Engineer', company: 'Mobile JSC', salary: 'Deal', level: 'senior', url: 'https://topcv.vn/job/2' },
      { title: 'React Fresher', company: 'Startup LLC', salary: '5-7M', level: 'fresher', url: 'https://topcv.vn/job/3' },
      { title: 'Data Scientist Python', company: 'AI Vina', salary: '30-40M', level: 'senior', url: 'https://topcv.vn/job/4' },
      { title: 'Java Backend', company: 'Fintech Corp', salary: '20-30M', level: 'middle', url: 'https://topcv.vn/job/5' },
    ];

    let filtered = mockJobs;
    if (keywords && keywords.length > 0) {
      filtered = mockJobs.filter(job => 
        keywords.some((kw: string) => job.title.toLowerCase().includes(kw.toLowerCase()))
      );
    }

    return filtered.map(job => ({
      uid: generateJobHash(job.title, job.company, job.salary),
      ...job
    }));
  }
}

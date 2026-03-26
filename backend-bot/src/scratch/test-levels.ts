import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { JobCrawlerService } from '../modules/crawler/job-crawler.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const crawlerService = app.get(JobCrawlerService);

  console.log('--- Level Extraction Verification Test ---');
  try {
    const jobs = await crawlerService.crawl({ keywords: ['frontend'], limit: 10 });
    console.log(`Crawled ${jobs.length} jobs in total.`);
    
    jobs.forEach((job, index) => {
      console.log(`[${index + 1}] Title: ${job.title.substring(0, 30)}... | Level: ${job.level} | Source: ${job.url?.includes('topcv') ? 'TopCV' : job.url?.includes('topdev') ? 'TopDev' : 'CareerViet'}`);
    });

    console.log('Done.');
  } catch (error) {
    console.error('Error during test:', error);
  }

  await app.close();
}

bootstrap();

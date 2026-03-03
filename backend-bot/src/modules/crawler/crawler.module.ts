import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JobCrawlerService } from './job-crawler.service';
import { GoogleSheetsModule } from '../google-sheets/google-sheets.module';

@Module({
  imports: [ConfigModule, GoogleSheetsModule],
  providers: [JobCrawlerService],
  exports: [JobCrawlerService],
})
export class CrawlerModule { }

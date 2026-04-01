import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { CrawledJob } from '../crawler/interfaces/crawler.interface';

@Injectable()
export class GoogleSheetsService implements OnModuleInit {
  private readonly logger = new Logger(GoogleSheetsService.name);
  private doc: GoogleSpreadsheet;
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initialize();
  }

  private async initialize() {
    try {
      const email = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL');
      const privateKey = this.configService.get<string>('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
      const sheetId = this.configService.get<string>('GOOGLE_SHEET_ID');

      if (!email || !privateKey || !sheetId) {
        this.logger.warn('Google Sheets credentials are missing in .env. Skipping initialization.');
        return;
      }

      const serviceAccountAuth = new JWT({
        email,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
      await this.doc.loadInfo();
      this.isInitialized = true;
      this.logger.log(`Google Sheets connected: ${this.doc.title}`);
    } catch (error) {
      this.logger.error('Failed to initialize Google Sheets connection', error);
    }
  }

  async appendJobs(jobs: CrawledJob[]): Promise<void> {
    if (!this.isInitialized || !jobs.length) return;

    try {
      const sheet = this.doc.sheetsByIndex[0]; // Assuming first sheet
      let rows: any[];
      try {
        rows = await sheet.getRows();
      } catch (e: any) {
        if (e.message.includes('No values in the header row')) {
          this.logger.log('Header row missing. Initializing headers...');
          await sheet.setHeaderRow(['Date', 'Title', 'Company', 'Salary', 'Level', 'Link']);
          rows = [];
        } else {
          throw e;
        }
      }
      
      const normalizeUrl = (url: string) => {
        if (!url) return '';
        const trimmed = url.trim();
        try {
          const u = new URL(trimmed);
          return (u.origin + u.pathname).toLowerCase().replace(/\/$/, ''); // Remove query, trailing slash, and lowercase
        } catch {
          return trimmed.split('?')[0].toLowerCase().replace(/\/$/, '');
        }
      };

      const existingUrls = new Set(rows.map(row => {
        const link = row.get('Link');
        return link ? normalizeUrl(link.toString()) : null;
      }).filter(Boolean));
      
      this.logger.debug(`Found ${existingUrls.size} existing URLs in sheet.`);

      const newJobs = jobs.filter(job => {
        if (!job.url) return false;
        const normalized = normalizeUrl(job.url);
        const isDuplicate = existingUrls.has(normalized);
        if (isDuplicate) {
          this.logger.debug(`Duplicate found: ${normalized}`);
        }
        return !isDuplicate;
      });
      
      if (newJobs.length === 0) {
        this.logger.log(`Bỏ qua ${jobs.length} job trùng lặp (hoặc không có URL), không có job mới.`);
        return;
      }

      const newRows = newJobs.map(job => ({
        Date: new Date().toISOString(),
        Title: job.title,
        Company: job.company,
        Salary: job.salary || 'Thỏa thuận',
        Level: job.level || 'Unknown',
        Link: job.url || '',
      }));

      await sheet.addRows(newRows);
      this.logger.log(`Success: Appended ${newRows.length} NEW jobs to Google Sheets. (Total found: ${jobs.length}, Skipped ${jobs.length - newRows.length} duplicates already in sheet).`);
    } catch (error) {
      this.logger.error('Error appending jobs to Google Sheets', error);
    }
  }

  async getJobs(page: number, limit: number): Promise<any> {
    if (!this.isInitialized) return { data: [], total: 0, page, limit };

    try {
      const sheet = this.doc.sheetsByIndex[0];
      let rows: any[];
      try {
        rows = await sheet.getRows();
      } catch (e: any) {
        if (e.message.includes('No values in the header row')) {
          return { data: [], total: 0, page, limit, totalPages: 0 };
        }
        throw e;
      }
      
      const start = (page - 1) * limit;
      const end = start + limit;
      
      const pagedRows = rows.slice(start, end).map(row => ({
        date: row.get('Date'),
        title: row.get('Title'),
        company: row.get('Company'),
        salary: row.get('Salary'),
        level: row.get('Level'),
        link: row.get('Link'),
      }));

      return {
        data: pagedRows,
        total: rows.length,
        page,
        limit,
        totalPages: Math.ceil(rows.length / limit)
      };
    } catch (error) {
      this.logger.error('Error getting jobs from Google Sheets', error);
      return { data: [], total: 0, page, limit, error: 'Failed to fetch jobs' };
    }
  }
}

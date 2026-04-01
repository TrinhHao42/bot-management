import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { GoogleSheetsService } from './google-sheets.service';
import { ApiKeyGuard } from '../../shared/guards/api-key.guard';

@Controller('jobs')
@UseGuards(ApiKeyGuard)
export class JobsController {
  constructor(private readonly googleSheetsService: GoogleSheetsService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheKey('all_jobs_paged')
  @CacheTTL(300000) // 5 minutes
  async getJobs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.googleSheetsService.getJobs(page, limit);
  }
}

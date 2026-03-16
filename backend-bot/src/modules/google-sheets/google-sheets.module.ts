import { Module } from '@nestjs/common';
import { GoogleSheetsService } from './google-sheets.service';
import { JobsController } from './jobs.controller';

@Module({
  controllers: [JobsController],
  providers: [GoogleSheetsService],
  exports: [GoogleSheetsService],
})
export class GoogleSheetsModule {}

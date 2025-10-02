import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { TimekeepingRawLogsService } from './timekeeping-raw-logs.service';
import { UtilityService } from '@common/utility.service';
import { TimekeepingRawLogQueryDTO } from './timekeeping-raw-logs.interface';
import { TimekeepingSource } from '@prisma/client';

@Controller('hris/timekeeping/raw-logs')
export class TimekeepingRawLogsController {
  constructor(
    private readonly timekeepingRawLogsService: TimekeepingRawLogsService,
    private readonly utilityService: UtilityService,
  ) {}

  @Get()
  async getTimekeepingRawLogs(
    @Query() query: TimekeepingRawLogQueryDTO,
    @Res() response: Response,
  ) {
    // Parse query parameters
    const parsedQuery: TimekeepingRawLogQueryDTO = {
      page: query.page ? parseInt(query.page.toString()) : 1,
      limit: query.limit ? parseInt(query.limit.toString()) : 50,
      startDate: query.startDate,
      endDate: query.endDate,
      accountId: query.accountId,
      source: query.source as TimekeepingSource,
      search: query.search,
      importBatchId: query.importBatchId,
    };

    return this.utilityService.responseHandler(
      this.timekeepingRawLogsService.getTimekeepingRawLogs(parsedQuery),
      response,
    );
  }

  @Get('export')
  async exportTimekeepingRawLogs(
    @Query() query: TimekeepingRawLogQueryDTO,
    @Res() response: Response,
  ) {
    try {
      const buffer = await this.timekeepingRawLogsService.exportToExcel(query);

      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=timekeeping-raw-logs.xlsx',
      );
      response.send(buffer);
    } catch (error) {
      return this.utilityService.responseHandler(
        Promise.reject(error),
        response,
      );
    }
  }
}

import { Controller, Get, Param, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { BankExportService } from './bank-export.service';

@Controller('bank-export')
export class BankExportController {
  constructor(
    private bankExportService: BankExportService,
    private utilityService: UtilityService,
  ) {}

  @Get('data/:cutoffId')
  async getBankData(
    @Param('cutoffId') cutoffId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '25',
    @Query('search') search = '',
    @Query('bankKey') bankKey = '',
    @Query('sortBy') sortBy = 'netPay',
    @Query('sortOrder') sortOrder = 'desc',
    @Res() response: Response,
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return this.utilityService.responseHandler(
      this.bankExportService.getBankGroupedData(cutoffId, {
        page: pageNum,
        limit: limitNum,
        search: search.trim(),
        bankKey: bankKey.trim(),
        sortBy: sortBy.trim(),
        sortOrder: sortOrder.trim() as 'asc' | 'desc',
      }),
      response,
    );
  }

  @Get('export/:cutoffId/:bankKey')
  async exportBank(
    @Param('cutoffId') cutoffId: string,
    @Param('bankKey') bankKey: string,
    @Res() response: Response,
  ) {
    try {
      const result = await this.bankExportService.exportBankData(
        cutoffId,
        bankKey,
      );

      response.setHeader('Content-Type', result.contentType);
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.filename}"`,
      );
      response.send(result.content);
    } catch (error) {
      return this.utilityService.errorResponse(
        response,
        error,
        'Failed to export bank data',
      );
    }
  }
}

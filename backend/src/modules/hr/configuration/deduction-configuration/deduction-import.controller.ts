import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Query,
  Body,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DeductionImportService } from './deduction-import.service';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { MulterFile } from '../../../../types/multer';

@Controller('hr-configuration/deduction/import')
export class DeductionImportController {
  constructor(
    private readonly deductionImportService: DeductionImportService,
    private readonly utilityService: UtilityService,
  ) {}

  @Post(':configurationId/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('configurationId') configurationId: string,
    @UploadedFile() file: MulterFile,
    @Res() response: Response,
  ) {
    if (!file) {
      return response.status(400).json({ message: 'No file provided' });
    }

    const companyId = this.utilityService.companyId;
    const accountId = this.utilityService.accountInformation?.id;

    return this.utilityService.responseHandler(
      this.deductionImportService.uploadAndParseFile(
        file,
        companyId,
        accountId,
        parseInt(configurationId),
      ),
      response,
    );
  }

  @Post(':batchId/validate')
  async validateBatch(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionImportService.validateBatch(batchId),
      response,
    );
  }

  @Post(':batchId/approve')
  async approveWarnings(
    @Param('batchId') batchId: string,
    @Body() body: { approvedIds: number[] },
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionImportService.approveWarnings(batchId, body.approvedIds),
      response,
    );
  }

  @Post(':batchId/process')
  async processBatch(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionImportService.processBatch(batchId),
      response,
    );
  }

  @Get(':batchId/status')
  async getImportStatus(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionImportService.getImportStatus(batchId),
      response,
    );
  }

  @Put('history')
  async getImportHistory(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionImportService.getImportHistory(query, body),
      response,
    );
  }

  @Get('history/:batchId')
  async getImportBatchDetails(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionImportService.getImportBatchDetails(batchId),
      response,
    );
  }

  @Get('history/:batchId/errors')
  async getImportBatchErrors(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionImportService.getImportBatchErrors(batchId),
      response,
    );
  }

  @Get('history/:batchId/download-errors')
  async downloadErrorReport(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    const buffer =
      await this.deductionImportService.generateErrorReport(batchId);
    response.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="deduction_import_errors_${batchId}.xlsx"`,
      'Content-Length': buffer.length,
    });
    response.end(buffer);
  }

  @Get(':configurationId/template')
  async downloadTemplate(
    @Param('configurationId') configurationId: string,
    @Res() response: Response,
  ) {
    const buffer = await this.deductionImportService.generateTemplate(
      parseInt(configurationId),
    );
    response.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="deduction_import_template.xlsx"',
      'Content-Length': buffer.length,
    });
    response.end(buffer);
  }
}

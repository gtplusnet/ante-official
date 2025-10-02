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
import { EmployeeImportService } from './employee-import.service';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { MulterFile } from '../../../../types/multer';

@Controller('hris/employee/import')
export class EmployeeImportController {
  constructor(
    private readonly employeeImportService: EmployeeImportService,
    private readonly utilityService: UtilityService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: MulterFile,
    @Res() response: Response,
  ) {
    if (!file) {
      return response.status(400).json({ message: 'No file provided' });
    }
    return this.utilityService.responseHandler(
      this.employeeImportService.uploadAndParseFile(file),
      response,
    );
  }

  @Post(':batchId/validate')
  async validateBatch(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeImportService.validateBatch(batchId),
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
      this.employeeImportService.approveWarnings(batchId, body.approvedIds),
      response,
    );
  }

  @Post(':batchId/process')
  async processBatch(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeImportService.processBatch(batchId),
      response,
    );
  }

  @Get(':batchId/status')
  async getImportStatus(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeImportService.getImportStatus(batchId),
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
      this.employeeImportService.getImportHistory(query, body),
      response,
    );
  }

  @Get('history/:batchId')
  async getImportBatchDetails(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeImportService.getImportBatchDetails(batchId),
      response,
    );
  }

  @Get('history/:batchId/errors')
  async getImportBatchErrors(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeImportService.getImportBatchErrors(batchId),
      response,
    );
  }

  @Get('history/:batchId/download-errors')
  async downloadErrorReport(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    const buffer =
      await this.employeeImportService.generateErrorReport(batchId);
    response.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="import_errors_${batchId}.xlsx"`,
      'Content-Length': buffer.length,
    });
    response.end(buffer);
  }
}

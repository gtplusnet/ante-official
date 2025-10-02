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
import { TimekeepingImportService } from '../services/timekeeping-import.service';
import { UtilityService } from '@common/utility.service';
import { ExcelService } from '@common/services/excel';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { MulterFile } from '../../../../../types/multer';

@Controller('hris/timekeeping/import')
export class TimekeepingImportController {
  constructor(
    private readonly timekeepingImportService: TimekeepingImportService,
    private readonly utilityService: UtilityService,
    private readonly excelService: ExcelService,
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
      this.timekeepingImportService.uploadAndValidateFile(file),
      response,
    );
  }

  @Post(':batchId/approve-overlaps')
  async approveOverlaps(
    @Param('batchId') batchId: string,
    @Body() body: { approvedTempIds: number[] },
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.timekeepingImportService.approveOverlaps(
        batchId,
        body.approvedTempIds,
      ),
      response,
    );
  }

  @Post(':batchId/process')
  async processBatch(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.timekeepingImportService.processBatch(batchId),
      response,
    );
  }

  @Get(':batchId/status')
  async getBatchStatus(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.timekeepingImportService.getBatchDetails(batchId),
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
      this.timekeepingImportService.getImportHistory(query, body),
      response,
    );
  }

  @Get('history/:batchId')
  async getBatchDetails(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.timekeepingImportService.getBatchDetails(batchId),
      response,
    );
  }

  @Get('history/:batchId/errors')
  async getBatchErrors(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.timekeepingImportService.getBatchErrors(batchId),
      response,
    );
  }

  @Get('history/:batchId/download-errors')
  async downloadErrorReport(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    try {
      // Get batch details and errors
      const [batch, errors] = await Promise.all([
        this.timekeepingImportService.getBatchDetails(batchId),
        this.timekeepingImportService.getBatchErrors(batchId),
      ]);

      if (!batch) {
        return response.status(404).json({ message: 'Batch not found' });
      }

      // Define columns for Excel export
      const columns = [
        { header: 'Row Number', key: 'rowNumber', width: 15 },
        { header: 'Employee Code', key: 'employeeCode', width: 20 },
        { header: 'Employee Name', key: 'employeeName', width: 25 },
        { header: 'Time In', key: 'timeIn', width: 20 },
        { header: 'Time Out', key: 'timeOut', width: 20 },
        { header: 'Remarks', key: 'remarks', width: 30 },
        { header: 'Validation Errors', key: 'validationErrors', width: 40 },
        { header: 'Has Overlap', key: 'hasOverlap', width: 15 },
        { header: 'Overlapping Logs', key: 'overlappingLogs', width: 40 },
        { header: 'Is Approved', key: 'isApproved', width: 15 },
      ];

      // Prepare error data for export
      const data = errors.map((error) => ({
        rowNumber: error.rowNumber,
        employeeCode: error.employeeCode,
        employeeName: error.employeeName || '',
        timeIn: error.timeIn.toISOString(),
        timeOut: error.timeOut.toISOString(),
        remarks: error.remarks || '',
        validationErrors: error.validationErrors
          ? JSON.stringify(error.validationErrors)
          : '',
        hasOverlap: error.hasOverlap ? 'Yes' : 'No',
        overlappingLogs: error.overlappingLogs
          ? JSON.stringify(error.overlappingLogs)
          : '',
        isApproved: error.isApproved ? 'Yes' : 'No',
      }));

      // Generate Excel buffer using centralized service
      const buffer = await this.excelService.exportToBuffer(
        columns,
        data,
        'Errors',
        {
          headerStyle: {
            font: { bold: true },
          },
        },
      );

      // Set headers
      response.setHeader(
        'Content-Disposition',
        `attachment; filename="timekeeping_import_errors_${batchId}.xlsx"`,
      );
      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      response.send(buffer);
    } catch (error) {
      console.error('Failed to generate error report:', error);
      return response
        .status(500)
        .json({ message: 'Failed to generate error report' });
    }
  }

  @Get('template')
  async downloadTemplate(@Res() response: Response) {
    try {
      const buffer = await this.timekeepingImportService.generateTemplate();

      // Set headers
      response.setHeader(
        'Content-Disposition',
        'attachment; filename="timekeeping_import_template.xlsx"',
      );
      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      response.send(buffer);
    } catch (error) {
      console.error('Failed to generate template:', error);
      return response
        .status(500)
        .json({ message: 'Failed to generate template' });
    }
  }

  @Get(':batchId/logs')
  async getImportBatchLogs(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.timekeepingImportService.getImportBatchLogs(batchId),
      response,
    );
  }

  @Get(':batchId/success-summary')
  async getImportSuccessSummary(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.timekeepingImportService.getImportSuccessSummary(batchId),
      response,
    );
  }

  @Get(':batchId/employees')
  async getImportEmployeeSummary(
    @Param('batchId') batchId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.timekeepingImportService.getImportEmployeeSummary(batchId),
      response,
    );
  }
}

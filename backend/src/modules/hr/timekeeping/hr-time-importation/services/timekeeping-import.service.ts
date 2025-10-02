import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { BiometricParserFactory } from '../parsers/parser.factory';
import { EmployeeValidationService } from './employee-validation.service';
import { BiometricModel } from '../../../../../shared/enums/biometric-model.enum';
import { ImportTimeFromImageGeminiLog } from '../../../../../shared/response/import-time-from-image.response';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { ModuleRef } from '@nestjs/core';
import * as moment from 'moment';
import { MulterFile } from '../../../../../types/multer';

export interface TimekeepingImportUploadResponse {
  batchId: string;
  fileName: string;
  totalRows: number;
  status: string;
  validationSummary: {
    validRows: number;
    errorRows: number;
    warningRows: number;
    overlappingRows: number;
  };
}

export interface OverlapCheckResult {
  hasOverlaps: boolean;
  overlappingLogs: {
    employeeId: string;
    employeeName: string;
    existingLogs: {
      id: number;
      timeIn: Date;
      timeOut: Date;
      source: string;
      remarks?: string;
    }[];
    newLog: {
      timeIn: Date;
      timeOut: Date;
      remarks: string;
    };
  }[];
}

@Injectable()
export class TimekeepingImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilityService: UtilityService,
    private readonly parserFactory: BiometricParserFactory,
    private readonly employeeValidationService: EmployeeValidationService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async uploadAndValidateFile(
    file: MulterFile,
  ): Promise<TimekeepingImportUploadResponse> {
    // Get user info from utility service
    const uploadedBy = this.utilityService.accountInformation.id;
    const companyId = this.utilityService.companyId;

    // Create import batch
    const batch = await this.prisma.timekeepingImportBatch.create({
      data: {
        fileName: file.originalname,
        uploadedBy,
        companyId,
        status: 'uploading',
      },
    });

    try {
      // Parse the file using DefaultLogParser
      const parser = this.parserFactory.getParser(BiometricModel.DEFAULT_LOG);
      if (!parser) {
        throw new Error('Default log parser not available');
      }

      // Convert file buffer to base64
      const base64Data = file.buffer.toString('base64');

      // Parse the file
      const parseResult = await parser.parse(base64Data, file.originalname, '');

      if (parseResult.status === 'Error') {
        await this.prisma.timekeepingImportBatch.update({
          where: { id: batch.id },
          data: {
            status: 'failed',
            completedAt: new Date(),
            totalRows: 0,
            errorRows: 1,
          },
        });

        throw new Error(parseResult.remarks);
      }

      // Validate employees
      const validation =
        await this.employeeValidationService.validateEmployeeLogs(
          parseResult.logs,
        );

      // Check for overlaps
      const overlapResults = await this.checkOverlaps(validation.validLogs);

      // Save temporary records
      let rowNumber = 1;
      const tempRecords = [];

      // Process valid logs
      for (const log of validation.validLogs) {
        const overlap = overlapResults.overlappingLogs.find(
          (o) =>
            o.employeeId === log.employeeId &&
            new Date(o.newLog.timeIn).getTime() ===
              new Date(log.timeIn).getTime(),
        );

        tempRecords.push({
          importBatchId: batch.id,
          rowNumber: rowNumber++,
          employeeCode: log.employeeId,
          employeeName: overlap?.employeeName || log.employeeId,
          accountId: await this.getAccountIdFromEmployeeId(log.employeeId),
          timeIn: new Date(log.timeIn),
          timeOut: new Date(log.timeOut),
          remarks: log.remarks,
          validationErrors: null,
          validationWarnings: null,
          overlappingLogs: overlap ? overlap.existingLogs : null,
          hasOverlap: !!overlap,
          isValid: true,
          isApproved: !overlap, // Auto-approve if no overlap
        });
      }

      // Process invalid logs
      for (const log of validation.invalidLogs) {
        tempRecords.push({
          importBatchId: batch.id,
          rowNumber: rowNumber++,
          employeeCode: log.employeeId,
          employeeName: log.employeeId,
          accountId: null,
          timeIn: new Date(log.timeIn),
          timeOut: new Date(log.timeOut),
          remarks: log.remarks,
          validationErrors: [
            {
              field: 'employeeId',
              message: log.validationError || 'Employee not found',
              type: 'reference',
            },
          ],
          validationWarnings: null,
          overlappingLogs: null,
          hasOverlap: false,
          isValid: false,
          isApproved: false,
        });
      }

      // Bulk insert temp records
      await this.prisma.timekeepingImportTemp.createMany({
        data: tempRecords,
      });

      // Update batch with counts
      const summary = {
        validRows: validation.validLogs.length,
        errorRows: validation.invalidLogs.length,
        warningRows: 0,
        overlappingRows: overlapResults.overlappingLogs.length,
      };

      await this.prisma.timekeepingImportBatch.update({
        where: { id: batch.id },
        data: {
          totalRows: tempRecords.length,
          validRows: summary.validRows,
          errorRows: summary.errorRows,
          warningRows: summary.warningRows,
          overlappingRows: summary.overlappingRows,
          status:
            summary.errorRows > 0
              ? 'validation_failed'
              : summary.overlappingRows > 0
                ? 'overlaps_found'
                : 'validated',
        },
      });

      return {
        batchId: batch.id,
        fileName: file.originalname,
        totalRows: tempRecords.length,
        status:
          summary.errorRows > 0
            ? 'validation_failed'
            : summary.overlappingRows > 0
              ? 'overlaps_found'
              : 'validated',
        validationSummary: summary,
      };
    } catch (error) {
      // Update batch status to failed
      await this.prisma.timekeepingImportBatch.update({
        where: { id: batch.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  async checkOverlaps(
    logs: ImportTimeFromImageGeminiLog[],
  ): Promise<OverlapCheckResult> {
    const overlappingLogs = [];

    for (const log of logs) {
      // Get account ID for this employee
      const accountId = await this.getAccountIdFromEmployeeId(log.employeeId);
      if (!accountId) continue;

      const newTimeIn = new Date(log.timeIn);
      const newTimeOut = new Date(log.timeOut);

      // Find overlapping raw logs
      const existingLogs = await this.prisma.employeeTimekeepingRaw.findMany({
        where: {
          accountId,
          OR: [
            // New log starts during existing log
            {
              AND: [
                { timeIn: { lte: newTimeIn } },
                { timeOut: { gte: newTimeIn } },
              ],
            },
            // New log ends during existing log
            {
              AND: [
                { timeIn: { lte: newTimeOut } },
                { timeOut: { gte: newTimeOut } },
              ],
            },
            // New log completely contains existing log
            {
              AND: [
                { timeIn: { gte: newTimeIn } },
                { timeOut: { lte: newTimeOut } },
              ],
            },
            // Existing log completely contains new log
            {
              AND: [
                { timeIn: { lte: newTimeIn } },
                { timeOut: { gte: newTimeOut } },
              ],
            },
          ],
        },
        include: {
          account: {
            select: {
              firstName: true,
              lastName: true,
              EmployeeData: {
                select: {
                  employeeCode: true,
                },
              },
            },
          },
        },
      });

      if (existingLogs.length > 0) {
        overlappingLogs.push({
          employeeId: log.employeeId,
          employeeName: `${existingLogs[0].account.firstName} ${existingLogs[0].account.lastName}`,
          existingLogs: existingLogs.map((existing) => ({
            id: existing.id,
            timeIn: existing.timeIn,
            timeOut: existing.timeOut,
            source: existing.source,
            remarks: existing.remarks,
          })),
          newLog: {
            timeIn: newTimeIn,
            timeOut: newTimeOut,
            remarks: log.remarks || '',
          },
        });
      }
    }

    return {
      hasOverlaps: overlappingLogs.length > 0,
      overlappingLogs,
    };
  }

  async approveOverlaps(
    batchId: string,
    approvedTempIds: number[],
  ): Promise<void> {
    // Mark specific temp records as approved
    await this.prisma.timekeepingImportTemp.updateMany({
      where: {
        importBatchId: batchId,
        id: { in: approvedTempIds },
        hasOverlap: true,
      },
      data: {
        isApproved: true,
      },
    });

    // Check if all records are now approved or have no overlaps
    const pendingOverlaps = await this.prisma.timekeepingImportTemp.count({
      where: {
        importBatchId: batchId,
        hasOverlap: true,
        isApproved: false,
      },
    });

    if (pendingOverlaps === 0) {
      await this.prisma.timekeepingImportBatch.update({
        where: { id: batchId },
        data: { status: 'approved' },
      });
    }
  }

  async processBatch(batchId: string): Promise<void> {
    const batch = await this.prisma.timekeepingImportBatch.findUnique({
      where: { id: batchId },
      include: {
        tempRecords: {
          where: {
            isValid: true,
            isApproved: true,
          },
        },
      },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    if (batch.status !== 'approved' && batch.status !== 'validated') {
      throw new Error('Batch is not ready for processing');
    }

    await this.prisma.timekeepingImportBatch.update({
      where: { id: batchId },
      data: { status: 'processing' },
    });

    try {
      // Delete overlapping logs first
      for (const record of batch.tempRecords) {
        if (record.hasOverlap && record.overlappingLogs) {
          const overlappingIds = (record.overlappingLogs as any[]).map(
            (log) => log.id,
          );
          await this.prisma.employeeTimekeepingRaw.deleteMany({
            where: {
              id: { in: overlappingIds },
            },
          });
        }
      }

      // Insert new logs with importBatchId
      const newLogs = batch.tempRecords.map((record) => ({
        accountId: record.accountId!,
        timeIn: record.timeIn,
        timeOut: record.timeOut,
        timeSpan: this.calculateTimeSpan(record.timeIn, record.timeOut),
        source: 'EXCEL_IMPORTATION' as const,
        remarks: record.remarks,
        importBatchId: batchId, // Link to import batch
      }));

      await this.prisma.employeeTimekeepingRaw.createMany({
        data: newLogs,
      });

      // Trigger timekeeping computation for affected dates
      await this.computeAffectedTimekeeping(batch.tempRecords, batchId);

      // Mark temp records as processed
      await this.prisma.timekeepingImportTemp.updateMany({
        where: { importBatchId: batchId },
        data: { isProcessed: true },
      });

      // Update batch status
      await this.prisma.timekeepingImportBatch.update({
        where: { id: batchId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          processedRows: batch.tempRecords.length,
        },
      });
    } catch (error) {
      await this.prisma.timekeepingImportBatch.update({
        where: { id: batchId },
        data: { status: 'failed' },
      });
      throw error;
    }
  }

  async getImportHistory(query: TableQueryDTO, body: TableBodyDTO) {
    const { perPage = 10, page = 1 } = query;
    const sortBy = 'startedAt';
    const sortOrder = 'desc';
    const { filters = [] } = body;

    const where: any = {};

    // Apply filters
    filters.forEach((filter: any) => {
      Object.keys(filter).forEach((key) => {
        where[key] = filter[key];
      });
    });

    const [list, totalCount] = await Promise.all([
      this.prisma.timekeepingImportBatch.findMany({
        where,
        include: {
          account: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          rawLogs: {
            select: {
              accountId: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.timekeepingImportBatch.count({ where }),
    ]);

    // Calculate unique employees for each batch
    const listWithEmployeeCount = list.map((batch) => {
      const uniqueEmployees = new Set(
        batch.rawLogs.map((log) => log.accountId),
      );
      return {
        ...batch,
        uniqueEmployees: uniqueEmployees.size,
        rawLogs: undefined, // Remove rawLogs from response
      };
    });

    return {
      list: listWithEmployeeCount,
      pagination: {
        page,
        perPage,
        totalCount,
        totalPages: Math.ceil(totalCount / perPage),
      },
    };
  }

  async getBatchDetails(batchId: string) {
    return this.prisma.timekeepingImportBatch.findUnique({
      where: { id: batchId },
      include: {
        account: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getBatchErrors(batchId: string) {
    return this.prisma.timekeepingImportTemp.findMany({
      where: {
        importBatchId: batchId,
        OR: [{ isValid: false }, { hasOverlap: true }],
      },
      orderBy: { rowNumber: 'asc' },
    });
  }

  private async getAccountIdFromEmployeeId(
    employeeId: string,
  ): Promise<string | null> {
    const employee = await this.prisma.employeeData.findFirst({
      where: {
        OR: [{ employeeCode: employeeId }, { biometricsNumber: employeeId }],
        isActive: true,
      },
      select: { accountId: true },
    });

    return employee?.accountId || null;
  }

  private calculateTimeSpan(timeIn: Date, timeOut: Date): number {
    const diffMs = timeOut.getTime() - timeIn.getTime();
    return diffMs / (1000 * 60 * 60); // Convert to hours
  }

  async getImportBatchLogs(batchId: string) {
    const logs = await this.prisma.employeeTimekeepingRaw.findMany({
      where: { importBatchId: batchId },
      include: {
        account: {
          select: {
            firstName: true,
            lastName: true,
            EmployeeData: {
              select: {
                employeeCode: true,
              },
            },
          },
        },
      },
      orderBy: [{ timeIn: 'desc' }, { accountId: 'asc' }],
    });

    return logs.map((log) => ({
      ...log,
      employeeName: `${log.account.firstName} ${log.account.lastName}`,
      employeeCode: log.account.EmployeeData[0]?.employeeCode || '',
    }));
  }

  async getImportSuccessSummary(batchId: string) {
    const batch = await this.prisma.timekeepingImportBatch.findUnique({
      where: { id: batchId },
      include: {
        account: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        rawLogs: {
          select: {
            accountId: true,
            timeIn: true,
            timeOut: true,
          },
        },
      },
    });

    if (!batch) {
      throw new Error('Import batch not found');
    }

    // Get unique employees
    const uniqueEmployees = new Set(batch.rawLogs.map((log) => log.accountId));

    // Get date range
    const dates = batch.rawLogs.map((log) => log.timeIn);
    const minDate =
      dates.length > 0
        ? new Date(Math.min(...dates.map((d) => d.getTime())))
        : null;
    const maxDate =
      dates.length > 0
        ? new Date(Math.max(...dates.map((d) => d.getTime())))
        : null;

    return {
      batchId: batch.id,
      fileName: batch.fileName,
      uploadedBy: `${batch.account.firstName} ${batch.account.lastName}`,
      status: batch.status,
      completedAt: batch.completedAt,
      summary: {
        totalLogsImported: batch.rawLogs.length,
        uniqueEmployees: uniqueEmployees.size,
        dateRange: {
          from: minDate,
          to: maxDate,
        },
        processingTime:
          batch.completedAt && batch.startedAt
            ? Math.round(
                (batch.completedAt.getTime() - batch.startedAt.getTime()) /
                  1000,
              )
            : null,
      },
      statistics: {
        totalRows: batch.totalRows,
        processedRows: batch.processedRows,
        errorRows: batch.errorRows,
        overlappingRows: batch.overlappingRows,
      },
    };
  }

  async getImportEmployeeSummary(batchId: string) {
    const batch = await this.prisma.timekeepingImportBatch.findUnique({
      where: { id: batchId },
      include: {
        rawLogs: {
          include: {
            account: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                EmployeeData: {
                  select: {
                    employeeCode: true,
                  },
                },
              },
            },
          },
          orderBy: [{ accountId: 'asc' }, { timeIn: 'asc' }],
        },
      },
    });

    if (!batch) {
      throw new Error('Import batch not found');
    }

    // Group logs by employee
    const employeeMap = new Map();

    batch.rawLogs.forEach((log) => {
      const employeeId = log.accountId;
      if (!employeeMap.has(employeeId)) {
        const empData = log.account.EmployeeData[0];
        employeeMap.set(employeeId, {
          accountId: employeeId,
          employeeCode: empData?.employeeCode || '',
          firstName: log.account.firstName,
          lastName: log.account.lastName,
          fullName: `${log.account.firstName} ${log.account.lastName}`,
          department: '', // Not available in current schema
          position: '', // Not available in current schema
          logs: [],
          totalLogs: 0,
          totalHours: 0,
          dateRange: {
            from: null,
            to: null,
          },
        });
      }

      const employee = employeeMap.get(employeeId);
      employee.logs.push({
        timeIn: log.timeIn,
        timeOut: log.timeOut,
        timeSpan: log.timeSpan,
        remarks: log.remarks,
      });

      employee.totalLogs++;
      employee.totalHours += log.timeSpan;

      // Update date range
      if (!employee.dateRange.from || log.timeIn < employee.dateRange.from) {
        employee.dateRange.from = log.timeIn;
      }
      if (!employee.dateRange.to || log.timeIn > employee.dateRange.to) {
        employee.dateRange.to = log.timeIn;
      }
    });

    // Convert map to array and sort by employee name
    const employees = Array.from(employeeMap.values()).sort((a, b) =>
      a.fullName.localeCompare(b.fullName),
    );

    return {
      batchId: batch.id,
      fileName: batch.fileName,
      totalEmployees: employees.length,
      totalLogs: batch.rawLogs.length,
      employees: employees.map((emp) => ({
        ...emp,
        totalHours: Math.round(emp.totalHours * 100) / 100, // Round to 2 decimal places
        logs: undefined, // Remove detailed logs from response to reduce size
      })),
    };
  }

  private async computeAffectedTimekeeping(
    tempRecords: any[],
    batchId: string,
  ): Promise<void> {
    this.utilityService.log(
      `[IMPORT] Starting timekeeping computation for import batch: ${batchId}`,
    );

    // Get unique employee-date combinations for recomputation
    const employeeDatePairs = new Set<string>();
    tempRecords.forEach((record) => {
      if (record.accountId) {
        const dateString = moment(record.timeIn).format('YYYY-MM-DD');
        employeeDatePairs.add(`${record.accountId}:${dateString}`);
      }
    });

    this.utilityService.log(
      `[IMPORT] Found ${employeeDatePairs.size} unique employee-date combinations to compute`,
    );

    // Get the EmployeeTimekeepingService dynamically to avoid circular dependency
    let employeeTimekeepingService;
    try {
      const { EmployeeTimekeepingService } = await import(
        '../../employee-timekeeping/employee-timekeeping.service'
      );
      employeeTimekeepingService = this.moduleRef.get(
        EmployeeTimekeepingService,
        { strict: false },
      );
    } catch (error) {
      this.utilityService.log(
        `[IMPORT] Failed to get EmployeeTimekeepingService: ${error.message}`,
      );
      return;
    }

    // Trigger recomputation for affected dates
    const computationResults = [];
    let successCount = 0;
    let failureCount = 0;

    for (const pair of employeeDatePairs) {
      const [employeeAccountId, date] = pair.split(':');
      try {
        this.utilityService.log(
          `[IMPORT] Computing timekeeping for employee ${employeeAccountId} on ${date}`,
        );

        await employeeTimekeepingService.recompute({
          employeeAccountId,
          date,
        });

        computationResults.push({ employeeAccountId, date, status: 'success' });
        successCount++;

        this.utilityService.log(
          `[IMPORT] Successfully computed timekeeping for employee ${employeeAccountId} on ${date}`,
        );
      } catch (error) {
        this.utilityService.log(
          `[IMPORT] Computation failed for employee ${employeeAccountId} on ${date}: ${error.message}`,
        );
        computationResults.push({
          employeeAccountId,
          date,
          status: 'failed',
          error: error.message,
        });
        failureCount++;
      }
    }

    this.utilityService.log(
      `[IMPORT] Computation completed for batch ${batchId}. Success: ${successCount}, Failed: ${failureCount}`,
    );

    // Log detailed results for debugging
    if (failureCount > 0) {
      const failedComputations = computationResults.filter(
        (r) => r.status === 'failed',
      );
      this.utilityService.log(
        `[IMPORT] Failed computations: ${JSON.stringify(failedComputations)}`,
      );
    }
  }

  async generateTemplate(): Promise<Buffer> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();

    // Create main data sheet
    const mainSheet = workbook.addWorksheet('Time Logs', {
      properties: { tabColor: { argb: '4472C4' } },
    });

    // Define columns with proper formatting
    mainSheet.columns = [
      { header: 'Employee Code', key: 'employeeCode', width: 15 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Time', key: 'time', width: 12 },
      { header: 'Type', key: 'type', width: 8 },
      { header: 'Remarks', key: 'remarks', width: 30 },
    ];

    // Style the header row
    const headerRow = mainSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4472C4' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 20;

    // Add sample data
    const sampleData = [
      {
        employeeCode: 'EMP-1001',
        date: '2025-01-29',
        name: 'Juan Dela Cruz',
        time: '8:00 AM',
        type: 'in',
        remarks: 'Added from Facial Recognition',
      },
      {
        employeeCode: 'EMP-1001',
        date: '2025-01-29',
        name: 'Juan Dela Cruz',
        time: '5:00 PM',
        type: 'out',
        remarks: 'Added from Facial Recognition',
      },
      {
        employeeCode: 'EMP-1002',
        date: '2025-01-29',
        name: 'Maria Santos',
        time: '8:30 AM',
        type: 'in',
        remarks: 'Added from Facial Recognition',
      },
      {
        employeeCode: 'EMP-1002',
        date: '2025-01-29',
        name: 'Maria Santos',
        time: '5:30 PM',
        type: 'out',
        remarks: 'Added from Facial Recognition',
      },
      {
        employeeCode: 'EMP-1003',
        date: '2025-01-29',
        name: 'Pedro Garcia',
        time: '9:00 AM',
        type: 'in',
        remarks: 'Added from Facial Recognition',
      },
      {
        employeeCode: 'EMP-1003',
        date: '2025-01-29',
        name: 'Pedro Garcia',
        time: '6:00 PM',
        type: 'out',
        remarks: 'Added from Facial Recognition',
      },
    ];

    mainSheet.addRows(sampleData);

    // Add data validation for Type column (column E)
    // Apply to rows 2-1000
    for (let row = 2; row <= 1000; row++) {
      const typeCell = mainSheet.getCell(`E${row}`);
      typeCell.dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"in,out"'],
        showErrorMessage: true,
        errorTitle: 'Invalid Type',
        error: 'Type must be either "in" or "out"',
      };
    }

    // Add date validation for Date column (column B)
    for (let row = 2; row <= 1000; row++) {
      const dateCell = mainSheet.getCell(`B${row}`);
      dateCell.dataValidation = {
        type: 'date',
        operator: 'greaterThan',
        showErrorMessage: true,
        errorTitle: 'Invalid Date',
        error: 'Please enter a valid date (YYYY-MM-DD or MM/DD/YYYY)',
        formulae: [new Date(2000, 0, 1)],
        showInputMessage: true,
        promptTitle: 'Date Format',
        prompt: 'Enter date in format: YYYY-MM-DD or MM/DD/YYYY',
      };
    }

    // Format Date column as date
    mainSheet.getColumn('date').numFmt = 'yyyy-mm-dd';

    // Add borders to all cells with data
    const lastRow = mainSheet.lastRow?.number || 7;
    for (let row = 1; row <= lastRow; row++) {
      for (let col = 1; col <= 6; col++) {
        const cell = mainSheet.getRow(row).getCell(col);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    }

    // Add notes to header cells
    mainSheet.getCell('A1').note =
      'Employee Code must match existing records in the system';
    mainSheet.getCell('B1').note = 'Date format: YYYY-MM-DD (e.g., 2025-07-29)';
    mainSheet.getCell('D1').note =
      'Time format: h:mm AM/PM (e.g., 8:00 AM, 5:30 PM)';
    mainSheet.getCell('E1').note =
      'Type must be exactly "in" or "out" (lowercase)';

    // Create instructions sheet
    const instructionsSheet = workbook.addWorksheet('Instructions', {
      properties: { tabColor: { argb: 'FF9900' } },
    });

    instructionsSheet.columns = [
      { header: 'Instructions', key: 'content', width: 80 },
    ];

    // Style instructions header
    const instrHeaderRow = instructionsSheet.getRow(1);
    instrHeaderRow.font = { bold: true, size: 14 };
    instrHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF2CC' },
    };

    const instructions = [
      { content: 'TIMEKEEPING IMPORT TEMPLATE INSTRUCTIONS' },
      { content: '' },
      { content: 'IMPORTANT NOTES:' },
      {
        content: '1. Do not modify the column headers in the "Time Logs" sheet',
      },
      {
        content:
          '2. Employee Code must match existing employee codes in the system',
      },
      {
        content:
          '3. Date format can be: "YYYY-MM-DD" (2025-01-29) or "MM/DD/YYYY" (01/29/2025)',
      },
      {
        content:
          '4. Time format can be: "8:00 AM", "08:00 AM", "8:30 PM", etc.',
      },
      {
        content:
          '5. Type must be either "in" or "out" (lowercase) - use the dropdown!',
      },
      { content: '6. Name column is optional and for reference only' },
      { content: '7. Remarks column is optional' },
      { content: '' },
      { content: 'COLUMN DESCRIPTIONS:' },
      {
        content:
          'Employee Code - Required. The employee code/ID as registered in the system',
      },
      {
        content:
          'Date - Required. The date of the time log in YYYY-MM-DD or MM/DD/YYYY format',
      },
      {
        content:
          'Name - Optional. Employee name for reference (not used in import)',
      },
      { content: 'Time - Required. Time of log in 12-hour format with AM/PM' },
      {
        content:
          'Type - Required. Must be "in" for time in or "out" for time out (use dropdown)',
      },
      {
        content: 'Remarks - Optional. Any additional notes about the time log',
      },
      { content: '' },
      { content: 'TIPS:' },
      {
        content:
          '- Each employee should have matching in/out pairs for each day',
      },
      {
        content:
          '- If time out is missing, the system will flag it as incomplete',
      },
      { content: '- The system will check for overlapping time entries' },
      {
        content:
          '- You can delete the sample data rows before adding your own data',
      },
      {
        content:
          '- The Type column has a dropdown - click on the cell to see options!',
      },
    ];

    instructionsSheet.addRows(instructions);

    // Style the instructions
    instructionsSheet.getRow(3).font = { bold: true, size: 12 };
    instructionsSheet.getRow(12).font = { bold: true, size: 12 };
    instructionsSheet.getRow(20).font = { bold: true, size: 12 };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

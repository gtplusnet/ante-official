import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { SocketService } from '@modules/communication/socket/socket/socket.service';
import { DeductionPeriod, Prisma } from '@prisma/client';
import { ExcelService } from '@common/services/excel';
import * as ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { EmployeeListService } from '@modules/hr/employee/employee-list/employee-list.service';
import { MulterFile } from '../../../../types/multer';

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

@Injectable()
export class AllowanceImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilityService: UtilityService,
    private readonly socketService: SocketService,
    private readonly employeeListService: EmployeeListService,
    private readonly excelService: ExcelService,
  ) {}

  async uploadAndParseFile(
    file: MulterFile,
    companyId: number,
    uploadedBy: string,
    allowanceConfigurationId: number,
  ) {
    const batchId = uuidv4();

    // Create import batch record
    await this.prisma.allowanceImportBatch.create({
      data: {
        id: batchId,
        fileName: file.originalname,
        uploadedBy,
        companyId,
        allowanceConfigurationId,
        status: 'uploaded',
      },
    });

    // Parse Excel file using centralized Excel service
    const parsedData = await this.excelService.importFromBuffer(file.buffer, {
      sheetIndex: 0,
      headerRow: 1,
      dataStartRow: 2,
      trimValues: true,
      includeEmptyRows: false,
    });

    if (!parsedData.rows || parsedData.rows.length === 0) {
      throw new Error('No data found in the Excel file');
    }

    // Parse rows into temp records
    const tempRecords: Prisma.AllowanceImportTempCreateManyInput[] = [];
    for (let i = 0; i < parsedData.rows.length; i++) {
      const row = parsedData.rows[i];

      // Extract values based on column position or header
      const employeeCode =
        row['Employee Code'] || row[parsedData.headers[0]] || '';
      const allowanceAmount =
        row['Allowance Amount'] || row[parsedData.headers[1]] || 0;
      const allowancePeriod =
        row['Allowance Period'] || row[parsedData.headers[2]] || '';
      const effectivityDate =
        row['Effectivity Date'] || row[parsedData.headers[3]] || '';
      const proRatedAllowance =
        row['Pro-Rated Allowance'] || row[parsedData.headers[4]] || '';

      tempRecords.push({
        importBatchId: batchId,
        rowNumber: i + 2, // +2 because Excel rows start at 1 and we skip header
        employeeCode: String(employeeCode || '').trim(),
        allowanceAmount: parseFloat(allowanceAmount) || 0,
        allowancePeriod: this.mapAllowancePeriod(allowancePeriod),
        effectivityDate: this.parseDate(effectivityDate),
        proRatedAllowance: this.parseBoolean(proRatedAllowance),
      });
    }

    // Bulk insert temp records
    await this.prisma.allowanceImportTemp.createMany({
      data: tempRecords,
    });

    // Update batch total rows
    await this.prisma.allowanceImportBatch.update({
      where: { id: batchId },
      data: { totalRows: tempRecords.length },
    });

    return { batchId, totalRows: tempRecords.length };
  }

  async validateBatch(batchId: string) {
    const batch = await this.prisma.allowanceImportBatch.findUnique({
      where: { id: batchId },
      include: { allowanceConfiguration: true },
    });

    if (!batch) {
      throw new Error('Import batch not found');
    }

    // Update status to validating
    await this.prisma.allowanceImportBatch.update({
      where: { id: batchId },
      data: { status: 'validating' },
    });

    // Get all temp records
    const tempRecords = await this.prisma.allowanceImportTemp.findMany({
      where: { importBatchId: batchId },
      orderBy: { rowNumber: 'asc' },
    });

    let validRows = 0;
    let warningRows = 0;
    let errorRows = 0;
    const totalRows = tempRecords.length;

    // Get all employee codes for batch validation
    const employeeCodes = tempRecords
      .map((r) => r.employeeCode)
      .filter(Boolean);
    const employees = await this.getEmployeesByCode(
      employeeCodes,
      batch.companyId,
    );
    const employeeMap = new Map(employees.map((e) => [e.employeeCode, e]));

    // Check for existing allowance plans
    const accountIds = Array.from(employeeMap.values()).map((e) => e.accountId);
    const existingPlans = await this.prisma.allowancePlan.findMany({
      where: {
        allowanceConfigurationId: batch.allowanceConfigurationId,
        accountId: { in: accountIds },
        isActive: true,
      },
      select: {
        accountId: true,
        account: {
          select: {
            EmployeeData: {
              select: { employeeCode: true },
            },
          },
        },
      },
    });

    const existingPlanMap = new Map(
      existingPlans.map((p) => [
        p.account.EmployeeData?.employeeCode,
        p.accountId,
      ]),
    );

    // Validate each record
    for (let i = 0; i < tempRecords.length; i++) {
      const record = tempRecords[i];
      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];

      // Send progress update
      this.socketService.emitToClients([batch.uploadedBy], 'import-progress', {
        batchId,
        stage: 'validating',
        percentage: Math.round(((i + 1) / totalRows) * 100),
        current: i + 1,
        total: totalRows,
      });

      // Validate employee code
      if (!record.employeeCode) {
        errors.push({
          field: 'employeeCode',
          message: 'Employee code is required',
          severity: 'error',
        });
      } else {
        const employee = employeeMap.get(record.employeeCode);
        if (!employee) {
          errors.push({
            field: 'employeeCode',
            message: `Employee code '${record.employeeCode}' not found`,
            severity: 'error',
          });
        } else if (existingPlanMap.has(record.employeeCode)) {
          warnings.push({
            field: 'employeeCode',
            message: `Employee already has an active allowance plan for this type`,
            severity: 'warning',
          });
        }
      }

      // Validate allowance amount
      if (!record.allowanceAmount || record.allowanceAmount.toNumber() <= 0) {
        errors.push({
          field: 'allowanceAmount',
          message: 'Allowance amount must be greater than 0',
          severity: 'error',
        });
      }

      // Validate allowance period
      if (!record.allowancePeriod) {
        errors.push({
          field: 'allowancePeriod',
          message: 'Allowance period is required',
          severity: 'error',
        });
      }

      // Validate effectivity date
      if (!record.effectivityDate) {
        errors.push({
          field: 'effectivityDate',
          message: 'Effectivity date is required',
          severity: 'error',
        });
      }

      // Update record with validation results
      const isValid = errors.length === 0;
      await this.prisma.allowanceImportTemp.update({
        where: { id: record.id },
        data: {
          isValid,
          validationErrors: errors.length > 0 ? JSON.stringify(errors) : null,
          validationWarnings:
            warnings.length > 0 ? JSON.stringify(warnings) : null,
        },
      });

      if (isValid && warnings.length === 0) validRows++;
      else if (isValid && warnings.length > 0) warningRows++;
      else errorRows++;
    }

    // Update batch validation stats
    await this.prisma.allowanceImportBatch.update({
      where: { id: batchId },
      data: {
        status: 'validated',
        validRows,
        warningRows,
        errorRows,
      },
    });

    // Send final validation status
    this.socketService.emitToClients([batch.uploadedBy], 'import-progress', {
      batchId,
      stage: 'validated',
      percentage: 100,
      stats: { validRows, warningRows, errorRows },
    });

    return { validRows, warningRows, errorRows };
  }

  async approveWarnings(batchId: string, approvedIds: number[]) {
    await this.prisma.allowanceImportTemp.updateMany({
      where: {
        importBatchId: batchId,
        id: { in: approvedIds },
      },
      data: { isApproved: true },
    });

    return { approved: approvedIds.length };
  }

  async processBatch(batchId: string) {
    const batch = await this.prisma.allowanceImportBatch.findUnique({
      where: { id: batchId },
      include: { allowanceConfiguration: true },
    });

    if (!batch) {
      throw new Error('Import batch not found');
    }

    // Update status to processing
    await this.prisma.allowanceImportBatch.update({
      where: { id: batchId },
      data: { status: 'processing' },
    });

    // Get all valid records to process
    const recordsToProcess = await this.prisma.allowanceImportTemp.findMany({
      where: {
        importBatchId: batchId,
        isValid: true,
        isProcessed: false,
        OR: [
          { validationWarnings: { equals: Prisma.JsonNull } },
          { isApproved: true },
        ],
      },
      orderBy: { rowNumber: 'asc' },
    });

    let processedRows = 0;
    let failedRows = 0;
    const totalToProcess = recordsToProcess.length;

    // Get employee account IDs
    const employeeCodes = recordsToProcess.map((r) => r.employeeCode);
    const employees = await this.getEmployeesByCode(
      employeeCodes,
      batch.companyId,
    );
    const employeeMap = new Map(employees.map((e) => [e.employeeCode, e]));

    // Process each record
    for (let i = 0; i < recordsToProcess.length; i++) {
      const record = recordsToProcess[i];

      // Send progress update
      this.socketService.emitToClients([batch.uploadedBy], 'import-progress', {
        batchId,
        stage: 'processing',
        percentage: Math.round(((i + 1) / totalToProcess) * 100),
        current: i + 1,
        total: totalToProcess,
        stats: { processedRows, failedRows },
      });

      try {
        const employee = employeeMap.get(record.employeeCode);
        if (!employee) {
          throw new Error(
            `Employee not found for code: ${record.employeeCode}`,
          );
        }

        // Create allowance plan
        const allowancePlan = await this.prisma.allowancePlan.create({
          data: {
            name: `${batch.allowanceConfiguration.name} - ${employee.fullName}`,
            amount: record.allowanceAmount.toNumber(),
            effectivityDate: record.effectivityDate,
            allowanceConfigurationId: batch.allowanceConfigurationId,
            accountId: employee.accountId,
            deductionPeriod: record.allowancePeriod,
            isActive: true,
          },
        });

        // Update temp record as processed
        await this.prisma.allowanceImportTemp.update({
          where: { id: record.id },
          data: {
            isProcessed: true,
            processedAt: new Date(),
            createdAllowancePlanId: allowancePlan.id,
          },
        });

        processedRows++;
      } catch (error) {
        // Update temp record with error
        await this.prisma.allowanceImportTemp.update({
          where: { id: record.id },
          data: {
            isProcessed: true,
            processedAt: new Date(),
            processingError: error.message,
          },
        });

        failedRows++;
      }
    }

    // Update batch as completed
    await this.prisma.allowanceImportBatch.update({
      where: { id: batchId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        processedRows,
        failedRows,
      },
    });

    // Send completion status
    this.socketService.emitToClients([batch.uploadedBy], 'import-progress', {
      batchId,
      stage: 'complete',
      percentage: 100,
      stats: { processedRows, failedRows },
    });

    return { processedRows, failedRows };
  }

  async getImportStatus(batchId: string) {
    const batch = await this.prisma.allowanceImportBatch.findUnique({
      where: { id: batchId },
      include: {
        tempRecords: {
          where: {
            OR: [
              { validationErrors: { not: null } },
              { validationWarnings: { not: null } },
            ],
          },
          orderBy: { rowNumber: 'asc' },
        },
      },
    });

    if (!batch) {
      throw new Error('Import batch not found');
    }

    return {
      batch: {
        id: batch.id,
        fileName: batch.fileName,
        status: batch.status,
        totalRows: batch.totalRows,
        validRows: batch.validRows,
        warningRows: batch.warningRows,
        errorRows: batch.errorRows,
        processedRows: batch.processedRows,
        failedRows: batch.failedRows,
      },
      errors: batch.tempRecords.map((r) => ({
        id: r.id,
        rowNumber: r.rowNumber,
        employeeCode: r.employeeCode,
        validationErrors: r.validationErrors
          ? (JSON.parse(r.validationErrors as string) as ValidationError[])
          : [],
        validationWarnings: r.validationWarnings
          ? (JSON.parse(r.validationWarnings as string) as ValidationError[])
          : [],
      })),
    };
  }

  async getImportHistory(query: any, body: any) {
    const {
      page = 1,
      perPage = 10,
      sortBy = 'startedAt',
      sortOrder = 'desc',
    } = query;
    const { filters = [] } = body;

    const where: Prisma.AllowanceImportBatchWhereInput = {};

    // Apply filters
    filters.forEach((filter: any) => {
      if (filter.status) {
        where.status = filter.status;
      }
      if (filter.fileName) {
        where.fileName = filter.fileName;
      }
    });

    const [list, totalCount] = await Promise.all([
      this.prisma.allowanceImportBatch.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { [sortBy]: sortOrder },
        include: {
          account: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.allowanceImportBatch.count({ where }),
    ]);

    return {
      list,
      pagination: {
        page,
        perPage,
        totalCount,
        totalPages: Math.ceil(totalCount / perPage),
      },
    };
  }

  async getImportBatchDetails(batchId: string) {
    return this.prisma.allowanceImportBatch.findUnique({
      where: { id: batchId },
      include: {
        account: true,
        allowanceConfiguration: true,
        tempRecords: {
          orderBy: { rowNumber: 'asc' },
        },
      },
    });
  }

  async getImportBatchErrors(batchId: string) {
    return this.prisma.allowanceImportTemp.findMany({
      where: {
        importBatchId: batchId,
        OR: [
          { validationErrors: { not: null } },
          { processingError: { not: null } },
        ],
      },
      orderBy: { rowNumber: 'asc' },
    });
  }

  async generateErrorReport(batchId: string): Promise<Buffer> {
    const errors = await this.getImportBatchErrors(batchId);

    const data = errors.map((error) => ({
      'Row Number': error.rowNumber,
      'Employee Code': error.employeeCode,
      'Allowance Amount': error.allowanceAmount.toString(),
      'Allowance Period': error.allowancePeriod,
      'Effectivity Date': error.effectivityDate.toISOString().split('T')[0],
      'Pro-Rated': error.proRatedAllowance ? 'Yes' : 'No',
      Errors: error.validationErrors
        ? JSON.stringify(error.validationErrors)
        : error.processingError,
    }));

    // Generate Excel error report using centralized service
    if (data.length > 0) {
      const columns = Object.keys(data[0]).map((key) => ({
        header: key,
        key: key,
        width: 20,
      }));

      return await this.excelService.exportToBuffer(columns, data, 'Errors', {
        headerStyle: {
          font: { bold: true },
        } as Partial<ExcelJS.Style>,
      });
    }

    // Return empty Excel if no data
    return await this.excelService.exportToBuffer(
      [{ header: 'No Errors', key: 'message', width: 50 }],
      [{ message: 'No errors found' }],
      'Errors',
    );
  }

  async generateTemplate(): Promise<Buffer> {
    // Get period options
    const periodOptions = await this.getPeriodOptions();

    // Define columns
    const columns = [
      { header: 'Employee Code', key: 'employeeCode', width: 15 },
      { header: 'Allowance Amount', key: 'allowanceAmount', width: 15 },
      { header: 'Allowance Period', key: 'allowancePeriod', width: 20 },
      { header: 'Effectivity Date', key: 'effectivityDate', width: 15 },
      { header: 'Pro-Rated Allowance', key: 'proRatedAllowance', width: 20 },
    ];

    // Sample data
    const sampleData = [
      {
        employeeCode: 'EMP001',
        allowanceAmount: 5000,
        allowancePeriod: periodOptions[0] || 'FIRST_PERIOD',
        effectivityDate: new Date().toISOString().split('T')[0],
        proRatedAllowance: 'No',
      },
      {
        employeeCode: 'EMP002',
        allowanceAmount: 3000,
        allowancePeriod: periodOptions[0] || 'FIRST_PERIOD',
        effectivityDate: new Date().toISOString().split('T')[0],
        proRatedAllowance: 'Yes',
      },
    ];

    // Instructions for the template
    const instructions = [
      'Instructions for Allowance Import',
      '',
      '1. Employee Code: Must match existing employee codes in the system',
      '2. Allowance Amount: Numeric value greater than 0',
      `3. Allowance Period: Must be one of: ${periodOptions.join(', ')}`,
      '4. Effectivity Date: Format YYYY-MM-DD',
      '5. Pro-Rated Allowance: Yes or No',
      '',
      'Note: Do not modify the column headers',
      '',
      'The template includes dropdown menus for Allowance Period and Pro-Rated Allowance fields.',
      'Click on cells in these columns to see the dropdown arrow and select from available options.',
    ];

    // Generate template using centralized Excel service
    return await this.excelService.createTemplate(columns, {
      sampleData,
      dropdowns: [
        {
          columnKey: 'allowancePeriod',
          options: periodOptions,
          allowBlank: false,
          errorTitle: 'Invalid Period',
          errorMessage: `Please select from: ${periodOptions.join(', ')}`,
        },
        {
          columnKey: 'proRatedAllowance',
          options: ['Yes', 'No'],
          allowBlank: false,
          errorTitle: 'Invalid Value',
          errorMessage: 'Please select either Yes or No',
        },
      ],
      dateColumns: [
        {
          columnKey: 'effectivityDate',
          format: 'yyyy-mm-dd',
          allowBlank: false,
        },
      ],
      instructions,
    });
  }

  private mapAllowancePeriod(value: any): DeductionPeriod {
    const periodMap: Record<string, DeductionPeriod> = {
      FIRST_PERIOD: DeductionPeriod.FIRST_PERIOD,
      LAST_PERIOD: DeductionPeriod.LAST_PERIOD,
      SECOND_PERIOD: DeductionPeriod.LAST_PERIOD,
      EVERY_PERIOD: DeductionPeriod.EVERY_PERIOD,
      'FIRST PERIOD': DeductionPeriod.FIRST_PERIOD,
      'LAST PERIOD': DeductionPeriod.LAST_PERIOD,
      'SECOND PERIOD': DeductionPeriod.LAST_PERIOD,
      'EVERY PERIOD': DeductionPeriod.EVERY_PERIOD,
    };

    const normalized = String(value || '')
      .toUpperCase()
      .replace(/\s+/g, '_');
    return periodMap[normalized] || DeductionPeriod.EVERY_PERIOD;
  }

  private parseDate(value: any): Date {
    if (!value) return new Date();

    // Handle Excel date serial number
    if (typeof value === 'number') {
      return new Date((value - 25569) * 86400 * 1000);
    }

    // Handle string date
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  private parseBoolean(value: any): boolean {
    const trueValues = ['yes', 'y', 'true', '1', 1, true];
    return trueValues.includes(String(value).toLowerCase());
  }

  private async getPeriodOptions(): Promise<string[]> {
    return Object.values(DeductionPeriod);
  }

  private async getEmployeesByCode(employeeCodes: string[], companyId: number) {
    const employees = await this.prisma.account.findMany({
      where: {
        companyId,
        EmployeeData: {
          employeeCode: { in: employeeCodes },
        },
      },
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
    });

    return employees.map((e) => ({
      accountId: e.id,
      employeeCode: e.EmployeeData?.employeeCode || '',
      fullName: `${e.firstName} ${e.lastName}`,
    }));
  }
}

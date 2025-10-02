import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { SocketService } from '@modules/communication/socket/socket/socket.service';
import { DeductionPeriod, Prisma } from '@prisma/client';
import { ExcelService } from '@common/services/excel';
import { v4 as uuidv4 } from 'uuid';
import { MulterFile } from '../../../../types/multer';

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

@Injectable()
export class DeductionImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilityService: UtilityService,
    private readonly socketService: SocketService,
    private readonly excelService: ExcelService,
  ) {}

  async uploadAndParseFile(
    file: MulterFile,
    companyId: number,
    uploadedBy: string,
    deductionConfigurationId: number,
  ) {
    const batchId = uuidv4();

    // Get deduction configuration to check if it requires loan amount
    const deductionConfig = await this.prisma.deductionConfiguration.findUnique(
      {
        where: { id: deductionConfigurationId },
      },
    );

    if (!deductionConfig) {
      throw new Error('Deduction configuration not found');
    }

    // Create import batch record
    await this.prisma.deductionImportBatch.create({
      data: {
        id: batchId,
        fileName: file.originalname,
        uploadedBy,
        companyId,
        deductionConfigurationId,
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

    const dataRows = parsedData.rows;

    // Parse rows into temp records
    const tempRecords: Prisma.DeductionImportTempCreateManyInput[] = [];
    const hasLoanAmount = deductionConfig.category === 'LOAN';

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] as any[];
      if (!row || row.length === 0) continue;

      let employeeCode,
        loanAmount,
        monthlyAmortization,
        deductionPeriod,
        effectivityDate;

      if (hasLoanAmount) {
        [
          employeeCode,
          loanAmount,
          monthlyAmortization,
          deductionPeriod,
          effectivityDate,
        ] = row;
      } else {
        [employeeCode, monthlyAmortization, deductionPeriod, effectivityDate] =
          row;
      }

      tempRecords.push({
        importBatchId: batchId,
        rowNumber: i + 2, // +2 because Excel rows start at 1 and we skip header
        employeeCode: String(employeeCode || '').trim(),
        loanAmount: hasLoanAmount ? parseFloat(loanAmount) || null : null,
        monthlyAmortization: parseFloat(monthlyAmortization) || 0,
        deductionPeriod: this.mapDeductionPeriod(deductionPeriod),
        effectivityDate: this.parseDate(effectivityDate),
      });
    }

    // Bulk insert temp records
    await this.prisma.deductionImportTemp.createMany({
      data: tempRecords,
    });

    // Update batch total rows
    await this.prisma.deductionImportBatch.update({
      where: { id: batchId },
      data: { totalRows: tempRecords.length },
    });

    return { batchId, totalRows: tempRecords.length };
  }

  async validateBatch(batchId: string) {
    const batch = await this.prisma.deductionImportBatch.findUnique({
      where: { id: batchId },
      include: {
        deductionConfiguration: {},
      },
    });

    if (!batch) {
      throw new Error('Import batch not found');
    }

    // Update status to validating
    await this.prisma.deductionImportBatch.update({
      where: { id: batchId },
      data: { status: 'validating' },
    });

    // Get all temp records
    const tempRecords = await this.prisma.deductionImportTemp.findMany({
      where: { importBatchId: batchId },
      orderBy: { rowNumber: 'asc' },
    });

    let validRows = 0;
    let warningRows = 0;
    let errorRows = 0;
    const totalRows = tempRecords.length;
    const hasLoanAmount = batch.deductionConfiguration.category === 'LOAN';

    // Get all employee codes for batch validation
    const employeeCodes = tempRecords
      .map((r) => r.employeeCode)
      .filter(Boolean);
    const employees = await this.getEmployeesByCode(
      employeeCodes,
      batch.companyId,
    );
    const employeeMap = new Map(employees.map((e) => [e.employeeCode, e]));

    // Check for existing deduction plans
    const accountIds = Array.from(employeeMap.values()).map((e) => e.accountId);
    const existingPlans = await this.prisma.deductionPlan.findMany({
      where: {
        deductionConfigurationId: batch.deductionConfigurationId,
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
            message: `Employee already has an active deduction plan for this type`,
            severity: 'warning',
          });
        }
      }

      // Validate loan amount (if required)
      if (
        hasLoanAmount &&
        (!record.loanAmount || record.loanAmount.toNumber() <= 0)
      ) {
        errors.push({
          field: 'loanAmount',
          message: 'Loan amount must be greater than 0',
          severity: 'error',
        });
      }

      // Validate monthly amortization
      if (
        !record.monthlyAmortization ||
        record.monthlyAmortization.toNumber() <= 0
      ) {
        errors.push({
          field: 'monthlyAmortization',
          message: 'Monthly amortization must be greater than 0',
          severity: 'error',
        });
      }

      // Validate deduction period
      if (!record.deductionPeriod) {
        errors.push({
          field: 'deductionPeriod',
          message: 'Deduction period is required',
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
      await this.prisma.deductionImportTemp.update({
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
    await this.prisma.deductionImportBatch.update({
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
    await this.prisma.deductionImportTemp.updateMany({
      where: {
        importBatchId: batchId,
        id: { in: approvedIds },
      },
      data: { isApproved: true },
    });

    return { approved: approvedIds.length };
  }

  async processBatch(batchId: string) {
    const batch = await this.prisma.deductionImportBatch.findUnique({
      where: { id: batchId },
      include: { deductionConfiguration: true },
    });

    if (!batch) {
      throw new Error('Import batch not found');
    }

    // Update status to processing
    await this.prisma.deductionImportBatch.update({
      where: { id: batchId },
      data: { status: 'processing' },
    });

    // Get all valid records to process
    const recordsToProcess = await this.prisma.deductionImportTemp.findMany({
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

        // Create deduction plan
        const deductionPlan = await this.prisma.deductionPlan.create({
          data: {
            name: `${batch.deductionConfiguration.name} - ${employee.fullName}`,
            deductionConfigurationId: batch.deductionConfigurationId,
            accountId: employee.accountId,
            monthlyAmortization: record.monthlyAmortization.toNumber(),
            totalAmount: record.loanAmount ? record.loanAmount.toNumber() : 0,
            totalPaidAmount: 0,
            remainingBalance: record.loanAmount
              ? record.loanAmount.toNumber()
              : 0,
            deductionPeriod: record.deductionPeriod,
            effectivityDate: record.effectivityDate,
            isActive: true,
            isOpen: true,
          },
        });

        // Update temp record as processed
        await this.prisma.deductionImportTemp.update({
          where: { id: record.id },
          data: {
            isProcessed: true,
            processedAt: new Date(),
            createdDeductionPlanId: deductionPlan.id,
          },
        });

        processedRows++;
      } catch (error) {
        // Update temp record with error
        await this.prisma.deductionImportTemp.update({
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
    await this.prisma.deductionImportBatch.update({
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
    const batch = await this.prisma.deductionImportBatch.findUnique({
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

    const where: Prisma.DeductionImportBatchWhereInput = {};

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
      this.prisma.deductionImportBatch.findMany({
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
      this.prisma.deductionImportBatch.count({ where }),
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
    return this.prisma.deductionImportBatch.findUnique({
      where: { id: batchId },
      include: {
        account: true,
        deductionConfiguration: true,
        tempRecords: {
          orderBy: { rowNumber: 'asc' },
        },
      },
    });
  }

  async getImportBatchErrors(batchId: string) {
    return this.prisma.deductionImportTemp.findMany({
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
    const batch = await this.prisma.deductionImportBatch.findUnique({
      where: { id: batchId },
      include: {
        deductionConfiguration: {},
      },
    });

    const errors = await this.getImportBatchErrors(batchId);
    const hasLoanAmount = batch?.deductionConfiguration.category === 'LOAN';

    const data = errors.map((error) => {
      const baseData: any = {
        'Row Number': error.rowNumber,
        'Employee Code': error.employeeCode,
      };

      if (hasLoanAmount) {
        baseData['Loan Amount'] = error.loanAmount?.toString() || '';
      }

      return {
        ...baseData,
        'Monthly Amortization': error.monthlyAmortization.toString(),
        'Deduction Period': error.deductionPeriod,
        'Effectivity Date': error.effectivityDate.toISOString().split('T')[0],
        Errors: error.validationErrors
          ? JSON.stringify(error.validationErrors)
          : error.processingError,
      };
    });

    // Generate Excel using centralized service
    const columns = Object.keys(data[0] || {}).map((key) => ({
      header:
        key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      key: key,
      width: 20,
    }));

    return await this.excelService.exportToBuffer(columns, data, 'Errors');
  }

  async generateTemplate(deductionConfigurationId: number): Promise<Buffer> {
    // Get deduction configuration to check if it requires loan amount
    const deductionConfig = await this.prisma.deductionConfiguration.findUnique(
      {
        where: { id: deductionConfigurationId },
      },
    );

    if (!deductionConfig) {
      throw new Error('Deduction configuration not found');
    }

    const hasLoanAmount = deductionConfig.category === 'LOAN';
    const periodOptions = await this.getPeriodOptions();

    // Prepare data for Excel template generation

    // Define columns based on deduction type
    const columns: any[] = [
      { header: 'Employee Code', key: 'employeeCode', width: 15 },
    ];

    if (hasLoanAmount) {
      columns.push({ header: 'Loan Amount', key: 'loanAmount', width: 15 });
    }

    columns.push(
      { header: 'Monthly Amortization', key: 'monthlyAmortization', width: 20 },
      { header: 'Deduction Period', key: 'deductionPeriod', width: 20 },
      { header: 'Effectivity Date', key: 'effectivityDate', width: 15 },
    );

    // Template generation is handled below using the centralized Excel service

    // Generate template using centralized Excel service
    const templateOptions = {
      dropdowns:
        periodOptions.length > 0
          ? [
              {
                columnKey: hasLoanAmount
                  ? 'deductionPeriod'
                  : 'deductionPeriod',
                options: periodOptions,
                allowBlank: false,
                errorTitle: 'Invalid Period',
                errorMessage: 'Please select a valid period from the dropdown',
              },
            ]
          : undefined,
      dateColumns: [
        {
          columnKey: 'effectivityDate',
          format: 'yyyy-mm-dd',
          allowBlank: false,
        },
      ],
      sampleData: hasLoanAmount
        ? [
            {
              employeeCode: 'EMP001',
              loanAmount: 50000,
              monthlyAmortization: 2000,
              deductionPeriod: periodOptions[0] || 'MONTHLY',
              effectivityDate: new Date().toISOString().split('T')[0],
            },
            {
              employeeCode: 'EMP002',
              loanAmount: 30000,
              monthlyAmortization: 1500,
              deductionPeriod: periodOptions[0] || 'MONTHLY',
              effectivityDate: new Date().toISOString().split('T')[0],
            },
          ]
        : [
            {
              employeeCode: 'EMP001',
              monthlyAmortization: 1000,
              deductionPeriod: periodOptions[0] || 'MONTHLY',
              effectivityDate: new Date().toISOString().split('T')[0],
            },
            {
              employeeCode: 'EMP002',
              monthlyAmortization: 1500,
              deductionPeriod: periodOptions[0] || 'MONTHLY',
              effectivityDate: new Date().toISOString().split('T')[0],
            },
          ],
      instructions: [
        'DEDUCTION IMPORT TEMPLATE',
        '',
        'Instructions:',
        '1. Do not modify the column headers',
        '2. Employee Code must match existing employees in the system',
        hasLoanAmount
          ? '3. Loan Amount is the total loan amount (must be greater than 0)'
          : '',
        hasLoanAmount
          ? '4. Monthly Amortization is the amount to deduct per period'
          : '3. Monthly Amortization is the amount to deduct per period',
        hasLoanAmount
          ? '5. Deduction Period: Select from dropdown (e.g., MONTHLY, SEMI_MONTHLY)'
          : '4. Deduction Period: Select from dropdown (e.g., MONTHLY, SEMI_MONTHLY)',
        hasLoanAmount
          ? '6. Effectivity Date: Format YYYY-MM-DD'
          : '5. Effectivity Date: Format YYYY-MM-DD',
        '',
        'Notes:',
        '- Duplicate employee codes will be rejected',
        '- Invalid or missing data will cause validation errors',
        '- Maximum 10,000 rows per import',
      ].filter(Boolean),
    };

    return await this.excelService.createTemplate(columns, templateOptions);
  }

  private mapDeductionPeriod(value: any): DeductionPeriod {
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

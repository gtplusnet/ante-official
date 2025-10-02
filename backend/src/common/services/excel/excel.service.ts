import { Injectable, BadRequestException } from '@nestjs/common';
import { ExcelImportService } from './excel-import.service';
import { ExcelExportService } from './excel-export.service';
import { ExcelValidationService } from './excel-validation.service';
import { ExcelTransformService } from './excel-transform.service';
import {
  ExcelColumn,
  ExcelImportOptions,
  ExcelExportOptions,
  ExcelValidationRule,
  ExcelTransformOptions,
  ExcelParsedData,
  ExcelValidationResult,
  ExcelSheetConfig,
} from './interfaces/excel.interface';
import { MulterFile } from '../../../types/multer';

/**
 * Main Excel service that orchestrates all Excel operations
 * Following Facade pattern to provide a simplified interface
 */
@Injectable()
export class ExcelService {
  constructor(
    private readonly importService: ExcelImportService,
    private readonly exportService: ExcelExportService,
    private readonly validationService: ExcelValidationService,
    private readonly transformService: ExcelTransformService,
  ) {}

  // ==================== Import Operations ====================

  /**
   * Import and process Excel file from Multer upload
   */
  async importFromFile<T = any>(
    file: MulterFile,
    options?: {
      importOptions?: ExcelImportOptions;
      validationRules?: ExcelValidationRule[];
      transformOptions?: ExcelTransformOptions;
    },
  ): Promise<{
    data: T[];
    validation?: ExcelValidationResult;
    metadata?: any;
  }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided');
    }

    // Step 1: Import the Excel file
    const parsedData = await this.importService.importFromBuffer<T>(
      file.buffer,
      options?.importOptions,
    );

    let processedData = parsedData.rows;

    // Step 2: Transform data if mappings provided
    if (options?.transformOptions) {
      processedData = this.transformService.transform<T>(
        processedData,
        options.transformOptions,
      );
    }

    // Step 3: Validate data if rules provided
    let validationResult: ExcelValidationResult | undefined;
    if (options?.validationRules) {
      validationResult = await this.validationService.validate(
        processedData,
        options.validationRules,
      );

      // Return only valid rows if validation was performed
      if (validationResult) {
        processedData = validationResult.validRows as T[];
      }
    }

    return {
      data: processedData,
      validation: validationResult,
      metadata: parsedData.metadata,
    };
  }

  /**
   * Import Excel from buffer
   */
  async importFromBuffer<T = any>(
    buffer: Buffer,
    options?: ExcelImportOptions,
  ): Promise<ExcelParsedData<T>> {
    return this.importService.importFromBuffer<T>(buffer, options);
  }

  /**
   * Import Excel from base64
   */
  async importFromBase64<T = any>(
    base64Data: string,
    options?: ExcelImportOptions,
  ): Promise<ExcelParsedData<T>> {
    return this.importService.importFromBase64<T>(base64Data, options);
  }

  /**
   * Stream large Excel files for memory efficiency
   */
  async *streamRows<T = any>(
    buffer: Buffer,
    options?: ExcelImportOptions,
  ): AsyncGenerator<T, void, unknown> {
    yield* this.importService.streamRows<T>(buffer, options);
  }

  // ==================== Export Operations ====================

  /**
   * Export data to Excel buffer
   */
  async exportToBuffer(
    columns: ExcelColumn[],
    data: any[],
    sheetName?: string,
    options?: Partial<ExcelSheetConfig>,
  ): Promise<Buffer> {
    return this.exportService.exportToBuffer(columns, data, sheetName, options);
  }

  /**
   * Export multiple sheets to Excel
   */
  async exportMultipleSheetsToBuffer(
    options: ExcelExportOptions,
  ): Promise<Buffer> {
    return this.exportService.exportMultipleSheetsToBuffer(options);
  }

  /**
   * Create Excel template with validations
   */
  async createTemplate(columns: ExcelColumn[], options?: any): Promise<Buffer> {
    return this.exportService.createTemplate(columns, options);
  }

  // ==================== Validation Operations ====================

  /**
   * Validate Excel data
   */
  async validateData(
    data: any[],
    rules: ExcelValidationRule[],
  ): Promise<ExcelValidationResult> {
    return this.validationService.validate(data, rules);
  }

  /**
   * Create validation rules from column definitions
   */
  createValidationRules(columns: any[]): ExcelValidationRule[] {
    return this.validationService.createRulesFromColumns(columns);
  }

  /**
   * Generate validation report
   */
  generateValidationReport(result: ExcelValidationResult): string {
    return this.validationService.generateValidationReport(result);
  }

  // ==================== Transform Operations ====================

  /**
   * Transform Excel data
   */
  transformData<T = any>(data: any[], options: ExcelTransformOptions): T[] {
    return this.transformService.transform<T>(data, options);
  }

  /**
   * Create auto-mapping for transformation
   */
  createAutoMapping(sourceColumns: string[], targetFields?: string[]): any[] {
    return this.transformService.createAutoMapping(sourceColumns, targetFields);
  }

  // ==================== Utility Operations ====================

  /**
   * Parse Excel date
   */
  parseExcelDate(value: any): Date | null {
    return this.importService.parseExcelDate(value);
  }

  /**
   * Convert Excel to CSV
   */
  async convertToCSV(
    buffer: Buffer,
    options?: ExcelImportOptions,
  ): Promise<string> {
    return this.importService.convertToCSV(buffer, options);
  }

  /**
   * Get Excel file metadata
   */
  async getMetadata(buffer: Buffer): Promise<any> {
    return this.importService.getMetadata(buffer);
  }

  // ==================== Helper Methods ====================

  /**
   * Create standard employee import columns
   */
  static createEmployeeImportColumns(): ExcelColumn[] {
    return [
      { header: 'Employee Code', key: 'employeeCode', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Middle Name (Optional)', key: 'middleName', width: 20 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Email Address', key: 'email', width: 25 },
      {
        header: 'Birthdate (yyyy/mm/dd)',
        key: 'birthdate',
        width: 20,
        numFmt: 'yyyy/mm/dd',
      },
      { header: 'Civil Status', key: 'civilStatus', width: 15 },
      { header: 'Sex', key: 'sex', width: 10 },
      { header: 'Street', key: 'street', width: 30 },
      { header: 'City / Town', key: 'city', width: 20 },
      { header: 'State / Province', key: 'stateProvince', width: 20 },
      { header: 'Postal Code', key: 'postalCode', width: 15 },
      { header: 'ZIP Code', key: 'zipCode', width: 15 },
      { header: 'Country', key: 'country', width: 20 },
      { header: 'Contact Number', key: 'contactNumber', width: 20 },
      { header: 'Role/Position', key: 'role', width: 25 },
      { header: 'Reports To (Employee Code)', key: 'reportsTo', width: 25 },
      {
        header: 'Monthly Rate',
        key: 'monthlyRate',
        width: 15,
        numFmt: '#,##0.00',
      },
      { header: 'Employment Status', key: 'employmentStatus', width: 20 },
      {
        header: 'Start Date',
        key: 'startDate',
        width: 15,
        numFmt: 'mm/dd/yyyy',
      },
      { header: 'End Date', key: 'endDate', width: 15, numFmt: 'mm/dd/yyyy' },
      { header: 'Branch', key: 'branch', width: 20 },
      { header: 'Bank Name', key: 'bankName', width: 25 },
      { header: 'Bank Account Number', key: 'bankAccountNumber', width: 25 },
      { header: 'Schedule Code', key: 'scheduleCode', width: 20 },
      { header: 'Payroll Group Code', key: 'payrollGroupCode', width: 20 },
      { header: 'TIN Number', key: 'tinNumber', width: 20 },
      { header: 'SSS Number', key: 'sssNumber', width: 20 },
      { header: 'HDMF Number', key: 'hdmfNumber', width: 20 },
      { header: 'PHC Number', key: 'phcNumber', width: 20 },
    ];
  }

  /**
   * Create standard student import columns
   */
  static createStudentImportColumns(): ExcelColumn[] {
    return [
      { header: 'Student Number', key: 'studentNumber', width: 20 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Middle Name', key: 'middleName', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Password', key: 'password', width: 20 },
      {
        header: 'Date of Birth',
        key: 'dateOfBirth',
        width: 20,
        numFmt: 'mm/dd/yyyy',
      },
      { header: 'Gender', key: 'gender', width: 15 },
      { header: 'Contact Number', key: 'contactNumber', width: 20 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Guardian Name', key: 'guardianName', width: 30 },
      { header: 'Guardian Contact', key: 'guardianContact', width: 20 },
      { header: 'Grade Level', key: 'gradeLevel', width: 15 },
      { header: 'Section', key: 'section', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ];
  }

  /**
   * Create standard timesheet columns
   */
  static createTimesheetColumns(): ExcelColumn[] {
    return [
      { header: 'Employee Code', key: 'employeeCode', width: 20 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Date', key: 'date', width: 15, numFmt: 'mm/dd/yyyy' },
      { header: 'Time In', key: 'timeIn', width: 15 },
      { header: 'Time Out', key: 'timeOut', width: 15 },
      { header: 'Break Start', key: 'breakStart', width: 15 },
      { header: 'Break End', key: 'breakEnd', width: 15 },
      {
        header: 'Regular Hours',
        key: 'regularHours',
        width: 15,
        numFmt: '#,##0.00',
      },
      {
        header: 'Overtime Hours',
        key: 'overtimeHours',
        width: 15,
        numFmt: '#,##0.00',
      },
      {
        header: 'Total Hours',
        key: 'totalHours',
        width: 15,
        numFmt: '#,##0.00',
      },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 },
    ];
  }
}

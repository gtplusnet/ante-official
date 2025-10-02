import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  ExcelImportOptions,
  ExcelParsedData,
  ExcelMetadata,
  ExcelError,
} from './interfaces/excel.interface';

/**
 * Service responsible for importing and parsing Excel files
 * Following Single Responsibility Principle - only handles import operations
 */
@Injectable()
export class ExcelImportService {
  /**
   * Import Excel file from buffer
   */
  async importFromBuffer<T = any>(
    buffer: Buffer,
    options: ExcelImportOptions = {},
  ): Promise<ExcelParsedData<T>> {
    try {
      const workbook = await this.loadWorkbook(buffer);
      const worksheet = this.getWorksheet(workbook, options);

      if (!worksheet) {
        throw new BadRequestException('No worksheet found in the Excel file');
      }

      return this.parseWorksheet<T>(worksheet, options);
    } catch (error) {
      throw this.handleImportError(error);
    }
  }

  /**
   * Import Excel file from base64 string
   */
  async importFromBase64<T = any>(
    base64Data: string,
    options: ExcelImportOptions = {},
  ): Promise<ExcelParsedData<T>> {
    const base64 = this.extractBase64Data(base64Data);
    const buffer = Buffer.from(base64, 'base64');
    return this.importFromBuffer<T>(buffer, options);
  }

  /**
   * Import Excel file from file path
   */
  async importFromFile<T = any>(
    filePath: string,
    options: ExcelImportOptions = {},
  ): Promise<ExcelParsedData<T>> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const worksheet = this.getWorksheet(workbook, options);

      if (!worksheet) {
        throw new BadRequestException('No worksheet found in the Excel file');
      }

      return this.parseWorksheet<T>(worksheet, options);
    } catch (error) {
      throw this.handleImportError(error);
    }
  }

  /**
   * Import multiple sheets from Excel file
   */
  async importMultipleSheets<T = any>(
    buffer: Buffer,
    sheetOptions?: Map<string, ExcelImportOptions>,
  ): Promise<Map<string, ExcelParsedData<T>>> {
    try {
      const workbook = await this.loadWorkbook(buffer);
      const results = new Map<string, ExcelParsedData<T>>();

      for (const worksheet of workbook.worksheets) {
        const options = sheetOptions?.get(worksheet.name) || {};
        const parsedData = await this.parseWorksheet<T>(worksheet, options);
        results.set(worksheet.name, parsedData);
      }

      return results;
    } catch (error) {
      throw this.handleImportError(error);
    }
  }

  /**
   * Get Excel file metadata
   */
  async getMetadata(buffer: Buffer): Promise<ExcelMetadata> {
    try {
      const workbook = await this.loadWorkbook(buffer);
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        throw new BadRequestException('No worksheet found in the Excel file');
      }

      return {
        sheetName: worksheet.name,
        totalRows: worksheet.rowCount,
        totalColumns: worksheet.columnCount,
        emptyRows: this.countEmptyRows(worksheet),
        createdDate: workbook.created,
        modifiedDate: workbook.modified,
        author: workbook.creator,
      };
    } catch (error) {
      throw this.handleImportError(error);
    }
  }

  /**
   * Parse Excel dates correctly
   */
  parseExcelDate(value: any): Date | null {
    if (!value) return null;

    // If it's already a Date object
    if (value instanceof Date) return value;

    // If it's a number (Excel serial date)
    if (typeof value === 'number') {
      // Excel stores dates as numbers (days since 1900-01-01)
      // But there's a bug in Excel that treats 1900 as a leap year
      const date = new Date((value - 25569) * 86400 * 1000);
      return date;
    }

    // If it's a string, try to parse it
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return null;
  }

  /**
   * Convert Excel worksheet to CSV string
   */
  async convertToCSV(
    buffer: Buffer,
    options: ExcelImportOptions = {},
  ): Promise<string> {
    const parsedData = await this.importFromBuffer(buffer, options);
    const headers = parsedData.headers;
    const rows = parsedData.rows;

    const csvRows = [headers.join(',')];

    for (const row of rows) {
      const values = headers.map((header) => {
        const value = row[header];
        // Escape values containing commas or quotes
        if (
          typeof value === 'string' &&
          (value.includes(',') || value.includes('"'))
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Stream large Excel files (for memory efficiency)
   */
  async *streamRows<T = any>(
    buffer: Buffer,
    options: ExcelImportOptions = {},
  ): AsyncGenerator<T, void, unknown> {
    const workbook = await this.loadWorkbook(buffer);
    const worksheet = this.getWorksheet(workbook, options);

    if (!worksheet) {
      throw new BadRequestException('No worksheet found in the Excel file');
    }

    const headers = this.extractHeaders(worksheet, options);
    const startRow = options.dataStartRow || 2;
    const maxRows = options.maxRows || Infinity;
    const trimValues = options.trimValues !== false;

    let rowCount = 0;

    for (
      let rowNumber = startRow;
      rowNumber <= worksheet.rowCount && rowCount < maxRows;
      rowNumber++
    ) {
      const row = worksheet.getRow(rowNumber);

      if (!options.includeEmptyRows && this.isRowEmpty(row)) {
        continue;
      }

      const rowData: any = {};

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          let value = cell.value;

          // Handle Excel date serial numbers
          if (
            cell.type === ExcelJS.ValueType.Date ||
            (typeof value === 'number' && this.isExcelDate(cell))
          ) {
            value = this.parseExcelDate(value);
          }

          // Handle formula results
          if (cell.type === ExcelJS.ValueType.Formula) {
            value = cell.result;
          }

          // Handle rich text
          if (cell.type === ExcelJS.ValueType.RichText) {
            value =
              (cell.value as any).richText
                ?.map((rt: any) => rt.text)
                .join('') || '';
          }

          // Handle hyperlinks
          if (cell.type === ExcelJS.ValueType.Hyperlink) {
            // Hyperlink cells have value as { text: string, hyperlink: string }
            value = (cell.value as any).text || cell.text || '';
          }

          // Trim string values if enabled
          if (trimValues && typeof value === 'string') {
            value = value.trim();
          }

          rowData[header] = value;
        }
      });

      yield rowData as T;
      rowCount++;
    }
  }

  // Private helper methods

  private async loadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    return workbook;
  }

  private getWorksheet(
    workbook: ExcelJS.Workbook,
    options: ExcelImportOptions,
  ): ExcelJS.Worksheet | undefined {
    if (options.sheetName) {
      return workbook.getWorksheet(options.sheetName);
    }

    const sheetIndex = options.sheetIndex || 0;
    return workbook.worksheets[sheetIndex];
  }

  private parseWorksheet<T>(
    worksheet: ExcelJS.Worksheet,
    options: ExcelImportOptions,
  ): ExcelParsedData<T> {
    const headers = this.extractHeaders(worksheet, options);
    const rows = this.extractRows<T>(worksheet, headers, options);
    const rawData = this.extractRawData(worksheet, options);

    return {
      headers,
      rows,
      rawData,
      metadata: {
        sheetName: worksheet.name,
        totalRows: worksheet.rowCount,
        totalColumns: worksheet.columnCount,
        emptyRows: this.countEmptyRows(worksheet),
      },
    };
  }

  private extractHeaders(
    worksheet: ExcelJS.Worksheet,
    options: ExcelImportOptions,
  ): string[] {
    const headerRow = options.headerRow || 1;
    const headers: string[] = [];
    const row = worksheet.getRow(headerRow);

    row.eachCell((cell, colNumber) => {
      const value = cell.value?.toString() || `Column${colNumber}`;
      headers[colNumber - 1] =
        options.trimValues !== false ? value.trim() : value;
    });

    return headers;
  }

  private extractRows<T>(
    worksheet: ExcelJS.Worksheet,
    headers: string[],
    options: ExcelImportOptions,
  ): T[] {
    const rows: T[] = [];
    const startRow = options.dataStartRow || 2;
    const maxRows = options.maxRows || Infinity;
    const trimValues = options.trimValues !== false;

    let rowCount = 0;

    for (
      let rowNumber = startRow;
      rowNumber <= worksheet.rowCount && rowCount < maxRows;
      rowNumber++
    ) {
      const row = worksheet.getRow(rowNumber);

      if (!options.includeEmptyRows && this.isRowEmpty(row)) {
        continue;
      }

      const rowData: any = {};

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          let value = cell.value;

          // Handle Excel date serial numbers
          if (
            cell.type === ExcelJS.ValueType.Date ||
            (typeof value === 'number' && this.isExcelDate(cell))
          ) {
            value = this.parseExcelDate(value);
          }

          // Handle formula results
          if (cell.type === ExcelJS.ValueType.Formula) {
            value = cell.result;
          }

          // Handle rich text
          if (cell.type === ExcelJS.ValueType.RichText) {
            value =
              (cell.value as any).richText
                ?.map((rt: any) => rt.text)
                .join('') || '';
          }

          // Handle hyperlinks
          if (cell.type === ExcelJS.ValueType.Hyperlink) {
            // Hyperlink cells have value as { text: string, hyperlink: string }
            value = (cell.value as any).text || cell.text || '';
          }

          // Trim string values if enabled
          if (trimValues && typeof value === 'string') {
            value = value.trim();
          }

          rowData[header] = value;
        }
      });

      rows.push(rowData as T);
      rowCount++;
    }

    return rows;
  }

  private extractRawData(
    worksheet: ExcelJS.Worksheet,
    options: ExcelImportOptions,
  ): any[][] {
    const rawData: any[][] = [];
    const startRow = options.headerRow || 1;
    const maxRows = options.maxRows
      ? startRow + options.maxRows
      : worksheet.rowCount;

    for (let rowNumber = startRow; rowNumber <= maxRows; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const rowData: any[] = [];

      row.eachCell({ includeEmpty: true }, (cell) => {
        rowData.push(cell.value);
      });

      rawData.push(rowData);
    }

    return rawData;
  }

  private isRowEmpty(row: ExcelJS.Row): boolean {
    let isEmpty = true;

    row.eachCell({ includeEmpty: false }, (cell) => {
      if (
        cell.value !== null &&
        cell.value !== undefined &&
        cell.value !== ''
      ) {
        isEmpty = false;
      }
    });

    return isEmpty;
  }

  private isExcelDate(cell: ExcelJS.Cell): boolean {
    // Check if cell has date number format
    const numFmt = cell.numFmt;
    if (!numFmt) return false;

    // Common date formats in Excel
    const dateFormats = [
      'mm/dd/yyyy',
      'dd/mm/yyyy',
      'yyyy-mm-dd',
      'm/d/yy',
      'd-mmm-yy',
    ];
    return dateFormats.some((format) =>
      numFmt.toLowerCase().includes(format.toLowerCase()),
    );
  }

  private countEmptyRows(worksheet: ExcelJS.Worksheet): number {
    let emptyCount = 0;

    worksheet.eachRow((row) => {
      if (this.isRowEmpty(row)) {
        emptyCount++;
      }
    });

    return emptyCount;
  }

  private extractBase64Data(base64Data: string): string {
    // Remove data URL prefix if present
    if (base64Data.includes(',')) {
      return base64Data.split(',')[1];
    }
    return base64Data;
  }

  private handleImportError(error: any): ExcelError {
    const excelError = new Error(error.message) as ExcelError;
    excelError.code = 'EXCEL_IMPORT_ERROR';
    excelError.details = error;

    if (error instanceof BadRequestException) {
      throw error;
    }

    throw new BadRequestException(
      `Failed to import Excel file: ${error.message}`,
    );
  }
}

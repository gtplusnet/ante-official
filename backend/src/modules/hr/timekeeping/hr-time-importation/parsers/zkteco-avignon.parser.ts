import { Injectable } from '@nestjs/common';
import { BiometricParser } from './biometric-parser.interface';
import {
  ImportTimeFromImageResponse,
  ImportTimeFromImageGeminiLog,
} from '../../../../../shared/response/import-time-from-image.response';
import { ExcelConverter } from '../utils/excel.converter';

@Injectable()
export class ZKTecoAvignonParser implements BiometricParser {
  /**
   * Expected column headers for ZKTeco Avignon format
   * Adjust these based on the actual template structure
   */
  private readonly EXPECTED_HEADERS = {
    employeeId: ['employee id', 'emp id', 'id', 'employee no', 'emp no'],
    employeeName: ['name', 'employee name', 'emp name'],
    date: ['date', 'log date', 'attendance date'],
    timeIn: ['time in', 'in time', 'check in', 'clock in', 'in'],
    timeOut: ['time out', 'out time', 'check out', 'clock out', 'out'],
    department: ['department', 'dept'],
    // Add more headers as needed based on the actual template
  };

  async parse(
    base64Data: string,
    _fileName: string,
    _remarks: string,
  ): Promise<ImportTimeFromImageResponse> {
    try {
      const isValid = await this.validateFormat(base64Data);
      if (!isValid) {
        return {
          status: 'Error',
          remarks:
            'Invalid file format. Please upload a valid ZKTeco Avignon Excel export.',
          logs: [],
        };
      }

      // Extract table data from Excel
      const sheets = await ExcelConverter.extractTableData(base64Data);
      if (!sheets || sheets.length === 0) {
        return {
          status: 'Error',
          remarks: 'No data found in the Excel file.',
          logs: [],
        };
      }

      const logs: ImportTimeFromImageGeminiLog[] = [];

      // Process each sheet
      for (const sheet of sheets) {
        const processedLogs = this.processSheet(sheet.data);
        logs.push(...processedLogs);
      }

      if (logs.length === 0) {
        return {
          status: 'Error',
          remarks:
            'No time logs could be extracted from the file. Please check the file format.',
          logs: [],
        };
      }

      return {
        status: 'Complete',
        remarks: `Successfully extracted ${logs.length} time log(s) from ZKTeco Avignon export.`,
        logs,
      };
    } catch (error) {
      return {
        status: 'Error',
        remarks: `Failed to parse ZKTeco Avignon file: ${error.message}`,
        logs: [],
      };
    }
  }

  async validateFormat(base64Data: string): Promise<boolean> {
    try {
      const sheets = await ExcelConverter.extractTableData(base64Data);
      if (!sheets || sheets.length === 0) return false;

      // Check the first sheet for expected headers
      const firstSheet = sheets[0];
      if (!firstSheet.data || firstSheet.data.length < 2) return false; // Need at least header + 1 data row

      const headers = firstSheet.data[0] as string[];
      if (!headers || headers.length === 0) return false;

      // Convert headers to lowercase for comparison
      const normalizedHeaders = headers.map(
        (h) => h?.toString().toLowerCase().trim() || '',
      );

      // Check if we have at least the essential columns
      const hasEmployeeId =
        this.findColumnIndex(
          normalizedHeaders,
          this.EXPECTED_HEADERS.employeeId,
        ) !== -1;
      const hasDate =
        this.findColumnIndex(normalizedHeaders, this.EXPECTED_HEADERS.date) !==
        -1;
      const hasTimeIn =
        this.findColumnIndex(
          normalizedHeaders,
          this.EXPECTED_HEADERS.timeIn,
        ) !== -1;
      const hasTimeOut =
        this.findColumnIndex(
          normalizedHeaders,
          this.EXPECTED_HEADERS.timeOut,
        ) !== -1;

      return hasEmployeeId && (hasDate || (hasTimeIn && hasTimeOut));
    } catch {
      return false;
    }
  }

  getSupportedExtensions(): string[] {
    return ['.xlsx', '.xls'];
  }

  private processSheet(data: any[]): ImportTimeFromImageGeminiLog[] {
    if (!data || data.length < 2) return []; // Need headers and at least one data row

    const headers = data[0] as string[];
    const normalizedHeaders = headers.map(
      (h) => h?.toString().toLowerCase().trim() || '',
    );

    // Find column indices
    const employeeIdCol = this.findColumnIndex(
      normalizedHeaders,
      this.EXPECTED_HEADERS.employeeId,
    );
    const employeeNameCol = this.findColumnIndex(
      normalizedHeaders,
      this.EXPECTED_HEADERS.employeeName,
    );
    const dateCol = this.findColumnIndex(
      normalizedHeaders,
      this.EXPECTED_HEADERS.date,
    );
    const timeInCol = this.findColumnIndex(
      normalizedHeaders,
      this.EXPECTED_HEADERS.timeIn,
    );
    const timeOutCol = this.findColumnIndex(
      normalizedHeaders,
      this.EXPECTED_HEADERS.timeOut,
    );

    const logs: ImportTimeFromImageGeminiLog[] = [];

    // Process data rows (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const employeeId = this.extractValue(row[employeeIdCol]);
      if (!employeeId) continue; // Skip rows without employee ID

      const dateValue = dateCol !== -1 ? this.extractValue(row[dateCol]) : null;
      const timeInValue =
        timeInCol !== -1 ? this.extractValue(row[timeInCol]) : null;
      const timeOutValue =
        timeOutCol !== -1 ? this.extractValue(row[timeOutCol]) : null;
      const employeeName =
        employeeNameCol !== -1 ? this.extractValue(row[employeeNameCol]) : null;

      // Parse and format the time entries
      const parsedEntry = this.parseTimeEntry(
        employeeId,
        dateValue,
        timeInValue,
        timeOutValue,
        employeeName,
      );
      if (parsedEntry) {
        logs.push(parsedEntry);
      }
    }

    return logs;
  }

  private findColumnIndex(headers: string[], possibleNames: string[]): number {
    for (let i = 0; i < headers.length; i++) {
      if (possibleNames.includes(headers[i])) {
        return i;
      }
    }
    return -1;
  }

  private extractValue(cellValue: any): string | null {
    if (cellValue === null || cellValue === undefined || cellValue === '') {
      return null;
    }
    return cellValue.toString().trim();
  }

  private parseTimeEntry(
    employeeId: string,
    dateValue: string | null,
    timeInValue: string | null,
    timeOutValue: string | null,
    employeeName: string | null,
  ): ImportTimeFromImageGeminiLog | null {
    try {
      // Parse date
      let date: Date;
      if (dateValue) {
        // Handle Excel date serial number or string date
        if (typeof dateValue === 'number' || !isNaN(Number(dateValue))) {
          // Excel stores dates as numbers
          date = this.excelDateToJSDate(Number(dateValue));
        } else {
          date = new Date(dateValue);
        }
      } else {
        // If no date column, try to extract from time values or use today
        date = new Date();
      }

      if (isNaN(date.getTime())) {
        date = new Date(); // Fallback to today if date parsing fails
      }

      // Format date as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];

      // Parse time values
      const timeIn = this.parseTime(timeInValue, formattedDate);
      const timeOut = this.parseTime(timeOutValue, formattedDate);

      if (!timeIn && !timeOut) {
        return null; // Skip entries with no valid time data
      }

      const remarks: string[] = [];
      if (employeeName) {
        remarks.push(`Employee: ${employeeName}`);
      }
      if (!timeIn) {
        remarks.push('No time in recorded');
      }
      if (!timeOut) {
        remarks.push('No time out recorded');
      }

      return {
        employeeId: employeeId.toString(),
        timeIn: timeIn || '',
        timeOut: timeOut || '',
        remarks: remarks.join('; '),
      };
    } catch (error) {
      console.error('Error parsing time entry:', error);
      return null;
    }
  }

  private parseTime(timeValue: string | null, dateStr: string): string | null {
    if (!timeValue) return null;

    try {
      const time = timeValue.trim();

      // Handle various time formats
      // Format: HH:mm:ss or HH:mm
      const timeMatch = time.match(
        /^(\d{1,2}):(\d{2})(?::(\d{2}))?(\s*[AP]M)?$/i,
      );
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
        const meridiem = timeMatch[4];

        // Handle 12-hour format
        if (meridiem) {
          const isPM = meridiem.trim().toUpperCase() === 'PM';
          if (hours === 12 && !isPM) {
            hours = 0; // 12 AM is 0 hours
          } else if (hours !== 12 && isPM) {
            hours += 12; // Add 12 for PM times (except 12 PM)
          }
        }

        // Format as YYYY-MM-DD HH:mm AM/PM
        const date = new Date(
          `${dateStr}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        );
        return this.formatDateTime(date);
      }

      // Try parsing as a complete datetime
      const dateTime = new Date(time);
      if (!isNaN(dateTime.getTime())) {
        return this.formatDateTime(dateTime);
      }

      return null;
    } catch {
      return null;
    }
  }

  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const hoursStr = hours.toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hoursStr}:${minutes} ${ampm}`;
  }

  private excelDateToJSDate(excelDate: number): Date {
    // Excel dates start from 1900-01-01 (with a leap year bug for 1900)
    // JavaScript dates start from 1970-01-01
    // Excel date 1 = 1900-01-01
    const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return new Date(excelEpoch.getTime() + excelDate * millisecondsPerDay);
  }
}

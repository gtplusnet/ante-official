import { Injectable } from '@nestjs/common';
import { BiometricParser } from './biometric-parser.interface';
import { ImportTimeFromImageResponse } from '../../../../../shared/response/import-time-from-image.response';
import * as ExcelJS from 'exceljs';
import { DateTime } from 'luxon';

interface _DefaultLogRow {
  'Employee Code': string;
  Date: string;
  Name: string;
  Time: string;
  Type: string;
  Remarks: string;
}

@Injectable()
export class DefaultLogParser implements BiometricParser {
  async parse(
    base64Data: string,
    fileName: string,
    userRemarks?: string,
  ): Promise<ImportTimeFromImageResponse> {
    try {
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');

      // Read Excel file using ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        return {
          status: 'Error',
          remarks: 'No worksheet found in Excel file',
          logs: [],
        };
      }

      // Convert to array format (header: 1 equivalent)
      const jsonData = [];
      worksheet.eachRow((row) => {
        const rowData = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
          rowData.push(cell.value);
        });
        jsonData.push(rowData);
      });

      if (!jsonData || jsonData.length === 0) {
        return {
          status: 'Error',
          remarks: 'No data found in Excel file',
          logs: [],
        };
      }

      // Get headers from first row
      const headers = jsonData[0] as any[];
      const headerMap: { [key: string]: number } = {};

      // Map headers to indices (case-insensitive)
      headers.forEach((value, index) => {
        if (typeof value === 'string') {
          const normalizedHeader = value.toLowerCase().trim();
          if (
            normalizedHeader.includes('employee') &&
            normalizedHeader.includes('code')
          ) {
            headerMap['employeeCode'] = index;
          } else if (normalizedHeader === 'date') {
            headerMap['date'] = index;
          } else if (normalizedHeader === 'name') {
            headerMap['name'] = index;
          } else if (normalizedHeader === 'time') {
            headerMap['time'] = index;
          } else if (normalizedHeader === 'type') {
            headerMap['type'] = index;
          } else if (normalizedHeader === 'remarks') {
            headerMap['remarks'] = index;
          }
        }
      });

      // Validate required headers
      if (
        !('employeeCode' in headerMap) ||
        !('date' in headerMap) ||
        !('time' in headerMap) ||
        !('type' in headerMap)
      ) {
        return {
          status: 'Error',
          remarks:
            'Invalid Excel format. Required columns: Employee Code, Date, Time, Type',
          logs: [],
        };
      }

      // Group logs by employee and date
      const employeeLogs: Map<string, { in?: any; out?: any }[]> = new Map();

      // Process data rows (skip header)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any;

        // Skip empty rows
        if (!row[headerMap.employeeCode]) continue;

        const employeeCode = String(row[headerMap.employeeCode]).trim();
        const dateStr = row[headerMap.date];
        const timeStr = row[headerMap.time];
        const type = String(row[headerMap.type] || '').toLowerCase();
        const remarks = row[headerMap.remarks] || '';

        // Skip if no date or time data
        if (!dateStr || !timeStr) continue;

        // Parse the date and time together
        const parsedDateTime = this.parseDateTime(dateStr, timeStr);
        if (!parsedDateTime) continue;

        // Initialize employee logs if not exists
        if (!employeeLogs.has(employeeCode)) {
          employeeLogs.set(employeeCode, []);
        }

        const logs = employeeLogs.get(employeeCode)!;

        // Find or create log entry for this date
        const dateKey = parsedDateTime.toISODate();
        let dayLog = logs.find((log) => {
          if (log.in) {
            return DateTime.fromISO(log.in.dateTime).toISODate() === dateKey;
          }
          if (log.out) {
            return DateTime.fromISO(log.out.dateTime).toISODate() === dateKey;
          }
          return false;
        });

        if (!dayLog) {
          dayLog = {};
          logs.push(dayLog);
        }

        // Store the log entry
        const logEntry = {
          dateTime: parsedDateTime.toISO(),
          originalTime: timeStr,
          remarks: remarks,
        };

        if (type.includes('in')) {
          dayLog.in = logEntry;
        } else if (type.includes('out')) {
          dayLog.out = logEntry;
        }
      }

      // Convert to final format
      const finalLogs = [];
      for (const [employeeId, logs] of employeeLogs) {
        for (const log of logs) {
          if (log.in && log.out) {
            finalLogs.push({
              employeeId,
              timeIn: log.in.dateTime,
              timeOut: log.out.dateTime,
              remarks:
                log.in.remarks ||
                log.out.remarks ||
                userRemarks ||
                'Imported from Default Log',
            });
          } else if (log.in && !log.out) {
            // Handle missing time out
            finalLogs.push({
              employeeId,
              timeIn: log.in.dateTime,
              timeOut: log.in.dateTime, // Same as time in for now
              remarks: `Missing time out. ${log.in.remarks || userRemarks || 'Imported from Default Log'}`,
            });
          } else if (!log.in && log.out) {
            // Handle missing time in
            finalLogs.push({
              employeeId,
              timeIn: log.out.dateTime, // Same as time out for now
              timeOut: log.out.dateTime,
              remarks: `Missing time in. ${log.out.remarks || userRemarks || 'Imported from Default Log'}`,
            });
          }
        }
      }

      return {
        status: 'Complete',
        remarks: `Successfully parsed ${finalLogs.length} timekeeping logs from ${employeeLogs.size} employees`,
        logs: finalLogs,
      };
    } catch (error) {
      console.error('Error parsing Default Log Excel:', error);
      return {
        status: 'Error',
        remarks: `Failed to parse Excel file: ${error.message}`,
        logs: [],
      };
    }
  }

  private parseDateTime(dateStr: string, timeStr: string): DateTime | null {
    try {
      // Parse date
      const cleanDate = String(dateStr).trim();
      let parsedDate: DateTime | null = null;

      // Try different date formats
      if (cleanDate.includes('-')) {
        // Try YYYY-MM-DD format
        parsedDate = DateTime.fromFormat(cleanDate, 'yyyy-MM-dd');
        if (!parsedDate.isValid) {
          // Try MM-DD-YYYY format
          parsedDate = DateTime.fromFormat(cleanDate, 'MM-dd-yyyy');
        }
      } else if (cleanDate.includes('/')) {
        // Try MM/DD/YYYY format
        parsedDate = DateTime.fromFormat(cleanDate, 'MM/dd/yyyy');
        if (!parsedDate.isValid) {
          // Try M/D/YYYY format
          parsedDate = DateTime.fromFormat(cleanDate, 'M/d/yyyy');
        }
      }

      // Handle Excel serial date number
      if (!parsedDate || !parsedDate.isValid) {
        if (!isNaN(Number(cleanDate))) {
          const excelDate = this.excelDateToJSDate(Number(cleanDate));
          parsedDate = DateTime.fromJSDate(excelDate);
        }
      }

      if (!parsedDate || !parsedDate.isValid) {
        console.error('Failed to parse date:', dateStr);
        return null;
      }

      // Parse time
      const cleanTime = String(timeStr).trim();
      let hour = 0,
        minute = 0;

      // Try parsing with meridiem (12-hour format)
      const timeParsed = DateTime.fromFormat(cleanTime, 'h:mm a');
      if (timeParsed.isValid) {
        hour = timeParsed.hour;
        minute = timeParsed.minute;
      } else {
        // Try 24-hour format
        const timeParsed24 = DateTime.fromFormat(cleanTime, 'HH:mm');
        if (timeParsed24.isValid) {
          hour = timeParsed24.hour;
          minute = timeParsed24.minute;
        } else {
          // Try variations
          const timeParsedVar = DateTime.fromFormat(cleanTime, 'h:mma');
          if (timeParsedVar.isValid) {
            hour = timeParsedVar.hour;
            minute = timeParsedVar.minute;
          } else {
            console.error('Failed to parse time:', timeStr);
            return null;
          }
        }
      }

      // Combine date and time
      return parsedDate.set({
        hour,
        minute,
        second: 0,
        millisecond: 0,
      });
    } catch (error) {
      console.error('Error parsing date/time:', dateStr, timeStr, error);
      return null;
    }
  }

  private excelDateToJSDate(excelDate: number): Date {
    // Excel dates start from 1900-01-01
    // But Excel incorrectly treats 1900 as a leap year, so we need to adjust
    const baseDate = new Date(1899, 11, 30); // December 30, 1899
    return new Date(baseDate.getTime() + excelDate * 24 * 60 * 60 * 1000);
  }

  async validateFormat(base64Data: string): Promise<boolean> {
    try {
      const buffer = Buffer.from(base64Data, 'base64');

      // Use dynamic import to access Excel service
      const { ExcelImportService } = await import('@common/services/excel');
      const importService = new ExcelImportService();

      const parsedData = await importService.importFromBuffer(buffer, {
        sheetIndex: 0,
        headerRow: 1,
        dataStartRow: 2,
        maxRows: 1, // We only need headers for validation
      });

      const firstRow = parsedData.headers.map((h) => h.toLowerCase());

      // Check for required columns
      const hasEmployeeCode = firstRow.some(
        (header) => header.includes('employee') && header.includes('code'),
      );
      const hasDate = firstRow.some((header) => header === 'date');
      const hasTime = firstRow.some((header) => header === 'time');
      const hasType = firstRow.some((header) => header === 'type');

      return hasEmployeeCode && hasDate && hasTime && hasType;
    } catch (error) {
      return false;
    }
  }

  getSupportedExtensions(): string[] {
    return ['.xlsx', '.xls'];
  }
}

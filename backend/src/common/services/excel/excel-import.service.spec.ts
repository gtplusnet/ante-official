import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ExcelImportService } from './excel-import.service';
import {
  ExcelImportOptions,
  ExcelParsedData,
  ExcelMetadata,
} from './interfaces/excel.interface';

describe('ExcelImportService', () => {
  let service: ExcelImportService;
  let mockWorkbook: jest.Mocked<ExcelJS.Workbook>;
  let mockWorksheet: jest.Mocked<ExcelJS.Worksheet>;
  let mockRow: jest.Mocked<ExcelJS.Row>;
  let mockCell: jest.Mocked<ExcelJS.Cell>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelImportService],
    }).compile();

    service = module.get<ExcelImportService>(ExcelImportService);

    // Create mock objects
    mockCell = {
      value: 'test value',
      type: ExcelJS.ValueType.String,
      numFmt: undefined,
      result: undefined,
    } as jest.Mocked<ExcelJS.Cell>;

    mockRow = {
      eachCell: jest.fn(),
    } as unknown as jest.Mocked<ExcelJS.Row>;

    mockWorksheet = {
      name: 'Test Sheet',
      rowCount: 10,
      columnCount: 5,
      getRow: jest.fn().mockReturnValue(mockRow),
      eachRow: jest.fn(),
    } as unknown as jest.Mocked<ExcelJS.Worksheet>;

    mockWorkbook = {
      xlsx: {
        load: jest.fn(),
        readFile: jest.fn(),
      },
      worksheets: [mockWorksheet],
      getWorksheet: jest.fn().mockReturnValue(mockWorksheet),
      created: new Date('2023-01-01'),
      modified: new Date('2023-01-02'),
      creator: 'Test User',
    } as unknown as jest.Mocked<ExcelJS.Workbook>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parseExcelDate', () => {
    it('should return null for null/undefined values', () => {
      expect(service.parseExcelDate(null)).toBeNull();
      expect(service.parseExcelDate(undefined)).toBeNull();
    });

    it('should return the same Date object if already a Date', () => {
      const date = new Date('2023-01-01');
      expect(service.parseExcelDate(date)).toBe(date);
    });

    it('should parse Excel serial date number correctly', () => {
      // Excel serial date 44927 = 2023-01-01
      const result = service.parseExcelDate(44927);
      expect(result).toBeInstanceOf(Date);
    });

    it('should parse valid date string', () => {
      const result = service.parseExcelDate('2023-01-01');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2023);
    });

    it('should return null for invalid date string', () => {
      expect(service.parseExcelDate('invalid-date')).toBeNull();
    });
  });

  describe('extractBase64Data', () => {
    it('should extract base64 data from data URL', () => {
      const dataUrl = 'data:application/vnd.ms-excel;base64,SGVsbG8gV29ybGQ=';
      const result = (service as any).extractBase64Data(dataUrl);
      expect(result).toBe('SGVsbG8gV29ybGQ=');
    });

    it('should return the same string if no data URL prefix', () => {
      const base64 = 'SGVsbG8gV29ybGQ=';
      const result = (service as any).extractBase64Data(base64);
      expect(result).toBe(base64);
    });
  });

  describe('isRowEmpty', () => {
    it('should return true for empty row', () => {
      mockRow.eachCell.mockImplementation((_options, _callback) => {
        // No cells to iterate over (empty row)
      });

      const result = (service as any).isRowEmpty(mockRow);
      expect(result).toBe(true);
    });

    it('should return false for row with values', () => {
      mockRow.eachCell.mockImplementation((options, callback) => {
        callback(mockCell, 1);
      });

      const result = (service as any).isRowEmpty(mockRow);
      expect(result).toBe(false);
    });

    it('should return true for row with only null/undefined/empty values', () => {
      const emptyCells = [{ value: null }, { value: undefined }, { value: '' }];

      mockRow.eachCell.mockImplementation((options, callback) => {
        emptyCells.forEach((cell, index) => {
          callback(cell as ExcelJS.Cell, index + 1);
        });
      });

      const result = (service as any).isRowEmpty(mockRow);
      expect(result).toBe(true);
    });
  });

  describe('isExcelDate', () => {
    it('should return false for cell without number format', () => {
      mockCell.numFmt = undefined;
      const result = (service as any).isExcelDate(mockCell);
      expect(result).toBe(false);
    });

    it('should return true for common date formats', () => {
      const dateFormats = [
        'mm/dd/yyyy',
        'dd/mm/yyyy',
        'yyyy-mm-dd',
        'm/d/yy',
        'd-mmm-yy',
      ];

      dateFormats.forEach((format) => {
        mockCell.numFmt = format;
        const result = (service as any).isExcelDate(mockCell);
        expect(result).toBe(true);
      });
    });

    it('should return false for non-date formats', () => {
      mockCell.numFmt = '#,##0.00';
      const result = (service as any).isExcelDate(mockCell);
      expect(result).toBe(false);
    });
  });

  describe('countEmptyRows', () => {
    it('should count empty rows correctly', () => {
      const rows = [mockRow, mockRow, mockRow];

      mockWorksheet.eachRow.mockImplementation(
        (optionsOrCallback, callback) => {
          const actualCallback =
            typeof optionsOrCallback === 'function'
              ? optionsOrCallback
              : callback;
          rows.forEach((row) => actualCallback(row, 1));
        },
      );

      // Mock isRowEmpty to return true for first two rows, false for third
      jest
        .spyOn(service as any, 'isRowEmpty')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const result = (service as any).countEmptyRows(mockWorksheet);
      expect(result).toBe(2);
    });
  });

  describe('getWorksheet', () => {
    const options: ExcelImportOptions = {};

    it('should get worksheet by name if provided', () => {
      options.sheetName = 'Test Sheet';
      const result = (service as any).getWorksheet(mockWorkbook, options);

      expect(mockWorkbook.getWorksheet).toHaveBeenCalledWith('Test Sheet');
      expect(result).toBe(mockWorksheet);
    });

    it('should get worksheet by index if name not provided', () => {
      options.sheetName = undefined;
      options.sheetIndex = 0;

      const result = (service as any).getWorksheet(mockWorkbook, options);
      expect(result).toBe(mockWorksheet);
    });

    it('should default to first worksheet if no options provided', () => {
      const result = (service as any).getWorksheet(mockWorkbook, {});
      expect(result).toBe(mockWorksheet);
    });
  });

  describe('extractHeaders', () => {
    it('should extract headers from specified row', () => {
      const options: ExcelImportOptions = { headerRow: 1, trimValues: true };

      mockRow.eachCell.mockImplementation((optionsOrCallback, callback) => {
        const actualCallback =
          typeof optionsOrCallback === 'function'
            ? optionsOrCallback
            : callback;
        actualCallback({ value: '  Header1  ' } as ExcelJS.Cell, 1);
        actualCallback({ value: 'Header2' } as ExcelJS.Cell, 2);
        actualCallback({ value: null } as ExcelJS.Cell, 3);
      });

      const result = (service as any).extractHeaders(mockWorksheet, options);

      expect(result).toEqual(['Header1', 'Header2', 'Column3']);
      expect(mockWorksheet.getRow).toHaveBeenCalledWith(1);
    });

    it('should not trim values when trimValues is false', () => {
      const options: ExcelImportOptions = { headerRow: 1, trimValues: false };

      mockRow.eachCell.mockImplementation((optionsOrCallback, callback) => {
        const actualCallback =
          typeof optionsOrCallback === 'function'
            ? optionsOrCallback
            : callback;
        actualCallback({ value: '  Header1  ' } as ExcelJS.Cell, 1);
      });

      const result = (service as any).extractHeaders(mockWorksheet, options);
      expect(result).toEqual(['  Header1  ']);
    });
  });

  describe('loadWorkbook', () => {
    it('should load workbook from buffer', async () => {
      const buffer = Buffer.from('test');

      // Mock ExcelJS.Workbook constructor and xlsx.load
      jest.spyOn(ExcelJS, 'Workbook').mockImplementation(() => mockWorkbook);

      const result = await (service as any).loadWorkbook(buffer);

      expect(mockWorkbook.xlsx.load).toHaveBeenCalledWith(buffer);
      expect(result).toBe(mockWorkbook);
    });
  });

  describe('handleImportError', () => {
    it('should throw BadRequestException for BadRequestException input', () => {
      const badRequestError = new BadRequestException('Bad request');

      expect(() => {
        (service as any).handleImportError(badRequestError);
      }).toThrow(BadRequestException);
    });

    it('should create ExcelError and throw BadRequestException for other errors', () => {
      const genericError = new Error('Generic error');

      expect(() => {
        (service as any).handleImportError(genericError);
      }).toThrow(BadRequestException);
    });
  });

  describe('importFromBase64', () => {
    it('should import from base64 data', async () => {
      const base64Data = 'data:application/vnd.ms-excel;base64,SGVsbG8=';
      const options: ExcelImportOptions = {};

      // Mock the importFromBuffer method
      const expectedResult: ExcelParsedData = {
        headers: ['Header1'],
        rows: [{ Header1: 'Value1' }],
        rawData: [['Header1'], ['Value1']],
        metadata: {
          sheetName: 'Test Sheet',
          totalRows: 2,
          totalColumns: 1,
          emptyRows: 0,
        },
      };

      jest.spyOn(service, 'importFromBuffer').mockResolvedValue(expectedResult);

      const result = await service.importFromBase64(base64Data, options);

      expect(service.importFromBuffer).toHaveBeenCalledWith(
        Buffer.from('SGVsbG8=', 'base64'),
        options,
      );
      expect(result).toBe(expectedResult);
    });
  });

  describe('convertToCSV', () => {
    it('should convert Excel data to CSV format', async () => {
      const buffer = Buffer.from('test');
      const mockParsedData: ExcelParsedData = {
        headers: ['Name', 'Age', 'City'],
        rows: [
          { Name: 'John', Age: 30, City: 'New York' },
          { Name: 'Jane', Age: 25, City: 'Los Angeles' },
        ],
        rawData: [],
      };

      jest.spyOn(service, 'importFromBuffer').mockResolvedValue(mockParsedData);

      const result = await service.convertToCSV(buffer);

      const expectedCSV =
        'Name,Age,City\nJohn,30,New York\nJane,25,Los Angeles';
      expect(result).toBe(expectedCSV);
    });

    it('should handle values with commas and quotes in CSV', async () => {
      const buffer = Buffer.from('test');
      const mockParsedData: ExcelParsedData = {
        headers: ['Description'],
        rows: [
          { Description: 'Text with, comma' },
          { Description: 'Text with "quotes"' },
        ],
        rawData: [],
      };

      jest.spyOn(service, 'importFromBuffer').mockResolvedValue(mockParsedData);

      const result = await service.convertToCSV(buffer);

      const expectedCSV =
        'Description\n"Text with, comma"\n"Text with ""quotes"""';
      expect(result).toBe(expectedCSV);
    });
  });

  describe('getMetadata', () => {
    it('should return Excel file metadata', async () => {
      const buffer = Buffer.from('test');

      jest
        .spyOn(service as any, 'loadWorkbook')
        .mockResolvedValue(mockWorkbook);
      jest.spyOn(service as any, 'countEmptyRows').mockReturnValue(2);

      const result = await service.getMetadata(buffer);

      const expectedMetadata: ExcelMetadata = {
        sheetName: 'Test Sheet',
        totalRows: 10,
        totalColumns: 5,
        emptyRows: 2,
        createdDate: new Date('2023-01-01'),
        modifiedDate: new Date('2023-01-02'),
        author: 'Test User',
      };

      expect(result).toEqual(expectedMetadata);
    });

    it('should throw BadRequestException if no worksheet found', async () => {
      const buffer = Buffer.from('test');

      mockWorkbook.worksheets = [];
      jest
        .spyOn(service as any, 'loadWorkbook')
        .mockResolvedValue(mockWorkbook);

      await expect(service.getMetadata(buffer)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('importFromBuffer', () => {
    it('should import Excel data from buffer successfully', async () => {
      const buffer = Buffer.from('test');
      const options: ExcelImportOptions = {};

      jest
        .spyOn(service as any, 'loadWorkbook')
        .mockResolvedValue(mockWorkbook);
      jest.spyOn(service as any, 'getWorksheet').mockReturnValue(mockWorksheet);
      jest.spyOn(service as any, 'parseWorksheet').mockReturnValue({
        headers: ['Name'],
        rows: [{ Name: 'John' }],
        rawData: [['Name'], ['John']],
        metadata: { sheetName: 'Test', totalRows: 2, totalColumns: 1 },
      });

      const result = await service.importFromBuffer(buffer, options);

      expect(result.headers).toEqual(['Name']);
      expect(result.rows).toEqual([{ Name: 'John' }]);
    });

    it('should throw BadRequestException if no worksheet found', async () => {
      const buffer = Buffer.from('test');

      jest
        .spyOn(service as any, 'loadWorkbook')
        .mockResolvedValue(mockWorkbook);
      jest.spyOn(service as any, 'getWorksheet').mockReturnValue(undefined);

      await expect(service.importFromBuffer(buffer)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle errors and throw BadRequestException', async () => {
      const buffer = Buffer.from('test');

      jest
        .spyOn(service as any, 'loadWorkbook')
        .mockRejectedValue(new Error('Load error'));

      await expect(service.importFromBuffer(buffer)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('importFromFile', () => {
    it('should import Excel data from file path', async () => {
      const filePath = '/path/to/file.xlsx';
      const options: ExcelImportOptions = {};

      jest.spyOn(ExcelJS, 'Workbook').mockImplementation(() => mockWorkbook);
      jest.spyOn(service as any, 'getWorksheet').mockReturnValue(mockWorksheet);
      jest.spyOn(service as any, 'parseWorksheet').mockReturnValue({
        headers: ['Name'],
        rows: [{ Name: 'John' }],
        rawData: [['Name'], ['John']],
        metadata: { sheetName: 'Test', totalRows: 2, totalColumns: 1 },
      });

      const result = await service.importFromFile(filePath, options);

      expect(mockWorkbook.xlsx.readFile).toHaveBeenCalledWith(filePath);
      expect(result.headers).toEqual(['Name']);
    });

    it('should throw BadRequestException if no worksheet found in file', async () => {
      const filePath = '/path/to/file.xlsx';

      jest.spyOn(ExcelJS, 'Workbook').mockImplementation(() => mockWorkbook);
      jest.spyOn(service as any, 'getWorksheet').mockReturnValue(undefined);

      await expect(service.importFromFile(filePath)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('importMultipleSheets', () => {
    it('should import data from multiple sheets', async () => {
      const buffer = Buffer.from('test');
      const sheet1 = { ...mockWorksheet, name: 'Sheet1' };
      const sheet2 = { ...mockWorksheet, name: 'Sheet2' };

      mockWorkbook.worksheets = [sheet1, sheet2];

      jest
        .spyOn(service as any, 'loadWorkbook')
        .mockResolvedValue(mockWorkbook);
      jest
        .spyOn(service as any, 'parseWorksheet')
        .mockReturnValueOnce({
          headers: ['Col1'],
          rows: [{ Col1: 'Data1' }],
          rawData: [],
          metadata: { sheetName: 'Sheet1', totalRows: 1, totalColumns: 1 },
        })
        .mockReturnValueOnce({
          headers: ['Col2'],
          rows: [{ Col2: 'Data2' }],
          rawData: [],
          metadata: { sheetName: 'Sheet2', totalRows: 1, totalColumns: 1 },
        });

      const result = await service.importMultipleSheets(buffer);

      expect(result.size).toBe(2);
      expect(result.get('Sheet1')?.rows).toEqual([{ Col1: 'Data1' }]);
      expect(result.get('Sheet2')?.rows).toEqual([{ Col2: 'Data2' }]);
    });
  });
});

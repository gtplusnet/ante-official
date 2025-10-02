import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ExcelService } from './excel.service';
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

describe('ExcelService', () => {
  let service: ExcelService;
  let importService: ExcelImportService;
  let exportService: ExcelExportService;
  let validationService: ExcelValidationService;
  let transformService: ExcelTransformService;

  const mockImportService = {
    importFromBuffer: jest.fn(),
    importFromBase64: jest.fn(),
    streamRows: jest.fn(),
    parseExcelDate: jest.fn(),
    convertToCSV: jest.fn(),
    getMetadata: jest.fn(),
  };

  const mockExportService = {
    exportToBuffer: jest.fn(),
    exportMultipleSheetsToBuffer: jest.fn(),
    createTemplate: jest.fn(),
  };

  const mockValidationService = {
    validate: jest.fn(),
    createRulesFromColumns: jest.fn(),
    generateValidationReport: jest.fn(),
  };

  const mockTransformService = {
    transform: jest.fn(),
    createAutoMapping: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExcelService,
        {
          provide: ExcelImportService,
          useValue: mockImportService,
        },
        {
          provide: ExcelExportService,
          useValue: mockExportService,
        },
        {
          provide: ExcelValidationService,
          useValue: mockValidationService,
        },
        {
          provide: ExcelTransformService,
          useValue: mockTransformService,
        },
      ],
    }).compile();

    service = module.get<ExcelService>(ExcelService);
    importService = module.get<ExcelImportService>(ExcelImportService);
    exportService = module.get<ExcelExportService>(ExcelExportService);
    validationService = module.get<ExcelValidationService>(
      ExcelValidationService,
    );
    transformService = module.get<ExcelTransformService>(ExcelTransformService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have all required services injected', () => {
    expect(service).toBeDefined();
    expect(service['importService']).toBe(importService);
    expect(service['exportService']).toBe(exportService);
    expect(service['validationService']).toBe(validationService);
    expect(service['transformService']).toBe(transformService);
  });

  describe('importFromFile', () => {
    const mockFile: MulterFile = {
      fieldname: 'file',
      originalname: 'test.xlsx',
      encoding: '7bit',
      mimetype:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('mock excel data'),
      size: 1024,
      destination: '',
      filename: '',
      path: '',
      stream: null,
    };

    it('should import file successfully without options', async () => {
      const mockParsedData: ExcelParsedData = {
        headers: ['Name', 'Email'],
        rows: [{ Name: 'John', Email: 'john@example.com' }],
        metadata: { totalRows: 1, totalColumns: 2 },
      };

      mockImportService.importFromBuffer.mockResolvedValue(mockParsedData);

      const result = await service.importFromFile(mockFile);

      expect(mockImportService.importFromBuffer).toHaveBeenCalledWith(
        mockFile.buffer,
        undefined,
      );
      expect(result).toEqual({
        data: mockParsedData.rows,
        validation: undefined,
        metadata: mockParsedData.metadata,
      });
    });

    it('should import file with validation rules', async () => {
      const mockParsedData: ExcelParsedData = {
        headers: ['Name', 'Email'],
        rows: [
          { Name: 'John', Email: 'john@example.com' },
          { Name: 'Jane', Email: 'invalid-email' },
        ],
        metadata: { totalRows: 2, totalColumns: 2 },
      };

      const mockValidationResult: ExcelValidationResult = {
        isValid: false,
        errors: [
          {
            row: 2,
            column: 'Email',
            value: 'invalid-email',
            message: 'Invalid email format',
            type: 'email',
          },
        ],
        validRows: [{ Name: 'John', Email: 'john@example.com' }],
        invalidRows: [
          {
            rowNumber: 2,
            data: { Name: 'Jane', Email: 'invalid-email' },
            errors: [
              {
                row: 2,
                column: 'Email',
                value: 'invalid-email',
                message: 'Invalid email format',
                type: 'email',
              },
            ],
          },
        ],
      };

      const validationRules: ExcelValidationRule[] = [
        { field: 'Name', type: 'required' },
        { field: 'Email', type: 'email' },
      ];

      mockImportService.importFromBuffer.mockResolvedValue(mockParsedData);
      mockValidationService.validate.mockResolvedValue(mockValidationResult);

      const result = await service.importFromFile(mockFile, {
        validationRules,
      });

      expect(mockValidationService.validate).toHaveBeenCalledWith(
        mockParsedData.rows,
        validationRules,
      );
      expect(result.data).toEqual(mockValidationResult.validRows);
      expect(result.validation).toEqual(mockValidationResult);
    });

    it('should import file with transform options', async () => {
      const mockParsedData: ExcelParsedData = {
        headers: ['Full Name', 'Email Address'],
        rows: [
          { 'Full Name': 'John Doe', 'Email Address': 'john@example.com' },
        ],
        metadata: { totalRows: 1, totalColumns: 2 },
      };

      const transformOptions: ExcelTransformOptions = {
        mappings: [
          { sourceColumn: 'Full Name', targetField: 'name' },
          { sourceColumn: 'Email Address', targetField: 'email' },
        ],
      };

      const transformedData = [{ name: 'John Doe', email: 'john@example.com' }];

      mockImportService.importFromBuffer.mockResolvedValue(mockParsedData);
      mockTransformService.transform.mockReturnValue(transformedData);

      const result = await service.importFromFile(mockFile, {
        transformOptions,
      });

      expect(mockTransformService.transform).toHaveBeenCalledWith(
        mockParsedData.rows,
        transformOptions,
      );
      expect(result.data).toEqual(transformedData);
    });

    it('should import file with both transform and validation options', async () => {
      const mockParsedData: ExcelParsedData = {
        headers: ['Full Name', 'Email Address'],
        rows: [
          { 'Full Name': 'John Doe', 'Email Address': 'john@example.com' },
        ],
        metadata: { totalRows: 1, totalColumns: 2 },
      };

      const transformOptions: ExcelTransformOptions = {
        mappings: [
          { sourceColumn: 'Full Name', targetField: 'name' },
          { sourceColumn: 'Email Address', targetField: 'email' },
        ],
      };

      const transformedData = [{ name: 'John Doe', email: 'john@example.com' }];

      const validationRules: ExcelValidationRule[] = [
        { field: 'name', type: 'required' },
        { field: 'email', type: 'email' },
      ];

      const mockValidationResult: ExcelValidationResult = {
        isValid: true,
        errors: [],
        validRows: transformedData,
        invalidRows: [],
      };

      mockImportService.importFromBuffer.mockResolvedValue(mockParsedData);
      mockTransformService.transform.mockReturnValue(transformedData);
      mockValidationService.validate.mockResolvedValue(mockValidationResult);

      const result = await service.importFromFile(mockFile, {
        transformOptions,
        validationRules,
      });

      expect(mockTransformService.transform).toHaveBeenCalledWith(
        mockParsedData.rows,
        transformOptions,
      );
      expect(mockValidationService.validate).toHaveBeenCalledWith(
        transformedData,
        validationRules,
      );
      expect(result.data).toEqual(mockValidationResult.validRows);
      expect(result.validation).toEqual(mockValidationResult);
    });

    it('should throw BadRequestException when file is null', async () => {
      await expect(service.importFromFile(null)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.importFromFile(null)).rejects.toThrow(
        'No file provided',
      );
    });

    it('should throw BadRequestException when file has no buffer', async () => {
      const fileWithoutBuffer = { ...mockFile, buffer: undefined };

      await expect(service.importFromFile(fileWithoutBuffer)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.importFromFile(fileWithoutBuffer)).rejects.toThrow(
        'No file provided',
      );
    });
  });

  describe('importFromBuffer', () => {
    it('should import from buffer successfully', async () => {
      const buffer = Buffer.from('mock excel data');
      const options: ExcelImportOptions = { sheetIndex: 0 };
      const mockParsedData: ExcelParsedData = {
        headers: ['Name'],
        rows: [{ Name: 'John' }],
        metadata: { totalRows: 1, totalColumns: 1 },
      };

      mockImportService.importFromBuffer.mockResolvedValue(mockParsedData);

      const result = await service.importFromBuffer(buffer, options);

      expect(mockImportService.importFromBuffer).toHaveBeenCalledWith(
        buffer,
        options,
      );
      expect(result).toEqual(mockParsedData);
    });

    it('should import from buffer without options', async () => {
      const buffer = Buffer.from('mock excel data');
      const mockParsedData: ExcelParsedData = {
        headers: ['Name'],
        rows: [{ Name: 'John' }],
        metadata: { totalRows: 1, totalColumns: 1 },
      };

      mockImportService.importFromBuffer.mockResolvedValue(mockParsedData);

      const result = await service.importFromBuffer(buffer);

      expect(mockImportService.importFromBuffer).toHaveBeenCalledWith(
        buffer,
        undefined,
      );
      expect(result).toEqual(mockParsedData);
    });
  });

  describe('importFromBase64', () => {
    it('should import from base64 successfully', async () => {
      const base64Data = 'base64encodedexceldata';
      const options: ExcelImportOptions = { headerRow: 1 };
      const mockParsedData: ExcelParsedData = {
        headers: ['Name'],
        rows: [{ Name: 'Jane' }],
        metadata: { totalRows: 1, totalColumns: 1 },
      };

      mockImportService.importFromBase64.mockResolvedValue(mockParsedData);

      const result = await service.importFromBase64(base64Data, options);

      expect(mockImportService.importFromBase64).toHaveBeenCalledWith(
        base64Data,
        options,
      );
      expect(result).toEqual(mockParsedData);
    });
  });

  describe('streamRows', () => {
    it('should stream rows from buffer', async () => {
      const buffer = Buffer.from('mock excel data');
      const options: ExcelImportOptions = { maxRows: 100 };
      const mockRows = [{ Name: 'John' }, { Name: 'Jane' }];

      // Mock the async generator
      async function* mockGenerator() {
        for (const row of mockRows) {
          yield row;
        }
      }

      mockImportService.streamRows.mockReturnValue(mockGenerator());

      const generator = service.streamRows(buffer, options);
      const results = [];

      for await (const row of generator) {
        results.push(row);
      }

      expect(mockImportService.streamRows).toHaveBeenCalledWith(
        buffer,
        options,
      );
      expect(results).toEqual(mockRows);
    });
  });

  describe('exportToBuffer', () => {
    it('should export data to buffer', async () => {
      const columns: ExcelColumn[] = [
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
      ];
      const data = [{ name: 'John', email: 'john@example.com' }];
      const sheetName = 'Users';
      const options: Partial<ExcelSheetConfig> = { headerStyle: {} };
      const mockBuffer = Buffer.from('exported excel data');

      mockExportService.exportToBuffer.mockResolvedValue(mockBuffer);

      const result = await service.exportToBuffer(
        columns,
        data,
        sheetName,
        options,
      );

      expect(mockExportService.exportToBuffer).toHaveBeenCalledWith(
        columns,
        data,
        sheetName,
        options,
      );
      expect(result).toEqual(mockBuffer);
    });

    it('should export data to buffer with minimal parameters', async () => {
      const columns: ExcelColumn[] = [
        { header: 'Name', key: 'name', width: 20 },
      ];
      const data = [{ name: 'John' }];
      const mockBuffer = Buffer.from('exported excel data');

      mockExportService.exportToBuffer.mockResolvedValue(mockBuffer);

      const result = await service.exportToBuffer(columns, data);

      expect(mockExportService.exportToBuffer).toHaveBeenCalledWith(
        columns,
        data,
        undefined,
        undefined,
      );
      expect(result).toEqual(mockBuffer);
    });
  });

  describe('exportMultipleSheetsToBuffer', () => {
    it('should export multiple sheets to buffer', async () => {
      const options: ExcelExportOptions = {
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ header: 'Name', key: 'name', width: 20 }],
            data: [{ name: 'John' }],
          },
          {
            name: 'Sheet2',
            columns: [{ header: 'Email', key: 'email', width: 25 }],
            data: [{ email: 'john@example.com' }],
          },
        ],
        filename: 'export.xlsx',
      };
      const mockBuffer = Buffer.from('exported multiple sheets');

      mockExportService.exportMultipleSheetsToBuffer.mockResolvedValue(
        mockBuffer,
      );

      const result = await service.exportMultipleSheetsToBuffer(options);

      expect(
        mockExportService.exportMultipleSheetsToBuffer,
      ).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockBuffer);
    });
  });

  describe('createTemplate', () => {
    it('should create template buffer', async () => {
      const columns: ExcelColumn[] = [
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
      ];
      const options = { includeValidation: true };
      const mockBuffer = Buffer.from('template excel data');

      mockExportService.createTemplate.mockResolvedValue(mockBuffer);

      const result = await service.createTemplate(columns, options);

      expect(mockExportService.createTemplate).toHaveBeenCalledWith(
        columns,
        options,
      );
      expect(result).toEqual(mockBuffer);
    });

    it('should create template buffer without options', async () => {
      const columns: ExcelColumn[] = [
        { header: 'Name', key: 'name', width: 20 },
      ];
      const mockBuffer = Buffer.from('template excel data');

      mockExportService.createTemplate.mockResolvedValue(mockBuffer);

      const result = await service.createTemplate(columns);

      expect(mockExportService.createTemplate).toHaveBeenCalledWith(
        columns,
        undefined,
      );
      expect(result).toEqual(mockBuffer);
    });
  });

  describe('validateData', () => {
    it('should validate data successfully', async () => {
      const data = [
        { name: 'John', email: 'john@example.com' },
        { name: 'Jane', email: 'invalid-email' },
      ];
      const rules: ExcelValidationRule[] = [
        { field: 'name', type: 'required' },
        { field: 'email', type: 'email' },
      ];
      const mockValidationResult: ExcelValidationResult = {
        isValid: false,
        errors: [
          {
            row: 2,
            column: 'email',
            value: 'invalid-email',
            message: 'Invalid email format',
            type: 'email',
          },
        ],
        validRows: [{ name: 'John', email: 'john@example.com' }],
        invalidRows: [
          {
            rowNumber: 2,
            data: { name: 'Jane', email: 'invalid-email' },
            errors: [
              {
                row: 2,
                column: 'email',
                value: 'invalid-email',
                message: 'Invalid email format',
                type: 'email',
              },
            ],
          },
        ],
      };

      mockValidationService.validate.mockResolvedValue(mockValidationResult);

      const result = await service.validateData(data, rules);

      expect(mockValidationService.validate).toHaveBeenCalledWith(data, rules);
      expect(result).toEqual(mockValidationResult);
    });
  });

  describe('createValidationRules', () => {
    it('should create validation rules from columns', () => {
      const columns = [
        { key: 'name', required: true },
        { key: 'email', type: 'email' },
      ];
      const mockRules: ExcelValidationRule[] = [
        { field: 'name', type: 'required' },
        { field: 'email', type: 'email' },
      ];

      mockValidationService.createRulesFromColumns.mockReturnValue(mockRules);

      const result = service.createValidationRules(columns);

      expect(mockValidationService.createRulesFromColumns).toHaveBeenCalledWith(
        columns,
      );
      expect(result).toEqual(mockRules);
    });
  });

  describe('generateValidationReport', () => {
    it('should generate validation report', () => {
      const validationResult: ExcelValidationResult = {
        isValid: false,
        errors: [
          {
            row: 2,
            column: 'email',
            value: 'invalid-email',
            message: 'Invalid email format',
            type: 'email',
          },
        ],
        validRows: [],
        invalidRows: [],
      };
      const mockReport = 'Validation Report: 1 error found';

      mockValidationService.generateValidationReport.mockReturnValue(
        mockReport,
      );

      const result = service.generateValidationReport(validationResult);

      expect(
        mockValidationService.generateValidationReport,
      ).toHaveBeenCalledWith(validationResult);
      expect(result).toEqual(mockReport);
    });
  });

  describe('transformData', () => {
    it('should transform data successfully', () => {
      const data = [
        { 'Full Name': 'John Doe', 'Email Address': 'john@example.com' },
      ];
      const options: ExcelTransformOptions = {
        mappings: [
          { sourceColumn: 'Full Name', targetField: 'name' },
          { sourceColumn: 'Email Address', targetField: 'email' },
        ],
      };
      const transformedData = [{ name: 'John Doe', email: 'john@example.com' }];

      mockTransformService.transform.mockReturnValue(transformedData);

      const result = service.transformData(data, options);

      expect(mockTransformService.transform).toHaveBeenCalledWith(
        data,
        options,
      );
      expect(result).toEqual(transformedData);
    });
  });

  describe('createAutoMapping', () => {
    it('should create auto mapping', () => {
      const sourceColumns = ['Full Name', 'Email Address'];
      const targetFields = ['name', 'email'];
      const mockMapping = [
        { sourceColumn: 'Full Name', targetField: 'name' },
        { sourceColumn: 'Email Address', targetField: 'email' },
      ];

      mockTransformService.createAutoMapping.mockReturnValue(mockMapping);

      const result = service.createAutoMapping(sourceColumns, targetFields);

      expect(mockTransformService.createAutoMapping).toHaveBeenCalledWith(
        sourceColumns,
        targetFields,
      );
      expect(result).toEqual(mockMapping);
    });

    it('should create auto mapping without target fields', () => {
      const sourceColumns = ['name', 'email'];
      const mockMapping = [
        { sourceColumn: 'name', targetField: 'name' },
        { sourceColumn: 'email', targetField: 'email' },
      ];

      mockTransformService.createAutoMapping.mockReturnValue(mockMapping);

      const result = service.createAutoMapping(sourceColumns);

      expect(mockTransformService.createAutoMapping).toHaveBeenCalledWith(
        sourceColumns,
        undefined,
      );
      expect(result).toEqual(mockMapping);
    });
  });

  describe('parseExcelDate', () => {
    it('should parse Excel date', () => {
      const value = '2023-01-01';
      const mockDate = new Date('2023-01-01');

      mockImportService.parseExcelDate.mockReturnValue(mockDate);

      const result = service.parseExcelDate(value);

      expect(mockImportService.parseExcelDate).toHaveBeenCalledWith(value);
      expect(result).toEqual(mockDate);
    });

    it('should return null for invalid date', () => {
      const value = 'invalid-date';

      mockImportService.parseExcelDate.mockReturnValue(null);

      const result = service.parseExcelDate(value);

      expect(mockImportService.parseExcelDate).toHaveBeenCalledWith(value);
      expect(result).toBeNull();
    });
  });

  describe('convertToCSV', () => {
    it('should convert Excel to CSV', async () => {
      const buffer = Buffer.from('excel data');
      const options: ExcelImportOptions = { sheetIndex: 0 };
      const mockCSV = 'name,email\nJohn,john@example.com';

      mockImportService.convertToCSV.mockResolvedValue(mockCSV);

      const result = await service.convertToCSV(buffer, options);

      expect(mockImportService.convertToCSV).toHaveBeenCalledWith(
        buffer,
        options,
      );
      expect(result).toEqual(mockCSV);
    });

    it('should convert Excel to CSV without options', async () => {
      const buffer = Buffer.from('excel data');
      const mockCSV = 'name,email\nJohn,john@example.com';

      mockImportService.convertToCSV.mockResolvedValue(mockCSV);

      const result = await service.convertToCSV(buffer);

      expect(mockImportService.convertToCSV).toHaveBeenCalledWith(
        buffer,
        undefined,
      );
      expect(result).toEqual(mockCSV);
    });
  });

  describe('getMetadata', () => {
    it('should get Excel metadata', async () => {
      const buffer = Buffer.from('excel data');
      const mockMetadata = {
        sheetName: 'Sheet1',
        totalRows: 10,
        totalColumns: 3,
        author: 'John Doe',
      };

      mockImportService.getMetadata.mockResolvedValue(mockMetadata);

      const result = await service.getMetadata(buffer);

      expect(mockImportService.getMetadata).toHaveBeenCalledWith(buffer);
      expect(result).toEqual(mockMetadata);
    });
  });

  describe('static helper methods', () => {
    it('should create employee import columns', () => {
      const columns = ExcelService.createEmployeeImportColumns();

      expect(Array.isArray(columns)).toBe(true);
      expect(columns.length).toBeGreaterThan(0);
      expect(columns[0]).toHaveProperty('header');
      expect(columns[0]).toHaveProperty('key');
      expect(columns[0]).toHaveProperty('width');

      // Check a few specific columns
      expect(columns.find((c) => c.key === 'employeeCode')).toBeDefined();
      expect(columns.find((c) => c.key === 'firstName')).toBeDefined();
      expect(columns.find((c) => c.key === 'lastName')).toBeDefined();
      expect(columns.find((c) => c.key === 'email')).toBeDefined();
    });

    it('should create student import columns', () => {
      const columns = ExcelService.createStudentImportColumns();

      expect(Array.isArray(columns)).toBe(true);
      expect(columns.length).toBeGreaterThan(0);
      expect(columns[0]).toHaveProperty('header');
      expect(columns[0]).toHaveProperty('key');
      expect(columns[0]).toHaveProperty('width');

      // Check a few specific columns
      expect(columns.find((c) => c.key === 'studentNumber')).toBeDefined();
      expect(columns.find((c) => c.key === 'firstName')).toBeDefined();
      expect(columns.find((c) => c.key === 'lastName')).toBeDefined();
      expect(columns.find((c) => c.key === 'email')).toBeDefined();
    });

    it('should create timesheet columns', () => {
      const columns = ExcelService.createTimesheetColumns();

      expect(Array.isArray(columns)).toBe(true);
      expect(columns.length).toBeGreaterThan(0);
      expect(columns[0]).toHaveProperty('header');
      expect(columns[0]).toHaveProperty('key');
      expect(columns[0]).toHaveProperty('width');

      // Check a few specific columns
      expect(columns.find((c) => c.key === 'employeeCode')).toBeDefined();
      expect(columns.find((c) => c.key === 'name')).toBeDefined();
      expect(columns.find((c) => c.key === 'date')).toBeDefined();
      expect(columns.find((c) => c.key === 'timeIn')).toBeDefined();
      expect(columns.find((c) => c.key === 'timeOut')).toBeDefined();
    });

    it('should have consistent column structure across all helpers', () => {
      const employeeColumns = ExcelService.createEmployeeImportColumns();
      const studentColumns = ExcelService.createStudentImportColumns();
      const timesheetColumns = ExcelService.createTimesheetColumns();

      [employeeColumns, studentColumns, timesheetColumns].forEach((columns) => {
        columns.forEach((column) => {
          expect(column).toHaveProperty('header');
          expect(column).toHaveProperty('key');
          expect(column).toHaveProperty('width');
          expect(typeof column.header).toBe('string');
          expect(typeof column.key).toBe('string');
          expect(typeof column.width).toBe('number');
        });
      });
    });

    it('should have unique keys within each column set', () => {
      const employeeColumns = ExcelService.createEmployeeImportColumns();
      const studentColumns = ExcelService.createStudentImportColumns();
      const timesheetColumns = ExcelService.createTimesheetColumns();

      [employeeColumns, studentColumns, timesheetColumns].forEach((columns) => {
        const keys = columns.map((c) => c.key);
        const uniqueKeys = [...new Set(keys)];
        expect(keys.length).toBe(uniqueKeys.length);
      });
    });
  });
});

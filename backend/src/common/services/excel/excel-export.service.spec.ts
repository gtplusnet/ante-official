import { Test, TestingModule } from '@nestjs/testing';
import * as ExcelJS from 'exceljs';
import { ExcelExportService } from './excel-export.service';
import {
  ExcelColumn,
  ExcelDropdown,
  ExcelDateColumn,
  ExcelSheetConfig,
  ExcelExportOptions,
  ExcelCellStyle,
  ExcelConditionalFormat,
  ExcelFormula,
} from './interfaces/excel.interface';

describe('ExcelExportService', () => {
  let service: ExcelExportService;
  let mockWorkbook: jest.Mocked<ExcelJS.Workbook>;
  let mockWorksheet: jest.Mocked<ExcelJS.Worksheet>;
  let mockRow: jest.Mocked<ExcelJS.Row>;
  let mockCell: jest.Mocked<ExcelJS.Cell>;
  let mockColumn: jest.Mocked<ExcelJS.Column>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelExportService],
    }).compile();

    service = module.get<ExcelExportService>(ExcelExportService);

    // Create mock objects
    mockCell = {
      value: undefined,
      font: {},
      fill: {},
      alignment: {},
      border: {},
      numFmt: '',
      dataValidation: {},
    } as jest.Mocked<ExcelJS.Cell>;

    mockRow = {
      eachCell: jest.fn(),
      number: 10, // Set to a higher number so the loop in addDropdowns will execute
    } as unknown as jest.Mocked<ExcelJS.Row>;

    mockColumn = {
      width: 10,
      numFmt: '',
      eachCell: jest.fn(),
    } as unknown as jest.Mocked<ExcelJS.Column>;

    mockWorkbook = {
      creator: '',
      created: new Date(),
      modified: new Date(),
      lastModifiedBy: '',
      properties: {},
      worksheets: [mockWorksheet], // Include the worksheet so it can be protected
      addWorksheet: jest.fn().mockReturnValue(mockWorksheet),
      xlsx: {
        writeBuffer: jest.fn().mockResolvedValue(Buffer.from('test')),
        writeFile: jest.fn().mockResolvedValue(undefined),
      },
    } as unknown as jest.Mocked<ExcelJS.Workbook>;

    mockWorksheet = {
      name: 'Test Sheet',
      addRow: jest.fn().mockReturnValue(mockRow),
      addRows: jest.fn(),
      getRow: jest.fn().mockReturnValue(mockRow),
      getColumn: jest.fn().mockReturnValue(mockColumn),
      getCell: jest.fn().mockReturnValue(mockCell),
      columns: [mockColumn],
      lastRow: mockRow,
      views: [],
      state: 'visible',
      protect: jest.fn(),
      addConditionalFormatting: jest.fn(),
      workbook: mockWorkbook,
    } as unknown as jest.Mocked<ExcelJS.Worksheet>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWorkbook', () => {
    it('should create workbook with default properties', () => {
      jest.spyOn(ExcelJS, 'Workbook').mockImplementation(() => mockWorkbook);

      const result = (service as any).createWorkbook();

      expect(result).toBe(mockWorkbook);
    });

    it('should create workbook with custom options', () => {
      jest.spyOn(ExcelJS, 'Workbook').mockImplementation(() => mockWorkbook);

      const options: ExcelExportOptions = {
        author: 'Test Author',
        created: new Date('2023-01-01'),
        modified: new Date('2023-01-02'),
        lastModifiedBy: 'Test User',
        properties: { date1904: true },
      };

      const result = (service as any).createWorkbook(options);

      expect(result).toBe(mockWorkbook);
      expect(mockWorkbook.creator).toBe('Test Author');
      expect(mockWorkbook.created).toEqual(new Date('2023-01-01'));
      expect(mockWorkbook.modified).toEqual(new Date('2023-01-02'));
      expect(mockWorkbook.lastModifiedBy).toBe('Test User');
    });
  });

  describe('configureColumns', () => {
    it('should configure worksheet columns correctly', () => {
      const columns: ExcelColumn[] = [
        {
          header: 'Name',
          key: 'name',
          width: 20,
          numFmt: '@', // Text format
        },
        {
          header: 'Age',
          key: 'age',
          width: 10,
        },
      ];

      (service as any).configureColumns(mockWorksheet, columns);

      expect(mockWorksheet.columns).toHaveLength(2);
      expect(mockWorksheet.getColumn).toHaveBeenCalledWith(1);
      expect(mockWorksheet.getColumn).toHaveBeenCalledTimes(1); // Only first column has numFmt
    });

    it('should set default width when not specified', () => {
      const columns: ExcelColumn[] = [
        {
          header: 'LongHeaderName',
          key: 'longName',
        },
      ];

      (service as any).configureColumns(mockWorksheet, columns);

      // Should use header length + 5 or minimum 10
      expect(mockWorksheet.columns).toBeDefined();
    });
  });

  describe('addData', () => {
    it('should add data rows to worksheet', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      (service as any).addData(mockWorksheet, data);

      expect(mockWorksheet.addRows).toHaveBeenCalledWith(data);
    });
  });

  describe('applyHeaderStyles', () => {
    it('should apply default header styles', () => {
      mockRow.eachCell.mockImplementation((optionsOrCallback, callback) => {
        const actualCallback =
          typeof optionsOrCallback === 'function'
            ? optionsOrCallback
            : callback;
        if (typeof actualCallback === 'function') {
          actualCallback(mockCell, 1);
        }
      });

      (service as any).applyHeaderStyles(mockWorksheet);

      expect(mockWorksheet.getRow).toHaveBeenCalledWith(1);
      expect(mockRow.eachCell).toHaveBeenCalled();
    });

    it('should apply custom header styles', () => {
      const customStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: 'FFFF0000' } },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0000FF' },
        },
      };

      mockRow.eachCell.mockImplementation((optionsOrCallback, callback) => {
        const actualCallback =
          typeof optionsOrCallback === 'function'
            ? optionsOrCallback
            : callback;
        if (typeof actualCallback === 'function') {
          actualCallback(mockCell, 1);
        }
      });

      (service as any).applyHeaderStyles(mockWorksheet, customStyle);

      expect(mockCell.font).toBe(customStyle.font);
      expect(mockCell.fill).toBe(customStyle.fill);
    });
  });

  describe('freezePanes', () => {
    it('should freeze panes with row and column', () => {
      const options = { row: 2, column: 1 };

      (service as any).freezePanes(mockWorksheet, options);

      expect(mockWorksheet.views).toEqual([
        {
          state: 'frozen',
          xSplit: 1,
          ySplit: 2,
        },
      ]);
    });

    it('should use default values when not specified', () => {
      const options = {};

      (service as any).freezePanes(mockWorksheet, options);

      expect(mockWorksheet.views).toEqual([
        {
          state: 'frozen',
          xSplit: 0,
          ySplit: 1,
        },
      ]);
    });
  });

  describe('addDropdowns', () => {
    const columns: ExcelColumn[] = [
      { header: 'Status', key: 'status' },
      { header: 'Priority', key: 'priority' },
    ];

    it('should add dropdown validation for short option lists', () => {
      const dropdowns: ExcelDropdown[] = [
        {
          columnKey: 'status',
          options: ['Active', 'Inactive'],
          allowBlank: false,
        },
      ];

      (service as any).addDropdowns(mockWorksheet, columns, dropdowns);

      expect(mockWorksheet.getCell).toHaveBeenCalled();
    });

    it('should create hidden sheet for long dropdown lists', () => {
      const longOptions = Array.from(
        { length: 100 },
        (_, i) => `Option ${i + 1}`,
      );
      const dropdowns: ExcelDropdown[] = [
        {
          columnKey: 'status',
          options: longOptions,
        },
      ];

      (service as any).addDropdowns(mockWorksheet, columns, dropdowns);

      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Dropdown_status');
    });

    it('should handle dropdown options with commas', () => {
      const dropdowns: ExcelDropdown[] = [
        {
          columnKey: 'status',
          options: ['Option, with comma', 'Simple option'],
        },
      ];

      (service as any).addDropdowns(mockWorksheet, columns, dropdowns);

      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Dropdown_status');
    });
  });

  describe('addDateValidations', () => {
    const columns: ExcelColumn[] = [
      { header: 'Start Date', key: 'startDate' },
      { header: 'End Date', key: 'endDate' },
    ];

    it('should add date validation with default format', () => {
      const dateColumns: ExcelDateColumn[] = [
        {
          columnKey: 'startDate',
        },
      ];

      (service as any).addDateValidations(mockWorksheet, columns, dateColumns);

      expect(mockColumn.numFmt).toBe('mm/dd/yyyy');
      expect(mockWorksheet.getCell).toHaveBeenCalled();
    });

    it('should add date validation with custom format and date range', () => {
      const dateColumns: ExcelDateColumn[] = [
        {
          columnKey: 'startDate',
          format: 'yyyy-mm-dd',
          minDate: new Date('2023-01-01'),
          maxDate: new Date('2023-12-31'),
          allowBlank: true,
        },
      ];

      (service as any).addDateValidations(mockWorksheet, columns, dateColumns);

      expect(mockColumn.numFmt).toBe('yyyy-mm-dd');
    });
  });

  describe('exportToBuffer', () => {
    it('should export data to buffer successfully', async () => {
      jest
        .spyOn(service as any, 'createWorkbook')
        .mockReturnValue(mockWorkbook);
      jest
        .spyOn(service as any, 'configureColumns')
        .mockImplementation(() => {});
      jest.spyOn(service as any, 'addData').mockImplementation(() => {});
      jest
        .spyOn(service as any, 'applyHeaderStyles')
        .mockImplementation(() => {});

      const columns: ExcelColumn[] = [{ header: 'Name', key: 'name' }];
      const data = [{ name: 'John' }];

      const result = await service.exportToBuffer(columns, data, 'TestSheet');

      expect(result).toBeInstanceOf(Buffer);
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('TestSheet');
      expect(mockWorkbook.xlsx.writeBuffer).toHaveBeenCalled();
    });

    it('should apply options when provided', async () => {
      jest
        .spyOn(service as any, 'createWorkbook')
        .mockReturnValue(mockWorkbook);
      jest
        .spyOn(service as any, 'configureColumns')
        .mockImplementation(() => {});
      jest.spyOn(service as any, 'addData').mockImplementation(() => {});
      jest
        .spyOn(service as any, 'applyHeaderStyles')
        .mockImplementation(() => {});
      jest.spyOn(service as any, 'addDropdowns').mockImplementation(() => {});
      jest
        .spyOn(service as any, 'addDateValidations')
        .mockImplementation(() => {});
      jest.spyOn(service as any, 'freezePanes').mockImplementation(() => {});

      const columns: ExcelColumn[] = [{ header: 'Status', key: 'status' }];
      const data = [{ status: 'Active' }];
      const options: Partial<ExcelSheetConfig> = {
        dropdowns: [{ columnKey: 'status', options: ['Active', 'Inactive'] }],
        dateColumns: [{ columnKey: 'date' }],
        freezePane: { row: 2 },
        headerStyle: { font: { bold: true } },
      };

      await service.exportToBuffer(columns, data, 'TestSheet', options);

      expect(service['addDropdowns']).toHaveBeenCalled();
      expect(service['addDateValidations']).toHaveBeenCalled();
      expect(service['freezePanes']).toHaveBeenCalled();
    });
  });

  describe('exportToFile', () => {
    it('should export data to file successfully', async () => {
      jest
        .spyOn(service as any, 'createWorkbook')
        .mockReturnValue(mockWorkbook);
      jest
        .spyOn(service as any, 'configureColumns')
        .mockImplementation(() => {});
      jest.spyOn(service as any, 'addData').mockImplementation(() => {});
      jest
        .spyOn(service as any, 'applyHeaderStyles')
        .mockImplementation(() => {});

      const filePath = '/path/to/file.xlsx';
      const columns: ExcelColumn[] = [{ header: 'Name', key: 'name' }];
      const data = [{ name: 'John' }];

      await service.exportToFile(filePath, columns, data);

      expect(mockWorkbook.xlsx.writeFile).toHaveBeenCalledWith(filePath);
    });
  });

  describe('exportMultipleSheetsToBuffer', () => {
    it('should export multiple sheets to buffer', async () => {
      jest
        .spyOn(service as any, 'createWorkbook')
        .mockReturnValue(mockWorkbook);
      jest
        .spyOn(service as any, 'configureColumns')
        .mockImplementation(() => {});
      jest.spyOn(service as any, 'addData').mockImplementation(() => {});
      jest
        .spyOn(service as any, 'applyHeaderStyles')
        .mockImplementation(() => {});

      const options: ExcelExportOptions = {
        sheets: [
          {
            name: 'Sheet1',
            columns: [{ header: 'Name', key: 'name' }],
            data: [{ name: 'John' }],
          },
          {
            name: 'Sheet2',
            columns: [{ header: 'Age', key: 'age' }],
            data: [{ age: 30 }],
          },
        ],
      };

      const result = await service.exportMultipleSheetsToBuffer(options);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Sheet1');
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Sheet2');
    });

    it('should protect worksheets when password is provided', async () => {
      // Ensure addWorksheet returns a worksheet with a columns property
      const protectedWorksheet = {
        ...mockWorksheet,
        protect: jest.fn(),
        columns: [],
      };

      const protectedWorkbook = {
        ...mockWorkbook,
        addWorksheet: jest.fn().mockReturnValue(protectedWorksheet),
        worksheets: [protectedWorksheet],
      };

      jest
        .spyOn(service as any, 'createWorkbook')
        .mockReturnValue(protectedWorkbook);

      const options: ExcelExportOptions = {
        protectWorkbook: true,
        password: 'test123',
        sheets: [
          {
            name: 'Protected Sheet',
            columns: [{ header: 'Data', key: 'data' }],
          },
        ],
      };

      await service.exportMultipleSheetsToBuffer(options);

      expect(protectedWorksheet.protect).toHaveBeenCalledWith('test123', {});
    });
  });

  describe('createTemplate', () => {
    it('should create template with instructions and sample data', async () => {
      jest
        .spyOn(service as any, 'createWorkbook')
        .mockReturnValue(mockWorkbook);
      jest
        .spyOn(service as any, 'configureColumns')
        .mockImplementation(() => {});
      jest.spyOn(service as any, 'addData').mockImplementation(() => {});
      jest
        .spyOn(service as any, 'applyHeaderStyles')
        .mockImplementation(() => {});
      jest.spyOn(service as any, 'freezePanes').mockImplementation(() => {});

      const columns: ExcelColumn[] = [{ header: 'Name', key: 'name' }];
      const options = {
        instructions: ['Step 1: Fill in the data', 'Step 2: Save the file'],
        sampleData: [{ name: 'Sample Name' }],
      };

      const result = await service.createTemplate(columns, options);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Instructions');
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Data');
    });

    it('should create template without instructions', async () => {
      jest
        .spyOn(service as any, 'createWorkbook')
        .mockReturnValue(mockWorkbook);
      jest
        .spyOn(service as any, 'configureColumns')
        .mockImplementation(() => {});
      jest
        .spyOn(service as any, 'applyHeaderStyles')
        .mockImplementation(() => {});
      jest.spyOn(service as any, 'freezePanes').mockImplementation(() => {});

      const columns: ExcelColumn[] = [{ header: 'Name', key: 'name' }];

      const result = await service.createTemplate(columns);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Data');
      expect(mockWorkbook.addWorksheet).not.toHaveBeenCalledWith(
        'Instructions',
      );
    });
  });

  describe('applyConditionalFormatting', () => {
    it('should apply conditional formatting rules', () => {
      const formats: ExcelConditionalFormat[] = [
        {
          range: 'A1:A10',
          rules: [
            {
              type: 'cellIs',
              operator: 'greaterThan',
              formulae: [100],
              style: {
                fill: {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FF92D050' },
                },
              },
            } as ExcelJS.ConditionalFormattingRule,
          ],
        },
      ];

      service.applyConditionalFormatting(mockWorksheet, formats);

      expect(mockWorksheet.addConditionalFormatting).toHaveBeenCalledWith({
        ref: 'A1:A10',
        rules: formats[0].rules,
      });
    });
  });

  describe('addFormulas', () => {
    it('should add formulas to specific cells', () => {
      const formulas: ExcelFormula[] = [
        {
          cell: 'A1',
          formula: 'SUM(B1:B10)',
        },
        {
          cell: 'A2',
          formula: 'AVERAGE(B1:B10)',
          arrayFormula: true,
        },
      ];

      service.addFormulas(mockWorksheet, formulas);

      expect(mockWorksheet.getCell).toHaveBeenCalledWith('A1');
      expect(mockWorksheet.getCell).toHaveBeenCalledWith('A2');
      expect(mockCell.value).toBeDefined();
    });
  });

  describe('applyCellStyles', () => {
    it('should apply styles to specific cells', () => {
      const styles = new Map<string, ExcelCellStyle>();
      styles.set('A1', {
        font: { name: 'Arial', size: 12, bold: true } as ExcelJS.Font,
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF0000' },
        },
        alignment: { horizontal: 'center' } as ExcelJS.Alignment,
        numFmt: '0.00',
      });

      service.applyCellStyles(mockWorksheet, styles);

      expect(mockWorksheet.getCell).toHaveBeenCalledWith('A1');
      expect(mockCell.font).toEqual({ name: 'Arial', size: 12, bold: true });
      expect(mockCell.numFmt).toBe('0.00');
    });
  });

  describe('addSummaryRow', () => {
    it('should add summary row with custom style', () => {
      Object.defineProperty(mockWorksheet, 'lastRow', {
        value: mockRow,
        writable: true,
        configurable: true,
      });

      const summaryData = { Total: 100, Average: 50 };
      const style: ExcelCellStyle = {
        font: { name: 'Arial', size: 12, bold: true } as ExcelJS.Font,
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFCCCCCC' },
        },
      };

      mockRow.eachCell.mockImplementation((optionsOrCallback, callback) => {
        const actualCallback =
          typeof optionsOrCallback === 'function'
            ? optionsOrCallback
            : callback;
        if (typeof actualCallback === 'function') {
          actualCallback(mockCell, 1);
          actualCallback(mockCell, 2);
        }
      });

      service.addSummaryRow(mockWorksheet, summaryData, style);

      expect(mockWorksheet.addRow).toHaveBeenCalledWith(summaryData);
      expect(mockCell.font).toBe(style.font);
      expect(mockCell.fill).toBe(style.fill);
    });

    it('should return early if no last row exists', () => {
      Object.defineProperty(mockWorksheet, 'lastRow', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      service.addSummaryRow(mockWorksheet, {});

      expect(mockWorksheet.addRow).not.toHaveBeenCalled();
    });
  });

  describe('autoFitColumns', () => {
    it('should auto-fit column widths based on content', () => {
      mockColumn.eachCell.mockImplementation((options, callback) => {
        if (typeof callback === 'function') {
          callback({ value: 'Short' } as ExcelJS.Cell, 1);
          callback({ value: 'This is a much longer text' } as ExcelJS.Cell, 2);
        }
      });

      service.autoFitColumns(mockWorksheet);

      expect(mockColumn.width).toBeGreaterThan(0);
      expect(mockColumn.width).toBeLessThanOrEqual(50); // Max width constraint
    });

    it('should handle empty cells', () => {
      mockColumn.eachCell.mockImplementation((options, callback) => {
        if (typeof callback === 'function') {
          callback({ value: null } as ExcelJS.Cell, 1);
          callback({ value: undefined } as ExcelJS.Cell, 2);
        }
      });

      service.autoFitColumns(mockWorksheet);

      expect(mockColumn.width).toBe(2); // Minimum width with padding
    });
  });
});

import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
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

/**
 * Service responsible for exporting data to Excel files
 * Following Single Responsibility Principle - only handles export operations
 */
@Injectable()
export class ExcelExportService {
  /**
   * Export data to Excel buffer
   */
  async exportToBuffer(
    columns: ExcelColumn[],
    data: any[],
    sheetName = 'Sheet1',
    options?: Partial<ExcelSheetConfig>,
  ): Promise<Buffer> {
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Configure columns
    this.configureColumns(worksheet, columns);

    // Add data
    this.addData(worksheet, data);

    // Apply styles
    this.applyHeaderStyles(worksheet, options?.headerStyle);

    // Add dropdowns if provided
    if (options?.dropdowns) {
      this.addDropdowns(worksheet, columns, options.dropdowns);
    }

    // Add date validations if provided
    if (options?.dateColumns) {
      this.addDateValidations(worksheet, columns, options.dateColumns);
    }

    // Freeze panes if specified
    if (options?.freezePane) {
      this.freezePanes(worksheet, options.freezePane);
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * Export multiple sheets to Excel buffer
   */
  async exportMultipleSheetsToBuffer(
    options: ExcelExportOptions,
  ): Promise<Buffer> {
    const workbook = this.createWorkbook(options);

    if (options.sheets) {
      for (const sheetConfig of options.sheets) {
        const worksheet = workbook.addWorksheet(sheetConfig.name);

        // Configure columns
        this.configureColumns(worksheet, sheetConfig.columns);

        // Add data
        if (sheetConfig.data) {
          this.addData(worksheet, sheetConfig.data);
        }

        // Apply styles
        this.applyHeaderStyles(worksheet, sheetConfig.headerStyle);

        // Add dropdowns
        if (sheetConfig.dropdowns) {
          this.addDropdowns(
            worksheet,
            sheetConfig.columns,
            sheetConfig.dropdowns,
          );
        }

        // Add date validations
        if (sheetConfig.dateColumns) {
          this.addDateValidations(
            worksheet,
            sheetConfig.columns,
            sheetConfig.dateColumns,
          );
        }

        // Freeze panes
        if (sheetConfig.freezePane) {
          this.freezePanes(worksheet, sheetConfig.freezePane);
        }
      }
    }

    // Protect workbook if specified
    // Note: ExcelJS doesn't have a protect method on workbook, only on worksheets
    if (options.protectWorkbook && options.password) {
      // Protection would need to be applied at worksheet level
      workbook.worksheets.forEach((worksheet) => {
        worksheet.protect(options.password, {});
      });
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * Export data to Excel file
   */
  async exportToFile(
    filePath: string,
    columns: ExcelColumn[],
    data: any[],
    sheetName = 'Sheet1',
    options?: Partial<ExcelSheetConfig>,
  ): Promise<void> {
    const workbook = this.createWorkbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Configure columns
    this.configureColumns(worksheet, columns);

    // Add data
    this.addData(worksheet, data);

    // Apply styles
    this.applyHeaderStyles(worksheet, options?.headerStyle);

    // Add dropdowns if provided
    if (options?.dropdowns) {
      this.addDropdowns(worksheet, columns, options.dropdowns);
    }

    // Add date validations if provided
    if (options?.dateColumns) {
      this.addDateValidations(worksheet, columns, options.dateColumns);
    }

    await workbook.xlsx.writeFile(filePath);
  }

  /**
   * Create Excel template with headers and validations
   */
  async createTemplate(
    columns: ExcelColumn[],
    options?: {
      dropdowns?: ExcelDropdown[];
      dateColumns?: ExcelDateColumn[];
      sampleData?: any[];
      instructions?: string[];
    },
  ): Promise<Buffer> {
    const workbook = this.createWorkbook();

    // Create instructions sheet if provided
    if (options?.instructions && options.instructions.length > 0) {
      const instructionSheet = workbook.addWorksheet('Instructions');
      instructionSheet.getColumn(1).width = 100;

      options.instructions.forEach((instruction, index) => {
        const cell = instructionSheet.getCell(index + 1, 1);
        cell.value = instruction;
        cell.font = { size: 11 };
        cell.alignment = { wrapText: true, vertical: 'top' };
      });
    }

    // Create data sheet
    const worksheet = workbook.addWorksheet('Data');

    // Configure columns
    this.configureColumns(worksheet, columns);

    // Add sample data if provided
    if (options?.sampleData) {
      this.addData(worksheet, options.sampleData);
    }

    // Style header row
    this.applyHeaderStyles(worksheet, {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0070C0' },
      },
      alignment: { vertical: 'middle', horizontal: 'center' },
    } as Partial<ExcelJS.Style>);

    // Add dropdowns
    if (options?.dropdowns) {
      this.addDropdowns(worksheet, columns, options.dropdowns, true);
    }

    // Add date validations
    if (options?.dateColumns) {
      this.addDateValidations(worksheet, columns, options.dateColumns, true);
    }

    // Freeze header row
    this.freezePanes(worksheet, { row: 2 });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * Apply conditional formatting to worksheet
   */
  applyConditionalFormatting(
    worksheet: ExcelJS.Worksheet,
    formats: ExcelConditionalFormat[],
  ): void {
    for (const format of formats) {
      worksheet.addConditionalFormatting({
        ref: format.range,
        rules: format.rules,
      });
    }
  }

  /**
   * Add formulas to specific cells
   */
  addFormulas(worksheet: ExcelJS.Worksheet, formulas: ExcelFormula[]): void {
    for (const formula of formulas) {
      const cell = worksheet.getCell(formula.cell);
      if (formula.arrayFormula) {
        cell.value = {
          formula: formula.formula,
          result: undefined,
        } as ExcelJS.CellFormulaValue;
      } else {
        cell.value = { formula: formula.formula };
      }
    }
  }

  /**
   * Style specific cells or ranges
   */
  applyCellStyles(
    worksheet: ExcelJS.Worksheet,
    styles: Map<string, ExcelCellStyle>,
  ): void {
    styles.forEach((style, cellRef) => {
      const cell = worksheet.getCell(cellRef);
      if (style.font) cell.font = style.font;
      if (style.fill) cell.fill = style.fill;
      if (style.alignment) cell.alignment = style.alignment;
      if (style.border) cell.border = style.border;
      if (style.numFmt) cell.numFmt = style.numFmt;
    });
  }

  /**
   * Add summary row with totals
   */
  addSummaryRow(
    worksheet: ExcelJS.Worksheet,
    summaryData: { [key: string]: any },
    style?: ExcelCellStyle,
  ): void {
    const lastRow = worksheet.lastRow;
    if (!lastRow) return;

    const summaryRow = worksheet.addRow(summaryData);

    if (style) {
      summaryRow.eachCell((cell) => {
        if (style.font) cell.font = style.font;
        if (style.fill) cell.fill = style.fill;
        if (style.alignment) cell.alignment = style.alignment;
        if (style.border) cell.border = style.border;
      });
    }
  }

  /**
   * Auto-fit column widths based on content
   */
  autoFitColumns(worksheet: ExcelJS.Worksheet): void {
    worksheet.columns.forEach((column) => {
      let maxLength = 0;

      column.eachCell({ includeEmpty: false }, (cell) => {
        const value = cell.value?.toString() || '';
        if (value.length > maxLength) {
          maxLength = value.length;
        }
      });

      // Set width with some padding
      column.width = Math.min(maxLength + 2, 50); // Max width of 50
    });
  }

  // Private helper methods

  private createWorkbook(options?: ExcelExportOptions): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();

    if (options) {
      workbook.creator = options.author || 'ANTE System';
      workbook.created = options.created || new Date();
      workbook.modified = options.modified || new Date();
      workbook.lastModifiedBy = options.lastModifiedBy || 'ANTE System';

      if (options.properties) {
        workbook.properties = options.properties;
      }
    }

    return workbook;
  }

  private configureColumns(
    worksheet: ExcelJS.Worksheet,
    columns: ExcelColumn[],
  ): void {
    const adjustedColumns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || Math.max(col.header.length + 5, 10),
      style: col.style,
    }));

    worksheet.columns = adjustedColumns;

    // Apply number formats if specified
    columns.forEach((col, index) => {
      if (col.numFmt) {
        worksheet.getColumn(index + 1).numFmt = col.numFmt;
      }
    });
  }

  private addData(worksheet: ExcelJS.Worksheet, data: any[]): void {
    worksheet.addRows(data);
  }

  private applyHeaderStyles(
    worksheet: ExcelJS.Worksheet,
    customStyle?: Partial<ExcelJS.Style>,
  ): void {
    const defaultStyle: Partial<ExcelJS.Style> = {
      font: { bold: true },
      alignment: { vertical: 'middle', horizontal: 'center' },
    };

    const style = customStyle || defaultStyle;

    worksheet.getRow(1).eachCell((cell) => {
      if (style.font) cell.font = style.font;
      if (style.fill) cell.fill = style.fill;
      if (style.alignment) cell.alignment = style.alignment;
      if (style.border) cell.border = style.border;
    });
  }

  private addDropdowns(
    worksheet: ExcelJS.Worksheet,
    columns: ExcelColumn[],
    dropdowns: ExcelDropdown[],
    isTemplate = false,
  ): void {
    dropdowns.forEach((dropdown) => {
      const colIndex =
        columns.findIndex((col) => col.key === dropdown.columnKey) + 1;

      if (colIndex > 0 && dropdown.options.length > 0) {
        const optionsString = dropdown.options
          .map((opt) => opt.replace(/,/g, ''))
          .join(',');

        // Use hidden sheet for long dropdown lists
        if (
          optionsString.length > 255 ||
          dropdown.options.some((opt) => opt.includes(','))
        ) {
          const hiddenSheetName = `Dropdown_${dropdown.columnKey}`;
          const hiddenSheet = worksheet.workbook.addWorksheet(hiddenSheetName);

          dropdown.options.forEach((opt, i) => {
            hiddenSheet.getCell(`A${i + 1}`).value = opt;
          });

          hiddenSheet.state = 'veryHidden';

          const range = `${hiddenSheetName}!$A$1:$A$${dropdown.options.length}`;
          const startRow = isTemplate ? 2 : 2;
          const endRow = isTemplate ? 1000 : worksheet.lastRow?.number || 100;

          for (let i = startRow; i <= endRow; i++) {
            worksheet.getCell(i, colIndex).dataValidation = {
              type: 'list',
              allowBlank: dropdown.allowBlank !== false,
              formulae: [`=${range}`],
              showErrorMessage: true,
              errorTitle: dropdown.errorTitle || 'Invalid Selection',
              error:
                dropdown.errorMessage ||
                'Please select a value from the dropdown.',
            };
          }
        } else {
          // Use direct formula for short lists
          const startRow = isTemplate ? 2 : 2;
          const endRow = isTemplate ? 1000 : worksheet.lastRow?.number || 100;

          for (let i = startRow; i <= endRow; i++) {
            worksheet.getCell(i, colIndex).dataValidation = {
              type: 'list',
              allowBlank: dropdown.allowBlank !== false,
              formulae: [`"${optionsString}"`],
              showErrorMessage: true,
              errorTitle: dropdown.errorTitle || 'Invalid Selection',
              error:
                dropdown.errorMessage ||
                'Please select a value from the dropdown.',
            };
          }
        }
      }
    });
  }

  private addDateValidations(
    worksheet: ExcelJS.Worksheet,
    columns: ExcelColumn[],
    dateColumns: ExcelDateColumn[],
    isTemplate = false,
  ): void {
    dateColumns.forEach((dateColumn) => {
      const colIndex =
        columns.findIndex((col) => col.key === dateColumn.columnKey) + 1;

      if (colIndex > 0) {
        // Set date format for the column
        const format = dateColumn.format || 'mm/dd/yyyy';
        worksheet.getColumn(colIndex).numFmt = format;

        const startRow = isTemplate ? 2 : 2;
        const endRow = isTemplate ? 1000 : worksheet.lastRow?.number || 100;

        for (let i = startRow; i <= endRow; i++) {
          const validation: ExcelJS.DataValidation = {
            type: 'date',
            operator: 'between',
            formulae: [
              dateColumn.minDate || new Date(1900, 0, 1),
              dateColumn.maxDate || new Date(2100, 11, 31),
            ],
            showInputMessage: true,
            promptTitle: 'Date Entry',
            prompt: `Please enter date in ${format.toUpperCase()} format`,
            showErrorMessage: true,
            errorStyle: 'error',
            errorTitle: 'Invalid Date',
            error: `Please enter a valid date in ${format.toUpperCase()} format`,
            allowBlank: dateColumn.allowBlank !== false,
          };

          worksheet.getCell(i, colIndex).dataValidation = validation;
        }
      }
    });
  }

  private freezePanes(
    worksheet: ExcelJS.Worksheet,
    options: { row?: number; column?: number },
  ): void {
    worksheet.views = [
      {
        state: 'frozen',
        xSplit: options.column || 0,
        ySplit: options.row || 1,
      },
    ];
  }
}

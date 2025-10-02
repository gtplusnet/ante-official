// To use this service, ensure you have installed exceljs: npm install exceljs
// If using TypeScript, you may also want: npm install --save-dev @types/exceljs
import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExcelExportService {
  async exportToExcel(
    columns: { header: string; key: string; width?: number }[],
    data: any[],
    sheetName = 'Sheet1',
    dropdowns?: { columnKey: string; options: string[] }[],
    dateColumns?: string[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Auto-adjust column widths based on header text if width not specified
    const adjustedColumns = columns.map((col) => ({
      ...col,
      width: col.width || Math.max(col.header.length + 5, 10), // Add padding of 5, minimum 10
    }));

    worksheet.columns = adjustedColumns;
    worksheet.addRows(data);

    // Style header row - make it bold
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Add dropdowns if provided
    if (dropdowns) {
      dropdowns.forEach((dropdown, dropdownIdx) => {
        const colIndex =
          columns.findIndex((col) => col.key === dropdown.columnKey) + 1;
        if (colIndex > 0 && dropdown.options.length > 0) {
          // If options are too long for a direct formula, use a hidden sheet
          const optionsString = dropdown.options
            .map((opt) => opt.replace(/,/g, ''))
            .join(',');
          if (
            optionsString.length > 255 ||
            dropdown.options.some((opt) => opt.includes(','))
          ) {
            // Create a hidden sheet for options
            const hiddenSheetName = `DropdownOptions${dropdownIdx}`;
            const hiddenSheet = workbook.addWorksheet(hiddenSheetName);
            dropdown.options.forEach((opt, i) => {
              hiddenSheet.getCell(`A${i + 1}`).value = opt;
            });
            hiddenSheet.state = 'veryHidden';
            // Reference the range in the data validation formula
            const range = `${hiddenSheetName}!$A$1:$A$${dropdown.options.length}`;
            for (let i = 2; i <= worksheet.lastRow.number; i++) {
              worksheet.getCell(i, colIndex).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [`=${range}`],
                showErrorMessage: true,
                errorTitle: 'Invalid Selection',
                error: 'Please select a value from the dropdown.',
              };
            }
          } else {
            // Use direct formula if short enough and no commas
            for (let i = 2; i <= worksheet.lastRow.number; i++) {
              worksheet.getCell(i, colIndex).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [`"${optionsString}"`],
                showErrorMessage: true,
                errorTitle: 'Invalid Selection',
                error: 'Please select a value from the dropdown.',
              };
            }
          }
        }
      });
    }

    // Add date validation if provided
    if (dateColumns && dateColumns.length > 0) {
      dateColumns.forEach((dateColumnKey) => {
        const colIndex =
          columns.findIndex((col) => col.key === dateColumnKey) + 1;
        if (colIndex > 0) {
          // Set date format for the entire column
          worksheet.getColumn(colIndex).numFmt = 'mm/dd/yyyy';

          // Add date validation for each cell in the column (excluding header)
          for (let i = 2; i <= worksheet.lastRow.number; i++) {
            worksheet.getCell(i, colIndex).dataValidation = {
              type: 'date',
              operator: 'greaterThanOrEqual',
              formulae: [new Date(1900, 0, 1)], // Allow dates from 1900 onwards
              showInputMessage: true,
              promptTitle: 'Date Entry',
              prompt: 'Please enter date in MM/DD/YYYY format',
              showErrorMessage: true,
              errorStyle: 'error',
              errorTitle: 'Invalid Date',
              error: 'Please enter a valid date in MM/DD/YYYY format',
              allowBlank: true,
            };
          }
        }
      });
    }

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  /**
   * Sample: Export with custom column widths, header style, cell background, and a formula row
   */
  async sampleStyledExcelExport(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('StyledSheet');

    // Define columns with width
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
    ];

    // Add data
    worksheet.addRows([
      { name: 'Alice', amount: 100, date: '2023-01-01' },
      { name: 'Bob', amount: 200, date: '2023-01-02' },
      { name: 'Charlie', amount: 300, date: '2023-01-03' },
    ]);

    // Style header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0070C0' }, // Blue background
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Style data rows (background color for Amount > 150)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const amountCell = row.getCell('amount');
        if (
          amountCell.value &&
          typeof amountCell.value === 'number' &&
          amountCell.value > 150
        ) {
          amountCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFC000' }, // Orange background
          };
        }
      }
    });

    // Add a formula row (sum of Amount)
    const lastDataRow = worksheet.lastRow.number;
    const formulaRow = worksheet.addRow({
      name: 'Total',
      amount: { formula: `SUM(B2:B${lastDataRow})` },
    });
    formulaRow.getCell('amount').font = { bold: true };
    formulaRow.getCell('name').font = { bold: true };
    formulaRow.getCell('amount').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF92D050' }, // Green background
    };

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }
}

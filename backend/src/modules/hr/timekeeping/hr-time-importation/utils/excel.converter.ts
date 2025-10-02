import { ExcelService } from '@common/services/excel';

export class ExcelConverter {
  static async convertToText(base64Data: string): Promise<string> {
    try {
      const excelService = new ExcelService(null, null, null, null); // Static usage
      const csvContent = await excelService.convertToCSV(
        Buffer.from(
          base64Data.includes(',') ? base64Data.split(',')[1] : base64Data,
          'base64',
        ),
      );
      return csvContent;
    } catch (error) {
      throw new Error(`Failed to convert Excel to text: ${error.message}`);
    }
  }

  static async extractTableData(base64Data: string): Promise<any[]> {
    try {
      const base64 = base64Data.includes(',')
        ? base64Data.split(',')[1]
        : base64Data;
      const buffer = Buffer.from(base64, 'base64');

      // Use the import service directly since we need raw data
      const { ExcelImportService } = await import('@common/services/excel');
      const importService = new ExcelImportService();
      const sheetsData = await importService.importMultipleSheets(buffer);

      const allData = [];
      for (const [sheetName, parsedData] of sheetsData) {
        allData.push({
          sheetName,
          data: parsedData.rawData || parsedData.rows,
        });
      }

      return allData;
    } catch (error) {
      throw new Error(`Failed to extract Excel data: ${error.message}`);
    }
  }
}

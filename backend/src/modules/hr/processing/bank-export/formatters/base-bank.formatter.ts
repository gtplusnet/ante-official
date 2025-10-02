import { IBankFormatter } from '../interfaces/bank-formatter.interface';
import { IBankEmployee } from '../interfaces/bank-export.interface';

export abstract class BaseBankFormatter implements IBankFormatter {
  abstract format(employees: IBankEmployee[]): string;
  abstract getFileExtension(): string;
  abstract getContentType(): string;

  protected generateCsv(headers: string[], rows: string[][]): string {
    const headerRow = headers.join(',');
    const dataRows = rows.map((row) =>
      row.map((cell) => this.escapeCsvValue(cell)).join(','),
    );
    return [headerRow, ...dataRows].join('\n');
  }

  protected escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  protected formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  protected padRight(str: string, length: number): string {
    return str.padEnd(length, ' ');
  }

  protected padLeft(str: string, length: number): string {
    return str.padStart(length, ' ');
  }
}

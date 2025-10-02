import { IBankEmployee } from './bank-export.interface';

export interface IBankFormatter {
  format(employees: IBankEmployee[]): string;
  getFileExtension(): string;
  getContentType(): string;
  getDelimiter?(): string;
}

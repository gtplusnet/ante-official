import { Injectable } from '@nestjs/common';
import { BaseBankFormatter } from './base-bank.formatter';
import { IBankEmployee } from '../interfaces/bank-export.interface';

@Injectable()
export class DefaultFormatter extends BaseBankFormatter {
  format(employees: IBankEmployee[]): string {
    const headers = ['Account Number', 'Employee Name', 'Amount'];
    const rows = employees.map((emp) => [
      emp.bankAccountNumber,
      emp.employeeName,
      this.formatAmount(emp.netPay),
    ]);
    return this.generateCsv(headers, rows);
  }

  getFileExtension(): string {
    return 'csv';
  }

  getContentType(): string {
    return 'text/csv';
  }
}

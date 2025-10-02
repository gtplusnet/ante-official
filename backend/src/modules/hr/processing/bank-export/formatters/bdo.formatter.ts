import { Injectable } from '@nestjs/common';
import { BaseBankFormatter } from './base-bank.formatter';
import { IBankEmployee } from '../interfaces/bank-export.interface';

@Injectable()
export class BdoFormatter extends BaseBankFormatter {
  format(employees: IBankEmployee[]): string {
    const headers = ['Account Number', 'Amount', 'Employee Name', 'Reference'];
    const rows = employees.map((emp) => [
      emp.bankAccountNumber,
      this.formatAmount(emp.netPay),
      emp.employeeName,
      emp.employeeCode,
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

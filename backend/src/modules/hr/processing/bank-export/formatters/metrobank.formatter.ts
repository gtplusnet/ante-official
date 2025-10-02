import { Injectable } from '@nestjs/common';
import { BaseBankFormatter } from './base-bank.formatter';
import { IBankEmployee } from '../interfaces/bank-export.interface';

@Injectable()
export class MetrobankFormatter extends BaseBankFormatter {
  format(employees: IBankEmployee[]): string {
    // Fixed-width format: Account(20), Amount(15), Name(30)
    return employees
      .map(
        (emp) =>
          this.padRight(emp.bankAccountNumber, 20) +
          this.padLeft(this.formatAmount(emp.netPay), 15) +
          this.padRight(emp.employeeName.substring(0, 30), 30),
      )
      .join('\n');
  }

  getFileExtension(): string {
    return 'txt';
  }

  getContentType(): string {
    return 'text/plain';
  }
}

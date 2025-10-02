import { Injectable } from '@nestjs/common';
import { BaseBankFormatter } from './base-bank.formatter';
import { IBankEmployee } from '../interfaces/bank-export.interface';

@Injectable()
export class BpiFormatter extends BaseBankFormatter {
  format(employees: IBankEmployee[]): string {
    return employees
      .map((emp) =>
        [
          emp.bankAccountNumber,
          this.formatAmount(emp.netPay),
          'PAYROLL',
          emp.employeeName.replace(/[|]/g, ''), // Remove pipes from name
        ].join('|'),
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

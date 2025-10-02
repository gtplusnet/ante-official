import { Injectable } from '@nestjs/common';
import { IBankFormatter } from '../interfaces/bank-formatter.interface';
import { BdoFormatter } from '../formatters/bdo.formatter';
import { BpiFormatter } from '../formatters/bpi.formatter';
import { MetrobankFormatter } from '../formatters/metrobank.formatter';
import { DefaultFormatter } from '../formatters/default.formatter';

@Injectable()
export class BankFormatterFactory {
  private formatters: Map<string, IBankFormatter>;

  constructor(
    private bdoFormatter: BdoFormatter,
    private bpiFormatter: BpiFormatter,
    private metrobankFormatter: MetrobankFormatter,
    private defaultFormatter: DefaultFormatter,
  ) {
    this.formatters = new Map([
      ['BDO', this.bdoFormatter],
      ['BPI', this.bpiFormatter],
      ['MBTC', this.metrobankFormatter],
    ]);
  }

  getFormatter(bankKey: string): IBankFormatter {
    return this.formatters.get(bankKey) || this.defaultFormatter;
  }
}

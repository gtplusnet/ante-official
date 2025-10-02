import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { BankExportController } from './bank-export.controller';
import { BankExportService } from './bank-export.service';
import { BankFormatterFactory } from './factories/bank-formatter.factory';
import { BdoFormatter } from './formatters/bdo.formatter';
import { BpiFormatter } from './formatters/bpi.formatter';
import { MetrobankFormatter } from './formatters/metrobank.formatter';
import { DefaultFormatter } from './formatters/default.formatter';

@Module({
  imports: [CommonModule],
  controllers: [BankExportController],
  providers: [
    BankExportService,
    BankFormatterFactory,
    BdoFormatter,
    BpiFormatter,
    MetrobankFormatter,
    DefaultFormatter,
  ],
  exports: [BankExportService],
})
export class BankExportModule {}

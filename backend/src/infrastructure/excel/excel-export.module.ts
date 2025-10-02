import { Module } from '@nestjs/common';
import { ExcelExportService } from '@common/services/excel-export.service';

@Module({
  providers: [ExcelExportService],
  exports: [ExcelExportService],
})
export class ExcelExportModule {}

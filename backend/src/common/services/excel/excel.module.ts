import { Module } from '@nestjs/common';
import { ExcelService } from './excel.service';
import { ExcelImportService } from './excel-import.service';
import { ExcelExportService } from './excel-export.service';
import { ExcelValidationService } from './excel-validation.service';
import { ExcelTransformService } from './excel-transform.service';

@Module({
  providers: [
    ExcelService,
    ExcelImportService,
    ExcelExportService,
    ExcelValidationService,
    ExcelTransformService,
  ],
  exports: [
    ExcelService,
    ExcelImportService,
    ExcelExportService,
    ExcelValidationService,
    ExcelTransformService,
  ],
})
export class ExcelModule {}

import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { HrTimeImportationController } from './hr-time-importation.controller';
import { HrTimeImportationService } from './hr-time-importation.service';
import { TimekeepingImportController } from './controllers/timekeeping-import.controller';
import { TimekeepingImportService } from './services/timekeeping-import.service';
import { AiChatModule } from '@integrations/ai-chat/ai-chat/ai-chat.module';
import { BiometricParserFactory } from './parsers/parser.factory';
import { ZKTecoAvignonParser } from './parsers/zkteco-avignon.parser';
import { DefaultLogParser } from './parsers/default-log.parser';
import { EmployeeValidationService } from './services/employee-validation.service';

@Module({
  imports: [CommonModule, AiChatModule],
  controllers: [HrTimeImportationController, TimekeepingImportController],
  providers: [
    HrTimeImportationService,
    TimekeepingImportService,
    BiometricParserFactory,
    ZKTecoAvignonParser,
    DefaultLogParser,
    EmployeeValidationService,
  ],
  exports: [HrTimeImportationService, TimekeepingImportService],
})
export class HrTimeImportationModule {}

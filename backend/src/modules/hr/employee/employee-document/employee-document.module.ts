import { Module } from '@nestjs/common';
import { EmployeeDocumentService } from './employee-document.service';

@Module({
  providers: [EmployeeDocumentService],
  exports: [EmployeeDocumentService],
})
export class EmployeeDocumentModule {}

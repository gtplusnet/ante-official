import { Module } from '@nestjs/common';
import { EmployeeCurrentController } from './employee-current.controller';
import { EmployeeCurrentService } from './employee-current.service';

@Module({
  controllers: [EmployeeCurrentController],
  providers: [EmployeeCurrentService],
  exports: [EmployeeCurrentService],
})
export class EmployeeCurrentModule {}
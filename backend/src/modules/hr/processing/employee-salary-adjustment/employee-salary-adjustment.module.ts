import { Module } from '@nestjs/common';
import { EmployeeSalaryAdjustmentController } from './employee-salary-adjustment.controller';
import { EmployeeSalaryAdjustmentService } from './employee-salary-adjustment.service';
import { CommonModule } from '@common/common.module';
import { HrisComputationModule } from '@modules/hr/computation/hris-computation/hris-computation.module';

@Module({
  imports: [CommonModule, HrisComputationModule],
  controllers: [EmployeeSalaryAdjustmentController],
  providers: [EmployeeSalaryAdjustmentService],
  exports: [EmployeeSalaryAdjustmentService],
})
export class EmployeeSalaryAdjustmentModule {}

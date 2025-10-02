import { Module } from '@nestjs/common';
import { LeaveConfigurationController } from './leave-configuration.controller';
import { LeaveTypeConfigurationService } from './leave-type-configuration.service';
import { LeavePlanService } from './leave-plan.service';
import { EmployeeLeavePlanService } from './employee-leave-plan.service';
import { CommonModule } from '@common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [LeaveConfigurationController],
  providers: [
    LeaveTypeConfigurationService,
    LeavePlanService,
    EmployeeLeavePlanService,
  ],
  exports: [
    LeaveTypeConfigurationService,
    LeavePlanService,
    EmployeeLeavePlanService,
  ],
})
export class LeaveConfigurationModule {}

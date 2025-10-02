import { forwardRef, Module } from '@nestjs/common';
import { TaxConfigurationService } from '@modules/hr/configuration/tax-configuration/tax-configuration.service';
// import { HrConfigurationController } from './hr-configuration.controller.backup';
import { NationalHolidayConfigurationService } from '@modules/hr/configuration/national-holiday-configuration/national-holiday-configuration.service';
import { LocalHolidayConfigurationService } from '@modules/hr/configuration/local-holiday-configuration/local-holiday-configuration.service';
import { PagibigConfigurationService } from '@modules/hr/configuration/pagibig-configuration/pagibig-configuration.service';
import { PhilhealtConfigurationService } from '@modules/hr/configuration/philhealth-configuration/philhealth-configuration.service';
import { ShiftConfigurationService } from '@modules/hr/configuration/shift-configuration/shift-configuration.service';
import { ScheduleConfigurationService } from '@modules/hr/configuration/schedule-configuration/schedule-configuration.service';
import { CommonModule } from '@common/common.module';
import { CutoffConfigurationService } from '@modules/hr/configuration/cutoff-configuration/cutoff-configuration.service';
import { PayrollGroupConfigurationService } from '@modules/hr/configuration/payroll-group-configuration/payroll-group-configuration.service';
import { SssConfigurationService } from '@modules/hr/configuration/sss-configuration/sss-configuration.service';
import { DeductionConfigurationService } from '@modules/hr/configuration/deduction-configuration/deduction-configuration.service';
import { AllowanceConfigurationService } from '@modules/hr/configuration/allowance-configuration/allowance-configuration.service';
import { DeductionPlanConfigurationService } from '@modules/hr/configuration/deduction-configuration/deduction-plan-configuration/deduction-plan-configuration.service';
import { DeductionImportService } from '@modules/hr/configuration/deduction-configuration/deduction-import.service';
import { DeductionImportController } from '@modules/hr/configuration/deduction-configuration/deduction-import.controller';
import { QueueModule } from '@infrastructure/queue/queue/queue.module';
import { HrisModule } from '../../../../hris/hris.module';
import { AllowancePlanService } from '@modules/hr/configuration/allowance-configuration/allowance-plan.service';
import { AllowanceImportService } from '@modules/hr/configuration/allowance-configuration/allowance-import.service';
import { AllowanceImportController } from '@modules/hr/configuration/allowance-configuration/allowance-import.controller';
import { PayrollApproversController } from '@modules/hr/configuration/payroll-approvers/payroll-approvers.controller';
import { PayrollApproversService } from '@modules/hr/configuration/payroll-approvers/payroll-approvers.service';
import { EmployeeSelectionService } from '@modules/hr/employee/employee-selection/employee-selection.service';
import { EmployeeListService } from '@modules/hr/employee/employee-list/employee-list.service';
import { AccountService } from '@modules/account/account/account.service';
import { FileUploadService } from '@infrastructure/file-upload/file-upload/file-upload.service';
import { BranchService } from '@modules/location/branch/branch/branch.service';
import { LocationService } from '@modules/location/location/location/location.service';
import { SocketModule } from '@modules/communication/socket/socket/socket.module';
import { TaxConfigurationController } from '@modules/hr/configuration/tax-configuration/tax-configuration.controller';
import { NationalHolidayConfigurationController } from '@modules/hr/configuration/national-holiday-configuration/national-holiday-configuration.controller';
import { LocalHolidayConfigurationController } from '@modules/hr/configuration/local-holiday-configuration/local-holiday-configuration.controller';
import { PagibigConfigurationController } from '@modules/hr/configuration/pagibig-configuration/pagibig-configuration.controller';
import { PhilhealthConfigurationController } from '@modules/hr/configuration/philhealth-configuration/philhealth-configuration.controller';
import { ScheduleConfigurationController } from '@modules/hr/configuration/schedule-configuration/schedule-configuration.controller';
import { CutoffConfigurationController } from '@modules/hr/configuration/cutoff-configuration/cutoff-configuration.controller';
import { PayrollGroupConfigurationController } from '@modules/hr/configuration/payroll-group-configuration/payroll-group-configuration.controller';
import { SssConfigurationController } from '@modules/hr/configuration/sss-configuration/sss-configuration.controller';
import { DeductionConfigurationController } from '@modules/hr/configuration/deduction-configuration/deduction-configuration.controller';
import { DeductionPlanConfigurationController } from '@modules/hr/configuration/deduction-configuration/deduction-plan-configuration.controller';
import { AllowanceConfigurationController } from '@modules/hr/configuration/allowance-configuration/allowance-configuration.controller';
import { AllowancePlanController } from '@modules/hr/configuration/allowance-configuration/allowance-plan.controller';
import { ShiftConfigurationController } from '@modules/hr/configuration/shift-configuration/shift-configuration.controller';
import { HrConfigurationController } from './hr-configuration.controller';
import { LeaveConfigurationModule } from '@modules/hr/configuration/leave-configuration/leave-configuration.module';
import { TeamModule } from '@modules/hr/team/team.module';

@Module({
  imports: [
    CommonModule,
    forwardRef(() => QueueModule),
    forwardRef(() => HrisModule),
    LeaveConfigurationModule,
    forwardRef(() => SocketModule),
    TeamModule,
  ],
  providers: [
    TaxConfigurationService,
    NationalHolidayConfigurationService,
    LocalHolidayConfigurationService,
    PhilhealtConfigurationService,
    PagibigConfigurationService,
    ShiftConfigurationService,
    ScheduleConfigurationService,
    CutoffConfigurationService,
    PayrollGroupConfigurationService,
    SssConfigurationService,
    DeductionConfigurationService,
    AllowanceConfigurationService,
    DeductionPlanConfigurationService,
    DeductionImportService,
    AllowancePlanService,
    AllowanceImportService,
    PayrollApproversService,
    EmployeeSelectionService,
    EmployeeListService,
    AccountService,
    FileUploadService,
    BranchService,
    LocationService,
  ],

  exports: [
    TaxConfigurationService,
    NationalHolidayConfigurationService,
    LocalHolidayConfigurationService,
    PhilhealtConfigurationService,
    PagibigConfigurationService,
    ShiftConfigurationService,
    ScheduleConfigurationService,
    CutoffConfigurationService,
    PayrollGroupConfigurationService,
    SssConfigurationService,
    DeductionConfigurationService,
    DeductionPlanConfigurationService,
    PayrollApproversService,
  ],
  controllers: [
    HrConfigurationController,
    PayrollApproversController,
    TaxConfigurationController,
    NationalHolidayConfigurationController,
    LocalHolidayConfigurationController,
    PagibigConfigurationController,
    PhilhealthConfigurationController,
    ScheduleConfigurationController,
    CutoffConfigurationController,
    PayrollGroupConfigurationController,
    SssConfigurationController,
    DeductionConfigurationController,
    DeductionPlanConfigurationController,
    DeductionImportController,
    AllowanceConfigurationController,
    AllowancePlanController,
    AllowanceImportController,
    ShiftConfigurationController,
  ],
})
export class HrConfigurationModule {}

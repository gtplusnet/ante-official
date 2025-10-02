import { forwardRef, Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { TimekeepingComputationService } from './timekeeping-computation/timekeeping-computation.service';
import { TimekeepingGroupingService } from './timekeeping-grouping/timekeeping-grouping.service';
import { EmployeeListService } from '@modules/hr/employee/employee-list/employee-list.service';
import { HrConfigurationModule } from '@modules/hr/configuration/hr-configuration/hr-configuration.module';
import { LocationService } from '@modules/location/location/location/location.service';
import { BranchService } from '@modules/location/branch/branch/branch.service';
import { HrFilingModule } from '@modules/hr/filing/hr-filing/hr-filing.module';
import { PayrollProcessingService } from './payroll-processing/payroll-processing.service';
import { PayrollDataService } from './payroll-processing/services/payroll-data.service';
import { PayrollRatesService } from './payroll-processing/services/payroll-rates.service';
import { DailySalaryComputationService } from './payroll-processing/services/daily-salary-computation.service';
import { CutoffSalaryComputationService } from './payroll-processing/services/cutoff-salary-computation.service';
import { GovernmentContributionsService } from './payroll-processing/services/government-contributions.service';
import { TaxComputationService } from './payroll-processing/services/tax-computation.service';
import { DeductionsService } from './payroll-processing/services/deductions.service';
import { AllowancesService } from './payroll-processing/services/allowances.service';
import { PayrollAggregationService } from './payroll-processing/services/payroll-aggregation.service';
import { SalaryAdjustmentsService } from './payroll-processing/services/salary-adjustments.service';
import { AttendanceConflictsModule } from '@modules/hr/timekeeping/attendance-conflicts/attendance-conflicts.module';
import { AttendanceConflictsService } from '@modules/hr/timekeeping/attendance-conflicts/attendance-conflicts.service';
import { IndividualScheduleAssignmentModule } from '@modules/hr/individual-schedule-assignment/individual-schedule-assignment.module';
import { TeamModule } from '@modules/hr/team/team.module';
import { ShiftConfigurationService } from '@modules/hr/configuration/shift-configuration/shift-configuration.service';

@Module({
  providers: [
    TimekeepingComputationService,
    TimekeepingGroupingService,
    EmployeeListService,
    LocationService,
    BranchService,
    PayrollProcessingService,
    PayrollDataService,
    PayrollRatesService,
    DailySalaryComputationService,
    CutoffSalaryComputationService,
    GovernmentContributionsService,
    TaxComputationService,
    DeductionsService,
    AllowancesService,
    SalaryAdjustmentsService,
    PayrollAggregationService,
    AttendanceConflictsService,
    ShiftConfigurationService,
  ],
  exports: [
    TimekeepingComputationService,
    TimekeepingGroupingService,
    EmployeeListService,
    PayrollProcessingService,
    PayrollDataService,
    PayrollRatesService,
    DailySalaryComputationService,
    CutoffSalaryComputationService,
    GovernmentContributionsService,
    TaxComputationService,
    DeductionsService,
    AllowancesService,
    SalaryAdjustmentsService,
    PayrollAggregationService,
  ],
  imports: [
    CommonModule,
    forwardRef(() => HrConfigurationModule),
    forwardRef(() => HrFilingModule),
    AttendanceConflictsModule,
    TeamModule,
    IndividualScheduleAssignmentModule,
  ],
})
export class HrisComputationModule {}

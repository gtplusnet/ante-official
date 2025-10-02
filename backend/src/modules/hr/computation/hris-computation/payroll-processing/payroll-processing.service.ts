import { Injectable, Inject } from '@nestjs/common';
import { EmployeeSalaryComputationStage } from '@prisma/client';
import { PayrollContext } from './interfaces/payroll-service.interfaces';
import { PayrollDataService } from './services/payroll-data.service';
import { DailySalaryComputationService } from './services/daily-salary-computation.service';
import { CutoffSalaryComputationService } from './services/cutoff-salary-computation.service';
import { GovernmentContributionsService } from './services/government-contributions.service';
import { TaxComputationService } from './services/tax-computation.service';
import { DeductionsService } from './services/deductions.service';
import { AllowancesService } from './services/allowances.service';
import { SalaryAdjustmentsService } from './services/salary-adjustments.service';
import { PayrollAggregationService } from './services/payroll-aggregation.service';

@Injectable()
export class PayrollProcessingService {
  private timekeepingCutoffId: number;
  private context: PayrollContext;

  @Inject() private readonly payrollDataService: PayrollDataService;
  @Inject()
  private readonly dailySalaryComputationService: DailySalaryComputationService;
  @Inject()
  private readonly cutoffSalaryComputationService: CutoffSalaryComputationService;
  @Inject()
  private readonly governmentContributionsService: GovernmentContributionsService;
  @Inject() private readonly taxComputationService: TaxComputationService;
  @Inject() private readonly deductionsService: DeductionsService;
  @Inject() private readonly allowancesService: AllowancesService;
  @Inject() private readonly salaryAdjustmentsService: SalaryAdjustmentsService;
  @Inject()
  private readonly payrollAggregationService: PayrollAggregationService;

  public setTimekeepingCutoffId(timekeepingCutoffId: number): void {
    this.timekeepingCutoffId = timekeepingCutoffId;
  }

  public async computeSalary(): Promise<void> {
    // Initialize payroll context with all necessary data
    this.context = await this.payrollDataService.initializePayrollContext(
      this.timekeepingCutoffId,
    );

    // Step 1: Compute daily salary breakdowns
    await this.dailySalaryComputationService.computeDaily(this.context);

    // Step 2: Compute cutoff salary (basic pay only, no gross pay yet)
    await this.cutoffSalaryComputationService.computeCutoffSalary(this.context);

    // Step 3: Compute allowances (moved up from step 5)
    await this.allowancesService.computeAllowances(this.context);

    // Step 3.5: Calculate gross pay with allowances
    this.cutoffSalaryComputationService.calculateGrossPay(this.context);

    // Step 4: Compute government contributions (SSS, PhilHealth, Pag-IBIG) - now uses complete gross pay
    await this.governmentContributionsService.computeGovernmentContributions(
      this.context,
    );

    // Step 5: Compute loans and deductions
    await this.deductionsService.computeLoansAndDeductions(this.context);

    // Step 6: Compute salary adjustments
    await this.salaryAdjustmentsService.computeSalaryAdjustments(this.context);

    // Step 7: Compute tax
    await this.taxComputationService.computeTax(this.context);

    // Step 8: Calculate net pay
    this.cutoffSalaryComputationService.calculateNetPay(this.context);

    // Step 9: Mark computation as completed
    this.context.employeeSalaryComputation.stage =
      EmployeeSalaryComputationStage.COMPUTED;

    // Step 10: Save the final computation to database
    await this.payrollDataService.updateEmployeeSalaryComputation(
      this.context.employeeSalaryComputation.employeeTimekeepingCutoffId,
      this.context.employeeSalaryComputation,
    );

    // Step 11: Update cutoff date range totals
    await this.payrollAggregationService.updateTotalCutoffDateRangeInformation(
      this.context,
    );
  }
}

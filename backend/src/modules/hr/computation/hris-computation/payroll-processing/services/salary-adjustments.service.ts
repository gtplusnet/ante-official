import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { PayrollContext } from '../interfaces/payroll-service.interfaces';
import { SalaryAdjustmentType } from '@prisma/client';

@Injectable()
export class SalaryAdjustmentsService {
  @Inject() private readonly prismaService: PrismaService;

  async computeSalaryAdjustments(context: PayrollContext): Promise<void> {
    // Fetch all salary adjustments for this employee and cutoff
    const adjustments =
      await this.prismaService.employeeSalaryAdjustment.findMany({
        where: {
          accountId: context.employeeData.accountDetails.id,
          cutoffDateRangeId: context.timekeepingCutoffData.cutoffDateRangeId,
          isActive: true,
        },
      });

    let totalAllowanceAdjustment = 0;
    let totalDeductionAdjustment = 0;
    let totalSalaryAdjustment = 0;

    // Store the original basic pay before any salary adjustments
    context.employeeSalaryComputation.basicPayBeforeAdjustment =
      context.employeeSalaryComputation.basicPay;

    for (const adjustment of adjustments) {
      if (adjustment.adjustmentType === SalaryAdjustmentType.ALLOWANCE) {
        totalAllowanceAdjustment += Number(adjustment.amount);
      } else if (adjustment.adjustmentType === SalaryAdjustmentType.DEDUCTION) {
        totalDeductionAdjustment += Number(adjustment.amount);
      } else if (adjustment.adjustmentType === SalaryAdjustmentType.SALARY) {
        totalSalaryAdjustment += Number(adjustment.amount);
      }
    }

    // Apply salary adjustment to basic pay
    if (totalSalaryAdjustment !== 0) {
      context.employeeSalaryComputation.basicPay += totalSalaryAdjustment;

      // Recalculate gross pay to include the salary adjustment
      context.employeeSalaryComputation.grossPay =
        context.employeeSalaryComputation.basicPay +
        context.employeeSalaryComputation.totalAdditionalEarnings +
        context.employeeSalaryComputation.allowance;
    }

    // Update the salary computation with adjustment totals
    context.employeeSalaryComputation.earningSalaryAdjustment =
      totalAllowanceAdjustment;
    context.employeeSalaryComputation.deductionSalaryAdjustmnt =
      totalDeductionAdjustment;
    context.employeeSalaryComputation.salaryAdjustment = totalSalaryAdjustment;

    // Also update totalBasicSalary to include salary adjustments for tax calculation
    context.employeeSalaryComputation.totalBasicSalary =
      context.employeeSalaryComputation.basicSalary;
  }
}

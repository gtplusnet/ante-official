import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { EmployeeSalaryAdjustment, Prisma } from '@prisma/client';
import {
  CreateEmployeeSalaryAdjustmentDTO,
  UpdateEmployeeSalaryAdjustmentDTO,
  GetEmployeeSalaryAdjustmentsDTO,
} from './employee-salary-adjustment.interface';
import { PayrollProcessingService } from '@modules/hr/computation/hris-computation/payroll-processing/payroll-processing.service';

@Injectable()
export class EmployeeSalaryAdjustmentService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;
  @Inject() public payrollProcessingService: PayrollProcessingService;

  async create(
    data: CreateEmployeeSalaryAdjustmentDTO,
  ): Promise<EmployeeSalaryAdjustment> {
    // Verify the account exists
    const account = await this.prisma.account.findUnique({
      where: { id: data.accountId },
    });

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    // First, check if the cutoffDateRangeId is actually a timekeepingCutoffId
    let actualCutoffDateRangeId = data.cutoffDateRangeId;

    // If it's a number string, it might be a timekeepingCutoffId
    if (!isNaN(Number(data.cutoffDateRangeId))) {
      const timekeepingCutoff =
        await this.prisma.employeeTimekeepingCutoff.findFirst({
          where: {
            id: Number(data.cutoffDateRangeId),
            accountId: data.accountId,
          },
        });

      if (timekeepingCutoff) {
        actualCutoffDateRangeId = timekeepingCutoff.cutoffDateRangeId;
      }
    }

    // Verify the cutoff date range exists
    const cutoffDateRange = await this.prisma.cutoffDateRange.findUnique({
      where: { id: actualCutoffDateRangeId },
    });

    if (!cutoffDateRange) {
      throw new BadRequestException('Cutoff date range not found');
    }

    // Verify the configuration exists based on adjustment type
    if (data.adjustmentType === 'ALLOWANCE') {
      const allowanceConfig =
        await this.prisma.allowanceConfiguration.findUnique({
          where: { id: data.configurationId },
        });

      if (!allowanceConfig) {
        throw new BadRequestException('Allowance configuration not found');
      }
    } else if (data.adjustmentType === 'DEDUCTION') {
      const deductionConfig =
        await this.prisma.deductionConfiguration.findUnique({
          where: { id: data.configurationId },
        });

      if (!deductionConfig) {
        throw new BadRequestException('Deduction configuration not found');
      }
    }

    // Create the adjustment
    const adjustment = await this.prisma.employeeSalaryAdjustment.create({
      data: {
        accountId: data.accountId,
        cutoffDateRangeId: actualCutoffDateRangeId,
        adjustmentType: data.adjustmentType,
        configurationId: data.configurationId,
        title: data.title,
        amount: data.amount,
      },
    });

    // Trigger recomputation
    await this.triggerRecomputation(data.accountId, actualCutoffDateRangeId);

    return adjustment;
  }

  async update(
    data: UpdateEmployeeSalaryAdjustmentDTO,
  ): Promise<EmployeeSalaryAdjustment> {
    const existing = await this.prisma.employeeSalaryAdjustment.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      throw new BadRequestException('Salary adjustment not found');
    }

    const updateData: Prisma.EmployeeSalaryAdjustmentUpdateInput = {};

    if (data.amount !== undefined) {
      updateData.amount = data.amount;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    const adjustment = await this.prisma.employeeSalaryAdjustment.update({
      where: { id: data.id },
      data: updateData,
    });

    // Trigger recomputation
    await this.triggerRecomputation(
      existing.accountId,
      existing.cutoffDateRangeId,
    );

    return adjustment;
  }

  async delete(id: number): Promise<EmployeeSalaryAdjustment> {
    const existing = await this.prisma.employeeSalaryAdjustment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new BadRequestException('Salary adjustment not found');
    }

    // Soft delete by setting isActive to false
    const adjustment = await this.prisma.employeeSalaryAdjustment.update({
      where: { id },
      data: { isActive: false },
    });

    // Trigger recomputation
    await this.triggerRecomputation(
      existing.accountId,
      existing.cutoffDateRangeId,
    );

    return adjustment;
  }

  async findMany(
    filters: GetEmployeeSalaryAdjustmentsDTO,
  ): Promise<EmployeeSalaryAdjustment[]> {
    const where: Prisma.EmployeeSalaryAdjustmentWhereInput = {};

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters.cutoffDateRangeId) {
      where.cutoffDateRangeId = filters.cutoffDateRangeId;
    }

    if (filters.adjustmentType) {
      where.adjustmentType = filters.adjustmentType;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return await this.prisma.employeeSalaryAdjustment.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: number): Promise<EmployeeSalaryAdjustment> {
    const adjustment = await this.prisma.employeeSalaryAdjustment.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!adjustment) {
      throw new BadRequestException('Salary adjustment not found');
    }

    return adjustment;
  }

  async getByEmployeeAndCutoff(
    accountId: string,
    cutoffDateRangeId: string,
  ): Promise<{
    allowances: any[];
    deductions: any[];
    salaryAdjustments: any[];
    totalAllowances: number;
    totalDeductions: number;
    totalSalaryAdjustments: number;
  }> {
    // First, check if the cutoffDateRangeId is actually a timekeepingCutoffId
    let actualCutoffDateRangeId = cutoffDateRangeId;

    // If it's a number string, it might be a timekeepingCutoffId
    if (!isNaN(Number(cutoffDateRangeId))) {
      const timekeepingCutoff =
        await this.prisma.employeeTimekeepingCutoff.findFirst({
          where: {
            id: Number(cutoffDateRangeId),
            accountId: accountId,
          },
        });

      if (timekeepingCutoff) {
        actualCutoffDateRangeId = timekeepingCutoff.cutoffDateRangeId;
      }
    }

    // Fetch adjustments with configuration details
    const adjustments = await this.prisma.employeeSalaryAdjustment.findMany({
      where: {
        accountId,
        cutoffDateRangeId: actualCutoffDateRangeId,
        isActive: true,
      },
      include: {
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Enrich adjustments with configuration data
    const enrichedAdjustments = await Promise.all(
      adjustments.map(async (adj) => {
        let taxBasis = 'TAXABLE'; // default
        let category = null; // default

        if (adj.adjustmentType === 'ALLOWANCE') {
          const config = await this.prisma.allowanceConfiguration.findUnique({
            where: { id: adj.configurationId },
          });
          if (config) {
            taxBasis = config.taxBasis;
            category = config.category;
          }
        } else if (adj.adjustmentType === 'DEDUCTION') {
          // Deductions don't have tax basis or category, but we can set defaults
          taxBasis = 'NON_TAXABLE';
          category = null;
        } else if (adj.adjustmentType === 'SALARY') {
          // Salary adjustments are not taxable since they affect basic pay directly
          taxBasis = 'NON_TAXABLE';
          category = null;
        }

        return {
          ...adj,
          taxBasis,
          category,
        };
      }),
    );

    const allowances = enrichedAdjustments.filter(
      (adj) => adj.adjustmentType === 'ALLOWANCE',
    );
    const deductions = enrichedAdjustments.filter(
      (adj) => adj.adjustmentType === 'DEDUCTION',
    );
    const salaryAdjustments = enrichedAdjustments.filter(
      (adj) => adj.adjustmentType === 'SALARY',
    );

    const totalAllowances = allowances.reduce(
      (sum, adj) => sum + Number(adj.amount),
      0,
    );
    const totalDeductions = deductions.reduce(
      (sum, adj) => sum + Number(adj.amount),
      0,
    );
    const totalSalaryAdjustments = salaryAdjustments.reduce(
      (sum, adj) => sum + Number(adj.amount),
      0,
    );

    return {
      allowances,
      deductions,
      salaryAdjustments,
      totalAllowances,
      totalDeductions,
      totalSalaryAdjustments,
    };
  }

  private async triggerRecomputation(
    accountId: string,
    cutoffDateRangeId: string,
  ): Promise<void> {
    // Find the employee timekeeping cutoff for this account and cutoff date range
    const timekeepingCutoff =
      await this.prisma.employeeTimekeepingCutoff.findFirst({
        where: {
          accountId,
          cutoffDateRangeId,
        },
      });

    if (timekeepingCutoff) {
      // Trigger recomputation for this employee
      this.payrollProcessingService.setTimekeepingCutoffId(
        timekeepingCutoff.id,
      );
      await this.payrollProcessingService.computeSalary();
    }
  }
}

import { Injectable } from '@nestjs/common';
import { BaseSeeder, SeederMetadata } from './base.seeder';
import { PrismaService } from '@common/prisma.service';
import {
  CutoffType,
  SalaryRateType,
  DeductionType,
  DeductionPeriod,
  DeductionTargetBasis,
} from '@prisma/client';
import overtimeRateFactorsReference from '../../../reference/overtime-rate-factors.reference';

// Type definitions for cutoff configurations
interface CutoffConfigSemiMonthly {
  firstCutoffPeriod: number;
  lastCutoffPeriod: number;
}

interface CutoffConfigMonthly {
  cutoffPeriod: number;
}

// Constants for default configurations
const DEFAULT_CUTOFFS = {
  SEMIMONTHLY: {
    code: 'SEMIMONTHLY-DEFAULT',
    type: CutoffType.SEMIMONTHLY,
    config: {
      firstCutoffPeriod: 15,
      lastCutoffPeriod: 28,
    } as CutoffConfigSemiMonthly,
    releaseProcessingDays: 3,
  },
  MONTHLY: {
    code: 'MONTHLY-DEFAULT',
    type: CutoffType.MONTHLY,
    config: {
      cutoffPeriod: 25,
    } as CutoffConfigMonthly,
    releaseProcessingDays: 5,
  },
} as const;

const DEFAULT_PAYROLL_GROUPS = {
  REGULAR_MONTHLY: {
    code: 'REGULAR-MONTHLY',
    cutoffType: 'SEMIMONTHLY',
    salaryRateType: SalaryRateType.MONTHLY_RATE,
    lateGraceTimeMinutes: 15,
    undertimeGraceTimeMinutes: 15,
    overtimeGraceTimeMinutes: 30,
    lateDeductionType: DeductionType.BASED_ON_SALARY,
    undertimeDeductionType: DeductionType.BASED_ON_SALARY,
    absentDeductionHours: 8,
    shiftingWorkingDaysPerWeek: 5,
    deductionPeriodSSS: DeductionPeriod.EVERY_PERIOD,
    deductionPeriodPhilhealth: DeductionPeriod.EVERY_PERIOD,
    deductionPeriodPagibig: DeductionPeriod.EVERY_PERIOD,
    deductionPeriodWitholdingTax: DeductionPeriod.EVERY_PERIOD,
    deductionBasisSSS: DeductionTargetBasis.BASIC_SALARY,
    deductionBasisPhilhealth: DeductionTargetBasis.BASIC_SALARY,
  },
  DAILY_WAGE: {
    code: 'DAILY-WAGE',
    cutoffType: 'SEMIMONTHLY',
    salaryRateType: SalaryRateType.DAILY_RATE,
    lateGraceTimeMinutes: 10,
    undertimeGraceTimeMinutes: 10,
    overtimeGraceTimeMinutes: 15,
    lateDeductionType: DeductionType.BASED_ON_SALARY,
    undertimeDeductionType: DeductionType.BASED_ON_SALARY,
    absentDeductionHours: 8,
    shiftingWorkingDaysPerWeek: 6,
    deductionPeriodSSS: DeductionPeriod.LAST_PERIOD,
    deductionPeriodPhilhealth: DeductionPeriod.LAST_PERIOD,
    deductionPeriodPagibig: DeductionPeriod.LAST_PERIOD,
    deductionPeriodWitholdingTax: DeductionPeriod.EVERY_PERIOD,
    deductionBasisSSS: DeductionTargetBasis.BASIC_PAY,
    deductionBasisPhilhealth: DeductionTargetBasis.BASIC_PAY,
  },
  CONTRACTUAL: {
    code: 'CONTRACTUAL',
    cutoffType: 'MONTHLY',
    salaryRateType: SalaryRateType.FIXED_RATE,
    lateGraceTimeMinutes: 0,
    undertimeGraceTimeMinutes: 0,
    overtimeGraceTimeMinutes: 0,
    lateDeductionType: DeductionType.NOT_DEDUCTED,
    undertimeDeductionType: DeductionType.NOT_DEDUCTED,
    absentDeductionHours: 0,
    shiftingWorkingDaysPerWeek: 5,
    deductionPeriodSSS: DeductionPeriod.NOT_DEDUCTED,
    deductionPeriodPhilhealth: DeductionPeriod.NOT_DEDUCTED,
    deductionPeriodPagibig: DeductionPeriod.NOT_DEDUCTED,
    deductionPeriodWitholdingTax: DeductionPeriod.EVERY_PERIOD,
    deductionBasisSSS: DeductionTargetBasis.BASIC_SALARY,
    deductionBasisPhilhealth: DeductionTargetBasis.BASIC_SALARY,
  },
} as const;

// Enhanced metadata interface for better type safety
interface PayrollGroupMetadata extends SeederMetadata {
  details?: {
    cutoffs: Array<{ code: string; id: number; type: string }>;
    payrollGroups: Array<{
      code: string;
      id: number;
      salaryRateType: string;
      cutoffId: number;
    }>;
  };
}

@Injectable()
export class PayrollGroupSeeder extends BaseSeeder {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  get type(): string {
    return 'payroll_group';
  }

  get name(): string {
    return 'Payroll Group';
  }

  get description(): string {
    return 'Creates default cutoffs and payroll groups for a company';
  }

  async canSeed(companyId: number): Promise<boolean> {
    // Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return false;
    }

    // Check if company already has payroll groups
    const existingPayrollGroups = await this.prisma.payrollGroup.count({
      where: { companyId, isDeleted: false },
    });

    // Check if company already has cutoffs
    const existingCutoffs = await this.prisma.cutoff.count({
      where: { companyId, isDeleted: false },
    });

    // Can seed if both payroll groups and cutoffs don't exist
    return existingPayrollGroups === 0 && existingCutoffs === 0;
  }

  async seed(companyId: number): Promise<PayrollGroupMetadata> {
    const metadata: PayrollGroupMetadata = {
      totalRecords: 0,
      processedRecords: 0,
      skippedRecords: 0,
      errors: [],
    };

    try {
      // Verify company exists before seeding
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        throw new Error(`Company with ID ${companyId} not found`);
      }

      // Use transaction for atomicity
      await this.prisma.$transaction(async (tx) => {
        const createdCutoffs: Record<string, number> = {};
        const cutoffDetails: Array<{ code: string; id: number; type: string }> =
          [];

        // 1. Create cutoffs
        for (const [key, cutoffConfig] of Object.entries(DEFAULT_CUTOFFS)) {
          const cutoff = await tx.cutoff.create({
            data: {
              cutoffCode: cutoffConfig.code,
              cutoffType: cutoffConfig.type,
              cutoffConfig: JSON.stringify(cutoffConfig.config),
              releaseProcessingDays: cutoffConfig.releaseProcessingDays,
              companyId,
              isDeleted: false,
            },
          });
          createdCutoffs[key] = cutoff.id;
          cutoffDetails.push({
            code: cutoffConfig.code,
            id: cutoff.id,
            type: cutoffConfig.type,
          });
          metadata.processedRecords!++;
        }

        // 2. Create payroll groups
        const payrollGroupDetails: Array<{
          code: string;
          id: number;
          salaryRateType: string;
          cutoffId: number;
        }> = [];

        for (const [_key, groupConfig] of Object.entries(
          DEFAULT_PAYROLL_GROUPS,
        )) {
          const cutoffId = createdCutoffs[groupConfig.cutoffType];

          const payrollGroup = await tx.payrollGroup.create({
            data: {
              payrollGroupCode: groupConfig.code,
              cutoffId,
              salaryRateType: groupConfig.salaryRateType,
              lateGraceTimeMinutes: groupConfig.lateGraceTimeMinutes,
              undertimeGraceTimeMinutes: groupConfig.undertimeGraceTimeMinutes,
              overtimeGraceTimeMinutes: groupConfig.overtimeGraceTimeMinutes,
              lateDeductionType: groupConfig.lateDeductionType,
              undertimeDeductionType: groupConfig.undertimeDeductionType,
              lateDeductionCustom: JSON.stringify({}),
              undertimeDeductionCustom: JSON.stringify({}),
              absentDeductionHours: groupConfig.absentDeductionHours,
              shiftingWorkingDaysPerWeek:
                groupConfig.shiftingWorkingDaysPerWeek,
              deductionPeriodSSS: groupConfig.deductionPeriodSSS,
              deductionPeriodPhilhealth: groupConfig.deductionPeriodPhilhealth,
              deductionPeriodPagibig: groupConfig.deductionPeriodPagibig,
              deductionPeriodWitholdingTax:
                groupConfig.deductionPeriodWitholdingTax,
              deductionBasisSSS: groupConfig.deductionBasisSSS,
              deductionBasisPhilhealth: groupConfig.deductionBasisPhilhealth,
              overtimeRateFactors: JSON.stringify(overtimeRateFactorsReference),
              companyId,
              isDeleted: false,
            },
          });

          payrollGroupDetails.push({
            code: groupConfig.code,
            id: payrollGroup.id,
            salaryRateType: groupConfig.salaryRateType,
            cutoffId,
          });
          metadata.processedRecords!++;
        }

        metadata.totalRecords = metadata.processedRecords;
        metadata.details = {
          cutoffs: cutoffDetails,
          payrollGroups: payrollGroupDetails,
        };
      });
    } catch (error) {
      const contextualError = `Failed to seed payroll groups for company ${companyId}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      metadata.errors!.push(contextualError);
      throw new Error(contextualError);
    }

    return metadata;
  }

  async validate(companyId: number): Promise<boolean> {
    // Check if the company has at least one payroll group and cutoff
    const payrollGroupCount = await this.prisma.payrollGroup.count({
      where: { companyId, isDeleted: false },
    });

    const cutoffCount = await this.prisma.cutoff.count({
      where: { companyId, isDeleted: false },
    });

    return payrollGroupCount > 0 && cutoffCount > 0;
  }
}

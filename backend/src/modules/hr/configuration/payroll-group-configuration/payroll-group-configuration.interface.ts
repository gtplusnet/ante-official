import {
  IsEmpty,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { DeductionTargetBasis, DeductionType } from '@prisma/client';
import { Exists } from '@common/validators/exists.validator';
import { Unique } from '@common/validators/unique.validator';
import { SalaryRateType, DeductionPeriod } from '@prisma/client';
import { Type } from 'class-transformer';
import { DeductionTimeBasis } from '../../../../shared/enums/deduction-time-basis.enum';

export class CustomDeduction {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @IsNotEmpty()
  @IsEnum(DeductionTimeBasis)
  timeBasis: DeductionTimeBasis;
}

export class OvertimeRateFactorsBreakdown {
  @IsNotEmpty()
  @IsNumber()
  noOvertime: number;

  @IsNotEmpty()
  @IsNumber()
  withOvertime: number;

  @IsNotEmpty()
  @IsNumber()
  withNightDifferential: number;

  @IsNotEmpty()
  @IsNumber()
  withNightDifferentialAndOvertime: number;
}

export class OvertimeRateFactorsHoliday {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => OvertimeRateFactorsBreakdown)
  nonHoliday: OvertimeRateFactorsBreakdown;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => OvertimeRateFactorsBreakdown)
  regularHoliday: OvertimeRateFactorsBreakdown;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => OvertimeRateFactorsBreakdown)
  specialHoliday: OvertimeRateFactorsBreakdown;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => OvertimeRateFactorsBreakdown)
  doubleHoliday: OvertimeRateFactorsBreakdown;
}

export class OvertimeRateFactors {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => OvertimeRateFactorsHoliday)
  workDay: OvertimeRateFactorsHoliday;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => OvertimeRateFactorsHoliday)
  restDay: OvertimeRateFactorsHoliday;
}

export class PayrollConfigurationCreateDTO {
  @IsNotEmpty({ message: 'Payroll Group Code should not be empty.' })
  @IsString()
  @Unique('payrollGroup', 'payrollGroupCode', {
    message: 'Payroll group code already exists.',
  })
  payrollGroupCode: string;

  @IsNotEmpty()
  @IsNumber()
  @Exists('cutoff', 'id', { message: 'Cutoff ID does not exist.' })
  cutoffId: number;

  @IsNotEmpty()
  @IsEnum(SalaryRateType)
  salaryRateType: SalaryRateType;

  @IsNotEmpty()
  @IsEnum(DeductionPeriod)
  deductionPeriodWitholdingTax: DeductionPeriod;

  @IsNotEmpty()
  @IsEnum(DeductionPeriod)
  deductionPeriodSSS: DeductionPeriod;

  @IsNotEmpty()
  @IsEnum(DeductionPeriod)
  deductionPeriodPhilhealth: DeductionPeriod;

  @IsNotEmpty()
  @IsEnum(DeductionPeriod)
  deductionPeriodPagibig: DeductionPeriod;

  @IsNotEmpty()
  @IsEnum(DeductionTargetBasis)
  deductionBasisSSS: DeductionTargetBasis;

  @IsNotEmpty()
  @IsEnum(DeductionTargetBasis)
  deductionBasisPhilhealth: DeductionTargetBasis;

  @IsNotEmpty()
  @IsEnum(DeductionType)
  lateDeductionType: DeductionType;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomDeduction)
  lateDeductionCustom?: CustomDeduction;

  @IsNotEmpty()
  @IsEnum(DeductionType)
  undertimeDeductionType: DeductionType;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomDeduction)
  undertimeDeductionCustom?: CustomDeduction;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(24)
  absentDeductionHours: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(7)
  shiftingWorkingDaysPerWeek: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  lateGraceTimeMinutes: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  undertimeGraceTimeMinutes: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  overtimeGraceTimeMinutes: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => OvertimeRateFactors)
  overtimeRateFactors: OvertimeRateFactors;
}

export class PayrollConfigurationUpdateDTO extends PayrollConfigurationCreateDTO {
  @IsOptional()
  @IsNumber()
  @Exists('payrollGroup', 'id', { message: 'Payroll group ID does not exist.' })
  id?: number;

  @IsEmpty()
  payrollGroupCode: string;
}

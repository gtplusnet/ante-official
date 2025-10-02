import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  ValidateIf,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

import { LeaveRenewalType } from '@prisma/client';
import {
  CreateLeavePlanRequest,
  UpdateLeavePlanRequest,
  EmployeeAssignmentRequest,
  AssignEmployeesToPlanRequest,
  UpdateEmployeeCreditsRequest,
  AdjustEmployeeCreditsRequest,
  UpdateEmployeeLeaveSettingsRequest,
  BulkCreditAdjustmentRequest,
  HistoryExportRequest,
  HistorySummaryRequest,
  EmployeeAllHistoryRequest,
} from '@shared/request/leave-configuration.request';

export class CreateLeavePlanDto implements CreateLeavePlanRequest {
  @IsNumber()
  leaveTypeConfigurationId: number;

  @IsString()
  planName: string;

  @IsBoolean()
  canCarryOver: boolean;

  @IsOptional()
  @IsNumber()
  maxCarryOverCredits?: number;

  @IsBoolean()
  canConvertToCash: boolean;

  @IsOptional()
  @IsNumber()
  maxCashConversionCredits?: number;

  @IsBoolean()
  canFileSameDay: boolean;

  @IsBoolean()
  allowLateFiling: boolean;

  @IsOptional()
  @IsNumber()
  advanceFilingDays?: number;

  @IsOptional()
  @IsNumber()
  maxConsecutiveDays?: number;

  @IsBoolean()
  canFileAgainstFutureCredits: boolean;

  @IsOptional()
  @IsNumber()
  maxAdvanceFilingDays?: number;

  @IsBoolean()
  isAttachmentMandatory: boolean;

  @IsBoolean()
  isLimitedConsecutiveFilingDays: boolean;

  @ValidateIf((o) => o.isLimitedConsecutiveFilingDays === true)
  @IsNumber()
  @Min(1)
  consecutiveFilingDays?: number;

  @IsEnum(LeaveRenewalType)
  renewalType:
    | 'HIRING_ANNIVERSARY'
    | 'START_OF_YEAR'
    | 'MONTHLY'
    | 'CUSTOM_DATE';

  @ValidateIf((o) => o.renewalType === LeaveRenewalType.CUSTOM_DATE)
  @IsString()
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  customRenewalDate?: string;
}

export class UpdateLeavePlanDto implements UpdateLeavePlanRequest {
  @IsOptional()
  @IsNumber()
  leaveTypeConfigurationId?: number;

  @IsOptional()
  @IsString()
  planName?: string;

  @IsOptional()
  @IsBoolean()
  canCarryOver?: boolean;

  @IsOptional()
  @IsNumber()
  maxCarryOverCredits?: number;

  @IsOptional()
  @IsBoolean()
  canConvertToCash?: boolean;

  @IsOptional()
  @IsNumber()
  maxCashConversionCredits?: number;

  @IsOptional()
  @IsBoolean()
  canFileSameDay?: boolean;

  @IsOptional()
  @IsBoolean()
  allowLateFiling?: boolean;

  @IsOptional()
  @IsNumber()
  advanceFilingDays?: number;

  @IsOptional()
  @IsNumber()
  maxConsecutiveDays?: number;

  @IsOptional()
  @IsBoolean()
  canFileAgainstFutureCredits?: boolean;

  @IsOptional()
  @IsNumber()
  maxAdvanceFilingDays?: number;

  @IsOptional()
  @IsBoolean()
  isAttachmentMandatory?: boolean;

  @IsOptional()
  @IsBoolean()
  isLimitedConsecutiveFilingDays?: boolean;

  @ValidateIf((o) => o.isLimitedConsecutiveFilingDays === true)
  @IsNumber()
  @Min(1)
  consecutiveFilingDays?: number;

  @IsOptional()
  @IsEnum(LeaveRenewalType)
  renewalType?:
    | 'HIRING_ANNIVERSARY'
    | 'START_OF_YEAR'
    | 'MONTHLY'
    | 'CUSTOM_DATE';

  @ValidateIf((o) => o.renewalType === LeaveRenewalType.CUSTOM_DATE)
  @IsString()
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  customRenewalDate?: string;
}

export class EmployeeAssignmentDto implements EmployeeAssignmentRequest {
  @IsString()
  accountId: string;

  @IsNumber()
  totalAnnualCredits: number;

  @IsNumber()
  monthlyAccrualCredits: number;

  @IsNumber()
  initialLeaveCredits: number;

  @IsNumber()
  leaveCreditsGivenUpfront: number;

  @ValidateIf((o) => o.monthlyAccrualCredits > 0)
  @IsInt()
  @Min(1)
  @Max(31)
  @Transform(({ value }) => parseInt(value))
  monthDayCreditsAccrual?: number;
}

export class AssignEmployeesToPlanDto implements AssignEmployeesToPlanRequest {
  @IsNumber()
  leavePlanId: number;

  @Type(() => EmployeeAssignmentDto)
  employees: EmployeeAssignmentDto[];
}

export class UpdateEmployeeCreditsDto implements UpdateEmployeeCreditsRequest {
  @IsOptional()
  @IsNumber()
  currentCredits?: number;

  @IsOptional()
  @IsNumber()
  usedCredits?: number;

  @IsOptional()
  @IsNumber()
  carriedCredits?: number;
}

export class AdjustEmployeeCreditsDto implements AdjustEmployeeCreditsRequest {
  @IsNumber()
  amount: number;

  @IsString()
  reason: string;

  @IsEnum(['CREDIT', 'DEBIT', 'ADJUSTMENT'])
  transactionType: 'CREDIT' | 'DEBIT' | 'ADJUSTMENT';
}

export class UpdateEmployeeLeaveSettingsDto
  implements UpdateEmployeeLeaveSettingsRequest
{
  @IsOptional()
  @IsNumber()
  totalAnnualCredits?: number;

  @IsOptional()
  @IsNumber()
  monthlyAccrualCredits?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  @Transform(({ value }) => parseInt(value))
  monthDay?: number;

  @IsOptional()
  @IsNumber()
  leaveCreditsGivenUpfront?: number;
}

export class BulkCreditAdjustmentItemDto {
  @IsNumber()
  employeeLeavePlanId: number;

  @IsNumber()
  amount: number;

  @IsString()
  reason: string;

  @IsEnum(['CREDIT', 'DEBIT', 'ADJUSTMENT'])
  transactionType: 'CREDIT' | 'DEBIT' | 'ADJUSTMENT';
}

export class BulkCreditAdjustmentDto implements BulkCreditAdjustmentRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkCreditAdjustmentItemDto)
  adjustments: BulkCreditAdjustmentItemDto[];
}

export class HistoryExportDto implements HistoryExportRequest {
  @IsOptional()
  @IsEnum(['excel'])
  format?: 'excel';

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class HistorySummaryDto implements HistorySummaryRequest {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  year?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class EmployeeAllHistoryDto implements EmployeeAllHistoryRequest {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  leavePlanId?: number;
}

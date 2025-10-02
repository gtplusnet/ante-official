import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Exists } from '@common/validators/exists.validator';
import { CutoffType, CutoffPeriodType } from '@prisma/client';
import { DateFormat } from '../../../../shared/response/utility.format';
import {
  CutoffConfigMonthly,
  CutoffConfigSemiMonthly,
  CutoffConfigWeekly,
} from '../../../../shared/response/cutoff.response';

export class GetCutOffDTO {
  @IsNotEmpty()
  @Exists('cutoff', 'id', { message: 'CutOff ID does not exist.' })
  id: number;
}

export class GetCutOffDateRangeDTO {
  @IsNotEmpty()
  @Exists('cutoffDateRange', 'id', {
    message: 'CutOff Date Range ID does not exist.',
  })
  id: string;
}

export class CutoffCreateDTO {
  @IsNotEmpty()
  @IsString()
  cutoffCode: string;

  @IsNotEmpty()
  @IsString()
  cutoffType: CutoffType;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Object)
  cutoffConfig:
    | CutoffConfigMonthly
    | CutoffConfigWeekly
    | CutoffConfigSemiMonthly;

  @IsNotEmpty()
  @IsNumber()
  @Max(31)
  releaseProcessingDays: number;
}

export class GetConfigSelectCutOffDTO {
  @IsNotEmpty()
  @IsString()
  cutoffType: CutoffType;
}

export class CutoffUpdateDTO extends CutoffCreateDTO {
  @IsNotEmpty()
  @IsNumber()
  @Exists('cutoff', 'id', { message: 'CutOff ID does not exist.' })
  id?: number;
}

export interface CutoffDate {
  cutoffId?: number;
  dateRangeCode: string;
  dateRange: string;
  fromDate: DateFormat;
  toDate: DateFormat;
  releaseDate: DateFormat;
  cutoffPeriodType: CutoffPeriodType;
}

import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
} from 'class-validator';
import { Exists } from '@common/validators/exists.validator';
import {
  CreateAllowancePlanRequest,
  UpdateAllowancePlanRequest,
  AddAllowancePlanBalanceRequest,
  PayAllowancePlanBalanceRequest,
} from '../../../../shared/request/allowance-plan.request';
import { DeductionPeriod } from '@prisma/client';

export class CreateAllowancePlanDTO implements CreateAllowancePlanRequest {
  @IsNotEmpty()
  @IsString()
  @Exists('employeeData', 'accountId')
  employeeAccountId: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsDateString()
  effectivityDate: string;

  @IsNotEmpty()
  @IsNumber()
  @Exists('allowanceConfiguration', 'id')
  allowanceConfigurationId: number;

  @IsNotEmpty()
  @IsEnum(DeductionPeriod)
  deductionPeriod: DeductionPeriod;
}

export class UpdateAllowancePlanDTO
  extends CreateAllowancePlanDTO
  implements UpdateAllowancePlanRequest
{
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

export class AddAllowancePlanBalanceDTO
  implements AddAllowancePlanBalanceRequest
{
  @IsNotEmpty()
  @IsNumber()
  @Exists('allowancePlan', 'id')
  allowancePlanId: number;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  remarks: string;
}

export class PayAllowancePlanBalanceDTO
  implements PayAllowancePlanBalanceRequest
{
  @IsNotEmpty()
  @IsNumber()
  @Exists('allowancePlan', 'id')
  allowancePlanId: number;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  remarks: string;
}

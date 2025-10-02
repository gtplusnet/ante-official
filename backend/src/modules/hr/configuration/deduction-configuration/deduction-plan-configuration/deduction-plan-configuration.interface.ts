import { DeductionPeriod } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { Exists } from '@common/validators/exists.validator';
import {
  CreateDeductionPlanConfigurationRequest,
  UpdateDeductionPlanConfigurationRequest,
  AddDeductionPlanBalanceRequest,
  PayDeductionPlanBalanceRequest,
} from '@shared/request';

export class CreateDeductionPlanDTO
  implements CreateDeductionPlanConfigurationRequest
{
  @IsNotEmpty()
  @IsString()
  @Exists('employeeData', 'accountId')
  employeeAccountId: string;

  @IsNotEmpty()
  @IsNumber()
  loanAmount: number;

  @IsNotEmpty()
  @IsNumber()
  monthlyAmortization: number;

  @IsNotEmpty()
  @IsEnum(DeductionPeriod)
  deductionPeriod: DeductionPeriod;

  @IsNotEmpty()
  @IsDateString()
  effectivityDate: string;

  @IsNotEmpty()
  @IsNumber()
  @Exists('deductionConfiguration', 'id')
  deductionConfigurationId: number;
}

export class UpdateDeductionPlanDTO
  extends CreateDeductionPlanDTO
  implements UpdateDeductionPlanConfigurationRequest
{
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

export class AddDeductionPlanBalanceDTO
  implements AddDeductionPlanBalanceRequest
{
  @IsNotEmpty()
  @IsNumber()
  @Exists('deductionPlan', 'id')
  deductionPlanId: number;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  remarks: string;
}

export class PayDeductionPlanBalanceDTO
  implements PayDeductionPlanBalanceRequest
{
  @IsNotEmpty()
  @IsNumber()
  @Exists('deductionPlan', 'id')
  deductionPlanId: number;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  remarks: string;
}

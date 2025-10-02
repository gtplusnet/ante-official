import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { AllowanceType } from '@prisma/client';
import {
  CreateAllowanceConfigurationRequest,
  UpdateAllowanceConfigurationRequest,
} from '../../../../shared/request/allowance-configuration.request';

export class CreateAllowanceConfigurationDTO
  implements CreateAllowanceConfigurationRequest
{
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(AllowanceType)
  allowanceCategory: AllowanceType;

  @IsOptional()
  @IsNumber()
  parentDeductionId?: number;
}

export class UpdateAllowanceConfigurationDTO
  extends CreateAllowanceConfigurationDTO
  implements UpdateAllowanceConfigurationRequest
{
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

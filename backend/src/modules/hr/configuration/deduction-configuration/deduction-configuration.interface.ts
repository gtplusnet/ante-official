import {
  CreateDeductionConfigurationRequest,
  UpdateDeductionConfigurationRequest,
} from '../../../../shared/request';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Exists } from '@common/validators/exists.validator';
import { DeductionCategory } from '@prisma/client';

export class CreateDeductionConfigurationDTO
  implements CreateDeductionConfigurationRequest
{
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  @Exists('deductionConfiguration', 'id', {
    message: 'Parent Deduction ID does not exist.',
  })
  parentDeduction: number;

  @IsNotEmpty()
  @IsEnum(DeductionCategory)
  deductionCategory: DeductionCategory;
}

export class UpdateDeductionConfigurationDTO
  extends CreateDeductionConfigurationDTO
  implements UpdateDeductionConfigurationRequest
{
  @IsNotEmpty()
  @IsNumber()
  @Exists('deductionConfiguration', 'id', {
    message: 'Deduction Configuration ID does not exist.',
  })
  id: number;
}

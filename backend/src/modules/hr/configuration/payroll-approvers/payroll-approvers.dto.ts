import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsNotEmpty,
  ArrayNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { TableDto } from '@common/dto/discussion.interface';
import {
  AddPayrollApproverRequest,
  BulkAddPayrollApproverRequest,
  DeletePayrollApproverRequest,
  TableRequest,
} from '../../../../shared/request';
import { Exists } from '@common/validators/exists.validator';

export class ApprovalLevelObject {
  @IsNumber()
  value: number;

  @IsString()
  label: string;
}

export class AddPayrollApproverDto implements AddPayrollApproverRequest {
  @IsString()
  @IsNotEmpty()
  @Exists('account', 'id', { message: 'Account does not exist' })
  accountId: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'object' && value?.value !== undefined) {
      return value.value;
    }
    return value;
  })
  @IsNumber()
  approvalLevel?: number;
}

export class BulkAddPayrollApproverDto
  implements BulkAddPayrollApproverRequest
{
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Exists('account', 'id', {
    each: true,
    message: 'One or more accounts do not exist',
  })
  accountIds: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'object' && value?.value !== undefined) {
      return value.value;
    }
    return value;
  })
  @IsNumber()
  approvalLevel?: number;
}

export class DeletePayrollApproverDto implements DeletePayrollApproverRequest {
  @IsString()
  @IsNotEmpty()
  @Exists('account', 'id', { message: 'Account does not exist' })
  accountId: string;
}

export class PayrollApproverTableDto extends TableDto implements TableRequest {}

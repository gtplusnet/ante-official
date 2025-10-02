import { IsNotEmpty, IsNumber, IsString, IsEnum } from 'class-validator';
import { ProcessSingleEmployeeRequest } from '../../../../shared/request';
import { Exists } from '@common/validators/exists.validator';
import { CutoffDateRangeStatus } from '@prisma/client';

export class ProcessSingleEmployeeDTO implements ProcessSingleEmployeeRequest {
  @IsNotEmpty()
  @Exists('employeeTimekeepingCutoff', 'id', {
    message: 'Timekeeping data does not exist.',
  })
  @IsNumber()
  timekeepingCutoffId: number;
}

export class GetCutoffListDTO {
  @IsNotEmpty()
  @IsString()
  @IsEnum(CutoffDateRangeStatus)
  status: CutoffDateRangeStatus;
}

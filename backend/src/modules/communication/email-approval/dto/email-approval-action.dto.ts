import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

import { ProcessEmailApprovalRequest } from '@shared/request';

export class ProcessEmailApprovalDto implements ProcessEmailApprovalRequest {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class EmailApprovalRejectionDto {
  @IsNotEmpty()
  @IsString()
  remarks: string;
}

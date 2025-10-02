import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PayeeType, FundAccountType } from '@prisma/client';

export class RFPCreateDTO {
  @IsNotEmpty()
  @IsString()
  readonly payeeType: PayeeType;

  @IsNotEmpty()
  payeeId: string;

  @IsNotEmpty()
  @IsString()
  readonly paymentType: FundAccountType;

  @IsOptional()
  @IsNumber()
  readonly projectId?: number;

  @IsNotEmpty()
  @IsNumber()
  readonly amount: number;

  @IsOptional()
  @IsNumber()
  readonly purchaseOrderId?: number;

  @IsNotEmpty()
  @IsString()
  readonly memo: string;
}

export class RFPApproveDTO {
  @IsNotEmpty()
  @IsNumber()
  readonly id: number;

  @IsOptional()
  @IsString()
  readonly memo: string;

  @IsOptional()
  @IsNumber()
  readonly fundAccountId: number;
}

export class RFPRejectDTO {
  @IsNotEmpty()
  @IsNumber()
  readonly id: number;

  @IsOptional()
  @IsString()
  readonly memo: string;
}

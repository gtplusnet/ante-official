import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import {
  FundAccountType,
  FundTransactionCode,
  FundTransactionType,
} from '@prisma/client';

export class createFundTranferDto {
  @IsNotEmpty()
  @IsNumber()
  fromFundAccountId: number;

  @IsNotEmpty()
  @IsNumber()
  toFundAccountId: number;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsNumber()
  fee: number;

  @IsString()
  memo: string;
}
export class createFundTransactionDto {
  @IsNotEmpty()
  @IsNumber()
  fundAccountId: number;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsString()
  memo: string;

  @IsString()
  type: FundTransactionType;
}

export class FundAccountDto {
  readonly id?: number;

  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsString()
  readonly description?: string;

  @IsNotEmpty()
  @IsString()
  readonly accountNumber: string;

  @IsNotEmpty()
  @IsString()
  readonly type: FundAccountType;

  readonly initialBalance?: number;
}

export class CreateTransactionDTO {
  @IsNotEmpty()
  @IsNumber()
  fundAccountId: number;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsString()
  memo: string;

  @IsString()
  type: FundTransactionType;

  @IsString()
  code: FundTransactionCode;
}

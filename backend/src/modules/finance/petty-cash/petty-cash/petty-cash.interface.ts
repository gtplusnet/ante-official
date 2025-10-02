import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { PettyCashTransactionType } from '@prisma/client';

export class IssuePettyCashDTO {
  @IsString()
  accountId: string;

  @IsNumber()
  amount: number;

  @IsNotEmpty()
  paymentType: string;

  @IsString()
  memo: string;
}

export class LiquidatePettyCashDTO {
  @IsNumber()
  @IsNotEmpty()
  attachmentProof: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  receiptNumber?: string;

  @IsDateString()
  @IsOptional()
  receiptDate?: string;

  @IsString()
  @IsOptional()
  vendorName?: string;

  @IsString()
  @IsOptional()
  vendorAddress?: string;

  @IsString()
  @IsOptional()
  vendorTin?: string;

  @IsString()
  @IsOptional()
  expenseCategory?: string;

  @IsString()
  @IsOptional()
  businessPurpose?: string;

  @IsBoolean()
  @IsOptional()
  isAiExtracted?: boolean;

  @IsNumber()
  @IsOptional()
  pettyCashHolderId?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  vatAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  withholdingTaxAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  vatAmountConfidence?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  withholdingTaxConfidence?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  totalAIConfidence?: number;
}

export class LiquidateApproveDTO {
  @IsNumber()
  @IsNotEmpty()
  id: number;
}

export class LiquidateRejectDTO extends LiquidateApproveDTO {
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class AssignPettyCashDTO {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  initialAmount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsNumber()
  @IsNotEmpty()
  fundAccountId: number;
}

export class RefillPettyCashDTO {
  @IsNumber()
  @IsNotEmpty()
  pettyCashHolderId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsNumber()
  @IsNotEmpty()
  fundAccountId: number;
}

export class DeductPettyCashDTO {
  @IsNumber()
  @IsNotEmpty()
  pettyCashHolderId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class PettyCashHolderDTO {
  id: number;
  account: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
  initialAmount: number;
  currentBalance: number;
  actualBalance?: number; // For compatibility with frontend
  pendingLiquidation?: number; // Sum of pending liquidations
  reason: string;
  isActive: boolean;
  fundAccountId?: number;
  fundAccount?: {
    id: number;
    name: string;
    accountNumber: string;
    balance: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class PettyCashTransactionDTO {
  id: number;
  type: PettyCashTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  performedBy: {
    id: string;
    name: string;
  };
  fundTransactionId?: number;
  transferFromHolderId?: number;
  transferFromHolder?: {
    id: number;
    account: {
      id: string;
      name: string;
    };
  };
  createdAt: Date;
}

export class ReturnPettyCashDTO {
  @IsNumber()
  @IsNotEmpty()
  pettyCashHolderId: number;

  @IsNumber()
  @IsNotEmpty()
  fundAccountId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class TransferPettyCashDTO {
  @IsNumber()
  @IsNotEmpty()
  fromHolderId: number;

  @IsNumber()
  @IsNotEmpty()
  toHolderId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ExtractReceiptDataDTO {
  @IsNumber()
  @IsNotEmpty()
  fileId: number;
}

export class ExtractedReceiptDataDTO {
  receiptNumber?: string;
  receiptDate?: string;
  vendorName?: string;
  vendorAddress?: string;
  vendorTin?: string;
  amount?: number;
  expenseCategory?: string;
  isAiExtracted: boolean;
  vatAmount?: number;
  withholdingTaxAmount?: number;
  vatAmountConfidence?: number;
  withholdingTaxConfidence?: number;
  // Additional confidence scores for all fields
  receiptNumberConfidence?: number;
  receiptDateConfidence?: number;
  vendorNameConfidence?: number;
  vendorAddressConfidence?: number;
  vendorTinConfidence?: number;
  amountConfidence?: number;
  expenseCategoryConfidence?: number;
  totalAIConfidence?: number;
}

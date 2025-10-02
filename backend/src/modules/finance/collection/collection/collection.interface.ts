import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CollectionType } from '@prisma/client';

export class CreateUpdateCollectionDTO {
  @IsOptional()
  @IsNumber()
  collectionId?: number;

  @IsNumber()
  @IsOptional()
  accomplishmentReferenceId?: number;

  @IsNumber()
  @IsNotEmpty()
  projectId: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  collectionType: CollectionType;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;
}

export class StartCollectionDTO {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}

export class CollectionAccomplishmentSummaryBreakdown {
  percentage: number;
  amount: number;
  downpaymentDeduction: number;
  retentionDeduction: number;
  subtotal: number;
}
export class CollectionAccomplishmentSummary {
  id: number;
  amount: number;
  description: string;
  collectionType: CollectionType;
  projectDownpaymentPercentage: number;
  projectRetentionFeePercentage: number;
  amountPaid: number;
  previous: CollectionAccomplishmentSummaryBreakdown;
  toDate: CollectionAccomplishmentSummaryBreakdown;
  thisPeriod: CollectionAccomplishmentSummaryBreakdown;
  billableAmount: number;
  collectedAmount: number;
  outstandingBalance: number;
}

export class ReceivePaymentDTO {
  @IsNumber()
  @IsNotEmpty()
  collectionId: number;

  @IsNumber()
  @IsNotEmpty()
  paymentAmount: number;

  @IsNumber()
  @IsNotEmpty()
  fundAccountId: number;
}

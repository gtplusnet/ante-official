import {
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WorkflowStageResponseDto {
  @IsNumber()
  id: number;

  @IsString()
  key: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  color: string;

  @IsString()
  textColor: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  isInitial: boolean;

  @IsBoolean()
  isFinal: boolean;
}

export class WorkflowInstanceResponseDto {
  @IsNumber()
  id: number;

  @IsString()
  sourceModule: string;

  @IsString()
  sourceId: string;

  @IsString()
  status: string;

  @IsNumber()
  currentStageId: number;

  @ValidateNested()
  @Type(() => WorkflowStageResponseDto)
  @IsOptional()
  currentStage?: WorkflowStageResponseDto;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}

export class PettyCashLiquidationResponseDto {
  @IsNumber()
  id: number;

  @IsNumber()
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

  @IsNumber()
  @IsOptional()
  vatAmount?: number;

  @IsNumber()
  @IsOptional()
  withholdingTaxAmount?: number;

  @IsNumber()
  @IsOptional()
  vatAmountConfidence?: number;

  @IsNumber()
  @IsOptional()
  withholdingTaxConfidence?: number;

  @IsNumber()
  @IsOptional()
  totalAIConfidence?: number;

  @IsBoolean()
  @IsOptional()
  isAiExtracted?: boolean;

  @IsString()
  status: string;

  @IsObject()
  @IsOptional()
  statusReference?: {
    key: string;
    label: string;
  };

  @IsNumber()
  @IsOptional()
  attachmentProofId?: number;

  @IsObject()
  @IsOptional()
  attachmentProof?: any;

  @IsNumber()
  @IsOptional()
  workflowInstanceId?: number | null;

  @ValidateNested()
  @Type(() => WorkflowInstanceResponseDto)
  @IsOptional()
  workflowInstance?: WorkflowInstanceResponseDto | null;

  @ValidateNested()
  @Type(() => WorkflowStageResponseDto)
  @IsOptional()
  workflowStage?: WorkflowStageResponseDto | null;

  @IsObject()
  @IsOptional()
  requestedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @IsObject()
  @IsOptional()
  pettyCashHolder?: {
    id: number;
    account: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    currentBalance: number;
  };

  @IsDateString()
  createdAt: string;

  @IsDateString()
  updatedAt: string;
}

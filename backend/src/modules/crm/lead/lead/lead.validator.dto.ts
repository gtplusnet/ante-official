import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Exists } from '@common/validators/exists.validator';
import { ProjectStatus } from '@prisma/client';

export class LeadCreateDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsNotEmpty()
  @IsString()
  readonly description: string;

  @IsNotEmpty()
  @IsNumber()
  readonly budget: number;

  @IsNotEmpty()
  @IsDateString()
  readonly startDate: string;

  @IsNotEmpty()
  @IsDateString()
  readonly endDate: string;

  @IsNotEmpty()
  readonly status: ProjectStatus;

  @IsOptional()
  @IsNumber()
  @Exists('client', 'id')
  clientId?: number;

  @IsNotEmpty()
  readonly isLead: boolean;

  @IsNotEmpty()
  @IsString()
  readonly locationId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  readonly downpaymentAmount: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  readonly retentionAmount: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  readonly winProbability?: number; // Changed from enum to number (0-100)

  @IsOptional()
  @IsString()
  @Exists('account', 'id')
  readonly personInChargeId?: string;

  // Lead-specific fields
  @IsOptional()
  @IsString()
  readonly relationshipOwnerId?: string;

  @IsOptional()
  @IsNumber()
  readonly abc?: number;

  @IsOptional()
  @IsNumber()
  readonly mmr?: number;

  @IsOptional()
  @IsNumber()
  readonly initialCosting?: number;

  @IsOptional()
  @IsString()
  readonly contactDetails?: string;

  @IsOptional()
  @IsString()
  readonly leadSource?: string;

  @IsOptional()
  @IsString()
  readonly leadType?: string;

  @IsOptional()
  @IsString()
  readonly leadBoardStage?: string;

  @IsOptional()
  @IsString()
  readonly clientEmailAddress?: string;
}

export class LeadUpdateDto {
  @IsNotEmpty()
  @IsNumber()
  readonly id: number;

  @IsString()
  @IsOptional()
  readonly name: string;

  @IsString()
  @IsOptional()
  readonly description: string;

  @IsNumber()
  @IsOptional()
  readonly budget: number;

  @IsDateString()
  @IsOptional()
  readonly startDate: string;

  @IsDateString()
  @IsOptional()
  readonly endDate: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  readonly downpaymentAmount: number = 0;

  @IsNumber()
  @Min(0)
  @Max(100)
  readonly retentionAmount: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  readonly winProbability?: number; // Changed from enum to number (0-100)

  @IsOptional()
  @IsString()
  @Exists('account', 'id')
  readonly personInChargeId?: string;

  // Lead-specific fields
  @IsOptional()
  @IsString()
  readonly relationshipOwnerId?: string;

  @IsOptional()
  @IsNumber()
  @Exists('client', 'id')
  readonly clientId?: number;

  @IsOptional()
  @IsNumber()
  readonly pointOfContactId?: number;

  @IsOptional()
  @IsString()
  readonly locationId?: string;

  @IsOptional()
  @IsNumber()
  readonly abc?: number;

  @IsOptional()
  @IsNumber()
  readonly mmr?: number;

  @IsOptional()
  @IsNumber()
  readonly initialCosting?: number;

  @IsOptional()
  @IsString()
  readonly contactDetails?: string;

  @IsOptional()
  @IsString()
  readonly leadSource?: string;

  @IsOptional()
  @IsString()
  readonly leadType?: string;

  @IsOptional()
  @IsString()
  readonly clientEmailAddress?: string;
}

export class LeadMoveDto {
  @IsNotEmpty()
  @IsString()
  readonly projectId: string; // Keep same name for compatibility

  @IsString()
  @IsOptional()
  readonly boardKey: string;
}

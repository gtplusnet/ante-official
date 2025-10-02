import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { IsDateGreaterThan } from '@common/dto/validators/date-range.validator';
import {
  ProjectCreateRequest,
  ProjectEditRequest,
} from '../../../../shared/request';
import { Exists } from '@common/validators/exists.validator';
import { ProjectStatus, WinProbability } from '@prisma/client';
export class ProjectCreateDto implements ProjectCreateRequest {
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
  @IsDateGreaterThan('startDate')
  readonly endDate: string;
  @IsNotEmpty()
  readonly status: ProjectStatus;
  @IsNotEmpty()
  @IsNumber()
  @Exists('client', 'id')
  clientId: number;
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
  @IsEnum(WinProbability)
  readonly winProbability?: WinProbability;
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
  readonly clientEmailAddress?: string;
}
export class ProjectMoveDto {
  @IsNotEmpty()
  @IsString()
  readonly projectId: string;
  @IsString()
  @IsOptional()
  readonly nowBoardStageKey: string;
}
export class ProjectUpdateDto implements ProjectEditRequest {
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
  @IsDateGreaterThan('startDate')
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
  @IsEnum(WinProbability)
  readonly winProbability?: WinProbability;
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
  readonly clientEmailAddress?: string;
}
export class ProjectIdDto {
  @IsNotEmpty()
  readonly id: string;
}
export class ProjectDeleteDto {
  @IsNotEmpty()
  @IsString()
  readonly password: string;
  @IsNotEmpty()
  readonly id: string;
}
export class ProjectDeleteAllDto {
  @IsNotEmpty()
  @IsString()
  readonly password: string;
}
export class ProjectBoardDto {
  @IsNotEmpty()
  @IsString()
  readonly isLead: string;
}

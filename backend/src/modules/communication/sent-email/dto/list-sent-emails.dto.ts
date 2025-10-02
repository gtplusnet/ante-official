import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EMAIL_MODULES, EMAIL_STATUS } from '@shared/constants/email-modules';
export class ListSentEmailsDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(EMAIL_MODULES))
  module?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(EMAIL_STATUS))
  status?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['sentAt', 'module', 'status'])
  sortBy?: 'sentAt' | 'module' | 'status' = 'sentAt';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

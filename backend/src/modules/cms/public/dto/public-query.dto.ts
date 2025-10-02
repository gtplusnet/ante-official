import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum PublicContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

export class PublicQueryDto {
  @ApiProperty({
    required: false,
    default: 1,
    minimum: 1,
    description: 'Page number for pagination',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    required: false,
    default: 20,
    minimum: 1,
    maximum: 100,
    description: 'Number of items per page (max 100)',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiProperty({
    required: false,
    description: 'Search term to filter content',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    enum: PublicContentStatus,
    description: 'Content status filter',
  })
  @IsOptional()
  @IsEnum(PublicContentStatus)
  status?: PublicContentStatus;

  @ApiProperty({
    required: false,
    description: 'Sort field (e.g., "createdAt", "-updatedAt")',
  })
  @IsOptional()
  @IsString()
  sort?: string;
}

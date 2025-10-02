import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ModuleType, FileType, ProcessingStatus } from '@prisma/client';

export class MediaQueryDto {
  @ApiProperty({
    description: 'Module to filter media files by',
    enum: ModuleType,
    required: false,
  })
  @IsEnum(ModuleType)
  @IsOptional()
  module?: ModuleType;

  @ApiProperty({
    description: 'Page number for pagination',
    type: Number,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 20;

  @ApiProperty({
    description: 'Search query to filter files by name',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'File type to filter by',
    enum: FileType,
    required: false,
  })
  @IsEnum(FileType)
  @IsOptional()
  type?: FileType;

  @ApiProperty({
    description: 'Folder ID to filter files by',
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  folderId?: number;

  @ApiProperty({
    description: 'Processing status to filter by',
    enum: ProcessingStatus,
    required: false,
  })
  @IsEnum(ProcessingStatus)
  @IsOptional()
  status?: ProcessingStatus;

  @ApiProperty({
    description: 'Tags to filter by (comma-separated)',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
    return value;
  })
  tags?: string[];
}

export class CreateFolderDto {
  @ApiProperty({
    description: 'Name of the folder',
    type: String,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Parent folder ID',
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  parentId?: number;

  @ApiProperty({
    description: 'Module where the folder belongs',
    enum: ModuleType,
    default: ModuleType.CMS,
    required: false,
  })
  @IsEnum(ModuleType)
  @IsOptional()
  module?: ModuleType = ModuleType.CMS;
}

export class MediaFolderWithStatsDto {
  id: number;
  name: string;
  path: string;
  parentId?: number;
  module: ModuleType;
  companyId: number;
  fileCount: number;
  subfolderCount: number;
  totalSize: number;
  createdAt: Date;
  updatedAt: Date;
}

export class FolderListQueryDto {
  @ApiProperty({
    description: 'Module to filter folders by',
    enum: ModuleType,
    required: false,
  })
  @IsEnum(ModuleType)
  @IsOptional()
  module?: ModuleType;

  @ApiProperty({
    description: 'Parent folder ID to filter subfolders',
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  parentId?: number;
}

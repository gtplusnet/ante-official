import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ModuleType } from '@prisma/client';

export class MediaUploadDto {
  @ApiProperty({
    description: 'Module where the media will be stored',
    enum: ModuleType,
    default: ModuleType.CMS,
    required: false,
  })
  @IsEnum(ModuleType)
  @IsOptional()
  module?: ModuleType = ModuleType.CMS;

  @ApiProperty({
    description: 'ID of the folder where the media will be stored',
    type: Number,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  folderId?: number;

  @ApiProperty({
    description: 'Name of the folder to create/use for storing the media',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  folderName?: string;

  @ApiProperty({
    description: 'Whether to process the media in background',
    type: Boolean,
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  processInBackground?: boolean = false;

  @ApiProperty({
    description: 'Alternative text for accessibility',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  alternativeText?: string;

  @ApiProperty({
    description: 'Caption for the media file',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({
    description: 'Tags for the media file',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
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

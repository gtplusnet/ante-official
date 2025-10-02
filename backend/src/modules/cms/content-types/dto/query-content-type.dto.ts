import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ContentTypeType } from '../../common/interfaces/cms.interface';

export class QueryContentTypeDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 25;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ContentTypeType)
  type?: ContentTypeType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').reduce((acc, item) => {
        const [field, order] = item.split(':');
        acc[field] = order === 'desc' ? -1 : 1;
        return acc;
      }, {});
    }
    return value;
  })
  sort?: Record<string, 1 | -1>;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.split(','))
  fields?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  includeArchived?: boolean = false;
}

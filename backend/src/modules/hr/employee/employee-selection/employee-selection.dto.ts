import { IsString, IsOptional, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class EmployeeSelectionFilterDto {
  @IsOptional()
  @Transform(({ value }) => {
    // Handle both single string and array of strings
    if (typeof value === 'string') {
      // If it's a comma-separated string, split it
      if (value.includes(',')) {
        return value
          .split(',')
          .map((id) => id.trim())
          .filter((id) => id);
      }
      // If it's a single value, keep it as string for backward compatibility
      return value;
    }
    // If it's already an array, return as is
    return value;
  })
  branch?: string | string[];

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  employmentStatus?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').filter((id) => id.trim());
    }
    return value;
  })
  excludeAccountIds?: string[];
}

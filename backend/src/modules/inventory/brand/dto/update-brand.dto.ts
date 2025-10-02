import { IsString, IsOptional, IsBoolean } from 'class-validator';

import { UpdateBrandRequest } from '@shared/request';

export class UpdateBrandDto implements UpdateBrandRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

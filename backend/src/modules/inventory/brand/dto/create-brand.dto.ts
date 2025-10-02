import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

import { CreateBrandRequest } from '@shared/request';

export class CreateBrandDto implements CreateBrandRequest {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

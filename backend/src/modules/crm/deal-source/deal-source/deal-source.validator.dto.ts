import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateDealSourceDto {
  @IsNotEmpty()
  @IsString()
  sourceName: string;
}

export class UpdateDealSourceDto {
  @IsOptional()
  @IsString()
  sourceName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DealSourceQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  showArchived?: string;
}

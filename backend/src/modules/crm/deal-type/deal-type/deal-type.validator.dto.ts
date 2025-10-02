import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateDealTypeDto {
  @IsNotEmpty()
  @IsString()
  typeName: string;
}

export class UpdateDealTypeDto {
  @IsOptional()
  @IsString()
  typeName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DealTypeQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  showArchived?: string;
}

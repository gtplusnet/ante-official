import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateVariationInventoryDTO {
  @IsNotEmpty()
  @IsString()
  itemNumber: string;

  @IsNotEmpty()
  @IsString()
  variationName: string;

  @IsNotEmpty()
  @IsString()
  variationDescription: string;

  @IsNotEmpty()
  @IsNumber()
  stocks: number;

  @IsNotEmpty()
  @IsString()
  unitOfMeasure: string;

  @IsNotEmpty()
  @IsNumber()
  unitPrice: number;

  @IsNumber()
  @IsOptional()
  total?: number;
}

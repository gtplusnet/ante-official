import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { CutoffType } from '@prisma/client';

export class TaxSelectDateDTO {
  @IsNotEmpty()
  @IsDateString()
  date: string;
}

export class TaxTableDTO {
  @IsNotEmpty()
  @IsString()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  type: CutoffType;
}

export class GetTaxBracketDTO {
  @IsNotEmpty()
  @IsString()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  type: CutoffType;

  @IsNotEmpty()
  @IsString()
  taxableIncome: number;
}

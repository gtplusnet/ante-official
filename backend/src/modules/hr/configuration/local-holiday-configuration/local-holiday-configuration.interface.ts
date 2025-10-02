import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { HolidayType } from '@prisma/client';

export class LocalHolidayCreateDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(HolidayType)
  type: HolidayType;

  @IsNotEmpty()
  @IsNumber()
  provinceId: number;

  @IsNotEmpty()
  @IsDateString()
  date: string;
}

export class LocalHolidayEditDTO extends LocalHolidayCreateDTO {
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

export class LocalHolidayDeleteDTO {
  @IsNotEmpty()
  id: number;
}

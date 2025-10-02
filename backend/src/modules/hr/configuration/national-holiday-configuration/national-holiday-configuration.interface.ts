import { IsNotEmpty, IsNumber } from 'class-validator';
import { HolidayType } from '@prisma/client';

export class HolidayConfigList {
  key: string;
  year: string;
  label: string;
}

export class HolidayConfigData {
  name: string;
  date: string;
  type: HolidayType;
}

export class NationHolidayListDTO {
  @IsNotEmpty()
  @IsNumber()
  year: number;
}

export class NationalHolidayReference {
  name: string;
  date: string;
  type: HolidayType;
}

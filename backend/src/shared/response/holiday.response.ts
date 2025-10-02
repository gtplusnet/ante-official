import { DateFormat } from './utility.format';
import { HolidayType } from '@prisma/client';

export interface LocalHolidayResponse {
  id: number;
  name: string;
  type: HolidayTypeResponse;
  date: DateFormat;
  province: {
    id: number;
    name: string;
    region: {
      id: number;
      name: string;
    };
  };
}

export interface NationalHolidayResponse {
  name: string;
  type: HolidayTypeResponse;
  date: DateFormat;
}

export interface HolidayTypeResponse {
  key: HolidayType;
  label: string;
}

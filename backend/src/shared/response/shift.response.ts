import { HoursFormat, TimeFormat } from './utility.format';
import { ShiftType } from '@prisma/client';

export interface ShiftDataResponse {
  id: number;
  shiftCode: string;
  breakHours: HoursFormat;
  totalWorkHours: HoursFormat;
  targetHours: HoursFormat;
  shiftBreakHours: HoursFormat;
  shiftTime: ShiftTimeDataResponse[];
  nextDayShiftTime: ShiftTimeDataResponse[];
  shiftType: ShiftTypeResponse;
  startTime: TimeFormat;
  endTime: TimeFormat;
}

export interface ShiftTypeResponse {
  key: ShiftType;
  label: string;
  isWorkDay: boolean;
}

export interface ShiftTimeDataResponse {
  isNightShift: boolean;
  workHours: HoursFormat;
  startTime: TimeFormat;
  endTime: TimeFormat;
  isBreakTime: boolean;
}

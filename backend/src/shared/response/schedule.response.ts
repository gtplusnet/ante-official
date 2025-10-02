import { HoursFormat } from './utility.format';
import { ShiftDataResponse } from './shift.response';

export interface ScheduleDataResponse {
  id: number;
  scheduleCode: string;
  daySchedule: ScheduleCreateDayResponse;
  totalWorkingHours: HoursFormat;
  dayScheduleDetails: {
    mondayShift: ShiftDataResponse;
    tuesdayShift: ShiftDataResponse;
    wednesdayShift: ShiftDataResponse;
    thursdayShift: ShiftDataResponse;
    fridayShift: ShiftDataResponse;
    saturdayShift: ShiftDataResponse;
    sundayShift: ShiftDataResponse;
  };
}

export interface ScheduleCreateDayResponse {
  mondayShiftId: number;
  tuesdayShiftId: number;
  wednesdayShiftId: number;
  thursdayShiftId: number;
  fridayShiftId: number;
  saturdayShiftId: number;
  sundayShiftId: number;
}

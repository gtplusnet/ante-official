export interface ScheduleDataRequest {
  id?: number;
  scheduleCode: string;
  daySchedule: {
    mondayShiftId: number;
    tuesdayShiftId: number;
    wednesdayShiftId: number;
    thursdayShiftId: number;
    fridayShiftId: number;
    saturdayShiftId: number;
    sundayShiftId: number;
  };
}

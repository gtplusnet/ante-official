import { ShiftType } from '@prisma/client';

export interface ShiftCreateRequest {
  shiftCode: string;
  shiftType: ShiftType;
  shiftTime: ShiftTimeRequest[];
  breakHours: number;
  targetHours?: number;
}

export interface ShiftUpdateRequest extends ShiftCreateRequest {
  id?: number;
}

export interface ShiftTimeRequest {
  startTime: string;
  endTime: string;
}

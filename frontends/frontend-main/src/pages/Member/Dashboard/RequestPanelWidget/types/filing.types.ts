// Import shared interfaces and re-export with additional frontend-specific types
import type { 
  FilingResponse, 
  FilingsListResponse,
  FilingTypeReference,
  FilingStatusReference,
  WorkingHour,
  ShiftData,
  LeaveData
} from '@shared/response';

// Re-export the shared types with aliases for backward compatibility
export type FilingType = FilingTypeReference;
export type FilingStatus = FilingStatusReference;
export type { WorkingHour, ShiftData, LeaveData };

// Frontend-specific types
export interface FormattedHours {
  raw: number;
  formatted: string;
  hours: number;
  minutes: number;
  totalMinutes: number;
}

export interface DisplayFields {
  shiftType?: string;
  workingHours?: FormattedHours;
  breakHours?: FormattedHours;
}

// Extend the shared FilingResponse for frontend use
export interface Filing extends Omit<FilingResponse, 'id'> {
  // Frontend already expects these fields from FilingResponse
  // Add missing properties expected by frontend components
  id: number | string;
}

export type FilingsResponse = FilingsListResponse;
export interface ISchoolAttendance {
  id: string;
  qrCode: string;
  personId: string;
  personType: 'student' | 'guardian';
  personName: string;
  action: 'check_in' | 'check_out';
  timestamp: Date;
  deviceId?: string;
  location?: string;
  syncedAt?: Date;
  companyId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceTableFilters {
  date?: string; // Single date filter
  personType?: 'student' | 'guardian';
  action?: 'check_in' | 'check_out';
  deviceId?: string;
}

export interface IAttendanceTableRow {
  id: string;
  personName: string;
  personType: 'student' | 'guardian';
  action: 'check_in' | 'check_out';
  timestamp: string;
  deviceId?: string;
  location?: string;
  formattedTime: string;
  formattedDate: string;
}

export interface IAttendanceListItem {
  id: string;
  label: string;
  value: string;
}

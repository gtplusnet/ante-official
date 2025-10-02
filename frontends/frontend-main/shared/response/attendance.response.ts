export interface IAttendanceResponse {
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

export interface IAttendanceTableResponse {
  list: IAttendanceResponse[];
  pagination: number[];
  currentPage: number;
  totalCount: number;
  totalPages: number;
}

export interface IAttendanceSummaryResponse {
  date: string;
  totalCheckIns: number;
  totalCheckOuts: number;
  studentCheckIns: number;
  guardianCheckIns: number;
  totalRecords: number;
}

export interface IAttendanceDeviceResponse {
  id: string;
  label: string;
  value: string;
}
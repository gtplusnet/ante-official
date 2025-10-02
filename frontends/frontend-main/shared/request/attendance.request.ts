export interface IAttendanceTableRequest {
  searchKeyword?: string;
  searchBy?: string;
  filters?: IAttendanceFilter[];
  settings?: any;
}

export interface IAttendanceFilter {
  date?: string;
  personType?: 'student' | 'guardian';
  action?: 'check_in' | 'check_out';
  deviceId?: string;
}

export interface IAttendanceExportRequest {
  date?: string;
  personType?: 'student' | 'guardian';
  action?: 'check_in' | 'check_out';
  deviceId?: string;
  format?: 'csv' | 'xlsx';
}
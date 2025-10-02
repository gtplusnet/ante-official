export interface ComputeTimekeepingRequest {
  employeeAccountId: string;
  simulatedTime: TimeInOutRequest[];
}

export interface RecomputeAllTimekeepingRequest {
  cutoffDateRangeId: string;
}

export interface RecomputeTimekeepingRequest {
  employeeAccountId: string;
  date: string;
}

export interface RecomputeTimekeepingCutoffRequest {
  employeeAccountId: string;
  cutoffDateRangeId: string;
}

export interface TimeInOutRequest {
  timeIn: string;
  timeOut: string;
}

export interface EmployeeTimekeepingRequest {
  employeeAccountId: string;
  cutoffDateRange: string;
}

export interface TimekeepingOverrideRequest {
  timekeepingId: number;
  worktime: number;
  nightDifferential: number;
  overtime: number;
  nightDifferentialOvertime: number;
  late: number;
  undertime: number;
}

export interface SubmitForPayrollProcessingRequest {
  cutoffDateRangeId: string;
}

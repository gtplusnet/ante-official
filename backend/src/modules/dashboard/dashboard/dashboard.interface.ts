export interface EmployeePayslipSummary {
  id: number;
  cutoffDateRangeId: string;
  employeeTimekeepingCutoffId: number;
  cutOffPeriod: string;
  payrollDate: string;
  startDate: Date;
  endDate: Date;
  cutoffCode: string;
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  processDate: Date;
}

export interface EmployeePayslipsResponse {
  payslips: EmployeePayslipSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardOverview {
  employeeCount: number;
  activeProjects: number;
  pendingApprovals: number;
  todayAttendance: number;
}

export interface HRMetrics {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  pendingFilings: number;
  approvedFilings: number;
  rejectedFilings: number;
  todayPresent: number;
  todayAbsent: number;
  todayOnLeave: number;
}

export interface ProjectMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pendingProjects: number;
  totalTasks: number;
  completedTasks: number;
}

export interface FinanceMetrics {
  totalReceivables: number;
  totalPayables: number;
  cashOnHand: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
}

export interface InventoryMetrics {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  pendingOrders: number;
  completedOrders: number;
}

export interface LeaveBalance {
  used: number;
  total: number;
}

export interface EmployeeDashboardCounters {
  outstandingRequests: number;
  daysBeforeCutoff: number | null;
  leaveBalance: LeaveBalance | null;
  allTasks: number;
}

export interface EmployeeCutoffDateRange {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  status: string;
  isCurrent: boolean;
}

export interface EmployeeCutoffDateRangesResponse {
  cutoffDateRanges: EmployeeCutoffDateRange[];
  currentCutoffId: string | null;
}

export interface AttendanceRecord {
  id: number;
  date: string;
  dateFormatted: string;
  timeIn?: string;
  timeOut?: string;
  status: string;
  hasConflict: boolean;
  description?: string;
  workTime?: number;
  overtime?: number;
  late?: number;
  undertime?: number;
  isPresent: boolean;
  isAbsent: boolean;
  hasLeave: boolean;
  leaveType?: string;
}

export interface EmployeeAttendanceResponse {
  attendanceRecords: AttendanceRecord[];
  total: number;
  startDate: string;
  endDate: string;
}

export interface AttendanceCalendarDay {
  date: string;
  details: string[];
  status:
    | 'PRESENT'
    | 'ABSENT'
    | 'HOLIDAY'
    | 'REST_DAY'
    | 'LEAVE'
    | 'NO_SCHEDULE';
  hasConflict: boolean;
  isWithinCutoff?: boolean; // Indicates if this date is within the selected cutoff period
  // Detailed data for click functionality
  timeIn?: string;
  timeOut?: string;
  workHours?: number;
  lateMinutes?: number;
  undertimeMinutes?: number;
  overtimeMinutes?: number;
  remarks?: string;
  holidayName?: string;
  leaveType?: string;
}

export interface EmployeeAttendanceCalendarResponse {
  calendarDays: AttendanceCalendarDay[];
  startDate: string;
  endDate: string;
}

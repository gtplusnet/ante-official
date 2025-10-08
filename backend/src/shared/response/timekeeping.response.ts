import {
  BreakdownType,
  ActiveShiftType,
  TimekeepingSource,
  CutoffPeriodType,
  CutoffDateRangeStatus,
} from '@prisma/client';
import { ShiftDataResponse } from './shift.response';
import {
  CurrencyFormat,
  DateFormat,
  HoursFormat,
  TimeFormat,
} from './utility.format';
import { TimekeepingLogType } from '../enums/timekeeping-log-types.enums';
import { HolidayTypeResponse } from './holiday.response';
import { QueueResponse } from './queue.response';

export interface DayDetails {
  isExtraDay: boolean;
  isRestDay: boolean;
  isDayApproved: boolean;
  isDayForApproval: boolean;
  specialHolidayCount: number;
  regularHolidayCount: number;
  isEligibleHoliday?: boolean;
  isEligibleHolidayOverride?: boolean | null;
  hasApprovedLeave?: boolean;
  leaveType?: string;
  leaveCompensationType?: string;
}

export interface TimekeepingLogTypeInterface {
  key: TimekeepingLogType;
  label: string;
}

export interface EmployeeTimekeepingTotal {
  employeeCode: string;
  timekeepingCutoffId: number;
  employeeAccountInformation: EmployeeTimekeepingTotalAccount;
  timekeepingTotal: TimekeepingDataResponse;
}

export interface EmployeeTimekeepingTotalAccount {
  accountId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  middleName: string;
}

export interface TimekeepingDataResponse {
  workTime: HoursFormat;
  breakTime: HoursFormat;
  late: HoursFormat;
  undertime: HoursFormat;
  overtime: HoursFormat;
  overtimeForApproval: HoursFormat;
  overtimeApproved: HoursFormat;
  nightDifferential: HoursFormat;
  nightDifferentialOvertime: HoursFormat;
  nightDifferentialOvertimeForApproval: HoursFormat;
  nightDifferentialOvertimeApproved: HoursFormat;
  absentCount: number;
  presentDayCount: number;
  totalCreditedHours: HoursFormat;
  specialHolidayCount: number;
  regularHolidayCount: number;
  totalHolidayCount: number;
  workDayCount: number;
  approvedLeaveCount: number;
  approvedLeaveHours: HoursFormat;
  leaveWithPayCount: number;
  leaveWithoutPayCount: number;
}

export interface TimeKeepingComputeResponseData {
  employeeId: string;
  inputTimeInOut: TimeInOutResponse[];
  rawTimeInOut: RawTimeInOutResponse[];
  output: TimekeepingOutputResponse[];
}

export interface ActiveShiftTypeResponse {
  key: ActiveShiftType;
  label: string;
  color: string;
}

export interface TimekeepingOutputResponse {
  date: string;
  timekeepingId: number;
  dateFormatted: DateFormat;
  timeIn?: string;
  timeOut?: string;
  dayDetails: DayDetails;
  activeShiftType: ActiveShiftTypeResponse;
  activeShift: ShiftDataResponse;
  timeBreakdown: TimeBreakdownResponse[];
  timekeepingSummary: TimekeepingSummaryResponse;
  isOverridden: boolean;
  timekeepingOverride: TimekeepingOverrideResponse;
  timekeepingComputed: TimekeepingComputedResponse;
  processedTimeBreakdown: TimeBreakdownResponse[];
  nextDayProcessedTimeBreakdown: TimeBreakdownResponse[];
  holidayList: TimekeepingHoliday[];
  gracePeriods?: GracePeriodInfo;
}

export interface TimeInOutResponse {
  timeIn: string;
  timeOut: string;
}

export interface RawTimeInOutResponse {
  id?: number;
  timeIn: Date;
  timeOut: Date;
}

export interface TimekeepingComputeOutputResponse {
  totalTime: HoursFormat;
  coverageTime: TimeBreakdownResponse[];
}

export interface TimekeepingSummaryResponse {
  worktime: HoursFormat;
  overtime: HoursFormat;
  breaktime: HoursFormat;
  overtimeForApproval: HoursFormat;
  overtimeApproved: HoursFormat;
  late: HoursFormat;
  undertime: HoursFormat;
  nightDifferential: HoursFormat;
  nightDifferentialOvertime: HoursFormat;
  nightDifferentialOvertimeForApproval: HoursFormat;
  nightDifferentialOvertimeApproved: HoursFormat;
  absentCount: number;
  presentDayCount: number;
  specialHolidayCount: number;
  regularHolidayCount: number;
  totalHolidayCount: number;
  totalCreditedHours: HoursFormat;
  approvedLeaveCount: number;
  approvedLeaveHours: HoursFormat;
  leaveWithPayCount: number;
  leaveWithoutPayCount: number;
  absentReason?: string;
}

export interface TimekeepingOverrideResponse {
  worktime: HoursFormat;
  overtime: HoursFormat;
  late: HoursFormat;
  undertime: HoursFormat;
  nightDifferential: HoursFormat;
  nightDifferentialOvertime: HoursFormat;
}

export interface TimekeepingComputedResponse {
  worktime: HoursFormat;
  breakTime: HoursFormat;
  overtime: HoursFormat;
  late: HoursFormat;
  undertime: HoursFormat;
  nightDifferential: HoursFormat;
  nightDifferentialOvertime: HoursFormat;
}

export interface TimeBreakdownResponse {
  id?: number;
  sourceRawId?: number;
  timeIn: TimeFormat;
  timeOut: TimeFormat;
  hours: HoursFormat;
  breakdownType?: BreakdownType;
  breakdownTypeDetails?: BreakdownTypeReferenceResponse;
}

export interface BreakdownTypeReferenceResponse {
  key: BreakdownType;
  isDefaultApproved: boolean;
  label: string;
}

export interface CutoffDateRangeResponse {
  key: string;
  label: string;
  startDate: DateFormat;
  endDate: DateFormat;
  processingDate: DateFormat;
  cutoffId: number;
  cutoffCode: string;
  cutoffPeriodType: CutoffPeriodTypeResponse;
  status: CutoffDateRangeStatus;
  isActive: boolean;
  dateRangeStatus: 'Past Due' | 'Current' | 'On Process';
  totalNetPay: CurrencyFormat;
  totalGrossPay: CurrencyFormat;
  totalBasicPay: CurrencyFormat;
  totalBasicSalary: CurrencyFormat;
  totalDeductionLate: CurrencyFormat;
  totalDeductionUndertime: CurrencyFormat;
  totalDeductionAbsent: CurrencyFormat;
  totalDeduction: CurrencyFormat;
  totalEarningOvertime: CurrencyFormat;
  totalEarningNightDiff: CurrencyFormat;
  totalEarningNightDiffOT: CurrencyFormat;
  totalEarningRestDay: CurrencyFormat;
  totalEarningRegularHoliday: CurrencyFormat;
  totalEarningSpecialHoliday: CurrencyFormat;
  totalAdditionalEarnings: CurrencyFormat;
  totalAllowance: CurrencyFormat;
  totalGovernmentContribution: CurrencyFormat;
  totalLoans: CurrencyFormat;
  totalTax: CurrencyFormat;
  totalBasicPayMonthlyRate: CurrencyFormat;
  totalDeductionSalaryAdjustmnt: CurrencyFormat;
  totalEarningSalaryAdjustment: CurrencyFormat;
  totalTaxableAllowance: CurrencyFormat;
  totalNonTaxableAllowance: CurrencyFormat;
  totalEarningsPlusAllowance: CurrencyFormat;
  totalGovernmentContributionSSS: CurrencyFormat;
  totalGovernmentContributionSSSBasis: CurrencyFormat;
  totalGovernmentContributionSSSEER: CurrencyFormat;
  totalGovernmentContributionSSSEREC: CurrencyFormat;
  totalGovernmentContributionSSSEEMPF: CurrencyFormat;
  totalGovernmentContributionSSSEETotal: CurrencyFormat;
  totalGovernmentContributionSSSERR: CurrencyFormat;
  totalGovernmentContributionSSSERMPF: CurrencyFormat;
  totalGovernmentContributionSSSERTotal: CurrencyFormat;
  totalGovernmentContributionSSSMSR: CurrencyFormat;
  totalGovernmentContributionSSSMSMPF: CurrencyFormat;
  totalGovernmentContributionSSSMSTotal: CurrencyFormat;
  totalGovernmentContributionPhilhealth: CurrencyFormat;
  totalGovernmentContributionPhilhealthBasis: CurrencyFormat;
  totalGovernmentContributionPhilhealthPercentage: CurrencyFormat;
  totalGovernmentContributionPhilhealthMinimum: CurrencyFormat;
  totalGovernmentContributionPhilhealthMaximum: CurrencyFormat;
  totalGovernmentContributionPhilhealthEmployeeShare: CurrencyFormat;
  totalGovernmentContributionPhilhealthEmployerShare: CurrencyFormat;
  totalGovernmentContributionPagibig: CurrencyFormat;
  totalGovernmentContributionPagibigBasis: CurrencyFormat;
  totalGovernmentContributionPagibigPercentage: CurrencyFormat;
  totalGovernmentContributionPagibigMinimumShare: CurrencyFormat;
  totalGovernmentContributionPagibigMinimumPercentage: CurrencyFormat;
  totalGovernmentContributionPagibigMaximumEEShare: CurrencyFormat;
  totalGovernmentContributionPagibigMaximumERShare: CurrencyFormat;
  totalGovernmentContributionPagibigEmployeeShare: CurrencyFormat;
  totalGovernmentContributionPagibigEmployerShare: CurrencyFormat;
  totalGovernmentContributionTax: CurrencyFormat;
  totalGrossTaxableIncome: CurrencyFormat;
  totalNonTaxableGovernmentContribution: CurrencyFormat;
  totalNonTaxableDeduction: CurrencyFormat;
  totalTaxableIncome: CurrencyFormat;
  totalTaxOffset: CurrencyFormat;
  totalTaxPercentage: CurrencyFormat;
  totalTaxByPercentage: CurrencyFormat;
  totalTaxFixedAmount: CurrencyFormat;
  timekeepingQueueResponse?: QueueResponse;
  processQueueResponse?: QueueResponse;
  payslipQueueResponse?: QueueResponse;
}

/**
 * Lightweight cutoff date range response for list views
 * Optimized for performance - returns only essential fields with minimal formatting
 */
export interface CutoffDateRangeLiteResponse {
  key: string;
  label: string;
  cutoffId: number;
  cutoffCode: string;
  startDate: DateFormat;
  endDate: DateFormat;
  processingDate: DateFormat;
  cutoffPeriodType: CutoffPeriodTypeResponse;
  status: CutoffDateRangeStatus;
  isActive: boolean;
  dateRangeStatus: 'Past Due' | 'Current' | 'On Process';
  // Optional totals - only included if non-zero (raw numbers, not formatted)
  totalNetPay?: number;
  totalGrossPay?: number;
  totalBasicPay?: number;
  totalDeduction?: number;
  totalEarningOvertime?: number;
  // Queue processing flags
  hasTimekeepingQueue?: boolean;
  hasPayrollQueue?: boolean;
  hasPayslipQueue?: boolean;
}

export interface CutoffPeriodTypeResponse {
  key: CutoffPeriodType;
  label: string;
}

export interface TimekeepingLogResponse {
  id: number;
  timeIn: DateFormat;
  timeOut: DateFormat;
  source: TimekeepingSourceResponse;
  timeSpan: HoursFormat;
  createdAt: DateFormat;
  // TIME-IN GEOLOCATION
  timeInLocation?: string | null;
  timeInIpAddress?: string | null;
  timeInLatitude?: number | null;
  timeInLongitude?: number | null;
  // TIME-OUT GEOLOCATION
  timeOutLocation?: string | null;
  timeOutIpAddress?: string | null;
  timeOutLatitude?: number | null;
  timeOutLongitude?: number | null;
}

export interface TimekeepingSourceResponse {
  key: TimekeepingSource;
  label: string;
}

export interface TimekeepingHoliday {
  name: string;
  holidayType: HolidayTypeResponse;
  source: string;
}

export interface GracePeriodInfo {
  lateGraceTimeMinutes: number;
  undertimeGraceTimeMinutes: number;
  overtimeGraceTimeMinutes: number;
  lateGraceApplied: boolean;
  undertimeGraceApplied: boolean;
  overtimeGraceApplied: boolean;
  lateMinutesForgiven?: number;
  undertimeMinutesForgiven?: number;
  overtimeMinutesAdjusted?: number;
}

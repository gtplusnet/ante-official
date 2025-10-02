import { Injectable } from '@nestjs/common';
import { DateFormat, HoursFormat, TimeFormat } from '@shared/response';
import { UtilityService } from '@common/utility.service';
import {
  BreakdownType,
  EmployeeTimekeeping,
  EmployeeTimekeepingComputed,
  EmployeeTimekeepingLogs,
  EmployeeTimekeepingOverride,
  Prisma,
  AttendanceConflictType,
} from '@prisma/client';
import { ShiftDataResponse, ShiftTimeDataResponse } from '@shared/response';
import {
  TimeBreakdownResponse,
  TimekeepingSummaryResponse,
} from '@shared/response';
import { PrismaService } from '@common/prisma.service';
import TimekeepingBreakdownTypeReference from '../../../../../reference/timekeeping-breakdown-type.reference';
import { ShiftType } from '@prisma/client';
import * as moment from 'moment';
import { LeaveTimekeepingIntegrationService } from '@modules/hr/filing/services/leave-timekeeping-integration.service';
import { AttendanceConflictsService } from '@modules/hr/timekeeping/attendance-conflicts/attendance-conflicts.service';
@Injectable()
export class TimekeepingComputationService {
  private employeeAccountId: string;
  private date: DateFormat;
  private employeeTimekeeping: EmployeeTimekeeping;
  private nextDayEmployeeTimekeeping: EmployeeTimekeeping;
  private shift: ShiftDataResponse;
  private previousDayShift: ShiftDataResponse;
  private timeBreakdown: TimeBreakdownResponse[];
  private nextDayTimeBreakdown: TimeBreakdownResponse[];
  private processedTimeBreakdown: TimeBreakdownResponse[];
  private nextDayProcessedTimeBreakdown: TimeBreakdownResponse[];
  private previousDayShiftNextDayTimeBreakdown: TimeBreakdownResponse[];
  private lateGraceTimeMinutes = 0;
  private undertimeGraceTimeMinutes = 0;
  private overtimeGraceTimeMinutes = 0;

  constructor(
    private readonly utilityService: UtilityService,
    private readonly prismaService: PrismaService,
    private readonly leaveTimekeepingIntegrationService: LeaveTimekeepingIntegrationService,
    private readonly attendanceConflictsService: AttendanceConflictsService,
  ) {}

  private safeParseActiveShiftConfig(activeShiftConfig: any): any {
    if (!activeShiftConfig) {
      return null;
    }

    // If it's already an object, return it
    if (
      typeof activeShiftConfig === 'object' &&
      !(activeShiftConfig instanceof String)
    ) {
      return activeShiftConfig;
    }

    // Convert to string and parse
    const configString = activeShiftConfig.toString();

    // Check for invalid JSON like "[object Object]"
    if (configString.startsWith('[object')) {
      console.error('Invalid activeShiftConfig detected:', configString);
      return null;
    }

    try {
      return JSON.parse(configString);
    } catch (error) {
      console.error(
        'Failed to parse activeShiftConfig:',
        error,
        'Value:',
        configString,
      );
      return null;
    }
  }

  public setEmployeeAccountId(employeeAccountId: string): void {
    this.employeeAccountId = employeeAccountId;
    this.employeeTimekeeping = null;
    this.nextDayEmployeeTimekeeping = null;
    this.timeBreakdown = [];
    this.nextDayTimeBreakdown = [];
    this.shift = null;
    this.processedTimeBreakdown = [];
    this.nextDayProcessedTimeBreakdown = [];
  }
  public setDate(date: DateFormat): void {
    this.date = date;
  }
  public async computeTimekeeping() {
    const dateString = moment(this.date.raw).format('YYYY-MM-DD');
    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] Starting computeTimekeeping for employee: ${this.employeeAccountId}, date: ${dateString}`,
    );

    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] Searching for employeeTimekeeping with dateString: ${dateString}, accountId: ${this.employeeAccountId}`,
    );

    this.employeeTimekeeping =
      await this.prismaService.employeeTimekeeping.findFirst({
        where: {
          dateString: dateString,
          employeeTimekeepingCutoff: {
            accountId: this.employeeAccountId,
          },
        },
        orderBy: {
          id: 'desc', // Get the most recent one in case of duplicates
        },
      });

    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] Found employeeTimekeeping record: ${this.employeeTimekeeping ? 'YES' : 'NO'}`,
    );
    if (this.employeeTimekeeping) {
      this.utilityService.log(
        `[RECOMPUTE-COMPUTATION] Timekeeping ID: ${this.employeeTimekeeping.id}, date: ${this.employeeTimekeeping.date}, dateString: ${this.employeeTimekeeping.dateString}, cutoffId: ${this.employeeTimekeeping.employeeTimekeepingCutoffId}`,
      );
    }

    // Fetch employee's payroll group for grace periods
    const employeeData = await this.prismaService.employeeData.findUnique({
      where: { accountId: this.employeeAccountId },
      include: { payrollGroup: true },
    });

    if (employeeData?.payrollGroup) {
      this.lateGraceTimeMinutes =
        employeeData.payrollGroup.lateGraceTimeMinutes || 0;
      this.undertimeGraceTimeMinutes =
        employeeData.payrollGroup.undertimeGraceTimeMinutes || 0;
      this.overtimeGraceTimeMinutes =
        employeeData.payrollGroup.overtimeGraceTimeMinutes || 0;
    }

    const previousDayEmployeeTimekeeping =
      await this.prismaService.employeeTimekeeping.findFirst({
        where: {
          dateString: moment(this.date.raw)
            .subtract(1, 'day')
            .format('YYYY-MM-DD'),
          employeeTimekeepingCutoff: {
            accountId: this.employeeAccountId,
          },
        },
      });

    this.nextDayEmployeeTimekeeping =
      await this.prismaService.employeeTimekeeping.findFirst({
        where: {
          dateString: moment(this.date.raw).add(1, 'day').format('YYYY-MM-DD'),
          employeeTimekeepingCutoff: {
            accountId: this.employeeAccountId,
          },
        },
      });

    // Detect attendance conflicts early - before checking if timekeeping exists
    // This allows us to detect MISSING_LOG conflicts for days without timekeeping records
    try {
      this.utilityService.log(
        `[RECOMPUTE-COMPUTATION] Detecting attendance conflicts...`,
      );

      // Detect conflicts for this date
      await this.attendanceConflictsService.detectConflicts(
        this.employeeAccountId,
        this.date,
        this.employeeTimekeeping,
      );

      // Note: We no longer auto-resolve all conflicts here
      // Conflicts will only be resolved if they're no longer valid after computation

      this.utilityService.log(
        `[RECOMPUTE-COMPUTATION] Initial attendance conflict detection completed`,
      );
    } catch (error) {
      this.utilityService.log(
        `[RECOMPUTE-COMPUTATION] Failed to detect initial attendance conflicts: ${error.message}`,
      );
      // Don't throw - conflict detection failure shouldn't stop the computation
    }

    if (!this.employeeTimekeeping) {
      // If no timekeeping record exists, we can't compute anything
      // This is a valid scenario when initializing timekeeping for a new date
      this.utilityService.log(
        `No timekeeping record found for employee ${this.employeeAccountId} on ${this.date.dateFull}`,
      );
      return;
    }

    const employeeTimekeepingLog: EmployeeTimekeepingLogs[] =
      await this.prismaService.employeeTimekeepingLogs.findMany({
        where: {
          timekeepingId: this.employeeTimekeeping.id,
          isRaw: true,
        },
        orderBy: {
          timeIn: 'asc',
        },
      });

    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] Found ${employeeTimekeepingLog.length} timekeeping logs for timekeeping ID: ${this.employeeTimekeeping.id}`,
    );
    if (employeeTimekeepingLog.length > 0) {
      this.utilityService.log(
        `[RECOMPUTE-COMPUTATION] First log: ${JSON.stringify(employeeTimekeepingLog[0])}`,
      );
    }

    let nextDayEmployeeTimekeepingLog: EmployeeTimekeepingLogs[] = [];

    if (this.nextDayEmployeeTimekeeping) {
      nextDayEmployeeTimekeepingLog =
        await this.prismaService.employeeTimekeepingLogs.findMany({
          where: {
            timekeepingId: this.nextDayEmployeeTimekeeping.id,
            isRaw: true,
          },
          orderBy: {
            timeIn: 'asc',
          },
        });
    }

    this.timeBreakdown = employeeTimekeepingLog.map(
      (log: EmployeeTimekeepingLogs) => {
        return {
          sourceRawId: log.sourceRawId,
          timeIn: this.utilityService.formatTime(log.timeIn),
          timeOut: this.utilityService.formatTime(log.timeOut),
          hours: this.utilityService.formatHours(log.timeSpan / 60),
        };
      },
    );

    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] Created ${this.timeBreakdown.length} timeBreakdown entries`,
    );
    if (this.timeBreakdown.length > 0) {
      this.utilityService.log(
        `[RECOMPUTE-COMPUTATION] First timeBreakdown entry: ${JSON.stringify(this.timeBreakdown[0])}`,
      );
    }

    // Safely parse activeShiftConfig
    this.shift = this.safeParseActiveShiftConfig(
      this.employeeTimekeeping.activeShiftConfig,
    ) as ShiftDataResponse;
    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] Active shift config: ${JSON.stringify(this.shift)}`,
    );
    this.previousDayShift = null;

    /* get next day time if next day shift has data on it's list */
    if (
      this.shift.nextDayShiftTime.length > 0 &&
      nextDayEmployeeTimekeepingLog.length > 0
    ) {
      this.nextDayTimeBreakdown = nextDayEmployeeTimekeepingLog.map(
        (log: EmployeeTimekeepingLogs) => {
          return {
            sourceRawId: log.sourceRawId,
            timeIn: this.utilityService.formatTime(log.timeIn),
            timeOut: this.utilityService.formatTime(log.timeOut),
            hours: this.utilityService.formatHours(log.timeSpan / 60),
          };
        },
      );
    }

    this.processedTimeBreakdown = this.timeBreakdown.map(
      (time: TimeBreakdownResponse) => {
        time.breakdownType = BreakdownType.OVERTIME;
        return time;
      },
    );

    if (previousDayEmployeeTimekeeping) {
      this.previousDayShift = this.safeParseActiveShiftConfig(
        previousDayEmployeeTimekeeping.activeShiftConfig,
      ) as ShiftDataResponse;

      // if previous day shift has next day shift time, then we need to remove the time overlap
      if (
        this.previousDayShift &&
        this.previousDayShift.nextDayShiftTime &&
        this.previousDayShift.nextDayShiftTime.length > 0
      ) {
        this.previousDayShiftNextDayTimeBreakdown =
          this.previousDayShift.nextDayShiftTime.map(
            (shiftNextDay: ShiftTimeDataResponse) => {
              return {
                timeIn: shiftNextDay.startTime,
                timeOut: shiftNextDay.endTime,
                hours: this.utilityService.formatHours(
                  shiftNextDay.endTime.hours - shiftNextDay.startTime.hours,
                ),
                breakdownType: BreakdownType.UNDEFINED,
              };
            },
          );

        this.processedTimeBreakdown = this.removeTimeOverlap(
          this.previousDayShiftNextDayTimeBreakdown,
          this.processedTimeBreakdown,
        );
      }
    }

    /* check rendered time */
    this.shift.nextDayShiftTime.forEach(
      (shiftNextDay: ShiftTimeDataResponse) => {
        this.nextDayTimeBreakdown.forEach(
          (nextDayTimeBreakdown: TimeBreakdownResponse) => {
            const renderedTime = this.checkRenderedTime(
              shiftNextDay.startTime,
              shiftNextDay.endTime,
              nextDayTimeBreakdown.timeIn,
              nextDayTimeBreakdown.timeOut,
              BreakdownType.WORK_TIME,
            );
            if (renderedTime) {
              this.nextDayProcessedTimeBreakdown.push(renderedTime);
            }
          },
        );
      },
    );

    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] Starting executeCompute...`,
    );
    this.executeCompute();
    this.utilityService.log(`[RECOMPUTE-COMPUTATION] executeCompute completed`);

    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] Starting updateTimekeeping...`,
    );
    await this.updateTimekeeping();
    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] updateTimekeeping completed`,
    );

    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] Starting saveTimeBreakdownToDatabase...`,
    );
    await this.saveTimeBreakdownToDatabase();
    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] saveTimeBreakdownToDatabase completed`,
    );

    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] Starting updateDaySummary...`,
    );
    await this.updateDaySummary();
    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] updateDaySummary completed`,
    );

    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] Starting saveCutoffBreakdownToDatabase...`,
    );
    await this.saveCutoffBreakdownToDatabase();
    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] saveCutoffBreakdownToDatabase completed`,
    );

    // Smart conflict resolution after computation
    try {
      this.utilityService.log(
        `[RECOMPUTE-COMPUTATION] Starting smart conflict resolution...`,
      );

      // Get timekeeping logs to check what conflicts should be resolved
      const timekeepingLogs =
        await this.prismaService.employeeTimekeepingLogs.findMany({
          where: {
            timekeepingId: this.employeeTimekeeping.id,
            isRaw: true,
          },
        });

      // If we have logs, resolve NO_ATTENDANCE conflicts (since employee did clock in/out)
      if (timekeepingLogs.length > 0) {
        await this.attendanceConflictsService.resolveSpecificConflictTypes(
          this.employeeAccountId,
          moment(this.date.raw).format('YYYY-MM-DD'),
          [AttendanceConflictType.NO_ATTENDANCE],
          'TIMEKEEPING_COMPUTATION',
        );
        this.utilityService.log(
          `[RECOMPUTE-COMPUTATION] Resolved NO_ATTENDANCE conflicts since logs exist`,
        );
      }

      // Detect conflicts again after computation - this will catch MISSING_TIME_OUT conflicts
      await this.attendanceConflictsService.detectConflicts(
        this.employeeAccountId,
        this.date,
        this.employeeTimekeeping,
      );

      this.utilityService.log(
        `[RECOMPUTE-COMPUTATION] Smart conflict resolution completed`,
      );
    } catch (error) {
      this.utilityService.log(
        `[RECOMPUTE-COMPUTATION] Failed in smart conflict resolution: ${error.message}`,
      );
      // Don't throw - conflict detection failure shouldn't stop the computation
    }
  }

  public async getDaySummaryComputedByTimekeeping(
    timekeepingId: number,
  ): Promise<TimekeepingSummaryResponse> {
    const employeeTimekeeping =
      await this.prismaService.employeeTimekeeping.findUnique({
        where: {
          id: timekeepingId,
        },
        include: {
          employeeTimekeepingCutoff: true,
        },
      });

    const employeeTimekeepingComputed: EmployeeTimekeepingComputed =
      await this.prismaService.employeeTimekeepingComputed.findUnique({
        where: {
          timekeepingId: employeeTimekeeping.id,
        },
      });

    const employeeTimekeepingOverride: EmployeeTimekeepingOverride =
      await this.prismaService.employeeTimekeepingOverride.findUnique({
        where: {
          id: employeeTimekeeping.overrideId || 0,
        },
      });

    const shiftConfig: ShiftDataResponse = this.safeParseActiveShiftConfig(
      employeeTimekeeping.activeShiftConfig,
    ) as ShiftDataResponse;

    const response: TimekeepingSummaryResponse = {
      worktime: this.utilityService.formatHours(
        employeeTimekeepingComputed.workMinutes / 60,
      ),
      overtime: this.utilityService.formatHours(
        employeeTimekeepingComputed.overtimeMinutes / 60,
      ),
      breaktime: this.utilityService.formatHours(
        employeeTimekeepingComputed.breakMinutes / 60,
      ),
      overtimeForApproval: this.utilityService.formatHours(
        employeeTimekeeping.overtimeMinutesApproved / 60,
      ),
      overtimeApproved: this.utilityService.formatHours(0),
      late: this.utilityService.formatHours(
        employeeTimekeepingComputed.lateMinutes / 60,
      ),
      undertime: this.utilityService.formatHours(
        employeeTimekeepingComputed.undertimeMinutes / 60,
      ),
      nightDifferential: this.utilityService.formatHours(
        employeeTimekeepingComputed.nightDifferentialMinutes / 60,
      ),
      nightDifferentialOvertime: this.utilityService.formatHours(
        employeeTimekeepingComputed.nightDifferentialOvertimeMinutes / 60,
      ),
      nightDifferentialOvertimeForApproval: this.utilityService.formatHours(
        employeeTimekeeping.nightDifferentialOvertimeApproved / 60,
      ),
      nightDifferentialOvertimeApproved: this.utilityService.formatHours(0),
      absentCount: employeeTimekeeping.absentCount,
      presentDayCount: employeeTimekeeping.presentDayCount,
      specialHolidayCount: employeeTimekeeping.specialHolidayCount,
      regularHolidayCount: employeeTimekeeping.regularHolidayCount,
      totalHolidayCount:
        employeeTimekeeping.specialHolidayCount +
        employeeTimekeeping.regularHolidayCount,
      totalCreditedHours: this.utilityService.formatHours(
        employeeTimekeeping.totalCreditedHours / 60,
      ),
      approvedLeaveCount: 0,
      approvedLeaveHours: this.utilityService.formatHours(0),
      leaveWithPayCount: 0,
      leaveWithoutPayCount: 0,
    };

    // Check for approved leave on this date
    const hasLeave =
      await this.leaveTimekeepingIntegrationService.hasApprovedLeave(
        employeeTimekeeping.employeeTimekeepingCutoff.accountId,
        employeeTimekeeping.dateString,
      );

    if (hasLeave) {
      const leaveData =
        await this.leaveTimekeepingIntegrationService.getLeaveForDate(
          employeeTimekeeping.employeeTimekeepingCutoff.accountId,
          employeeTimekeeping.dateString,
        );

      if (leaveData) {
        const leaveInfo = leaveData.leaveData as any;
        const shiftHours = shiftConfig
          ? shiftConfig.totalWorkHours?.raw || 8
          : 8; // Default 8 hours if no shift

        // Apply full shift hours for leave
        response.approvedLeaveCount = 1;
        response.approvedLeaveHours =
          this.utilityService.formatHours(shiftHours);

        // Track paid vs unpaid leave
        if (leaveInfo?.compensationType === 'WITH_PAY') {
          response.leaveWithPayCount = 1;
        } else if (leaveInfo?.compensationType === 'WITHOUT_PAY') {
          response.leaveWithoutPayCount = 1;
        }

        // For approved leave, set full work time based on shift
        response.worktime = this.utilityService.formatHours(shiftHours);
        response.totalCreditedHours =
          this.utilityService.formatHours(shiftHours);

        // Clear deductions for leave days
        response.late = this.utilityService.formatHours(0);
        response.undertime = this.utilityService.formatHours(0);
        response.absentCount = 0;
        response.presentDayCount = 1;

        this.utilityService.log(
          `Employee ${employeeTimekeeping.employeeTimekeepingCutoff.accountId} is on approved leave (${leaveInfo?.leaveType || 'LEAVE'}) on ${employeeTimekeeping.dateString}. Applied ${shiftHours} hours.`,
        );
      }
    }

    /* override logic - but don't override if on approved leave */
    if (employeeTimekeepingOverride && !hasLeave) {
      response.worktime = this.utilityService.formatHours(
        employeeTimekeepingOverride.workMinutes / 60,
      );
      response.overtimeApproved = this.utilityService.formatHours(
        employeeTimekeepingOverride.overtimeMinutes / 60,
      );
      response.late = this.utilityService.formatHours(
        employeeTimekeepingOverride.lateMinutes / 60,
      );
      response.undertime = this.utilityService.formatHours(
        employeeTimekeepingOverride.undertimeMinutes / 60,
      );
      response.nightDifferential = this.utilityService.formatHours(
        employeeTimekeepingOverride.nightDifferentialMinutes / 60,
      );
      response.nightDifferentialOvertimeApproved =
        this.utilityService.formatHours(
          employeeTimekeepingOverride.nightDifferentialOvertimeMinutes / 60,
        );
    }

    /* compute total credited hours */
    response.totalCreditedHours = this.utilityService.formatHours(
      this.sumAll([
        response.worktime.totalMinutes,
        response.overtimeApproved.totalMinutes,
        response.nightDifferential.totalMinutes,
        response.nightDifferentialOvertimeApproved.totalMinutes,
      ]) / 60,
    );

    /* if day is not approved - there is no credited hours */
    if (!employeeTimekeeping.isDayApproved) {
      response.totalCreditedHours = this.utilityService.formatHours(0);
    }

    /* if you have any credited hours you are present */
    if (response.totalCreditedHours.totalMinutes > 0) {
      response.presentDayCount = 1;
      response.absentCount = 0;
    } else if (!hasLeave) {
      /* otherwise, you are absent (but not if on leave) */
      response.presentDayCount = 0;
      response.absentCount = 1;
    }

    /* if rest day or extra day - you can't be absent */
    if (
      shiftConfig &&
      (shiftConfig.shiftType.key == ShiftType.REST_DAY ||
        shiftConfig.shiftType.key == ShiftType.EXTRA_DAY)
    ) {
      response.absentCount = 0;
    }

    const accountInformation = await this.prismaService.account.findUnique({
      where: {
        id: this.employeeAccountId,
      },
    });

    this.utilityService.log(
      `Timekeeping Computation (${this.employeeTimekeeping.id}): ${accountInformation.email} computed for ${this.date.dateFull}. The total number of hours rendered is ${response.totalCreditedHours.formatted} hours.`,
    );

    return response;
  }

  private async updateDaySummary(): Promise<void> {
    const timekeepingSummary: TimekeepingSummaryResponse =
      await this.getDaySummaryComputedByTimekeeping(
        this.employeeTimekeeping.id,
      );
    const updateEmployeeTimekeeping: EmployeeTimekeeping =
      {} as EmployeeTimekeeping;

    updateEmployeeTimekeeping.workMinutes =
      timekeepingSummary.worktime.totalMinutes;
    updateEmployeeTimekeeping.breakMinutes =
      timekeepingSummary.breaktime.totalMinutes;
    updateEmployeeTimekeeping.lateMinutes =
      timekeepingSummary.late.totalMinutes;
    updateEmployeeTimekeeping.undertimeMinutes =
      timekeepingSummary.undertime.totalMinutes;
    updateEmployeeTimekeeping.overtimeMinutes =
      timekeepingSummary.overtime.totalMinutes;
    updateEmployeeTimekeeping.overtimeMinutesApproved =
      timekeepingSummary.overtimeApproved.totalMinutes;
    updateEmployeeTimekeeping.nightDifferentialMinutes =
      timekeepingSummary.nightDifferential.totalMinutes;
    updateEmployeeTimekeeping.nightDifferentialOvertimeMinutes =
      timekeepingSummary.nightDifferentialOvertime.totalMinutes;
    updateEmployeeTimekeeping.nightDifferentialOvertimeApproved =
      timekeepingSummary.nightDifferentialOvertimeApproved.totalMinutes;
    updateEmployeeTimekeeping.absentCount = timekeepingSummary.absentCount;
    updateEmployeeTimekeeping.presentDayCount =
      timekeepingSummary.presentDayCount;
    updateEmployeeTimekeeping.specialHolidayCount =
      timekeepingSummary.specialHolidayCount;
    updateEmployeeTimekeeping.regularHolidayCount =
      timekeepingSummary.regularHolidayCount;
    updateEmployeeTimekeeping.totalCreditedHours =
      timekeepingSummary.totalCreditedHours.totalMinutes;

    await this.prismaService.employeeTimekeeping.update({
      where: {
        id: this.employeeTimekeeping.id,
      },
      data: updateEmployeeTimekeeping,
    });
  }

  private sumAll(numbers: number[]): number {
    return numbers.reduce((acc, num) => acc + num, 0);
  }

  private async updateTimekeeping(): Promise<void> {
    let workTime = this.getTotalByBreakdownType(BreakdownType.WORK_TIME);
    const overtime = this.getTotalByBreakdownType(BreakdownType.OVERTIME);
    const nightDifferential = this.getTotalByBreakdownType(
      BreakdownType.NIGHT_DIFFERENTIAL,
    );
    const nightDifferentialOvertime = this.getTotalByBreakdownType(
      BreakdownType.NIGHT_DIFFERENTIAL_OVERTIME,
    );
    const late = this.getTotalByBreakdownType(BreakdownType.LATE);
    let undertime = this.getTotalByBreakdownType(BreakdownType.UNDERTIME);
    let breakTime = this.getTotalByBreakdownType(BreakdownType.BREAK_TIME);
    const breakHoursThreshold = 4 * 60; // todo: this must come from a config

    if (this.shift.breakHours && workTime.totalMinutes >= breakHoursThreshold) {
      workTime = this.utilityService.formatHours(
        (workTime.totalMinutes - this.shift.breakHours.totalMinutes) / 60,
      );
      breakTime = this.utilityService.formatHours(
        (breakTime.totalMinutes + this.shift.breakHours.totalMinutes) / 60,
      );
    }

    if (this.shift.shiftType.key == ShiftType.FLEXITIME) {
      if (workTime.totalMinutes > 0) {
        undertime = this.utilityService.formatHours(
          (this.shift.totalWorkHours.totalMinutes - workTime.totalMinutes) / 60,
        );
      }
    }

    // Store raw values before applying grace periods
    const rawLateMinutes = late.totalMinutes;
    const rawUndertimeMinutes = undertime.totalMinutes;
    const rawOvertimeMinutes = overtime.totalMinutes;

    // Apply grace periods as thresholds
    // Late: If within grace period, forgive completely. Otherwise, count full amount.
    const adjustedLateMinutes =
      rawLateMinutes <= this.lateGraceTimeMinutes ? 0 : rawLateMinutes;

    // Undertime: If within grace period, forgive completely. Otherwise, count full amount.
    const adjustedUndertimeMinutes =
      rawUndertimeMinutes <= this.undertimeGraceTimeMinutes
        ? 0
        : rawUndertimeMinutes;

    // Overtime: If within grace period, no overtime. Otherwise, count full amount.
    const adjustedOvertimeMinutes =
      rawOvertimeMinutes <= this.overtimeGraceTimeMinutes
        ? 0
        : rawOvertimeMinutes;

    await this.prismaService.employeeTimekeepingComputed.update({
      where: {
        timekeepingId: this.employeeTimekeeping.id,
      },
      data: {
        workMinutes: workTime.totalMinutes,
        overtimeMinutes: adjustedOvertimeMinutes,
        nightDifferentialMinutes: nightDifferential.totalMinutes,
        nightDifferentialOvertimeMinutes:
          nightDifferentialOvertime.totalMinutes,
        lateMinutes: adjustedLateMinutes,
        undertimeMinutes: adjustedUndertimeMinutes,
        breakMinutes: breakTime.totalMinutes,
        rawLateMinutes: rawLateMinutes,
        rawUndertimeMinutes: rawUndertimeMinutes,
        rawOvertimeMinutes: rawOvertimeMinutes,
      },
    });
  }

  private async saveTimeBreakdownToDatabase(): Promise<void> {
    const timekeepingLogs: Prisma.EmployeeTimekeepingLogsCreateManyInput[] =
      this.processedTimeBreakdown.map((time: TimeBreakdownResponse) => {
        const timeSpan = time.timeOut.minutes - time.timeIn.minutes;

        return {
          sourceRawId: time.sourceRawId,
          timeIn: time.timeIn.raw,
          timeOut: time.timeOut.raw,
          timeSpan: timeSpan,
          timekeepingId: this.employeeTimekeeping.id,
          type: time.breakdownType,
          isRaw: false,
        };
      });

    const nextDayTimekeepingLogs: Prisma.EmployeeTimekeepingLogsCreateManyInput[] =
      this.nextDayProcessedTimeBreakdown.map((time: TimeBreakdownResponse) => {
        const timeSpan = time.timeOut.minutes - time.timeIn.minutes;

        return {
          sourceRawId: time.sourceRawId,
          timeIn: time.timeIn.raw,
          timeOut: time.timeOut.raw,
          timeSpan: timeSpan,
          timekeepingId: this.employeeTimekeeping.id,
          type: time.breakdownType,
          isRaw: false,
          isNextDayOverlap: true,
        };
      });

    await this.prismaService.employeeTimekeepingLogs.deleteMany({
      where: {
        timekeepingId: this.employeeTimekeeping.id,
        isRaw: false,
      },
    });

    await this.prismaService.employeeTimekeepingLogs.createMany({
      data: timekeepingLogs,
    });

    await this.prismaService.employeeTimekeepingLogs.createMany({
      data: nextDayTimekeepingLogs,
    });
  }

  private async saveCutoffBreakdownToDatabase(): Promise<void> {
    const columns = [
      'workMinutes',
      'overtimeMinutes',
      'overtimeMinutesApproved',
      'overtimeMinutesForApproval',
      'nightDifferentialMinutes',
      'nightDifferentialOvertimeMinutes',
      'nightDifferentialOvertimeApproved',
      'nightDifferentialOvertimeForApproval',
      'lateMinutes',
      'undertimeMinutes',
      'totalCreditedHours',
      'absentCount',
      'presentDayCount',
      'breakMinutes',
      'specialHolidayCount',
      'regularHolidayCount',
      'workDayCount',
    ];

    const { _sum: aggregatedData } =
      await this.prismaService.employeeTimekeeping.aggregate({
        where: {
          employeeTimekeepingCutoffId:
            this.employeeTimekeeping.employeeTimekeepingCutoffId,
        },
        _sum: Object.fromEntries(columns.map((column) => [column, true])),
      });

    const defaultedData = Object.fromEntries(
      columns.map((column) => [column, aggregatedData[column] || 0]),
    );

    await this.prismaService.employeeTimekeepingCutoff.update({
      where: {
        id: this.employeeTimekeeping.employeeTimekeepingCutoffId,
      },
      data: defaultedData,
    });
  }

  private executeCompute() {
    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] executeCompute - Starting computeWorkHours...`,
    );
    this.computeWorkHours();
    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] executeCompute - computeWorkHours completed`,
    );

    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] executeCompute - Starting computeLateUndertime...`,
    );
    this.computeLateUndertime();
    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] executeCompute - computeLateUndertime completed`,
    );

    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] executeCompute - Starting computeNightDifferential...`,
    );
    this.computeNightDifferential();
    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] executeCompute - computeNightDifferential completed`,
    );

    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] executeCompute - Starting addBreakdownTypeDetails...`,
    );
    this.addBreakdownTypeDetails();
    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] executeCompute - addBreakdownTypeDetails completed`,
    );

    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] executeCompute - Starting sortBreakdown...`,
    );
    this.sortBreakdown();
    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] executeCompute - sortBreakdown completed`,
    );

    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] executeCompute - Final processedTimeBreakdown count: ${this.processedTimeBreakdown.length}`,
    );
  }
  private computeWorkHours(): void {
    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] computeWorkHours - timeBreakdown count: ${this.timeBreakdown.length}`,
    );
    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] computeWorkHours - nextDayTimeBreakdown count: ${this.nextDayTimeBreakdown.length}`,
    );

    const { workTime, nextDayWorkTime } = this.getWorkTime(
      this.shift,
      this.timeBreakdown,
      this.nextDayTimeBreakdown,
    );

    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] computeWorkHours - workTime count: ${workTime.length}`,
    );
    this.utilityService.log(
      `[RECOMPUTE-COMPUTATION] computeWorkHours - nextDayWorkTime count: ${nextDayWorkTime.length}`,
    );

    if (workTime.length > 0) {
      this.utilityService.log(
        `[RECOMPUTE-COMPUTATION] computeWorkHours - First workTime: ${JSON.stringify(workTime[0])}`,
      );
    }

    this.insertTimeBreakdown(workTime);
    this.insertNextDayTimeBreakdown(nextDayWorkTime);
  }
  private computeLateUndertime(): void {
    const { lateUndertime, nextDayLateUndertime } = this.getLateUndertime(
      this.shift,
      this.timeBreakdown,
      this.nextDayProcessedTimeBreakdown,
    );
    this.insertTimeBreakdown(lateUndertime);
    this.insertNextDayTimeBreakdown(nextDayLateUndertime);
  }
  private computeNightDifferential(): void {
    const worktimeBreakdown: TimeBreakdownResponse[] =
      this.processedTimeBreakdown.filter(
        (time) => time.breakdownType == BreakdownType.WORK_TIME,
      );
    const overtimeBreakdown: TimeBreakdownResponse[] =
      this.processedTimeBreakdown.filter(
        (time) => time.breakdownType == BreakdownType.OVERTIME,
      );
    const nextDayWorktimeBreakdown: TimeBreakdownResponse[] =
      this.nextDayProcessedTimeBreakdown.filter(
        (time) => time.breakdownType == BreakdownType.WORK_TIME,
      );
    const nextDayOvertimeBreakdown: TimeBreakdownResponse[] =
      this.nextDayProcessedTimeBreakdown.filter(
        (time) => time.breakdownType == BreakdownType.OVERTIME,
      );

    const nightDifferentialBreakdown: TimeBreakdownResponse[] = [];
    const nextDayNightDifferentialBreakdown: TimeBreakdownResponse[] = [];

    // Current day night differential
    const workTimeNightDifferential: TimeBreakdownResponse[] =
      this.getNightDifferentialTimeNight(
        worktimeBreakdown,
        BreakdownType.NIGHT_DIFFERENTIAL,
      );
    const workTimeMorningDifferential: TimeBreakdownResponse[] =
      this.getNightDifferentialTimeMorning(
        worktimeBreakdown,
        BreakdownType.NIGHT_DIFFERENTIAL,
      );
    const morningDifferentialTime: TimeBreakdownResponse[] =
      this.getNightDifferentialTimeMorning(
        overtimeBreakdown,
        BreakdownType.NIGHT_DIFFERENTIAL_OVERTIME,
      );
    const nightDifferentialTime: TimeBreakdownResponse[] =
      this.getNightDifferentialTimeNight(
        overtimeBreakdown,
        BreakdownType.NIGHT_DIFFERENTIAL_OVERTIME,
      );

    // Next day night differential
    const nextDayWorkTimeNightDifferential: TimeBreakdownResponse[] =
      this.getNightDifferentialTimeNight(
        nextDayWorktimeBreakdown,
        BreakdownType.NIGHT_DIFFERENTIAL,
      );
    const nextDayWorkTimeMorningDifferential: TimeBreakdownResponse[] =
      this.getNightDifferentialTimeMorning(
        nextDayWorktimeBreakdown,
        BreakdownType.NIGHT_DIFFERENTIAL,
      );
    const nextDayMorningDifferentialTime: TimeBreakdownResponse[] =
      this.getNightDifferentialTimeMorning(
        nextDayOvertimeBreakdown,
        BreakdownType.NIGHT_DIFFERENTIAL_OVERTIME,
      );
    const nextDayNightDifferentialTime: TimeBreakdownResponse[] =
      this.getNightDifferentialTimeNight(
        nextDayOvertimeBreakdown,
        BreakdownType.NIGHT_DIFFERENTIAL_OVERTIME,
      );

    nightDifferentialBreakdown.push(...workTimeMorningDifferential);
    nightDifferentialBreakdown.push(...morningDifferentialTime);
    nightDifferentialBreakdown.push(...workTimeNightDifferential);
    nightDifferentialBreakdown.push(...nightDifferentialTime);

    nextDayNightDifferentialBreakdown.push(
      ...nextDayWorkTimeMorningDifferential,
    );
    nextDayNightDifferentialBreakdown.push(...nextDayMorningDifferentialTime);
    nextDayNightDifferentialBreakdown.push(...nextDayWorkTimeNightDifferential);
    nextDayNightDifferentialBreakdown.push(...nextDayNightDifferentialTime);

    this.insertTimeBreakdown(nightDifferentialBreakdown);
    this.insertNextDayTimeBreakdown(nextDayNightDifferentialBreakdown);
  }

  private sortBreakdown(): void {
    this.processedTimeBreakdown = this.processedTimeBreakdown.sort((a, b) => {
      if (a.timeIn.minutes < b.timeIn.minutes) {
        return -1;
      }
      if (a.timeIn.minutes > b.timeIn.minutes) {
        return 1;
      }
      return 0;
    });
  }

  private addBreakdownTypeDetails(): void {
    this.processedTimeBreakdown = this.processedTimeBreakdown.map(
      (time: TimeBreakdownResponse) => {
        time.breakdownTypeDetails = TimekeepingBreakdownTypeReference.find(
          (type) => type.key == time.breakdownType,
        );
        return time;
      },
    );
  }

  private insertTimeBreakdown(timeBreakdown: TimeBreakdownResponse[]): void {
    this.processedTimeBreakdown = this.removeTimeOverlap(
      timeBreakdown,
      this.processedTimeBreakdown,
    );
    this.processedTimeBreakdown.push(...timeBreakdown);
  }

  private insertNextDayTimeBreakdown(
    timeBreakdown: TimeBreakdownResponse[],
  ): void {
    this.nextDayProcessedTimeBreakdown = this.removeTimeOverlap(
      timeBreakdown,
      this.nextDayProcessedTimeBreakdown,
    );
    this.nextDayProcessedTimeBreakdown.push(...timeBreakdown);
  }

  private removeTimeOverlap(
    timeBreakdown: TimeBreakdownResponse[],
    removeFrom: TimeBreakdownResponse[],
  ): TimeBreakdownResponse[] {
    removeFrom = removeFrom.flatMap((processedTime) => {
      let remainingTime = [processedTime];

      timeBreakdown.forEach((newTime) => {
        remainingTime = remainingTime.flatMap((time) => {
          if (
            time.timeIn.minutes >= newTime.timeOut.minutes ||
            time.timeOut.minutes <= newTime.timeIn.minutes
          ) {
            // No overlap
            return [time];
          }

          const splitTimes = [];
          if (time.timeIn.minutes < newTime.timeIn.minutes) {
            splitTimes.push({
              ...time,
              timeOut: newTime.timeIn,
              hours: this.utilityService.formatHours(
                (newTime.timeIn.minutes - time.timeIn.minutes) / 60,
              ),
            });
          }
          if (time.timeOut.minutes > newTime.timeOut.minutes) {
            splitTimes.push({
              ...time,
              timeIn: newTime.timeOut,
              hours: this.utilityService.formatHours(
                (time.timeOut.minutes - newTime.timeOut.minutes) / 60,
              ),
            });
          }
          return splitTimes;
        });
      });

      return remainingTime;
    });

    return removeFrom;
  }

  private removeTimeOverlapSameBreakdown(
    timeBreakdown: TimeBreakdownResponse[],
  ): TimeBreakdownResponse[] {
    const uniqueBreakdown = new Map<string, TimeBreakdownResponse>();

    timeBreakdown.forEach((time) => {
      const key = `${time.timeIn.minutes}-${time.timeOut.minutes}`;
      if (!uniqueBreakdown.has(key)) {
        uniqueBreakdown.set(key, time);
      }
    });

    return Array.from(uniqueBreakdown.values());
  }

  private getWorkTime(
    shift: ShiftDataResponse,
    timeBreakdown: TimeBreakdownResponse[],
    nextDayTimeBreakdown: TimeBreakdownResponse[],
  ): {
    workTime: TimeBreakdownResponse[];
    nextDayWorkTime: TimeBreakdownResponse[];
  } {
    const workTime: TimeBreakdownResponse[] = [];
    const nextDayWorkTime: TimeBreakdownResponse[] = [];

    if (shift.shiftType.key == ShiftType.TIME_BOUND) {
      shift.shiftTime.forEach((shiftTime: ShiftTimeDataResponse) => {
        timeBreakdown.forEach((time: TimeBreakdownResponse) => {
          const renderedTime = this.checkRenderedTime(
            shiftTime.startTime,
            shiftTime.endTime,
            time.timeIn,
            time.timeOut,
            shiftTime.isBreakTime
              ? BreakdownType.BREAK_TIME
              : BreakdownType.WORK_TIME,
          );

          if (renderedTime) {
            renderedTime.sourceRawId = time.sourceRawId;
            renderedTime && workTime.push(renderedTime);
          }
        });
      });

      /* check rendered time */
      shift.nextDayShiftTime.forEach((shiftNextDay: ShiftTimeDataResponse) => {
        nextDayTimeBreakdown.forEach(
          (nextDayTimeBreakdown: TimeBreakdownResponse) => {
            const renderedTime = this.checkRenderedTime(
              shiftNextDay.startTime,
              shiftNextDay.endTime,
              nextDayTimeBreakdown.timeIn,
              nextDayTimeBreakdown.timeOut,
              BreakdownType.WORK_TIME,
            );

            if (renderedTime) {
              renderedTime.sourceRawId = nextDayTimeBreakdown.sourceRawId;
              nextDayWorkTime.push(renderedTime);
            }
          },
        );
      });
    } else {
      const targetHours: HoursFormat = shift.targetHours;
      let remaingTargetMinutes: number = targetHours.totalMinutes;
      let overtimeStart = false;

      timeBreakdown.forEach((time: TimeBreakdownResponse) => {
        remaingTargetMinutes -= time.hours.totalMinutes;

        if (remaingTargetMinutes > 0) {
          time.breakdownType = BreakdownType.WORK_TIME;
          time.breakdownTypeDetails = TimekeepingBreakdownTypeReference.find(
            (type) => type.key == BreakdownType.WORK_TIME,
          );
          time.sourceRawId = time.sourceRawId;
          workTime.push(time);
        } else if (overtimeStart) {
          time.breakdownType = BreakdownType.OVERTIME;
          time.breakdownTypeDetails = TimekeepingBreakdownTypeReference.find(
            (type) => type.key == BreakdownType.WORK_TIME,
          );
          time.sourceRawId = time.sourceRawId;
          workTime.push(time);
        } else {
          const initialWorkTime: TimeBreakdownResponse =
            this.getWithintheShiftMinutes(
              time.hours.totalMinutes + remaingTargetMinutes,
              time,
            );
          workTime.push(initialWorkTime);
          overtimeStart = true;
        }
      });
    }

    return { workTime, nextDayWorkTime };
  }

  private getWithintheShiftMinutes(
    minutes: number,
    time: TimeBreakdownResponse,
  ): TimeBreakdownResponse {
    const adjustedTimeOut = this.utilityService.formatTime(
      moment(time.timeIn.raw, 'HH:mm:ss')
        .add(minutes, 'minutes')
        .format('HH:mm:ss'),
    );

    const responseBreakdown: TimeBreakdownResponse = {
      breakdownType: BreakdownType.WORK_TIME,
      timeIn: this.utilityService.formatTime(time.timeIn.raw),
      timeOut: adjustedTimeOut,
      hours: this.utilityService.formatHours(minutes / 60),
      sourceRawId: time.sourceRawId,
    };

    return responseBreakdown;
  }

  private checkRenderedTime(
    shiftIn: TimeFormat,
    shiftOut: TimeFormat,
    timeIn: TimeFormat,
    timeOut: TimeFormat,
    breakdownType: BreakdownType = BreakdownType.WORK_TIME,
  ): TimeBreakdownResponse {
    const timeInWithinShift =
      timeIn.minutes > shiftIn.minutes ? timeIn : shiftIn;
    const timeOutWithinShift =
      timeOut.minutes < shiftOut.minutes ? timeOut : shiftOut;

    if (timeInWithinShift.minutes < timeOutWithinShift.minutes) {
      const hours: HoursFormat = this.utilityService.formatHours(
        (timeOutWithinShift.minutes - timeInWithinShift.minutes) / 60,
      );
      return {
        breakdownType: breakdownType,
        timeIn: timeInWithinShift,
        timeOut: timeOutWithinShift,
        hours,
      };
    }
    return null;
  }

  private checkMissingTime(
    shiftIn: TimeFormat,
    shiftOut: TimeFormat,
    timeIn: TimeFormat,
    timeOut: TimeFormat,
  ): TimeBreakdownResponse {
    // Only get missing time if time is within shift period
    if (
      timeIn.minutes <= shiftOut.minutes &&
      timeOut.minutes >= shiftIn.minutes
    ) {
      // Get missing time before time in
      if (timeIn.minutes > shiftIn.minutes) {
        const hours: HoursFormat = this.utilityService.formatHours(
          (timeIn.minutes - shiftIn.minutes) / 60,
        );
        return {
          breakdownType: BreakdownType.UNDERTIME,
          timeIn: shiftIn,
          timeOut: timeIn,
          hours,
        };
      }

      // Get missing time after time out
      if (timeOut.minutes < shiftOut.minutes) {
        const hours: HoursFormat = this.utilityService.formatHours(
          (shiftOut.minutes - timeOut.minutes) / 60,
        );
        return {
          breakdownType: BreakdownType.UNDERTIME,
          timeIn: timeOut,
          timeOut: shiftOut,
          hours,
        };
      }
    }

    return null;
  }

  private getLateUndertime(
    shift: ShiftDataResponse,
    timeBreakdown: TimeBreakdownResponse[],
    nextDayTimeBreakdown: TimeBreakdownResponse[],
  ): {
    lateUndertime: TimeBreakdownResponse[];
    nextDayLateUndertime: TimeBreakdownResponse[];
  } {
    let lateUndertime: TimeBreakdownResponse[] = [];
    let nextDayLateUndertime: TimeBreakdownResponse[] = [];

    // Get all missing time from shift in the processed time breakdown
    if (shift.shiftType.key == ShiftType.TIME_BOUND) {
      shift.shiftTime.forEach((shiftTime: ShiftTimeDataResponse) => {
        if (!shiftTime.isBreakTime) {
          timeBreakdown.forEach((time: TimeBreakdownResponse) => {
            const missingTime = this.checkMissingTime(
              shiftTime.startTime,
              shiftTime.endTime,
              time.timeIn,
              time.timeOut,
            );

            if (missingTime) {
              missingTime.sourceRawId = time.sourceRawId;
              let pushTime = true;

              lateUndertime.forEach((late) => {
                // Check if the time overlaps with the existing late time
                if (
                  missingTime.timeIn.minutes >= late.timeIn.minutes &&
                  missingTime.timeOut.minutes <= late.timeOut.minutes
                ) {
                  pushTime = false;
                }
              });

              pushTime && lateUndertime.push(missingTime);
            }
          });
        }
      });

      shift.nextDayShiftTime.forEach((shiftNextDay: ShiftTimeDataResponse) => {
        nextDayTimeBreakdown.forEach(
          (nextDayTimeBreakdown: TimeBreakdownResponse) => {
            const missingTime = this.checkMissingTime(
              shiftNextDay.startTime,
              shiftNextDay.endTime,
              nextDayTimeBreakdown.timeIn,
              nextDayTimeBreakdown.timeOut,
            );

            if (missingTime) {
              missingTime.sourceRawId = nextDayTimeBreakdown.sourceRawId;
              nextDayLateUndertime.push(missingTime);
            }
          },
        );
      });
    }

    lateUndertime = this.removeTimeOverlap(
      this.processedTimeBreakdown,
      lateUndertime,
    );
    nextDayLateUndertime = this.removeTimeOverlap(
      this.nextDayProcessedTimeBreakdown,
      nextDayLateUndertime,
    );
    lateUndertime = this.removeTimeOverlapSameBreakdown(lateUndertime);
    nextDayLateUndertime =
      this.removeTimeOverlapSameBreakdown(nextDayLateUndertime);

    lateUndertime = lateUndertime.map((time) => {
      shift.shiftTime.forEach((shiftTime: ShiftTimeDataResponse) => {
        if (time.timeIn.seconds == shiftTime.startTime.seconds) {
          time.breakdownType = BreakdownType.LATE;
        }
      });

      return time;
    });

    nextDayLateUndertime = nextDayLateUndertime.map((time) => {
      shift.nextDayShiftTime.forEach((shiftNextDay: ShiftTimeDataResponse) => {
        if (time.timeIn.seconds == shiftNextDay.startTime.seconds) {
          time.breakdownType = BreakdownType.LATE;
        }
      });

      return time;
    });

    // Remove break time from late undertime
    shift.shiftTime.forEach((shiftTime: ShiftTimeDataResponse) => {
      if (shiftTime.isBreakTime) {
        const breakTime: TimeBreakdownResponse = {
          breakdownType: BreakdownType.BREAK_TIME,
          timeIn: shiftTime.startTime,
          timeOut: shiftTime.endTime,
          hours: this.utilityService.formatHours(0),
        };

        lateUndertime = this.removeTimeOverlap([breakTime], lateUndertime);
      }
    });

    // Remove the previous day shift next day time from late undertime
    if (this.previousDayShiftNextDayTimeBreakdown) {
      this.previousDayShiftNextDayTimeBreakdown.forEach((time) => {
        lateUndertime = this.removeTimeOverlap([time], lateUndertime);
      });
    }

    return { lateUndertime, nextDayLateUndertime };
  }

  private getTotalByBreakdownType(breakdownType: BreakdownType): HoursFormat {
    const total = this.processedTimeBreakdown.reduce((acc, time) => {
      if (time.breakdownType === breakdownType) {
        return acc + time.hours.totalMinutes;
      }
      return acc;
    }, 0);

    const totalNextDay = this.nextDayProcessedTimeBreakdown.reduce(
      (acc, time) => {
        if (time.breakdownType === breakdownType) {
          return acc + time.hours.totalMinutes;
        }
        return acc;
      },
      0,
    );

    return this.utilityService.formatHours((total + totalNextDay) / 60);
  }

  private getNightDifferentialTimeNight(
    timeBreakdown: TimeBreakdownResponse[],
    breakdownType: BreakdownType = BreakdownType.NIGHT_DIFFERENTIAL,
  ): TimeBreakdownResponse[] {
    const nightDifferentialTime: TimeBreakdownResponse[] = [];
    const nightStart: TimeFormat = this.utilityService.formatTime('22:00'); // 10:00 PM
    const nightEnd: TimeFormat = this.utilityService.formatTime('23:59:59'); // 11:59 PM

    timeBreakdown.forEach((time: TimeBreakdownResponse) => {
      const coverage = this.checkRenderedTime(
        nightStart,
        nightEnd,
        time.timeIn,
        time.timeOut,
        breakdownType,
      );

      if (coverage) {
        coverage.sourceRawId = time.sourceRawId;
        nightDifferentialTime.push(coverage);
      }
    });

    return nightDifferentialTime;
  }
  private getNightDifferentialTimeMorning(
    timeBreakdown: TimeBreakdownResponse[],
    breakdownType: BreakdownType = BreakdownType.NIGHT_DIFFERENTIAL,
  ): TimeBreakdownResponse[] {
    const nightDifferentialTime: TimeBreakdownResponse[] = [];
    const nightStart: TimeFormat = this.utilityService.formatTime('00:00'); // 12:00 AM
    const nightEnd: TimeFormat = this.utilityService.formatTime('06:00'); // 6:00 AM

    timeBreakdown.forEach((time: TimeBreakdownResponse) => {
      const coverage = this.checkRenderedTime(
        nightStart,
        nightEnd,
        time.timeIn,
        time.timeOut,
        breakdownType,
      );

      if (coverage) {
        coverage.sourceRawId = time.sourceRawId;
        nightDifferentialTime.push(coverage);
      }
    });

    return nightDifferentialTime;
  }
}

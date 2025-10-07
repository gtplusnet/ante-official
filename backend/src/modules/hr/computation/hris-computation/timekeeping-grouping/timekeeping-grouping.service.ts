import { Inject, Injectable, forwardRef } from '@nestjs/common';
import * as moment from 'moment';
import {
  DateFormat,
  EmployeeDataResponse,
  LocalHolidayResponse,
  NationalHolidayResponse,
  RawTimeInOutResponse,
  ShiftDataResponse,
  TimekeepingHoliday,
} from '@shared/response';
import {
  ActiveShiftType,
  BreakdownType,
  CutoffDateRange,
  EmployeeTimekeeping,
  EmployeeTimekeepingCutoff,
  EmployeeTimekeepingRaw,
  HolidayType,
  Prisma,
  ShiftType,
} from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { EmployeeListService } from '@modules/hr/employee/employee-list/employee-list.service';
import { CutoffConfigurationService } from '@modules/hr/configuration/cutoff-configuration/cutoff-configuration.service';
import { CutoffDate } from '@modules/hr/configuration/cutoff-configuration/cutoff-configuration.interface';
import { ScheduleConfigurationService } from '@modules/hr/configuration/schedule-configuration/schedule-configuration.service';
import { ShiftConfigurationService } from '@modules/hr/configuration/shift-configuration/shift-configuration.service';
import { NationalHolidayConfigurationService } from '@modules/hr/configuration/national-holiday-configuration/national-holiday-configuration.service';
import { LocalHolidayConfigurationService } from '@modules/hr/configuration/local-holiday-configuration/local-holiday-configuration.service';
import { UtilityService } from '@common/utility.service';
import { ScheduleAdjustmentService } from '@modules/hr/filing/services/schedule-adjustment.service';
import { IndividualScheduleAssignmentService } from '@modules/hr/individual-schedule-assignment/individual-schedule-assignment.service';
import { TeamService } from '@modules/hr/team/team.service';

@Injectable()
export class TimekeepingGroupingService {
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly employeeListService: EmployeeListService;
  @Inject(forwardRef(() => CutoffConfigurationService))
  private readonly cutoffConfigurationService: CutoffConfigurationService;
  @Inject()
  private readonly scheduleConfigurationService: ScheduleConfigurationService;
  @Inject()
  private readonly shiftConfigurationService: ShiftConfigurationService;
  @Inject()
  private readonly nationalHolidayConfigurationService: NationalHolidayConfigurationService;
  @Inject()
  private readonly localHolidayConfigurationService: LocalHolidayConfigurationService;
  @Inject() private readonly utilityService: UtilityService;
  @Inject()
  private readonly scheduleAdjustmentService: ScheduleAdjustmentService;
  @Inject()
  private readonly individualScheduleAssignmentService: IndividualScheduleAssignmentService;
  @Inject() private readonly teamService: TeamService;

  private employeeTimekeepingRaw: EmployeeTimekeepingRaw[];
  private employeeAccountId: string;
  private employeeInformation: EmployeeDataResponse;
  private cutoffCodeId: number;
  private fromDate: DateFormat;
  private toDate: DateFormat;
  private employeeTimekeepingCutoff: EmployeeTimekeepingCutoff;

  public initialize(employeeAccountId, fromDate, toDate) {
    this.employeeAccountId = employeeAccountId;
    this.fromDate = fromDate;
    this.toDate = toDate;
    this.employeeTimekeepingRaw = [];
    this.employeeTimekeepingCutoff = null;
    this.employeeInformation = null;
    this.cutoffCodeId = null;
  }

  public async updateShifting(employeeTimekeepingId: number) {
    const employeeTimekeeping: EmployeeTimekeeping =
      await this.prisma.employeeTimekeeping.findUnique({
        where: { id: employeeTimekeepingId },
      });

    const { activeShiftType, activeShift } = await this.getEmployeeActiveShift(
      this.employeeAccountId,
      employeeTimekeeping.date,
    );
    const isRestDay =
      activeShift.shiftType.key === ShiftType.REST_DAY ? true : false;
    const isExtraDay =
      activeShift.shiftType.key === ShiftType.EXTRA_DAY ? true : false;

    // Check if shift type changed from previous configuration
    let previousShiftConfig = null;
    if (employeeTimekeeping.activeShiftConfig) {
      // Check if it's already an object or needs parsing
      if (typeof employeeTimekeeping.activeShiftConfig === 'string') {
        try {
          // Avoid parsing invalid JSON like "[object Object]"
          if (!employeeTimekeeping.activeShiftConfig.startsWith('[object')) {
            previousShiftConfig = JSON.parse(
              employeeTimekeeping.activeShiftConfig,
            );
          }
        } catch (error) {
          console.error('Failed to parse activeShiftConfig:', error);
          previousShiftConfig = null;
        }
      } else {
        // It's already an object
        previousShiftConfig = employeeTimekeeping.activeShiftConfig;
      }
    }
    const previousIsRestDay =
      previousShiftConfig?.shiftType?.key === ShiftType.REST_DAY;

    let isInitialized = employeeTimekeeping.isInitialized;
    let isDayApproved = employeeTimekeeping.isDayApproved;
    let isEligibleHoliday = employeeTimekeeping.isEligibleHoliday;
    const isEligibleHolidayOverride =
      employeeTimekeeping.isEligibleHolidayOverride;

    if (!isInitialized) {
      // First time initialization
      isDayApproved = isRestDay ? false : true;
      isInitialized = true;
    } else if (previousShiftConfig && previousIsRestDay !== isRestDay) {
      // Shift type changed between rest day and work day
      // Update approval status accordingly
      isDayApproved = isRestDay ? false : true;
      this.utilityService.log(
        `[SHIFT-CHANGE] Date: ${moment(employeeTimekeeping.date).format('YYYY-MM-DD')}, ` +
          `Previous: ${previousIsRestDay ? 'REST_DAY' : 'WORK_DAY'}, ` +
          `Current: ${isRestDay ? 'REST_DAY' : 'WORK_DAY'}, ` +
          `isDayApproved: ${isDayApproved}`,
      );
    }

    const localHolidayList: LocalHolidayResponse[] =
      await this.localHolidayConfigurationService.getLocalHolidayListByDate({
        date: employeeTimekeeping.date,
      });

    const nationalHolidayList: NationalHolidayResponse[] =
      await this.nationalHolidayConfigurationService.getNationalHolidayListByDate(
        {
          date: employeeTimekeeping.date,
        },
      );

    const timekeepingHoliday: TimekeepingHoliday[] = localHolidayList.map(
      (holiday) => ({
        name: holiday.name,
        holidayType: holiday.type,
        source: 'Local Holiday',
      }),
    );

    timekeepingHoliday.push(
      ...nationalHolidayList.map((holiday) => ({
        name: holiday.name,
        holidayType: holiday.type,
        source: 'National Holiday',
      })),
    );

    // delete time keeping holiday if existing
    await this.prisma.employeeTimekeepingHoliday.deleteMany({
      where: {
        timekeepingId: employeeTimekeeping.id,
      },
    });

    const insertTimekeepingHolidayParams: Prisma.EmployeeTimekeepingHolidayCreateManyInput[] =
      timekeepingHoliday.map((holiday) => ({
        name: holiday.name,
        holidayType: holiday.holidayType.key,
        source: holiday.source,
        timekeepingId: employeeTimekeeping.id,
      }));

    await this.prisma.employeeTimekeepingHoliday.createMany({
      data: insertTimekeepingHolidayParams,
    });

    const regularHolidayCount = timekeepingHoliday.filter(
      (holiday) => holiday.holidayType.key === HolidayType.REGULAR,
    ).length;
    const specialHolidayCount = timekeepingHoliday.filter(
      (holiday) => holiday.holidayType.key === HolidayType.SPECIAL,
    ).length;

    // Check holiday eligibility
    if (regularHolidayCount > 0 || specialHolidayCount > 0) {
      // Calculate automatic eligibility
      const calculatedEligibility = await this.checkHolidayEligibility(
        employeeTimekeeping.employeeTimekeepingCutoffId
          ? (
              await this.prisma.employeeTimekeepingCutoff.findUnique({
                where: { id: employeeTimekeeping.employeeTimekeepingCutoffId },
              })
            )?.accountId || this.employeeAccountId
          : this.employeeAccountId,
        employeeTimekeeping.date,
      );

      // If there's no manual override, use calculated value
      if (isEligibleHolidayOverride === null) {
        isEligibleHoliday = calculatedEligibility;
      } else {
        // Manual override exists, use that value
        isEligibleHoliday = isEligibleHolidayOverride;
      }
    }

    // Safely stringify activeShift, handling undefined or circular references
    let activeShiftConfigString = null;
    if (activeShift) {
      try {
        activeShiftConfigString = JSON.stringify(activeShift);
      } catch (error) {
        console.error('Failed to stringify activeShift:', error);
        // Store a simplified version if full stringify fails
        activeShiftConfigString = JSON.stringify({
          shiftType: activeShift?.shiftType || null,
          id: activeShift?.id || null,
        });
      }
    }

    await this.prisma.employeeTimekeeping.update({
      where: { id: employeeTimekeeping.id },
      data: {
        isRestDay: isRestDay,
        workDayCount: isRestDay ? 0 : 1,
        isExtraDay: isExtraDay,
        activeShiftType: activeShiftType,
        activeShiftConfig: activeShiftConfigString,
        regularHolidayCount,
        specialHolidayCount,
        isInitialized,
        isDayApproved,
        isEligibleHoliday,
        isEligibleHolidayOverride,
      },
    });
  }
  private async getEmployeeActiveShift(
    employeeAccountId: string,
    date: Date,
  ): Promise<{
    activeShiftType: ActiveShiftType;
    activeShift: ShiftDataResponse;
  }> {
    // Priority order: SCHEDULE_ADJUSTMENT > INDIVIDUAL_SCHEDULE > TEAM_SCHEDULE > REGULAR_SHIFT

    // 1. Check for Schedule Adjustment (highest priority)
    const scheduleAdjustmentShift =
      await this.scheduleAdjustmentService.getScheduleAdjustmentShift(
        employeeAccountId,
        date,
      );
    if (scheduleAdjustmentShift) {
      return {
        activeShiftType: ActiveShiftType.SCHEDULE_ADJUSTMENT,
        activeShift: scheduleAdjustmentShift,
      };
    }

    // 2. Check for Individual Schedule
    const individualSchedule = await this.getIndividualScheduleShift(
      employeeAccountId,
      date,
    );
    if (individualSchedule) {
      return {
        activeShiftType: ActiveShiftType.INDIVIDUAL_SCHEDULE,
        activeShift: individualSchedule,
      };
    }

    // 3. Check for Team Schedule
    const teamSchedule = await this.getTeamScheduleShift(
      employeeAccountId,
      date,
    );
    if (teamSchedule) {
      return {
        activeShiftType: ActiveShiftType.TEAM_SCHEDULE,
        activeShift: teamSchedule,
      };
    }

    // 4. Fall back to Regular Shift (lowest priority)
    const regularShift =
      await this.scheduleConfigurationService.getEmployeeRegularShift(
        employeeAccountId,
        date,
        false,
      );
    if (regularShift) {
      return {
        activeShiftType: ActiveShiftType.REGULAR_SHIFT,
        activeShift: regularShift,
      };
    }

    // No shift found
    return { activeShiftType: ActiveShiftType.NONE, activeShift: null };
  }

  private async getIndividualScheduleShift(
    employeeAccountId: string,
    date: Date,
  ): Promise<ShiftDataResponse | null> {
    try {
      // Convert date to MM/DD/YYYY format for the API
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      const dateStr = `${month}/${day}/${year}`;

      // Get individual schedule assignments for this employee and date
      const assignments =
        await this.individualScheduleAssignmentService.getAssignments({
          startDate: dateStr,
          endDate: dateStr,
          employeeIds: [employeeAccountId],
        });

      if (assignments && assignments.length > 0) {
        const assignment = assignments[0];

        // If no shift is assigned, return null (use default)
        if (!assignment.shiftId) {
          return null;
        }

        // Get shift information using ShiftConfigurationService
        const shiftData = await this.shiftConfigurationService.getShiftInfo(
          assignment.shiftId,
          false,
        );
        return shiftData;
      }

      return null;
    } catch (error) {
      this.utilityService.log(
        `[SCHEDULE] Error getting individual schedule: ${error.message}`,
      );
      return null;
    }
  }

  private async getTeamScheduleShift(
    employeeAccountId: string,
    date: Date,
  ): Promise<ShiftDataResponse | null> {
    try {
      // First check if employee belongs to a team
      const employee = await this.prisma.account.findUnique({
        where: { id: employeeAccountId },
        include: {
          teamMembership: true,
        },
      });

      if (!employee?.teamMembership?.teamId) {
        return null; // Employee not in a team
      }

      // Convert date to YYYY-MM-DD format for team schedule
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Get team schedule assignment
      const teamSchedule = await this.prisma.teamScheduleAssignment.findFirst({
        where: {
          teamId: employee.teamMembership.teamId,
          date: dateStr,
          companyId: this.utilityService.companyId,
        },
      });

      if (!teamSchedule || !teamSchedule.shiftId) {
        return null; // No team schedule or no shift assigned
      }

      // Get shift information using ShiftConfigurationService
      const shiftData = await this.shiftConfigurationService.getShiftInfo(
        teamSchedule.shiftId,
        false,
      );
      return shiftData;
    } catch (error) {
      this.utilityService.log(
        `[SCHEDULE] Error getting team schedule: ${error.message}`,
      );
      return null;
    }
  }

  public async saveTimekeepingLogs() {
    this.utilityService.log(
      `[RECOMPUTE-GROUPING] Starting saveTimekeepingLogs...`,
    );

    this.utilityService.log(
      `[RECOMPUTE-GROUPING] Getting employee information...`,
    );
    await this.getEmployeeInformation();

    this.utilityService.log(`[RECOMPUTE-GROUPING] Getting raw logs...`);
    await this.getRawLogs();

    this.utilityService.log(
      `[RECOMPUTE-GROUPING] Grouping time in/out by date...`,
    );
    this.groupTimeInOutByDate();

    this.utilityService.log(
      `[RECOMPUTE-GROUPING] Upserting cutoff date range...`,
    );
    await this.upsertCutoffDateRange();

    this.utilityService.log(
      `[RECOMPUTE-GROUPING] saveTimekeepingLogs completed`,
    );
  }
  private async getEmployeeInformation() {
    this.employeeInformation = await this.employeeListService.info(
      this.employeeAccountId,
    );
    this.cutoffCodeId = this.employeeInformation.payrollGroup.cutoff.id;
  }
  private async upsertCutoffDateRange() {
    const groupedData = this.groupTimeInOutByDate();

    this.utilityService.log(
      `[RECOMPUTE-GROUPING] upsertCutoffDateRange - Grouped data dates: ${Object.keys(groupedData).join(', ')}`,
    );

    for (const date in groupedData) {
      const timeInOutLogs: RawTimeInOutResponse[] = groupedData[date];
      this.utilityService.log(
        `[RECOMPUTE-GROUPING] Processing date: ${date} with ${timeInOutLogs.length} logs`,
      );

      const matchingDateRange: CutoffDate = await this.getDateRangeByDate(date);

      if (matchingDateRange) {
        this.utilityService.log(
          `[RECOMPUTE-GROUPING] Found matching date range for date: ${date}`,
        );

        const cutoffDateRange =
          await this.saveDateRangeToDatabase(matchingDateRange);
        this.utilityService.log(
          `[RECOMPUTE-GROUPING] Saved cutoff date range: ${cutoffDateRange.id}`,
        );

        const employeeTimekeepingCutoff =
          await this.saveEmployeeTimekeepingCutoffToDatabase(
            cutoffDateRange.id,
          );
        this.utilityService.log(
          `[RECOMPUTE-GROUPING] Saved employee timekeeping cutoff: ${employeeTimekeepingCutoff.id}`,
        );

        await this.saveEmployeeTimekeepingToDatabase(
          employeeTimekeepingCutoff.id,
          date,
          timeInOutLogs,
        );
        this.utilityService.log(
          `[RECOMPUTE-GROUPING] Saved employee timekeeping for date: ${date}`,
        );
      } else {
        this.utilityService.log(
          `[RECOMPUTE-GROUPING] No matching date range found for date: ${date}`,
        );
      }
    }
  }
  private async saveDateRangeToDatabase(
    matchingDateRange: CutoffDate,
  ): Promise<CutoffDateRange> {
    const upsertCutoffDateRange: Prisma.CutoffDateRangeCreateInput = {
      id: matchingDateRange.dateRangeCode,
      cutoff: { connect: { id: this.cutoffCodeId } },
      startDate: matchingDateRange.fromDate.raw,
      endDate: matchingDateRange.toDate.raw,
      processingDate: moment(matchingDateRange.toDate.raw)
        .add(
          this.employeeInformation.payrollGroup.cutoff.releaseProcessingDays,
          'days',
        )
        .toDate(),
      cutoffPeriodType: matchingDateRange.cutoffPeriodType,
    };

    return await this.prisma.cutoffDateRange.upsert({
      where: {
        id: matchingDateRange.dateRangeCode,
      },
      create: upsertCutoffDateRange,
      update: upsertCutoffDateRange,
    });
  }
  private async saveEmployeeTimekeepingCutoffToDatabase(
    cutoffDateRangeId: string,
  ): Promise<EmployeeTimekeepingCutoff> {
    const upsertEmployeeTimekeepingCutoff: Prisma.EmployeeTimekeepingCutoffCreateInput =
      {
        account: { connect: { id: this.employeeAccountId } },
        cutoffDateRange: { connect: { id: cutoffDateRangeId } },
      };

    this.employeeTimekeepingCutoff =
      await this.prisma.employeeTimekeepingCutoff.upsert({
        where: {
          accountId_cutoffDateRangeId: {
            accountId: this.employeeAccountId,
            cutoffDateRangeId: cutoffDateRangeId,
          },
        },
        create: upsertEmployeeTimekeepingCutoff,
        update: upsertEmployeeTimekeepingCutoff,
      });

    return this.employeeTimekeepingCutoff;
  }
  private async saveEmployeeTimekeepingToDatabase(
    employeeTimekeepingCutoffId: number,
    date: string,
    timeInOutLogs: RawTimeInOutResponse[],
  ) {
    const upsertEmployeeTimekeeping: Prisma.EmployeeTimekeepingCreateInput = {
      date: new Date(date),
      dateString: moment(date).format('YYYY-MM-DD'),
      employeeTimekeepingCutoff: {
        connect: { id: employeeTimekeepingCutoffId },
      },
    };

    const employeeTimekeeping: EmployeeTimekeeping =
      await this.prisma.employeeTimekeeping.upsert({
        where: {
          employeeTimekeepingCutoffId_date: {
            employeeTimekeepingCutoffId: employeeTimekeepingCutoffId,
            date: new Date(date),
          },
        },
        create: upsertEmployeeTimekeeping,
        update: upsertEmployeeTimekeeping,
      });

    this.utilityService.log(
      `[RECOMPUTE-GROUPING] Created/Updated EmployeeTimekeeping with ID: ${employeeTimekeeping.id} for date: ${date}`,
    );

    await this.prisma.employeeTimekeepingComputed.upsert({
      where: {
        timekeepingId: employeeTimekeeping.id,
      },
      create: {
        timekeepingId: employeeTimekeeping.id,
      },
      update: {
        timekeepingId: employeeTimekeeping.id,
      },
    });

    // Update shifting and other time keeping configuration
    await this.updateShifting(employeeTimekeeping.id);

    // Delete overlapping timekeeping logs on same date
    this.utilityService.log(
      `[RECOMPUTE-GROUPING] Starting overlap detection for ${timeInOutLogs.length} new logs`,
    );

    // Get all existing logs first
    const allExistingLogs = await this.prisma.employeeTimekeepingLogs.findMany({
      where: {
        timekeeping: { id: employeeTimekeeping.id },
        isRaw: true,
      },
    });

    this.utilityService.log(
      `[RECOMPUTE-GROUPING] Found ${allExistingLogs.length} existing logs to check for overlaps`,
    );

    const logsToDelete: number[] = [];

    // Check each new log against existing logs
    for (const log of timeInOutLogs) {
      const timeIn = moment(log.timeIn).toDate();
      const timeOut = moment(log.timeOut).toDate();
      const timeInFormatted = moment(timeIn).format('HH:mm');
      const timeOutFormatted = moment(timeOut).format('HH:mm');

      const hoursformattedTimeIn =
        this.utilityService.formatTime(timeInFormatted).hours;
      const HoursformattedTimeOut =
        this.utilityService.formatTime(timeOutFormatted).hours;

      this.utilityService.log(
        `[RECOMPUTE-GROUPING] Checking new log: ${timeInFormatted}-${timeOutFormatted} (${hoursformattedTimeIn}h-${HoursformattedTimeOut}h)`,
      );

      // Check against all existing logs
      for (const existingLog of allExistingLogs) {
        const hoursformattedExistingTimeIn = this.utilityService.formatTime(
          existingLog.timeIn,
        ).hours;
        const hoursformattedExistingTimeOut = this.utilityService.formatTime(
          existingLog.timeOut,
        ).hours;

        // Check if ranges overlap
        const overlaps =
          (hoursformattedTimeIn >= hoursformattedExistingTimeIn &&
            hoursformattedTimeIn <= hoursformattedExistingTimeOut) ||
          (HoursformattedTimeOut >= hoursformattedExistingTimeIn &&
            HoursformattedTimeOut <= hoursformattedExistingTimeOut) ||
          (hoursformattedExistingTimeIn >= hoursformattedTimeIn &&
            hoursformattedExistingTimeIn <= HoursformattedTimeOut) ||
          (hoursformattedExistingTimeOut >= hoursformattedTimeIn &&
            hoursformattedExistingTimeOut <= HoursformattedTimeOut);

        if (overlaps) {
          this.utilityService.log(
            `[RECOMPUTE-GROUPING] Found overlap: existing log ${existingLog.timeIn}-${existingLog.timeOut} (${hoursformattedExistingTimeIn}h-${hoursformattedExistingTimeOut}h) overlaps with new log`,
          );

          // Always delete overlapping logs to prevent duplicates during recompute
          logsToDelete.push(existingLog.id);
          this.utilityService.log(
            `[RECOMPUTE-GROUPING] Marking existing log ${existingLog.id} for deletion (sourceRawId: ${existingLog.sourceRawId})`,
          );
        }
      }
    }

    // Delete overlapping logs in batch
    if (logsToDelete.length > 0) {
      this.utilityService.log(
        `[RECOMPUTE-GROUPING] Deleting ${logsToDelete.length} overlapping logs: ${logsToDelete.join(', ')}`,
      );
      await this.prisma.employeeTimekeepingLogs.deleteMany({
        where: { id: { in: logsToDelete } },
      });
    } else {
      this.utilityService.log(
        `[RECOMPUTE-GROUPING] No overlapping logs to delete`,
      );
    }

    // Insert new timekeeping logs
    this.utilityService.log(
      `[RECOMPUTE-GROUPING] Creating ${timeInOutLogs.length} new timekeeping logs`,
    );

    const createdLogs = await Promise.all(
      timeInOutLogs.map(async (log) => {
        const timeIn = moment(log.timeIn).toDate();
        const timeOut = moment(log.timeOut).toDate();

        const timeInFormatted = moment(timeIn).format('HH:mm');
        const timeOutFormatted = moment(timeOut).format('HH:mm');
        const timeSpanMinutes = moment(timeOut).diff(moment(timeIn), 'minutes');

        this.utilityService.log(
          `[RECOMPUTE-GROUPING] Creating log: ${timeInFormatted}-${timeOutFormatted} (${timeSpanMinutes} minutes) from sourceRaw ${log.id} for timekeeping ID: ${employeeTimekeeping.id}`,
        );

        const insertEmployeeTimeekepingLogs: Prisma.EmployeeTimekeepingLogsCreateInput =
          {
            timeIn: timeInFormatted,
            timeOut: timeOutFormatted,
            timeSpan: timeSpanMinutes,
            timekeeping: { connect: { id: employeeTimekeeping.id } },
            isRaw: true,
            type: BreakdownType.UNDEFINED,
            sourceRaw: { connect: { id: log.id } },
          };

        const createdLog = await this.prisma.employeeTimekeepingLogs.create({
          data: insertEmployeeTimeekepingLogs,
        });

        this.utilityService.log(
          `[RECOMPUTE-GROUPING] Created timekeeping log with ID: ${createdLog.id}`,
        );
        return createdLog;
      }),
    );

    this.utilityService.log(
      `[RECOMPUTE-GROUPING] Successfully created ${createdLogs.length} timekeeping logs`,
    );
  }
  private async getDateRangeByDate(date: string): Promise<CutoffDate> {
    // First, try to get from cutoff configuration (existing behavior)
    const { cutOffDates } =
      await this.cutoffConfigurationService.infoWithDateRange(
        this.cutoffCodeId,
      );

    // Check if date is within Cutoff Dates from configuration
    const matchingDateRange: CutoffDate = cutOffDates.find(
      ({ fromDate, toDate }) => {
        return moment(date).isBetween(
          fromDate.raw,
          toDate.raw,
          undefined,
          '[]',
        );
      },
    );

    // If found in configuration, return it
    if (matchingDateRange) {
      return matchingDateRange;
    }

    // Fallback: Check database for CutoffDateRange records
    this.utilityService.log(
      `[RECOMPUTE-GROUPING] No match in configuration, checking database for date: ${date}`,
    );

    const cutoffDateRange = await this.prisma.cutoffDateRange.findFirst({
      where: {
        cutoffId: this.cutoffCodeId,
        startDate: {
          lte: moment(date).endOf('day').toDate(),
        },
        endDate: {
          gte: moment(date).startOf('day').toDate(),
        },
      },
    });

    // If found in database, convert to CutoffDate format
    if (cutoffDateRange) {
      this.utilityService.log(
        `[RECOMPUTE-GROUPING] Found in database: ${cutoffDateRange.id}`,
      );

      return {
        cutoffId: cutoffDateRange.cutoffId,
        dateRangeCode: cutoffDateRange.id,
        dateRange: `${moment(cutoffDateRange.startDate).format('MMM DD, YYYY')} - ${moment(cutoffDateRange.endDate).format('MMM DD, YYYY')}`,
        fromDate: this.utilityService.formatDate(cutoffDateRange.startDate),
        toDate: this.utilityService.formatDate(cutoffDateRange.endDate),
        releaseDate: this.utilityService.formatDate(cutoffDateRange.processingDate),
        cutoffPeriodType: cutoffDateRange.cutoffPeriodType,
      };
    }

    // Not found in either configuration or database
    this.utilityService.log(
      `[RECOMPUTE-GROUPING] No matching date range found in configuration or database for date: ${date}`,
    );
    return null;
  }
  private async getRawLogs() {
    this.utilityService.log(
      `[RECOMPUTE-GROUPING] Fetching raw logs for employeeAccountId: ${this.employeeAccountId}`,
    );
    this.utilityService.log(
      `[RECOMPUTE-GROUPING] Date range: ${this.fromDate.raw} to ${moment(this.toDate.raw).endOf('day').toDate()}`,
    );

    this.employeeTimekeepingRaw =
      await this.prisma.employeeTimekeepingRaw.findMany({
        where: {
          accountId: this.employeeAccountId,
          timeIn: {
            gte: this.fromDate.raw,
            lte: moment(this.toDate.raw).endOf('day').toDate(),
          },
        },
      });

    this.utilityService.log(
      `[RECOMPUTE-GROUPING] Found ${this.employeeTimekeepingRaw.length} raw logs`,
    );
    if (this.employeeTimekeepingRaw.length > 0) {
      this.utilityService.log(
        `[RECOMPUTE-GROUPING] First raw log: ${JSON.stringify(this.employeeTimekeepingRaw[0])}`,
      );
    }
  }
  private async checkHolidayEligibility(
    employeeAccountId: string,
    holidayDate: Date,
  ): Promise<boolean> {
    // Get previous working days up to 14 days back (extended from 7)
    const lookbackDays = 14;
    const startDate = moment(holidayDate).subtract(lookbackDays, 'days');

    console.log(
      `[Holiday Eligibility Check] Employee: ${employeeAccountId}, Holiday Date: ${moment(holidayDate).format('YYYY-MM-DD')}`,
    );

    // Get employee's schedule to determine working days
    const employeeData = await this.employeeListService.info(employeeAccountId);
    const schedule = employeeData.schedule.dayScheduleDetails;

    // Get all timekeeping records for the lookback period
    const timekeepingRecords = await this.prisma.employeeTimekeeping.findMany({
      where: {
        employeeTimekeepingCutoff: {
          accountId: employeeAccountId,
        },
        date: {
          gte: startDate.toDate(),
          lt: holidayDate,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    console.log(
      `[Holiday Eligibility Check] Found ${timekeepingRecords.length} timekeeping records in lookback period`,
    );

    // Find the most recent working day before the holiday
    for (const record of timekeepingRecords) {
      const dayOfWeek = moment(record.date).format('dddd').toLowerCase();
      let isScheduledWorkDay = false;

      // Check if it's a scheduled working day
      switch (dayOfWeek) {
        case 'monday':
          isScheduledWorkDay = schedule.mondayShift.shiftType.isWorkDay;
          break;
        case 'tuesday':
          isScheduledWorkDay = schedule.tuesdayShift.shiftType.isWorkDay;
          break;
        case 'wednesday':
          isScheduledWorkDay = schedule.wednesdayShift.shiftType.isWorkDay;
          break;
        case 'thursday':
          isScheduledWorkDay = schedule.thursdayShift.shiftType.isWorkDay;
          break;
        case 'friday':
          isScheduledWorkDay = schedule.fridayShift.shiftType.isWorkDay;
          break;
        case 'saturday':
          isScheduledWorkDay = schedule.saturdayShift.shiftType.isWorkDay;
          break;
        case 'sunday':
          isScheduledWorkDay = schedule.sundayShift.shiftType.isWorkDay;
          break;
      }

      // Skip if it's a rest day (unless it's an approved worked rest day)
      if (record.isRestDay && !record.isDayApproved) {
        console.log(
          `[Holiday Eligibility Check] Skipping ${moment(record.date).format('YYYY-MM-DD')} - Rest day not worked`,
        );
        continue;
      }

      // Consider it a working day if:
      // 1. It's a scheduled work day, OR
      // 2. It's a rest day that was approved (worked rest day)
      const isEffectiveWorkDay =
        isScheduledWorkDay || (record.isRestDay && record.isDayApproved);

      if (!isEffectiveWorkDay) {
        console.log(
          `[Holiday Eligibility Check] Skipping ${moment(record.date).format('YYYY-MM-DD')} - Not a working day`,
        );
        continue;
      }

      // This is the last working day before the holiday
      console.log(
        `[Holiday Eligibility Check] Last working day: ${moment(record.date).format('YYYY-MM-DD')}, ` +
          `Credited hours: ${record.totalCreditedHours}, Is approved: ${record.isDayApproved}`,
      );

      // Check attendance on this working day
      // Employee is eligible if they have credited hours (were present)
      if (record.totalCreditedHours > 0) {
        console.log(
          `[Holiday Eligibility Check] Result: ELIGIBLE - Employee was present on last working day`,
        );
        return true; // Eligible for holiday pay
      } else {
        console.log(
          `[Holiday Eligibility Check] Result: NOT ELIGIBLE - Employee was absent on last working day`,
        );
        return false; // Not eligible (absent on last working day)
      }
    }

    // If no previous working day found, default to NOT eligible
    console.log(
      `[Holiday Eligibility Check] Result: NOT ELIGIBLE - No previous working day found in ${lookbackDays} day period`,
    );
    return false;
  }

  private groupTimeInOutByDate(): { [key: string]: RawTimeInOutResponse[] } {
    const groupedData: { [key: string]: RawTimeInOutResponse[] } = {};
    const current = moment(this.fromDate.raw);
    const end = moment(this.toDate.raw);

    // Initialize grouping for all dates in the range
    while (current.isSameOrBefore(end, 'day')) {
      const dateKey = current.format('YYYY-MM-DD');
      groupedData[dateKey] = [];
      current.add(1, 'day');
    }

    // Populate groupedData with actual timekeeping data
    this.employeeTimekeepingRaw.forEach((entry) => {
      let current = moment(entry.timeIn);
      const end = moment(entry.timeOut);

      while (current.isSameOrBefore(end, 'day')) {
        const dateKey = current.format('YYYY-MM-DD');
        const timeIn = current.isSame(entry.timeIn, 'day')
          ? entry.timeIn
          : current.startOf('day').toDate();
        const timeOut = current.isSame(entry.timeOut, 'day')
          ? entry.timeOut
          : current.endOf('day').toDate();

        if (!groupedData[dateKey]) {
          groupedData[dateKey] = [];
        }

        groupedData[dateKey].push({ id: entry.id, timeIn, timeOut });

        current = current.add(1, 'day').startOf('day');
      }
    });

    return groupedData;
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  PayrollFiling,
  PayrollFilingType,
  TimekeepingSource,
} from '@prisma/client';
import { ModuleRef } from '@nestjs/core';
import * as moment from 'moment';

@Injectable()
export class AttendanceBusinessFilingIntegrationService {
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly utilityService: UtilityService;

  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Create raw timekeeping logs from approved COA or OB filing
   */
  async createRawLogsFromFiling(filing: PayrollFiling): Promise<void> {
    // Only process COA and OB filings
    if (
      filing.filingType !== PayrollFilingType.CERTIFICATE_OF_ATTENDANCE &&
      filing.filingType !== PayrollFilingType.OFFICIAL_BUSINESS_FORM
    ) {
      return;
    }

    // Skip if no time data
    if (!filing.timeIn || !filing.timeOut) {
      this.utilityService.log(
        `Skipping raw log creation for filing ${filing.id} - missing time data`,
      );
      return;
    }

    // Determine source based on filing type
    const source =
      filing.filingType === PayrollFilingType.CERTIFICATE_OF_ATTENDANCE
        ? TimekeepingSource.CERTIFICATE_OF_ATTENDANCE
        : TimekeepingSource.OFFICIAL_BUSINESS;

    // Delete any overlapping raw logs (following the pattern from recordRawTimeInOut)
    await this.prisma.employeeTimekeepingRaw.deleteMany({
      where: {
        accountId: filing.accountId,
        OR: [
          {
            timeIn: {
              lte: filing.timeOut,
            },
            timeOut: {
              gte: filing.timeIn,
            },
          },
        ],
      },
    });

    // Calculate time span in minutes
    const timeSpan = moment(filing.timeOut).diff(
      moment(filing.timeIn),
      'minutes',
    );

    this.utilityService.log(
      `Creating raw log for ${filing.filingType} filing ${filing.id}: ` +
        `${moment(filing.timeIn).format('YYYY-MM-DD HH:mm')} - ${moment(filing.timeOut).format('YYYY-MM-DD HH:mm')} (${timeSpan} minutes)`,
    );

    // Create the raw timekeeping log
    await this.prisma.employeeTimekeepingRaw.create({
      data: {
        accountId: filing.accountId,
        timeIn: filing.timeIn,
        timeOut: filing.timeOut,
        timeSpan: timeSpan,
        source: source,
      },
    });

    // Trigger recomputation for all affected dates (from timeIn to timeOut)
    await this.triggerRecomputationForDateRange(
      filing.accountId,
      filing.timeIn,
      filing.timeOut,
    );
  }

  /**
   * Delete raw timekeeping logs when filing is rejected
   */
  async deleteRawLogsFromFiling(filing: PayrollFiling): Promise<void> {
    // Only process COA and OB filings
    if (
      filing.filingType !== PayrollFilingType.CERTIFICATE_OF_ATTENDANCE &&
      filing.filingType !== PayrollFilingType.OFFICIAL_BUSINESS_FORM
    ) {
      return;
    }

    if (!filing.timeIn || !filing.timeOut) {
      return;
    }

    // Determine source based on filing type
    const source =
      filing.filingType === PayrollFilingType.CERTIFICATE_OF_ATTENDANCE
        ? TimekeepingSource.CERTIFICATE_OF_ATTENDANCE
        : TimekeepingSource.OFFICIAL_BUSINESS;

    // Find and delete raw logs that match this filing
    // We match by account, source, and the exact time range
    const deletedLogs = await this.prisma.employeeTimekeepingRaw.deleteMany({
      where: {
        accountId: filing.accountId,
        source: source,
        timeIn: filing.timeIn,
        timeOut: filing.timeOut,
      },
    });

    this.utilityService.log(
      `Deleted ${deletedLogs.count} raw logs for rejected ${filing.filingType} filing ${filing.id}`,
    );

    // Trigger recomputation if any logs were deleted
    if (deletedLogs.count > 0) {
      await this.triggerRecomputationForDateRange(
        filing.accountId,
        filing.timeIn,
        filing.timeOut,
      );
    }
  }

  /**
   * Trigger timekeeping recomputation for a specific date
   */
  private async triggerRecomputation(
    accountId: string,
    date: Date,
  ): Promise<void> {
    try {
      // Use dynamic import to avoid circular dependencies
      const { EmployeeTimekeepingService } = await import(
        '../../timekeeping/employee-timekeeping/employee-timekeeping.service'
      );
      const employeeTimekeepingService = this.moduleRef.get(
        EmployeeTimekeepingService,
        { strict: false },
      );

      const dateString = moment(date).format('YYYY-MM-DD');

      await employeeTimekeepingService.recompute({
        employeeAccountId: accountId,
        date: dateString,
      });

      this.utilityService.log(
        `Triggered timekeeping recomputation for ${accountId} on ${dateString}`,
      );
    } catch (error) {
      this.utilityService.log(
        `Failed to trigger recomputation: ${error.message}`,
      );
    }
  }

  /**
   * Trigger timekeeping recomputation for a date range
   */
  private async triggerRecomputationForDateRange(
    accountId: string,
    timeIn: Date,
    timeOut: Date,
  ): Promise<void> {
    try {
      // Use dynamic import to avoid circular dependencies
      const { EmployeeTimekeepingService } = await import(
        '../../timekeeping/employee-timekeeping/employee-timekeeping.service'
      );
      const employeeTimekeepingService = this.moduleRef.get(
        EmployeeTimekeepingService,
        { strict: false },
      );

      // Recompute for all dates from timeIn to timeOut
      let currentDate = moment(timeIn).startOf('day');
      const endDate = moment(timeOut).startOf('day');

      while (currentDate.isSameOrBefore(endDate)) {
        const dateString = currentDate.format('YYYY-MM-DD');

        await employeeTimekeepingService.recompute({
          employeeAccountId: accountId,
          date: dateString,
        });

        this.utilityService.log(
          `Triggered timekeeping recomputation for ${accountId} on ${dateString}`,
        );

        currentDate = currentDate.add(1, 'day');
      }
    } catch (error) {
      this.utilityService.log(
        `Failed to trigger recomputation for date range: ${error.message}`,
      );
    }
  }
}

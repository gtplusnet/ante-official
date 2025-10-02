import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import {
  PayrollFiling,
  PayrollFilingType,
  PayrollFilingStatus,
} from '@prisma/client';
import * as moment from 'moment-timezone';
import { UtilityService } from '@common/utility.service';

@Injectable()
export class LeaveTimekeepingIntegrationService {
  constructor(
    private prisma: PrismaService,
    private utilityService: UtilityService,
  ) {}

  /**
   * Get approved leave filings for a specific employee and date range
   */
  async getApprovedLeaves(
    accountId: string,
    startDate: string,
    endDate: string,
  ): Promise<PayrollFiling[]> {
    return await this.prisma.payrollFiling.findMany({
      where: {
        accountId,
        filingType: PayrollFilingType.LEAVE,
        status: PayrollFilingStatus.APPROVED,
        OR: [
          {
            // Single day leaves
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          {
            // Multi-day leaves (using timeIn and timeOut for date range)
            timeIn: {
              lte: new Date(endDate),
            },
            timeOut: {
              gte: new Date(startDate),
            },
          },
        ],
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  /**
   * Calculate leave summary for timekeeping period
   */
  async calculateLeaveSummary(
    accountId: string,
    startDate: string,
    endDate: string,
  ) {
    const approvedLeaves = await this.getApprovedLeaves(
      accountId,
      startDate,
      endDate,
    );

    let approvedLeaveCount = 0;
    let approvedLeaveHours = 0;
    let leaveWithPayCount = 0;
    let leaveWithoutPayCount = 0;

    for (const leave of approvedLeaves) {
      const leaveData = leave.leaveData as any;

      // Calculate leave days
      let leaveDays = 0;
      if (leave.timeIn && leave.timeOut && leave.timeIn !== leave.timeOut) {
        // Multi-day leave (timeIn and timeOut are on different days)
        const start = moment(leave.timeIn);
        const end = moment(leave.timeOut);

        // Count only days within the cutoff period
        const periodStart = moment(startDate);
        const periodEnd = moment(endDate);

        const effectiveStart = moment.max(start, periodStart);
        const effectiveEnd = moment.min(end, periodEnd);

        if (effectiveStart.isSameOrBefore(effectiveEnd)) {
          leaveDays = effectiveEnd.diff(effectiveStart, 'days') + 1;
        }
      } else if (leave.date) {
        // Single day leave
        const leaveDate = moment(leave.date);
        if (
          leaveDate.isSameOrAfter(startDate) &&
          leaveDate.isSameOrBefore(endDate)
        ) {
          leaveDays = 1;
        }
      }

      // Calculate leave hours (assuming 8 hours per day if not specified)
      const leaveHours = leave.hours || leaveDays * 8;

      // Update counters
      approvedLeaveCount += leaveDays;
      approvedLeaveHours += leaveHours;

      // Track paid vs unpaid leaves
      if (leaveData?.compensationType === 'WITH_PAY') {
        leaveWithPayCount += leaveDays;
      } else if (leaveData?.compensationType === 'WITHOUT_PAY') {
        leaveWithoutPayCount += leaveDays;
      }
    }

    return {
      approvedLeaveCount,
      approvedLeaveHours: this.utilityService.formatHours(approvedLeaveHours),
      leaveWithPayCount,
      leaveWithoutPayCount,
      approvedLeaves,
    };
  }

  /**
   * Check if a specific date has an approved leave
   */
  async hasApprovedLeave(accountId: string, date: string): Promise<boolean> {
    const checkDate = moment(date).format('YYYY-MM-DD');

    const leave = await this.prisma.payrollFiling.findFirst({
      where: {
        accountId,
        filingType: PayrollFilingType.LEAVE,
        status: PayrollFilingStatus.APPROVED,
        OR: [
          {
            // Single day leave
            date: new Date(checkDate),
          },
          {
            // Multi-day leave (check if date falls between timeIn and timeOut)
            timeIn: {
              lte: new Date(checkDate),
            },
            timeOut: {
              gte: new Date(checkDate),
            },
          },
        ],
      },
    });

    return !!leave;
  }

  /**
   * Get leave details for a specific date
   */
  async getLeaveForDate(
    accountId: string,
    date: string,
  ): Promise<PayrollFiling | null> {
    const checkDate = moment(date).format('YYYY-MM-DD');

    return await this.prisma.payrollFiling.findFirst({
      where: {
        accountId,
        filingType: PayrollFilingType.LEAVE,
        status: PayrollFilingStatus.APPROVED,
        OR: [
          {
            // Single day leave
            date: new Date(checkDate),
          },
          {
            // Multi-day leave (check if date falls between timeIn and timeOut)
            timeIn: {
              lte: new Date(checkDate),
            },
            timeOut: {
              gte: new Date(checkDate),
            },
          },
        ],
      },
    });
  }
}

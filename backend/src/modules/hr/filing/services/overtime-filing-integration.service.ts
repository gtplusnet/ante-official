import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import {
  PayrollFiling,
  PayrollFilingStatus,
  PayrollFilingType,
} from '@prisma/client';
import * as moment from 'moment';
import { UtilityService } from '@common/utility.service';

@Injectable()
export class OvertimeFilingIntegrationService {
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly utilityService: UtilityService;

  /**
   * Sync all overtime filings for a specific date and employee to timekeeping
   */
  async syncFilingsToTimekeeping(accountId: string, date: Date): Promise<void> {
    const dateString = moment(date).format('YYYY-MM-DD');

    // Get all overtime filings for this date and employee
    const overtimeFilings = await this.prisma.payrollFiling.findMany({
      where: {
        accountId,
        date: {
          gte: moment(date).startOf('day').toDate(),
          lt: moment(date).endOf('day').toDate(),
        },
        filingType: PayrollFilingType.OVERTIME,
      },
    });

    this.utilityService.log(
      `Found ${overtimeFilings.length} overtime filings for ${accountId} on ${dateString}. ` +
        `Date range: ${moment(date).startOf('day').toISOString()} to ${moment(date).endOf('day').toISOString()}`,
    );

    // Calculate totals by status
    const pendingTotals = this.calculateTotalsByStatus(
      overtimeFilings,
      PayrollFilingStatus.PENDING,
    );
    const approvedTotals = this.calculateTotalsByStatus(
      overtimeFilings,
      PayrollFilingStatus.APPROVED,
    );

    // Find existing timekeeping record directly by employee and date
    const existingTimekeeping = await this.prisma.employeeTimekeeping.findFirst(
      {
        where: {
          dateString: dateString,
          employeeTimekeepingCutoff: {
            accountId: accountId,
          },
        },
        include: {
          employeeTimekeepingCutoff: true,
        },
      },
    );

    if (existingTimekeeping) {
      this.utilityService.log(
        `Found existing timekeeping record id: ${existingTimekeeping.id} for ${dateString}. ` +
          `Current approved OT: ${existingTimekeeping.overtimeMinutesApproved / 60}h`,
      );

      // Update existing record
      const updatedRecord = await this.prisma.employeeTimekeeping.update({
        where: {
          id: existingTimekeeping.id,
        },
        data: {
          overtimeMinutesForApproval: pendingTotals.overtimeMinutes,
          overtimeMinutesApproved: approvedTotals.overtimeMinutes,
          nightDifferentialOvertimeForApproval:
            pendingTotals.nightDifferentialMinutes,
          nightDifferentialOvertimeApproved:
            approvedTotals.nightDifferentialMinutes,
        },
      });

      this.utilityService.log(
        `Updated overtime filings for ${accountId} on ${dateString}: ` +
          `Pending OT: ${pendingTotals.overtimeMinutes / 60}h, ` +
          `Approved OT: ${approvedTotals.overtimeMinutes / 60}h. ` +
          `New DB value: ${updatedRecord.overtimeMinutesApproved / 60}h`,
      );
    } else {
      this.utilityService.log(
        `No existing timekeeping record found for ${accountId} on ${dateString}. ` +
          `Overtime sync skipped. Record should be created by timekeeping computation first.`,
      );
    }
  }

  /**
   * Update timekeeping when a single filing is created/updated/approved
   */
  async updateTimekeepingFromFiling(
    filing: PayrollFiling,
    oldDate?: Date,
  ): Promise<void> {
    if (filing.filingType !== PayrollFilingType.OVERTIME || !filing.date) {
      return;
    }

    // If the date changed, sync both old and new dates
    if (
      oldDate &&
      moment(oldDate).format('YYYY-MM-DD') !==
        moment(filing.date).format('YYYY-MM-DD')
    ) {
      await this.syncFilingsToTimekeeping(filing.accountId, oldDate);
    }

    // Sync the current date
    await this.syncFilingsToTimekeeping(filing.accountId, filing.date);
  }

  /**
   * Calculate total overtime minutes by status
   */
  private calculateTotalsByStatus(
    filings: PayrollFiling[],
    status: PayrollFilingStatus,
  ): { overtimeMinutes: number; nightDifferentialMinutes: number } {
    const filteredFilings = filings.filter((f) => f.status === status);

    const overtimeMinutes = filteredFilings.reduce(
      (sum, f) => sum + (f.hours || 0) * 60,
      0,
    );
    const nightDifferentialMinutes = filteredFilings.reduce(
      (sum, f) => sum + (f.nightDifferentialHours || 0) * 60,
      0,
    );

    return { overtimeMinutes, nightDifferentialMinutes };
  }
}

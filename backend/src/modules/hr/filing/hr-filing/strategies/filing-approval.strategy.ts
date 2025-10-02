import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '@common/prisma.service';
import { ApprovalStrategy } from '@modules/approval/approval.service';
import { PayrollFilingStatus, PayrollFilingType } from '@prisma/client';
import { FilingNotificationService } from '../../services/filing-notification.service';
import { OvertimeFilingIntegrationService } from '../../services/overtime-filing-integration.service';
import { AttendanceBusinessFilingIntegrationService } from '../../services/attendance-business-filing-integration.service';
import { EmployeeLeavePlanService } from '@modules/hr/configuration/leave-configuration/employee-leave-plan.service';
import * as moment from 'moment';

@Injectable()
export class FilingApprovalStrategy implements ApprovalStrategy {
  @Inject() private prisma: PrismaService;
  @Inject() private filingNotificationService: FilingNotificationService;
  @Inject()
  private overtimeFilingIntegrationService: OvertimeFilingIntegrationService;
  @Inject()
  private attendanceBusinessFilingIntegrationService: AttendanceBusinessFilingIntegrationService;
  @Inject() private employeeLeavePlanService: EmployeeLeavePlanService;

  constructor(private readonly moduleRef: ModuleRef) {}

  async onApprove(
    sourceId: string,
    approverId: string,
    remarks?: string,
  ): Promise<void> {
    const filingId = Number(sourceId);

    // Check if filing is in PENDING status
    const existingFiling = await this.prisma.payrollFiling.findUnique({
      where: { id: filingId },
    });

    if (!existingFiling) {
      throw new BadRequestException('Filing not found');
    }

    if (existingFiling.status !== PayrollFilingStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve filing that is not in PENDING status. Current status: ${existingFiling.status}`,
      );
    }

    // Update filing status to approved
    const filing = await this.prisma.payrollFiling.update({
      where: { id: filingId },
      data: {
        status: PayrollFilingStatus.APPROVED,
        isApproved: true,
        approvedById: approverId,
        approvedAt: new Date(),
        remarks: remarks || null,
      },
      include: {
        account: true,
        file: true,
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Handle different filing types
    if (filing.filingType === PayrollFilingType.OVERTIME) {
      // Sync overtime filing to timekeeping (moves from ForApproval to Approved)
      await this.overtimeFilingIntegrationService.updateTimekeepingFromFiling(
        filing,
      );
    } else if (
      filing.filingType === PayrollFilingType.CERTIFICATE_OF_ATTENDANCE ||
      filing.filingType === PayrollFilingType.OFFICIAL_BUSINESS_FORM
    ) {
      // Create raw timekeeping logs for COA and OB filings
      await this.attendanceBusinessFilingIntegrationService.createRawLogsFromFiling(
        filing,
      );
    } else if (filing.filingType === PayrollFilingType.SCHEDULE_ADJUSTMENT) {
      // Trigger timekeeping recomputation for the filing date
      if (filing.date) {
        const { EmployeeTimekeepingService } = await import(
          '../../../timekeeping/employee-timekeeping/employee-timekeeping.service'
        );
        const employeeTimekeepingService = this.moduleRef.get(
          EmployeeTimekeepingService,
          { strict: false },
        );

        await employeeTimekeepingService.recompute({
          employeeAccountId: filing.accountId,
          date: moment(filing.date).format('YYYY-MM-DD'),
        });
      }
    } else if (
      filing.filingType === PayrollFilingType.LEAVE &&
      filing.leaveData
    ) {
      // Leave credits are already deducted when filing is created
      // No additional action needed on approval
    }

    // Notify the employee using unified service
    await this.filingNotificationService.sendApprovalApproved({
      filing,
      approverId,
      remarks,
    });
  }

  async onReject(
    sourceId: string,
    approverId: string,
    remarks?: string,
  ): Promise<void> {
    const filingId = Number(sourceId);

    // Check if filing is in PENDING status
    const existingFiling = await this.prisma.payrollFiling.findUnique({
      where: { id: filingId },
    });

    if (!existingFiling) {
      throw new BadRequestException('Filing not found');
    }

    if (existingFiling.status !== PayrollFilingStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject filing that is not in PENDING status. Current status: ${existingFiling.status}`,
      );
    }

    // Update filing status to rejected
    const filing = await this.prisma.payrollFiling.update({
      where: { id: filingId },
      data: {
        status: PayrollFilingStatus.REJECTED,
        isApproved: false,
        approvedById: approverId,
        approvedAt: new Date(),
        rejectReason: remarks || null,
      },
      include: {
        account: true,
        file: true,
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Handle different filing types
    if (filing.filingType === PayrollFilingType.OVERTIME) {
      // Sync overtime filing to timekeeping (removes from ForApproval)
      await this.overtimeFilingIntegrationService.updateTimekeepingFromFiling(
        filing,
      );
    } else if (
      filing.filingType === PayrollFilingType.CERTIFICATE_OF_ATTENDANCE ||
      filing.filingType === PayrollFilingType.OFFICIAL_BUSINESS_FORM
    ) {
      // Delete raw timekeeping logs for rejected COA and OB filings
      await this.attendanceBusinessFilingIntegrationService.deleteRawLogsFromFiling(
        filing,
      );
    } else if (filing.filingType === PayrollFilingType.SCHEDULE_ADJUSTMENT) {
      // Trigger timekeeping recomputation to revert to regular schedule
      if (filing.date) {
        const { EmployeeTimekeepingService } = await import(
          '../../../timekeeping/employee-timekeeping/employee-timekeeping.service'
        );
        const employeeTimekeepingService = this.moduleRef.get(
          EmployeeTimekeepingService,
          { strict: false },
        );

        await employeeTimekeepingService.recompute({
          employeeAccountId: filing.accountId,
          date: moment(filing.date).format('YYYY-MM-DD'),
        });
      }
    } else if (
      filing.filingType === PayrollFilingType.LEAVE &&
      filing.leaveData
    ) {
      // Return leave credits since they were already deducted when filing was created
      const leaveData = filing.leaveData as any;
      if (
        leaveData.compensationType === 'WITH_PAY' &&
        leaveData.employeeLeavePlanId
      ) {
        try {
          // Return leave credits using the service
          await this.employeeLeavePlanService.adjustCredits(
            leaveData.employeeLeavePlanId,
            {
              amount: leaveData.days || 1,
              reason: `Leave rejected - returning credits for ${leaveData.leaveType} from ${moment(filing.timeIn || filing.date).format('MMM DD, YYYY')} to ${moment(filing.timeOut || filing.date).format('MMM DD, YYYY')}`,
              transactionType: 'CREDIT',
              referenceId: `FILING-${filing.id}-REJECTED`,
            },
            approverId,
          );
        } catch (error) {
          // Log error but don't fail the rejection
          console.error(
            `Failed to return leave credits for rejected filing ${filing.id}:`,
            error,
          );
        }
      }
    }

    // Notify the employee using unified service
    await this.filingNotificationService.sendApprovalRejected({
      filing,
      approverId,
      remarks,
    });
  }

  async onRequestInfo(
    sourceId: string,
    approverId: string,
    remarks?: string,
  ): Promise<void> {
    const filingId = Number(sourceId);

    const filing = await this.prisma.payrollFiling.findUnique({
      where: { id: filingId },
      include: {
        account: true,
        file: true,
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!filing) return;

    // Notify the employee using unified service
    await this.filingNotificationService.sendInfoRequested({
      filing,
      approverId,
      remarks,
    });
  }

  async getDisplayData(sourceId: string): Promise<any> {
    const filingId = Number(sourceId);

    const filing = await this.prisma.payrollFiling.findUnique({
      where: { id: filingId },
      include: {
        account: {
          include: {
            role: true,
          },
        },
        file: true,
      },
    });

    if (!filing) return null;

    // Format the filing data for display
    return {
      id: filing.id,
      type: this.filingNotificationService.getFilingTypeLabel(
        filing.filingType,
      ),
      employee: {
        name: `${filing.account.firstName} ${filing.account.lastName}`,
        role: filing.account.role?.name,
        email: filing.account.email,
      },
      details: {
        date: filing.date,
        timeIn: filing.timeIn,
        timeOut: filing.timeOut,
        hours: filing.hours,
        remarks: filing.remarks,
        rejectReason: filing.rejectReason,
      },
      attachment: filing.file
        ? {
            id: filing.file.id,
            name: filing.file.name,
            url: filing.file.url,
          }
        : null,
      createdAt: filing.createdAt,
      status: filing.status,
    };
  }
}

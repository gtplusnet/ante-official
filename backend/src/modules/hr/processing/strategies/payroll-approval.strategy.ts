import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ApprovalStrategy } from '@modules/approval/approval.service';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { PayrollApproversService } from '@modules/hr/configuration/payroll-approvers/payroll-approvers.service';
import { HrProcessingService } from '../hr-processing/hr-processing.service';
import { CutoffDateRangeStatus, BoardLaneKeys } from '@prisma/client';
import { NotificationService } from '@modules/communication/notification/notification/notification.service';
import { EmailApprovalService } from '@modules/communication/email-approval/services/email-approval.service';
import NotificationTypeReference from '../../../../reference/notification-type.reference';
import { PayrollReportGeneratorService } from '../services/payroll-report-generator.service';

@Injectable()
export class PayrollApprovalStrategy implements ApprovalStrategy {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilityService: UtilityService,
    @Inject(forwardRef(() => PayrollApproversService))
    private readonly payrollApproversService: PayrollApproversService,
    @Inject(forwardRef(() => HrProcessingService))
    private readonly hrProcessingService: HrProcessingService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
    @Inject(forwardRef(() => EmailApprovalService))
    private readonly emailApprovalService: EmailApprovalService,
    @Inject(forwardRef(() => PayrollReportGeneratorService))
    private readonly payrollReportGeneratorService: PayrollReportGeneratorService,
  ) {}

  async onApprove(
    cutoffId: string,
    approverId: string,
    remarks?: string,
  ): Promise<void> {
    console.log('PayrollApprovalStrategy.onApprove called with:', {
      cutoffId,
      approverId,
      remarks,
    });

    // Get the approval metadata from the task
    const task = await this.prisma.task.findFirst({
      where: {
        ApprovalMetadata: {
          sourceId: cutoffId,
          sourceModule: 'PAYROLL',
        },
        assignedToId: approverId,
        isOpen: true,
      },
      include: {
        ApprovalMetadata: true,
      },
    });

    if (!task || !task.ApprovalMetadata) {
      throw new Error('Approval task not found');
    }

    const currentLevel = task.ApprovalMetadata.approvalLevel || 1;
    const maxLevel = task.ApprovalMetadata.maxApprovalLevel || 1;

    // Find the DONE board lane
    const doneLane = await this.prisma.boardLane.findFirst({
      where: { key: BoardLaneKeys.DONE },
    });

    // Mark current task as completed and move to DONE lane
    await this.prisma.task.update({
      where: { id: task.id },
      data: {
        isOpen: false,
        boardLaneId: doneLane?.id || task.boardLaneId, // Fallback to current lane if DONE not found
      },
    });

    // Store approval history
    console.log('About to store approval history for approval');
    await this.storeApprovalHistory(
      cutoffId,
      approverId,
      'APPROVED',
      currentLevel,
      remarks,
    );
    console.log('Approval history stored successfully');

    if (currentLevel < maxLevel) {
      // Get next level approvers
      const nextApprovers = await this.getNextApprovers(cutoffId, currentLevel);

      // Create tasks for next level approvers
      for (const nextApproverId of nextApprovers) {
        await this.createApprovalTask(
          cutoffId,
          nextApproverId,
          currentLevel + 1,
          maxLevel,
        );
      }
    } else {
      // All levels approved - update cutoff status to APPROVED
      await this.prisma.cutoffDateRange.update({
        where: { id: cutoffId },
        data: { status: CutoffDateRangeStatus.APPROVED },
      });

      // Notify HR team of approval completion
      await this.sendApprovalNotification(cutoffId, 'APPROVED');
    }
  }

  async onReject(
    cutoffId: string,
    approverId: string,
    remarks?: string,
  ): Promise<void> {
    console.log('PayrollApprovalStrategy.onReject called with:', {
      cutoffId,
      approverId,
      remarks,
    });

    // Update cutoff status to REJECTED
    await this.prisma.cutoffDateRange.update({
      where: { id: cutoffId },
      data: { status: CutoffDateRangeStatus.REJECTED },
    });

    // Get current task to determine level
    const task = await this.prisma.task.findFirst({
      where: {
        ApprovalMetadata: {
          sourceId: cutoffId,
          sourceModule: 'PAYROLL',
        },
        assignedToId: approverId,
        isOpen: true,
      },
      include: {
        ApprovalMetadata: true,
      },
    });

    const currentLevel = task?.ApprovalMetadata?.approvalLevel || 1;

    // Store rejection history
    console.log('About to store approval history for rejection');
    await this.storeApprovalHistory(
      cutoffId,
      approverId,
      'REJECTED',
      currentLevel,
      remarks,
    );
    console.log('Rejection history stored successfully');

    // Find the DONE board lane
    const doneLane = await this.prisma.boardLane.findFirst({
      where: { key: BoardLaneKeys.DONE },
    });

    // Mark all open approval tasks as closed and move to DONE lane
    // First find all tasks to close (updateMany doesn't support nested where clauses)
    const tasksToClose = await this.prisma.task.findMany({
      where: {
        ApprovalMetadata: {
          sourceId: cutoffId,
          sourceModule: 'PAYROLL',
        },
        isOpen: true,
      },
      select: { id: true },
    });

    // Then close them and move to DONE lane if any exist
    if (tasksToClose.length > 0) {
      await this.prisma.task.updateMany({
        where: {
          id: { in: tasksToClose.map((t) => t.id) },
        },
        data: {
          isOpen: false,
          boardLaneId: doneLane?.id || undefined, // Only update if DONE lane found
        },
      });
    }

    // Notify HR team of rejection
    await this.sendApprovalNotification(cutoffId, 'REJECTED', remarks);
  }

  async getDisplayData(cutoffId: string): Promise<any> {
    const cutoffDateRange = await this.prisma.cutoffDateRange.findUnique({
      where: { id: cutoffId },
      include: {
        cutoff: {
          include: {
            PayrollGroup: true,
          },
        },
      },
    });

    if (!cutoffDateRange) {
      throw new Error('Cutoff not found');
    }

    // Get employee count and total amounts
    const employeeCount = await this.prisma.employeeTimekeepingCutoff.count({
      where: { cutoffDateRangeId: cutoffId },
    });

    return {
      cutoffId,
      payrollGroup:
        cutoffDateRange.cutoff.PayrollGroup[0]?.payrollGroupCode || 'Unknown',
      dateRange: `${cutoffDateRange.startDate.toLocaleDateString()} - ${cutoffDateRange.endDate.toLocaleDateString()}`,
      processingDate: cutoffDateRange.processingDate.toLocaleDateString(),
      employeeCount,
      totalNetPay: cutoffDateRange.totalNetPay,
      totalGrossPay: cutoffDateRange.totalGrossPay,
      totalDeductions: cutoffDateRange.totalDeduction,
      totalGovernmentContributions: cutoffDateRange.totalGovernmentContribution,
      status: cutoffDateRange.status,
    };
  }

  async getNextApprovers(
    cutoffId: string,
    currentLevel: number,
  ): Promise<string[]> {
    const cutoffDateRange = await this.prisma.cutoffDateRange.findUnique({
      where: { id: cutoffId },
      include: {
        cutoff: true,
      },
    });

    if (!cutoffDateRange) {
      throw new Error('Cutoff not found');
    }

    // Get all active approvers for the next level
    const nextLevelApprovers =
      await this.payrollApproversService.getApproversByLevel(currentLevel + 1);

    return nextLevelApprovers.map((approver) => approver.account.id);
  }

  private async createApprovalTask(
    cutoffId: string,
    approverId: string,
    level: number,
    maxLevel: number,
  ): Promise<void> {
    const cutoffData = await this.getDisplayData(cutoffId);

    const defaultBoardLane = await this.prisma.boardLane.findFirst({
      where: { key: 'BACKLOG' },
      orderBy: { order: 'asc' },
    });

    if (!defaultBoardLane) {
      throw new Error('No BACKLOG board lane found');
    }

    // Get previous approver info if this is not level 1
    let previousApproverInfo = '';
    if (level > 1) {
      const previousApproval =
        await this.prisma.payrollApprovalHistory.findFirst({
          where: {
            cutoffDateRangeId: cutoffId,
            approvalLevel: level - 1,
            action: 'APPROVED',
          },
          include: {
            approver: true,
          },
          orderBy: {
            approvedAt: 'desc',
          },
        });

      if (previousApproval) {
        previousApproverInfo = `\n\nPrevious approval by: ${previousApproval.approver.firstName} ${previousApproval.approver.lastName}`;
      }
    }

    const task = await this.prisma.task.create({
      data: {
        title: `Payroll Approval Required - ${cutoffData.payrollGroup}${level > 1 ? ` (Level ${level})` : ''}`,
        description: `Please review and approve the payroll for ${cutoffData.dateRange}. Total Net Pay: ${this.utilityService.formatCurrency(cutoffData.totalNetPay).formatCurrency}${previousApproverInfo}`,
        taskType: 'APPROVAL',
        assignMode: 'OTHER',
        isSelfAssigned: false,
        isOpen: true,
        order: 0,
        boardLaneId: defaultBoardLane.id,
        createdById: this.utilityService.accountInformation.id,
        updatedById: this.utilityService.accountInformation.id,
        assignedToId: approverId,
        ApprovalMetadata: {
          create: {
            sourceModule: 'PAYROLL',
            sourceId: cutoffId,
            actions: ['approve', 'reject'],
            approvalLevel: level,
            maxApprovalLevel: maxLevel,
            sourceData: cutoffData,
          },
        },
      },
    });

    // Get approver information for email
    const approver = await this.prisma.account.findUnique({
      where: { id: approverId },
      select: { firstName: true, lastName: true, email: true },
    });

    // Send email approval with encrypted action buttons
    if (approver?.email) {
      console.log(
        `Attempting to send email to approver: ${approver.email} for task ${task.id}`,
      );
      console.log('Approval data:', JSON.stringify(cutoffData, null, 2));

      try {
        // Generate payroll details Excel attachment
        console.log('Generating payroll details Excel report...');

        // Get employee salary information for the cutoff
        const employeeData =
          await this.hrProcessingService.getEmployeeListByCutoff(cutoffId);

        // Generate Excel buffer
        const excelBuffer =
          await this.payrollReportGeneratorService.generatePayrollDetailsExcel(
            cutoffId,
            employeeData,
          );

        console.log(
          'Excel report generated successfully, size:',
          excelBuffer.length,
          'bytes',
        );

        // Send email with attachment
        const emailResult = await this.emailApprovalService.sendApprovalEmail({
          taskId: task.id,
          approverId: approverId,
          module: 'PAYROLL',
          sourceId: cutoffId,
          templateName: 'payroll-approval',
          approvalData: cutoffData,
          recipientEmail: approver.email,
          attachments: [
            {
              filename: `Payroll_Details_${cutoffData.payrollGroup}_${cutoffData.dateRange.replace(/\//g, '-')}.xlsx`,
              content: excelBuffer,
              contentType:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
          ],
        });
        console.log(
          `Email approval with attachment sent successfully to ${approver.email} for payroll approval task ${task.id}`,
        );
        console.log('Email result:', emailResult);
      } catch (error) {
        console.error('Failed to send email approval:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', JSON.stringify(error, null, 2));
        // Continue with regular notification even if email fails
      }
    } else {
      console.log(`No email found for approver ${approverId}`);
    }

    // Send notification to approver
    const notificationMessage = `Payroll approval required for ${cutoffData.payrollGroup} (${cutoffData.dateRange}) - Level ${level}`;
    await this.notificationService.sendNotifications(
      0, // projectId - 0 for system notifications
      this.utilityService.accountInformation.id, // senderId
      [approverId], // receiverIds
      notificationMessage,
      NotificationTypeReference.PAYROLL_APPROVAL_REQUIRED.key,
      cutoffId, // showDialogId
    );
  }

  private async storeApprovalHistory(
    cutoffId: string,
    approverId: string,
    action: 'APPROVED' | 'REJECTED',
    level: number,
    remarks?: string,
  ): Promise<void> {
    try {
      console.log('Storing approval history:', {
        cutoffDateRangeId: cutoffId,
        approverId,
        action,
        approvalLevel: level,
        remarks,
        approvedAt: new Date(),
      });

      const result = await this.prisma.payrollApprovalHistory.create({
        data: {
          cutoffDateRangeId: cutoffId,
          approverId,
          action,
          approvalLevel: level,
          remarks,
          approvedAt: new Date(),
        },
      });

      console.log('Approval history stored successfully:', result);
    } catch (error) {
      console.error('Error storing approval history:', error);
      throw error;
    }
  }

  private async sendApprovalNotification(
    cutoffId: string,
    action: 'APPROVED' | 'REJECTED',
    remarks?: string,
  ): Promise<void> {
    const cutoffData = await this.getDisplayData(cutoffId);

    // Get HR users to notify - for now, get all users with HR roles
    // TODO: Implement proper module access checking
    const hrUsers = await this.prisma.account.findMany({
      where: {
        companyId: this.utilityService.companyId,
        role: {
          name: {
            contains: 'HR',
          },
        },
      },
      select: { id: true },
    });

    const hrUserIds = hrUsers.map((user) => user.id);

    const notificationType =
      action === 'APPROVED'
        ? NotificationTypeReference.PAYROLL_APPROVED
        : NotificationTypeReference.PAYROLL_REJECTED;

    const notificationMessage = `Payroll for ${cutoffData.payrollGroup} (${cutoffData.dateRange}) has been ${action.toLowerCase()}${remarks ? ': ' + remarks : ''}`;

    await this.notificationService.sendNotifications(
      0, // projectId - 0 for system notifications
      this.utilityService.accountInformation.id, // senderId
      hrUserIds, // receiverIds
      notificationMessage,
      notificationType.key,
      cutoffId, // showDialogId
    );
  }
}

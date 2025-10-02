import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Inject,
  Response as NestResponse,
} from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import { PrismaService } from '@common/prisma.service';
import { ApprovalService } from '@modules/approval/approval.service';
import { Response } from 'express';
import { HrProcessingService } from '../hr-processing/hr-processing.service';

interface ApproveRejectRequest {
  remarks?: string;
}

@Controller('payroll-approval')
export class PayrollApprovalController {
  constructor(
    private readonly utilityService: UtilityService,
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalService,
    @Inject() private readonly hrProcessingService: HrProcessingService,
  ) {}

  @Get('tasks/:cutoffId')
  async getPendingTasksForCutoff(
    @Param('cutoffId') cutoffId: string,
    @NestResponse() response?: Response,
  ) {
    const tasks = await this.prisma.task.findMany({
      where: {
        ApprovalMetadata: {
          sourceId: cutoffId,
          sourceModule: 'PAYROLL',
        },
        isOpen: true,
      },
      include: {
        assignedTo: true,
        ApprovalMetadata: true,
      },
    });

    const taskList = tasks.map((task) => ({
      id: task.id,
      approverName: `${task.assignedTo.firstName} ${task.assignedTo.lastName}`,
      level: task.ApprovalMetadata?.approvalLevel || 1,
    }));

    return this.utilityService.responseHandler(
      Promise.resolve(taskList),
      response,
    );
  }

  @Get('pending')
  async getPendingApprovals(@NestResponse() response?: Response) {
    const accountId = this.utilityService.accountInformation.id;

    // Get all open approval tasks for this user
    const pendingTasks = await this.prisma.task.findMany({
      where: {
        assignedToId: accountId,
        taskType: 'APPROVAL',
        isOpen: true,
        ApprovalMetadata: {
          sourceModule: 'PAYROLL',
        },
      },
      include: {
        ApprovalMetadata: true,
      },
    });

    // Get cutoff details for each task
    const pendingApprovals = await Promise.all(
      pendingTasks.map(async (task) => {
        const cutoffId = task.ApprovalMetadata?.sourceId;
        if (!cutoffId) return null;

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

        if (!cutoffDateRange) return null;

        const employeeCount = await this.prisma.employeeTimekeepingCutoff.count(
          {
            where: { cutoffDateRangeId: cutoffId },
          },
        );

        return {
          taskId: task.id,
          cutoffId,
          payrollGroup:
            cutoffDateRange.cutoff.PayrollGroup[0]?.payrollGroupCode ||
            'Unknown',
          startDate: cutoffDateRange.startDate,
          endDate: cutoffDateRange.endDate,
          processingDate: cutoffDateRange.processingDate,
          employeeCount,
          totalNetPay: cutoffDateRange.totalNetPay,
          totalGrossPay: cutoffDateRange.totalGrossPay,
          totalDeductions: cutoffDateRange.totalDeduction,
          totalGovernmentContributions:
            cutoffDateRange.totalGovernmentContribution,
          approvalLevel: task.ApprovalMetadata?.approvalLevel || 1,
          maxApprovalLevel: task.ApprovalMetadata?.maxApprovalLevel || 1,
        };
      }),
    );

    const validApprovals = pendingApprovals.filter(
      (approval) => approval !== null,
    );

    return this.utilityService.responseHandler(
      Promise.resolve(validApprovals),
      response,
    );
  }

  @Post('approve/:cutoffId')
  async approveCutoff(
    @Param('cutoffId') cutoffId: string,
    @Body() body: ApproveRejectRequest,
    @NestResponse() response?: Response,
  ) {
    const accountId = this.utilityService.accountInformation.id;

    // Find the approval task
    const task = await this.prisma.task.findFirst({
      where: {
        assignedToId: accountId,
        isOpen: true,
        ApprovalMetadata: {
          sourceModule: 'PAYROLL',
          sourceId: cutoffId,
        },
      },
      include: {
        ApprovalMetadata: true,
      },
    });

    if (!task) {
      throw new Error('No pending approval task found for this cutoff');
    }

    // Process the approval
    await this.approvalService.processApproval({
      taskId: task.id,
      action: 'approve',
      remarks: body.remarks,
    });

    return this.utilityService.responseHandler(
      Promise.resolve({ message: 'Payroll approved successfully' }),
      response,
    );
  }

  @Post('reject/:cutoffId')
  async rejectCutoff(
    @Param('cutoffId') cutoffId: string,
    @Body() body: ApproveRejectRequest,
    @NestResponse() response?: Response,
  ) {
    const accountId = this.utilityService.accountInformation.id;

    if (!body.remarks) {
      throw new Error('Rejection reason is required');
    }

    // Find the approval task
    const task = await this.prisma.task.findFirst({
      where: {
        assignedToId: accountId,
        isOpen: true,
        ApprovalMetadata: {
          sourceModule: 'PAYROLL',
          sourceId: cutoffId,
        },
      },
      include: {
        ApprovalMetadata: true,
      },
    });

    if (!task) {
      throw new Error('No pending approval task found for this cutoff');
    }

    // Process the rejection
    await this.approvalService.processApproval({
      taskId: task.id,
      action: 'reject',
      remarks: body.remarks,
    });

    return this.utilityService.responseHandler(
      Promise.resolve({ message: 'Payroll rejected successfully' }),
      response,
    );
  }

  @Get('history/:cutoffId')
  async getApprovalHistory(
    @Param('cutoffId') cutoffId: string,
    @NestResponse() response?: Response,
  ) {
    const history = await this.prisma.payrollApprovalHistory.findMany({
      where: {
        cutoffDateRangeId: cutoffId,
      },
      include: {
        approver: true,
      },
      orderBy: {
        approvedAt: 'desc',
      },
    });

    const formattedHistory = history.map((item) => ({
      id: item.id,
      action: item.action,
      approvalLevel: item.approvalLevel,
      approverName: `${item.approver.firstName} ${item.approver.lastName}`,
      approverEmail: item.approver.email,
      remarks: item.remarks,
      approvedAt: item.approvedAt,
    }));

    return this.utilityService.responseHandler(
      Promise.resolve(formattedHistory),
      response,
    );
  }

  @Get('cutoff/:cutoffId')
  async getCutoffDetails(
    @Param('cutoffId') cutoffId: string,
    @NestResponse() response?: Response,
  ) {
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

    const employeeList =
      await this.hrProcessingService.getEmployeeListByCutoff(cutoffId);

    const approvalHistory = await this.prisma.payrollApprovalHistory.findMany({
      where: {
        cutoffDateRangeId: cutoffId,
      },
      include: {
        approver: true,
      },
      orderBy: {
        approvedAt: 'asc',
      },
    });

    const result = {
      cutoffId,
      payrollGroup:
        cutoffDateRange.cutoff.PayrollGroup[0]?.payrollGroupCode || 'Unknown',
      startDate: cutoffDateRange.startDate,
      endDate: cutoffDateRange.endDate,
      processingDate: cutoffDateRange.processingDate,
      status: cutoffDateRange.status,
      employeeCount: employeeList.length,
      totalNetPay: cutoffDateRange.totalNetPay,
      totalGrossPay: cutoffDateRange.totalGrossPay,
      totalDeductions: cutoffDateRange.totalDeduction,
      totalGovernmentContributions: cutoffDateRange.totalGovernmentContribution,
      totalBasicPay: cutoffDateRange.totalBasicPay,
      totalAllowance: cutoffDateRange.totalAllowance,
      totalAdditionalEarnings: cutoffDateRange.totalAdditionalEarnings,
      approvalHistory: approvalHistory.map((item) => ({
        action: item.action,
        level: item.approvalLevel,
        approver: `${item.approver.firstName} ${item.approver.lastName}`,
        remarks: item.remarks,
        date: item.approvedAt,
      })),
    };

    return this.utilityService.responseHandler(
      Promise.resolve(result),
      response,
    );
  }
}

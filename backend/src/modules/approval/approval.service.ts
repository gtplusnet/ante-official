import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { TaskType, TaskAssignMode, BoardLaneKeys } from '@prisma/client';
import { NotificationService } from '@modules/communication/notification/notification/notification.service';
import NotificationTypeReference from '../../reference/notification-type.reference';

export interface CreateApprovalTaskParams {
  sourceModule: string;
  sourceId: string;
  approverId: string;
  title: string;
  description: string;
  metadata?: {
    actions?: string[];
    displayFields?: Record<string, any>;
    approvalLevel?: number;
    maxApprovalLevel?: number;
    approvalChain?: Record<string, string[]>;
    sourceData?: any;
  };
}

export interface ProcessApprovalParams {
  taskId: number;
  action: string;
  remarks?: string;
}

export interface ApprovalStrategy {
  onApprove(
    sourceId: string,
    approverId: string,
    remarks?: string,
  ): Promise<void>;
  onReject(
    sourceId: string,
    approverId: string,
    remarks?: string,
  ): Promise<void>;
  onRequestInfo?(
    sourceId: string,
    approverId: string,
    remarks?: string,
  ): Promise<void>;
  getDisplayData(sourceId: string): Promise<any>;
  getNextApprovers?(sourceId: string, currentLevel: number): Promise<string[]>;
}

@Injectable()
export class ApprovalService {
  private strategies: Map<string, ApprovalStrategy> = new Map();

  @Inject() private prisma: PrismaService;
  @Inject() private utilityService: UtilityService;
  @Inject() private notificationService: NotificationService;

  /**
   * Register an approval strategy for a specific module
   */
  registerStrategy(module: string, strategy: ApprovalStrategy) {
    this.strategies.set(module, strategy);
  }

  /**
   * Create an approval task
   */
  async createApprovalTask(params: CreateApprovalTaskParams): Promise<number> {
    const {
      sourceModule,
      sourceId,
      approverId,
      title,
      description,
      metadata = {},
    } = params;

    // Get BACKLOG board lane for new tasks
    const defaultBoardLane = await this.prisma.boardLane.findFirst({
      where: { key: BoardLaneKeys.BACKLOG },
      orderBy: { order: 'asc' },
    });
    if (!defaultBoardLane) {
      throw new BadRequestException('No BACKLOG board lane found');
    }

    // Create the task with approval metadata
    const companyId = this.utilityService.accountInformation.company?.id;
    const task = await this.prisma.task.create({
      data: {
        title,
        description,
        taskType: TaskType.APPROVAL,
        assignMode: TaskAssignMode.OTHER,
        isSelfAssigned: false,
        isOpen: true,
        order: 0,
        boardLaneId: defaultBoardLane.id,
        createdById: this.utilityService.accountInformation.id,
        updatedById: this.utilityService.accountInformation.id,
        assignedToId: approverId,
        ...(companyId && { companyId }),
        ApprovalMetadata: {
          create: {
            sourceModule,
            sourceId,
            actions: metadata.actions || ['approve', 'reject'],
            approvalLevel: metadata.approvalLevel || 1,
            maxApprovalLevel: metadata.maxApprovalLevel || 1,
            approvalChain: metadata.approvalChain || null,
            sourceData: metadata.sourceData || null,
          },
        },
      },
      include: {
        ApprovalMetadata: true,
      },
    });

    // Send notification to approver (skip for HR_FILING as it's handled by FilingNotificationService)
    if (sourceModule !== 'HR_FILING') {
      const notificationCode = NotificationTypeReference.TASK_CREATED.key;
      await this.notificationService.sendNotifications(
        null, // No specific project
        this.utilityService.accountInformation.id,
        [approverId],
        `You have a new approval request: ${title}`,
        notificationCode,
        task.id.toString(),
      );
    }

    return task.id;
  }

  /**
   * Process an approval action
   */
  async processApproval(params: ProcessApprovalParams): Promise<void> {
    const { taskId, action, remarks } = params;

    // Get task with approval metadata
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        ApprovalMetadata: true,
        assignedTo: true,
      },
    });

    if (!task || task.taskType !== TaskType.APPROVAL) {
      throw new NotFoundException('Approval task not found');
    }

    if (!task.ApprovalMetadata) {
      throw new BadRequestException('Task missing approval metadata');
    }

    if (task.assignedToId !== this.utilityService.accountInformation.id) {
      throw new BadRequestException(
        'You are not authorized to approve this task',
      );
    }

    const metadata = task.ApprovalMetadata;
    const actions = metadata.actions as string[];

    if (!actions.includes(action)) {
      throw new BadRequestException(`Invalid action: ${action}`);
    }

    // Get the strategy for this module
    const strategy = this.strategies.get(metadata.sourceModule);
    if (!strategy) {
      throw new BadRequestException(
        `No strategy registered for module: ${metadata.sourceModule}`,
      );
    }

    // Check if the source item is in a valid status for approval/rejection
    if (action === 'approve' || action === 'reject') {
      const sourceData = await strategy.getDisplayData(metadata.sourceId);

      // Different modules have different valid statuses for approval
      if (metadata.sourceModule === 'PAYROLL') {
        // Payroll approvals work with PROCESSED status
        if (
          sourceData &&
          sourceData.status &&
          sourceData.status !== 'PROCESSED' &&
          sourceData.status !== 'APPROVED'
        ) {
          throw new BadRequestException(
            `Cannot ${action} a payroll that is not in PROCESSED or APPROVED status. Current status: ${sourceData.status}`,
          );
        }
      } else if (metadata.sourceModule === 'HR_FILING') {
        // Filing approvals require PENDING status
        if (
          sourceData &&
          sourceData.status &&
          sourceData.status !== 'PENDING'
        ) {
          throw new BadRequestException(
            `Cannot ${action} a filing that is not in PENDING status. Current status: ${sourceData.status}`,
          );
        }
      }
      // Add other module-specific status checks as needed
    }

    // Process the action
    switch (action) {
      case 'approve':
        await this.handleApproval(task, metadata, strategy, remarks);
        break;
      case 'reject':
        await this.handleRejection(task, metadata, strategy, remarks);
        break;
      case 'request_info':
        if (strategy.onRequestInfo) {
          await strategy.onRequestInfo(
            metadata.sourceId,
            this.utilityService.accountInformation.id,
            remarks,
          );
        }
        break;
      default:
        throw new BadRequestException(`Unsupported action: ${action}`);
    }
  }

  /**
   * Handle approval action
   */
  private async handleApproval(
    task: any,
    metadata: any,
    strategy: ApprovalStrategy,
    remarks?: string,
  ): Promise<void> {
    const currentLevel = metadata.approvalLevel;
    const maxLevel = metadata.maxApprovalLevel;

    // Update approval metadata
    await this.prisma.approvalMetadata.update({
      where: { id: metadata.id },
      data: {
        remarks,
        approvedAt: new Date(),
      },
    });

    // For PAYROLL module, always delegate to strategy (it handles multi-level approvals internally)
    if (metadata.sourceModule === 'PAYROLL') {
      console.log('ApprovalService: PAYROLL module - delegating to strategy');
      await strategy.onApprove(
        metadata.sourceId,
        this.utilityService.accountInformation.id,
        remarks,
      );
      console.log('ApprovalService: PAYROLL strategy completed');
      return; // Strategy handles everything including task updates
    }

    // For other modules, use the original logic
    if (currentLevel >= maxLevel) {
      // Final approval - execute strategy and close task
      console.log(
        'ApprovalService: Calling strategy.onApprove for final approval',
      );
      await strategy.onApprove(
        metadata.sourceId,
        this.utilityService.accountInformation.id,
        remarks,
      );
      console.log('ApprovalService: strategy.onApprove completed');

      // Mark task as done
      const doneLane = await this.prisma.boardLane.findFirst({
        where: { key: BoardLaneKeys.DONE },
      });
      if (doneLane) {
        await this.prisma.task.update({
          where: { id: task.id },
          data: {
            boardLaneId: doneLane.id,
            isOpen: false,
          },
        });
      }
    } else {
      // Not final level - create task for next level
      const nextLevel = currentLevel + 1;
      const approvalChain = metadata.approvalChain as Record<
        string,
        string[]
      > | null;

      let nextApprovers: string[] = [];

      // Get next approvers from chain or strategy
      if (approvalChain && approvalChain[nextLevel.toString()]) {
        nextApprovers = approvalChain[nextLevel.toString()];
      } else if (strategy.getNextApprovers) {
        nextApprovers = await strategy.getNextApprovers(
          metadata.sourceId,
          nextLevel,
        );
      }

      // Mark current task as done
      const doneLane = await this.prisma.boardLane.findFirst({
        where: { key: BoardLaneKeys.DONE },
      });
      if (doneLane) {
        await this.prisma.task.update({
          where: { id: task.id },
          data: {
            boardLaneId: doneLane.id,
            isOpen: false,
          },
        });
      }

      // Create tasks for next level approvers
      for (const approverId of nextApprovers) {
        await this.createApprovalTask({
          sourceModule: metadata.sourceModule,
          sourceId: metadata.sourceId,
          approverId,
          title: `${task.title} (Level ${nextLevel})`,
          description: `${task.description}\n\nPrevious approval by: ${task.assignedTo.firstName} ${task.assignedTo.lastName}`,
          metadata: {
            ...metadata,
            approvalLevel: nextLevel,
            remarks: remarks
              ? `Level ${currentLevel} remarks: ${remarks}`
              : undefined,
          },
        });
      }
    }
  }

  /**
   * Handle rejection action
   */
  private async handleRejection(
    task: any,
    metadata: any,
    strategy: ApprovalStrategy,
    remarks?: string,
  ): Promise<void> {
    // Update approval metadata
    await this.prisma.approvalMetadata.update({
      where: { id: metadata.id },
      data: {
        remarks,
        approvedAt: new Date(),
      },
    });

    // Execute rejection strategy
    console.log('ApprovalService: Calling strategy.onReject');
    await strategy.onReject(
      metadata.sourceId,
      this.utilityService.accountInformation.id,
      remarks,
    );
    console.log('ApprovalService: strategy.onReject completed');

    // For PAYROLL module, strategy handles everything
    if (metadata.sourceModule === 'PAYROLL') {
      return; // Strategy handles task updates
    }

    // For other modules, mark task as done
    const doneLane = await this.prisma.boardLane.findFirst({
      where: { key: BoardLaneKeys.DONE },
    });
    if (doneLane) {
      await this.prisma.task.update({
        where: { id: task.id },
        data: {
          boardLaneId: doneLane.id,
          isOpen: false,
        },
      });
    }
  }

  /**
   * Get approval details for a task
   */
  async getApprovalDetails(taskId: number): Promise<any> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        ApprovalMetadata: true,
      },
    });

    if (!task || task.taskType !== TaskType.APPROVAL) {
      throw new NotFoundException('Approval task not found');
    }

    const metadata = task.ApprovalMetadata;
    if (!metadata) {
      throw new BadRequestException('Task missing approval metadata');
    }

    // Get strategy to fetch display data
    const strategy = this.strategies.get(metadata.sourceModule);
    if (!strategy) {
      return {
        task,
        metadata,
        sourceData: metadata.sourceData,
      };
    }

    const displayData = await strategy.getDisplayData(metadata.sourceId);

    return {
      task,
      metadata,
      sourceData: displayData,
    };
  }

  /**
   * Get approval history for a source
   */
  async getApprovalHistory(
    sourceModule: string,
    sourceId: string,
  ): Promise<any[]> {
    const approvals = await this.prisma.approvalMetadata.findMany({
      where: {
        sourceModule,
        sourceId,
        approvedAt: { not: null },
      },
      include: {
        task: {
          include: {
            assignedTo: true,
          },
        },
      },
      orderBy: {
        approvalLevel: 'asc',
      },
    });

    return approvals.map((approval) => ({
      level: approval.approvalLevel,
      approver: approval.task.assignedTo,
      approvedAt: approval.approvedAt,
      remarks: approval.remarks,
    }));
  }
}

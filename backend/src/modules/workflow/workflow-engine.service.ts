import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import {
  WorkflowInstance,
  WorkflowStage,
  WorkflowInstanceStatus,
} from '@prisma/client';
import { WorkflowTemplateService } from './workflow-template.service';
import { WorkflowValidatorService } from './workflow-validator.service';
import { WorkflowTaskService } from './workflow-task.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationService } from '@modules/communication/notification/notification/notification.service';
import notificationTypeReference from '../../reference/notification-type.reference';

export interface StartWorkflowParams {
  workflowCode: string;
  sourceModule: string;
  sourceId: string;
  initiatorId: string;
  companyId: number;
  metadata?: any;
}

export interface TransitionWorkflowParams {
  instanceId: number;
  action: string;
  performedById: string;
  remarks?: string;
  metadata?: any;
}

export interface WorkflowAction {
  code: string;
  name: string;
  buttonColor?: string;
  buttonIcon?: string;
  requiresRemarks: boolean;
  confirmationRequired: boolean;
  confirmationMessage?: string;
}

@Injectable()
export class WorkflowEngineService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WorkflowTemplateService))
    private workflowTemplateService: WorkflowTemplateService,
    @Inject(forwardRef(() => WorkflowValidatorService))
    private validatorService: WorkflowValidatorService,
    @Inject(forwardRef(() => WorkflowTaskService))
    private taskService: WorkflowTaskService,
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
  ) {}

  /**
   * Start a new workflow instance
   */
  async startWorkflow(params: StartWorkflowParams): Promise<WorkflowInstance> {
    const {
      workflowCode,
      sourceModule,
      sourceId,
      initiatorId,
      companyId,
      metadata,
    } = params;

    // Check if workflow instance already exists for this source
    const existingInstance = await this.prisma.workflowInstance.findUnique({
      where: {
        sourceModule_sourceId: {
          sourceModule,
          sourceId,
        },
      },
    });

    if (existingInstance) {
      throw new BadRequestException(
        `Workflow instance already exists for ${sourceModule}:${sourceId}`,
      );
    }

    // Get workflow template
    const workflow = await this.workflowTemplateService.findByCode(
      workflowCode,
      companyId,
    );

    if (!workflow) {
      throw new NotFoundException(
        `Workflow template '${workflowCode}' not found`,
      );
    }

    if (!workflow.isActive) {
      throw new BadRequestException(
        `Workflow template '${workflowCode}' is not active`,
      );
    }

    // Find initial stage
    const initialStage = workflow.stages.find((stage) => stage.isInitial);

    if (!initialStage) {
      throw new BadRequestException(
        `No initial stage defined for workflow '${workflowCode}'`,
      );
    }

    // Create workflow instance
    const instance = await this.prisma.$transaction(async (tx) => {
      // Create the instance
      const newInstance = await tx.workflowInstance.create({
        data: {
          workflowId: workflow.id,
          currentStageId: initialStage.id,
          sourceModule,
          sourceId,
          status: WorkflowInstanceStatus.ACTIVE,
          startedById: initiatorId,
          metadata,
        },
        include: {
          currentStage: true,
          workflow: true,
        },
      });

      // Add history entry for initialization
      await tx.workflowHistory.create({
        data: {
          instanceId: newInstance.id,
          toStageId: initialStage.id,
          action: 'WORKFLOW_STARTED',
          performedById: initiatorId,
          remarks: 'Workflow initiated',
          metadata: { initialMetadata: metadata },
        },
      });

      // Create initial task if stage has assignee
      if (initialStage.assigneeId || initialStage.assigneeType) {
        await this.taskService.createWorkflowTask({
          instanceId: newInstance.id,
          stageId: initialStage.id,
          stage: initialStage,
          sourceModule,
          sourceId,
          createdById: initiatorId,
          tx, // Pass the transaction context
        });
      }

      return newInstance;
    });

    // Emit event
    this.eventEmitter.emit('workflow.started', {
      instanceId: instance.id,
      workflowCode,
      sourceModule,
      sourceId,
      currentStage: initialStage.key,
    });

    return instance;
  }

  /**
   * Perform a workflow transition
   */
  async transitionWorkflow(
    params: TransitionWorkflowParams,
  ): Promise<WorkflowInstance> {
    const { instanceId, action, performedById, remarks, metadata } = params;

    // Get instance with relations
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        currentStage: {
          include: {
            transitionsFrom: {
              include: {
                toStage: true,
              },
            },
          },
        },
        workflow: {
          include: {
            buttonConfigs: true,
          },
        },
        tasks: {
          where: {
            completedAt: null,
          },
          include: {
            task: true,
          },
        },
      },
    });

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    if (instance.status !== WorkflowInstanceStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot transition workflow in ${instance.status} status`,
      );
    }

    // Find the transition for the action
    const transition = instance.currentStage.transitionsFrom.find(
      (t) => t.buttonName === action || t.conditionType === action,
    );

    if (!transition) {
      throw new BadRequestException(
        `Invalid action '${action}' for current stage '${instance.currentStage.name}'`,
      );
    }

    // Validate the transition
    const validationResult = await this.validatorService.validateTransition({
      instanceId,
      instance,
      transition,
      performedById,
      remarks,
      metadata,
    });

    if (!validationResult.isValid) {
      throw new BadRequestException(
        validationResult.errors?.join(', ') || 'Transition validation failed',
      );
    }

    // Check permissions
    const hasPermission = await this.validatorService.validatePermissions({
      userId: performedById,
      transition,
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    // Perform the transition
    const updatedInstance = await this.prisma.$transaction(async (tx) => {
      // Update instance
      const updated = await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          currentStageId: transition.toStageId!,
          status: transition.toStage!.isFinal
            ? WorkflowInstanceStatus.COMPLETED
            : WorkflowInstanceStatus.ACTIVE,
          completedAt: transition.toStage!.isFinal ? new Date() : null,
        },
        include: {
          currentStage: true,
          workflow: true,
        },
      });

      // Add history entry
      await tx.workflowHistory.create({
        data: {
          instanceId,
          fromStageId: instance.currentStageId,
          toStageId: transition.toStageId!,
          transitionId: transition.id,
          action,
          performedById,
          remarks,
          metadata,
        },
      });

      // Complete current tasks
      if (instance.tasks.length > 0) {
        for (const workflowTask of instance.tasks) {
          await this.taskService.completeWorkflowTask({
            taskId: workflowTask.taskId,
            action,
            remarks,
            completedById: performedById,
          });
        }
      }

      // Create new task if not final stage
      if (!transition.toStage!.isFinal && transition.toStage!) {
        await this.taskService.createWorkflowTask({
          instanceId,
          stageId: transition.toStageId!,
          stage: transition.toStage!,
          sourceModule: instance.sourceModule,
          sourceId: instance.sourceId,
          createdById: performedById,
          tx, // Pass the transaction context
        });
      }

      return updated;
    });

    // Sync source status
    await this.syncSourceStatus(updatedInstance);

    // Emit event
    this.eventEmitter.emit('workflow.transitioned', {
      instanceId,
      fromStage: instance.currentStage.key,
      toStage: updatedInstance.currentStage.key,
      action,
      performedById,
    });

    // Send notification to liquidation requester for status changes
    await this.sendWorkflowTransitionNotification(
      updatedInstance,
      performedById,
      remarks,
    );

    return updatedInstance;
  }

  /**
   * Get available actions for current stage
   */
  async getCurrentStageActions(
    instanceId: number,
    userId: string,
  ): Promise<WorkflowAction[]> {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        currentStage: {
          include: {
            transitionsFrom: {
              include: {
                toStage: true,
              },
            },
          },
        },
        workflow: {
          include: {
            buttonConfigs: true,
          },
        },
      },
    });

    if (!instance || instance.status !== WorkflowInstanceStatus.ACTIVE) {
      return [];
    }

    const actions: WorkflowAction[] = [];

    for (const transition of instance.currentStage.transitionsFrom) {
      // Check permissions
      const hasPermission = await this.validatorService.validatePermissions({
        userId,
        transition,
      });

      if (hasPermission) {
        // Get button config if exists
        const buttonConfig = instance.workflow.buttonConfigs.find(
          (config) => config.transitionCode === transition.buttonName,
        );

        actions.push({
          code: transition.buttonName || transition.conditionType || '',
          name: transition.buttonName || 'Action',
          buttonColor:
            buttonConfig?.buttonColor || transition.buttonColor || 'primary',
          buttonIcon: buttonConfig?.buttonIcon || undefined,
          requiresRemarks: buttonConfig?.remarkRequired || false,
          confirmationRequired: buttonConfig?.confirmationRequired || false,
          confirmationMessage: buttonConfig?.confirmationMessage || undefined,
        });
      }
    }

    return actions;
  }

  /**
   * Sync workflow status with source entity
   */
  async syncSourceStatus(instance: WorkflowInstance): Promise<void> {
    const { sourceModule, sourceId, currentStageId } = instance;

    // Get the current stage details
    const stage = await this.prisma.workflowStage.findUnique({
      where: { id: currentStageId },
    });

    if (!stage) return;

    // Emit event for source module to handle status sync
    this.eventEmitter.emit(`workflow.sync.${sourceModule.toLowerCase()}`, {
      sourceId,
      stageKey: stage.key,
      stageName: stage.name,
      isFinal: stage.isFinal,
      instanceId: instance.id,
    });

    // If it's petty cash liquidation, update the status directly
    if (sourceModule === 'petty_cash_liquidation') {
      await this.syncPettyCashLiquidationStatus(sourceId, stage.key);
    }
  }

  /**
   * Sync petty cash liquidation status
   */
  private async syncPettyCashLiquidationStatus(
    liquidationId: string,
    stageKey: string,
  ): Promise<void> {
    // Map workflow stage to liquidation status
    const statusMap: Record<string, string> = {
      PENDING: 'PENDING',
      APPROVED: 'APPROVED',
      REJECTED: 'REJECTED',
    };

    const status = statusMap[stageKey];
    if (status) {
      await this.prisma.pettyCashLiquidation.update({
        where: { id: parseInt(liquidationId) },
        data: { status: status as any },
      });
    }
  }

  /**
   * Get workflow instance by source
   */
  async getInstanceBySource(
    sourceModule: string,
    sourceId: string,
  ): Promise<WorkflowInstance | null> {
    return this.prisma.workflowInstance.findUnique({
      where: {
        sourceModule_sourceId: {
          sourceModule,
          sourceId,
        },
      },
      include: {
        currentStage: true,
        workflow: true,
        tasks: {
          include: {
            task: true,
          },
        },
        history: {
          include: {
            fromStage: true,
            toStage: true,
            performedBy: true,
          },
          orderBy: {
            performedAt: 'desc',
          },
        },
      },
    });
  }

  /**
   * Get workflow instance details
   */
  async getInstanceDetails(instanceId: number) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        currentStage: {
          include: {
            transitionsFrom: {
              include: {
                toStage: true,
              },
            },
          },
        },
        workflow: {
          include: {
            stages: {
              orderBy: { sequence: 'asc' },
            },
            buttonConfigs: true,
          },
        },
        tasks: {
          include: {
            task: {
              include: {
                assignedTo: true,
                boardLane: true,
              },
            },
            stage: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        history: {
          include: {
            fromStage: true,
            toStage: true,
            performedBy: true,
            transition: true,
          },
          orderBy: {
            performedAt: 'desc',
          },
        },
        startedBy: true,
      },
    });

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    return instance;
  }

  /**
   * Cancel workflow instance
   */
  async cancelWorkflow(
    instanceId: number,
    cancelledById: string,
    reason: string,
  ): Promise<void> {
    const instance = await this.getInstanceDetails(instanceId);

    if (instance.status !== WorkflowInstanceStatus.ACTIVE) {
      throw new BadRequestException('Can only cancel active workflows');
    }

    await this.prisma.$transaction(async (tx) => {
      // Update instance status
      await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          status: WorkflowInstanceStatus.CANCELLED,
          completedAt: new Date(),
        },
      });

      // Add history entry
      await tx.workflowHistory.create({
        data: {
          instanceId,
          fromStageId: instance.currentStageId,
          toStageId: instance.currentStageId,
          action: 'WORKFLOW_CANCELLED',
          performedById: cancelledById,
          remarks: reason,
        },
      });

      // Cancel any pending tasks
      if (instance.tasks.length > 0) {
        for (const workflowTask of instance.tasks) {
          if (!workflowTask.completedAt) {
            await this.taskService.cancelWorkflowTask(
              workflowTask.taskId,
              cancelledById,
              reason,
            );
          }
        }
      }
    });

    // Emit event
    this.eventEmitter.emit('workflow.cancelled', {
      instanceId,
      sourceModule: instance.sourceModule,
      sourceId: instance.sourceId,
      cancelledById,
      reason,
    });
  }

  /**
   * Get available actions for workflow instance
   */
  async getAvailableActions(instanceId: number, _userId: string) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        workflow: {
          include: {
            stages: {
              include: {
                transitionsFrom: {
                  include: {
                    toStage: true,
                  },
                },
              },
            },
          },
        },
        currentStage: {
          include: {
            transitionsFrom: {
              include: {
                toStage: true,
              },
            },
          },
        },
      },
    });

    if (!instance || instance.status !== 'ACTIVE') {
      return [];
    }

    // Get available transitions from current stage
    const availableActions = [];

    // Get current stage with transitions
    const currentStage = await this.prisma.workflowStage.findUnique({
      where: { id: instance.currentStageId },
      include: {
        transitionsFrom: {
          include: {
            toStage: true,
          },
        },
      },
    });

    if (!currentStage) {
      return [];
    }

    for (const transition of currentStage.transitionsFrom) {
      // For now, skip permission validation to debug the issue
      // TODO: Re-enable permission validation after fixing
      // const validationResult = await this.validatorService.validateTransition({
      //   instanceId: instance.id,
      //   instance,
      //   transition,
      //   performedById: userId,
      // });
      // const hasPermission = validationResult.isValid;
      const hasPermission = true; // Temporarily allow all transitions

      if (hasPermission) {
        availableActions.push({
          id: transition.id,
          action: transition.buttonName || 'Action',
          targetStage: transition.toStage?.name || 'Next Stage',
          targetStageId: transition.toStage?.id,
          toStageId: transition.toStageId,
          buttonColor: transition.buttonColor || 'primary',
          buttonName: transition.buttonName,
          buttonLabel: transition.buttonName || 'Action',
          buttonIcon:
            transition.transitionType === 'APPROVAL' &&
            transition.buttonName === 'Approve'
              ? 'check'
              : transition.transitionType === 'APPROVAL' &&
                  transition.buttonName === 'Reject'
                ? 'close'
                : null,
          dialogType: transition.dialogType,
          type:
            transition.transitionType || transition.conditionType || 'ACTION',
          confirmationMessage: null,
          confirmationRequired: false,
          requireRemarks: transition.dialogType === 'reason_dialog',
        });
      }
    }

    return availableActions;
  }

  /**
   * Suspend workflow instance
   */
  async suspendWorkflow(
    instanceId: number,
    suspendedById: string,
    reason?: string,
  ) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    if (instance.status !== 'ACTIVE') {
      throw new BadRequestException('Only active workflows can be suspended');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update instance status
      const updatedInstance = await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          status: 'SUSPENDED',
          metadata: {
            ...(instance.metadata as object),
            suspendedAt: new Date().toISOString(),
            suspendedById,
            suspendReason: reason,
          },
        },
      });

      // Create history entry
      await tx.workflowHistory.create({
        data: {
          instanceId,
          fromStageId: instance.currentStageId,
          toStageId: instance.currentStageId,
          action: 'SUSPEND',
          performedById: suspendedById,
          remarks: reason || 'Workflow suspended',
          performedAt: new Date(),
        },
      });

      // Emit event
      this.eventEmitter.emit('workflow.suspended', {
        instanceId,
        suspendedById,
        reason,
      });

      return updatedInstance;
    });
  }

  /**
   * Resume workflow instance
   */
  async resumeWorkflow(instanceId: number, resumedById: string) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    if (instance.status !== 'SUSPENDED') {
      throw new BadRequestException('Only suspended workflows can be resumed');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update instance status
      const updatedInstance = await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          status: 'ACTIVE',
          metadata: {
            ...(instance.metadata as object),
            resumedAt: new Date().toISOString(),
            resumedById,
          },
        },
      });

      // Create history entry
      await tx.workflowHistory.create({
        data: {
          instanceId,
          fromStageId: instance.currentStageId,
          toStageId: instance.currentStageId,
          action: 'RESUME',
          performedById: resumedById,
          remarks: 'Workflow resumed',
          performedAt: new Date(),
        },
      });

      // Emit event
      this.eventEmitter.emit('workflow.resumed', {
        instanceId,
        resumedById,
      });

      return updatedInstance;
    });
  }

  /**
   * Send notification to requester about workflow status changes
   */
  private async sendWorkflowTransitionNotification(
    instance: WorkflowInstance & { currentStage: WorkflowStage },
    performedById: string,
    _remarks?: string,
  ): Promise<void> {
    // Only send notifications for petty cash liquidations
    if (instance.sourceModule !== 'petty_cash_liquidation') {
      return;
    }

    try {
      const liquidation = await this.prisma.pettyCashLiquidation.findUnique({
        where: { id: parseInt(instance.sourceId) },
        select: {
          requestedById: true,
          amount: true,
        },
      });

      if (!liquidation || !liquidation.requestedById) {
        return;
      }

      // Don't send notification to the person who performed the action
      if (liquidation.requestedById === performedById) {
        return;
      }

      // Create generic status message
      const statusMessage = `Liquidation status updated to ${instance.currentStage.name}`;

      // Find the active task for this workflow to use as showDialogId
      const activeTask = await this.prisma.workflowTask.findFirst({
        where: {
          instanceId: instance.id,
          completedAt: null,
        },
        select: { taskId: true },
      });

      await this.notificationService.sendNotifications(
        null, // No specific project
        performedById, // Sender is the person who performed the action
        [liquidation.requestedById], // Send to the liquidation requester
        statusMessage,
        notificationTypeReference.TASK_MOVED.key, // Using TASK_MOVED for status updates
        activeTask?.taskId?.toString() || instance.sourceId, // Task ID or source ID for dialog
      );
    } catch (error) {
      console.error('Failed to send workflow transition notification:', error);
      // Don't throw - we don't want to fail the workflow transition if notification fails
    }
  }
}

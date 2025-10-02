import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import {
  Task,
  WorkflowTask,
  WorkflowStage,
  BoardLane,
  BoardLaneKeys,
  TaskType,
  AssigneeType,
} from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationService } from '@modules/communication/notification/notification/notification.service';
import notificationTypeReference from '../../reference/notification-type.reference';

export interface CreateWorkflowTaskParams {
  instanceId: number;
  stageId: number;
  stage: WorkflowStage;
  sourceModule: string;
  sourceId: string;
  createdById: string;
  tx?: any; // Optional transaction context
}

export interface CompleteWorkflowTaskParams {
  taskId: number;
  action: string;
  remarks?: string;
  completedById: string;
}

@Injectable()
export class WorkflowTaskService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
  ) {}

  /**
   * Create a workflow task for a stage
   */
  async createWorkflowTask(
    params: CreateWorkflowTaskParams,
  ): Promise<WorkflowTask> {
    const {
      instanceId,
      stageId,
      stage,
      sourceModule,
      sourceId,
      createdById,
      tx,
    } = params;

    // Determine assignee based on stage configuration
    const assigneeId = await this.determineAssignee(stage, createdById, tx);

    if (!assigneeId) {
      // No assignee, don't create task
      console.log(`No assignee determined for stage ${stage.name}`);
      return null as any;
    }

    // Get or create the appropriate board lane
    const boardLane = await this.getOrCreateBoardLane(tx);

    // Get source entity details for task title and description
    const { title, description } = await this.getTaskDetails(
      sourceModule,
      sourceId,
      stage,
      tx,
    );

    // Create the task
    const createTaskFn = async (prismaClient) => {
      // Create base task
      const newTask = await prismaClient.task.create({
        data: {
          title,
          description,
          boardLaneId: boardLane.id,
          createdById,
          updatedById: createdById,
          assignedToId: assigneeId,
          order: await this.getNextTaskOrder(boardLane.id, prismaClient),
          taskType: TaskType.APPROVAL,
          isOpen: true,
          priorityLevel: 1,
          dueDate: this.calculateDueDate(stage),
        },
      });

      // Create workflow task link
      const workflowTask = await prismaClient.workflowTask.create({
        data: {
          instanceId,
          taskId: newTask.id,
          stageId,
        },
        include: {
          task: true,
        },
      });

      // Create approval metadata
      await prismaClient.approvalMetadata.create({
        data: {
          taskId: newTask.id,
          sourceModule,
          sourceId,
        },
      });

      // Add task watchers/collaborators
      const watchersToAdd = [];

      // Add the creator as CREATOR watcher
      if (createdById) {
        watchersToAdd.push({
          taskId: newTask.id,
          accountId: createdById,
          watcherType: 'CREATOR',
        });
      }

      // Add the assignee as ASSIGNEE watcher if different from creator
      if (assigneeId && assigneeId !== createdById) {
        watchersToAdd.push({
          taskId: newTask.id,
          accountId: assigneeId,
          watcherType: 'ASSIGNEE',
        });
      }

      // For petty cash liquidation, add the liquidation requester as a WATCHER
      if (sourceModule === 'petty_cash_liquidation') {
        const liquidation = await prismaClient.pettyCashLiquidation.findUnique({
          where: { id: parseInt(sourceId) },
          select: { requestedById: true },
        });

        if (
          liquidation &&
          liquidation.requestedById &&
          liquidation.requestedById !== createdById &&
          liquidation.requestedById !== assigneeId
        ) {
          watchersToAdd.push({
            taskId: newTask.id,
            accountId: liquidation.requestedById,
            watcherType: 'WATCHER',
          });
        }
      }

      // Create all watchers
      if (watchersToAdd.length > 0) {
        await prismaClient.taskWatcher.createMany({
          data: watchersToAdd,
          skipDuplicates: true, // Skip if duplicate combinations exist
        });
      }

      return workflowTask;
    };

    // Use provided transaction or create a new one
    const task = tx
      ? await createTaskFn(tx)
      : await this.prisma.$transaction(async (newTx) => createTaskFn(newTx));

    // Send notification to assignee
    await this.sendTaskNotification(
      task.task,
      assigneeId,
      createdById,
      sourceModule,
      sourceId,
    );

    // Emit event
    this.eventEmitter.emit('workflow.task.created', {
      taskId: task.taskId,
      instanceId,
      stageId,
      assigneeId,
    });

    return task;
  }

  /**
   * Complete a workflow task
   */
  async completeWorkflowTask(
    params: CompleteWorkflowTaskParams,
  ): Promise<void> {
    const { taskId, action, remarks, completedById } = params;

    // Get workflow task
    const workflowTask = await this.prisma.workflowTask.findUnique({
      where: { taskId },
      include: {
        task: true,
      },
    });

    if (!workflowTask) {
      throw new NotFoundException('Workflow task not found');
    }

    if (workflowTask.completedAt) {
      throw new BadRequestException('Task already completed');
    }

    // Move task to done lane
    const doneLane = await this.prisma.boardLane.findFirst({
      where: { key: BoardLaneKeys.DONE },
    });

    if (!doneLane) {
      throw new NotFoundException('Done board lane not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // Update task
      await tx.task.update({
        where: { id: taskId },
        data: {
          boardLaneId: doneLane.id,
          isOpen: false,
          updatedById: completedById,
        },
      });

      // Update workflow task
      await tx.workflowTask.update({
        where: { id: workflowTask.id },
        data: {
          completedAt: new Date(),
        },
      });

      // Update approval metadata if exists
      await tx.approvalMetadata.updateMany({
        where: { taskId },
        data: {
          remarks:
            remarks ||
            (action === 'APPROVE'
              ? 'Approved via workflow'
              : 'Rejected via workflow'),
        },
      });
    });

    // Emit event
    this.eventEmitter.emit('workflow.task.completed', {
      taskId,
      instanceId: workflowTask.instanceId,
      action,
      completedById,
    });
  }

  /**
   * Cancel a workflow task
   */
  async cancelWorkflowTask(
    taskId: number,
    cancelledById: string,
    reason: string,
  ): Promise<void> {
    const workflowTask = await this.prisma.workflowTask.findUnique({
      where: { taskId },
      include: {
        task: true,
      },
    });

    if (!workflowTask) {
      throw new NotFoundException('Workflow task not found');
    }

    if (workflowTask.completedAt) {
      return; // Already completed, no need to cancel
    }

    // Get cancelled lane or create one
    let cancelledLane = await this.prisma.boardLane.findFirst({
      where: { key: BoardLaneKeys.DONE },
    });

    if (!cancelledLane) {
      // Use done lane as fallback
      cancelledLane = await this.prisma.boardLane.findFirst({
        where: { key: BoardLaneKeys.DONE },
      });
    }

    await this.prisma.$transaction(async (tx) => {
      // Update task
      await tx.task.update({
        where: { id: taskId },
        data: {
          boardLaneId: cancelledLane!.id,
          isOpen: false,
          updatedById: cancelledById,
          description: `${workflowTask.task.description || ''}\n\nCancelled: ${reason}`,
        },
      });

      // Update workflow task
      await tx.workflowTask.update({
        where: { id: workflowTask.id },
        data: {
          completedAt: new Date(),
        },
      });

      // Update approval metadata
      await tx.approvalMetadata.updateMany({
        where: { taskId },
        data: {
          remarks: reason || 'Cancelled via workflow',
        },
      });
    });
  }

  /**
   * Reassign a workflow task
   */
  async reassignWorkflowTask(
    taskId: number,
    newAssigneeId: string,
    reassignedById: string,
  ): Promise<void> {
    const workflowTask = await this.prisma.workflowTask.findUnique({
      where: { taskId },
      include: {
        task: true,
      },
    });

    if (!workflowTask) {
      throw new NotFoundException('Workflow task not found');
    }

    if (workflowTask.completedAt) {
      throw new BadRequestException('Cannot reassign completed task');
    }

    // Update task assignee
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: newAssigneeId,
        updatedById: reassignedById,
      },
    });

    // Send notification to new assignee
    await this.sendTaskNotification(
      workflowTask.task,
      newAssigneeId,
      reassignedById,
    );

    // Emit event
    this.eventEmitter.emit('workflow.task.reassigned', {
      taskId,
      instanceId: workflowTask.instanceId,
      oldAssigneeId: workflowTask.task.assignedToId,
      newAssigneeId,
      reassignedById,
    });
  }

  /**
   * Determine assignee based on stage configuration
   */
  private async determineAssignee(
    stage: WorkflowStage,
    requesterId: string,
    tx?: any,
  ): Promise<string | null> {
    if (!stage.assigneeType && !stage.assigneeId) {
      // No assignee configured, try to find supervisor
      return this.findSupervisor(requesterId, tx);
    }

    switch (stage.assigneeType) {
      case AssigneeType.SPECIFIC_USER:
        return stage.assigneeId;

      case AssigneeType.DIRECT_SUPERVISOR:
        return this.findSupervisor(requesterId, tx);

      case AssigneeType.DEPARTMENT:
        return this.findDepartmentHead(stage.assigneeId!, tx);

      case AssigneeType.ROLE:
        return this.findRoleUser(stage.assigneeId!, tx);

      default:
        return stage.assigneeId;
    }
  }

  /**
   * Find supervisor of a user
   */
  private async findSupervisor(
    userId: string,
    tx?: any,
  ): Promise<string | null> {
    const prismaClient = tx || this.prisma;
    const user = await prismaClient.account.findUnique({
      where: { id: userId },
      select: { parentAccountId: true },
    });

    return user?.parentAccountId || null;
  }

  /**
   * Find department head
   */
  private async findDepartmentHead(
    departmentId: string,
    tx?: any,
  ): Promise<string | null> {
    const prismaClient = tx || this.prisma;
    // Find first user with the department role who has manager permissions
    const departmentUser = await prismaClient.account.findFirst({
      where: {
        roleId: departmentId,
        role: {
          OR: [
            { name: { in: ['Manager', 'Department Head', 'Admin'] } },
            { isFullAccess: true },
            { level: { gte: 5 } },
          ],
        },
      },
    });

    return departmentUser?.id || null;
  }

  /**
   * Find user with specific role
   */
  private async findRoleUser(roleId: string, tx?: any): Promise<string | null> {
    const prismaClient = tx || this.prisma;
    const roleUser = await prismaClient.account.findFirst({
      where: {
        roleId,
        isDeleted: false,
      },
    });

    return roleUser?.id || null;
  }

  /**
   * Get or create workflow board lane
   */
  private async getOrCreateBoardLane(tx?: any): Promise<BoardLane> {
    const prismaClient = tx || this.prisma;
    let lane = await prismaClient.boardLane.findFirst({
      where: { key: BoardLaneKeys.BACKLOG },
    });

    if (!lane) {
      // Create default TODO lane if not exists
      lane = await prismaClient.boardLane.create({
        data: {
          name: 'To Do',
          key: BoardLaneKeys.BACKLOG,
          description: 'Default workflow tasks',
          order: 1,
          isDefault: true,
        },
      });
    }

    return lane;
  }

  /**
   * Get task details based on source module
   */
  private async getTaskDetails(
    sourceModule: string,
    sourceId: string,
    stage: WorkflowStage,
    tx?: any,
  ): Promise<{ title: string; description: string }> {
    let title = `${stage.name} Required`;
    let description = stage.description || '';

    const prismaClient = tx || this.prisma;

    if (sourceModule === 'petty_cash_liquidation') {
      const liquidation = await prismaClient.pettyCashLiquidation.findUnique({
        where: { id: parseInt(sourceId) },
        include: {
          requestedBy: true,
          pettyCashHolder: {
            include: {
              account: true,
            },
          },
        },
      });

      if (liquidation) {
        title = `Review Liquidation #${liquidation.id}`;

        // Format amount with proper currency formatting
        const formattedAmount = new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
        }).format(liquidation.amount);

        const formattedVat = liquidation.vatAmount
          ? new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP',
            }).format(liquidation.vatAmount)
          : null;

        const formattedWithholding = liquidation.withholdingTaxAmount
          ? new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP',
            }).format(liquidation.withholdingTaxAmount)
          : null;

        // Format date if available
        const receiptDate = liquidation.receiptDate
          ? new Date(liquidation.receiptDate).toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : null;

        // Create a simple description with basic HTML formatting
        const requesterName = `${liquidation.requestedBy.firstName} ${liquidation.requestedBy.lastName}`;
        const descriptionParts = [];

        // Start with main details
        descriptionParts.push('<ul>');
        descriptionParts.push(
          `<li><strong>Liquidation Request #${liquidation.id}</strong></li>`,
        );
        descriptionParts.push(
          `<li><strong>Amount:</strong> ${formattedAmount}</li>`,
        );
        descriptionParts.push(
          `<li><strong>Requested by:</strong> ${requesterName}</li>`,
        );

        // Add receipt details if available
        if (liquidation.receiptNumber) {
          descriptionParts.push(
            `<li><strong>Receipt Number:</strong> ${liquidation.receiptNumber}</li>`,
          );
        }
        if (receiptDate) {
          descriptionParts.push(
            `<li><strong>Receipt Date:</strong> ${receiptDate}</li>`,
          );
        }

        // Add vendor details if available
        if (liquidation.vendorName) {
          descriptionParts.push(
            `<li><strong>Vendor:</strong> ${liquidation.vendorName}</li>`,
          );
        }
        if (liquidation.vendorTin) {
          descriptionParts.push(
            `<li><strong>Vendor TIN:</strong> ${liquidation.vendorTin}</li>`,
          );
        }
        if (liquidation.vendorAddress) {
          descriptionParts.push(
            `<li><strong>Vendor Address:</strong> ${liquidation.vendorAddress}</li>`,
          );
        }

        // Add expense details if available
        if (liquidation.expenseCategory) {
          descriptionParts.push(
            `<li><strong>Category:</strong> ${liquidation.expenseCategory}</li>`,
          );
        }
        if (liquidation.businessPurpose) {
          descriptionParts.push(
            `<li><strong>Business Purpose:</strong> ${liquidation.businessPurpose}</li>`,
          );
        }

        // Add tax details if present
        if (formattedVat) {
          descriptionParts.push(
            `<li><strong>VAT:</strong> ${formattedVat}</li>`,
          );
        }
        if (formattedWithholding) {
          descriptionParts.push(
            `<li><strong>Withholding Tax:</strong> ${formattedWithholding}</li>`,
          );
        }

        // Add notes if available
        if (liquidation.description && liquidation.description.trim()) {
          descriptionParts.push(
            `<li><strong>Notes:</strong> ${liquidation.description}</li>`,
          );
        }

        // Add AI extraction info if applicable
        if (liquidation.isAiExtracted && liquidation.totalAIConfidence) {
          descriptionParts.push(
            `<li><em>AI-extracted data (${liquidation.totalAIConfidence}% confidence)</em></li>`,
          );
        }

        descriptionParts.push('</ul>');

        // Add separator and action required
        descriptionParts.push('<hr>');

        // Add stage-specific instruction
        if (stage.description) {
          descriptionParts.push(
            `<p><strong>Action Required:</strong> ${stage.description}</p>`,
          );
        } else {
          // Add default action instruction based on stage
          if (
            stage.key === 'PENDING' ||
            stage.name.toLowerCase().includes('review')
          ) {
            descriptionParts.push(
              '<p><strong>Action Required:</strong> Please review the liquidation details above and approve or reject this request.</p>',
            );
          } else if (stage.name.toLowerCase().includes('approval')) {
            descriptionParts.push(
              '<p><strong>Action Required:</strong> Your approval is required for this liquidation request.</p>',
            );
          } else {
            descriptionParts.push(
              `<p><strong>Action Required:</strong> ${stage.name} is required for this request.</p>`,
            );
          }
        }

        // Join all parts together for HTML content
        description = descriptionParts.join('');
      }
    } else if (sourceModule === 'PURCHASE_REQUEST') {
      const purchaseRequest = await this.prisma.purchaseRequest.findUnique({
        where: { id: parseInt(sourceId) },
      });

      if (purchaseRequest) {
        title = `Review Purchase Request #${purchaseRequest.id}`;
        description = `Purchase request requiring ${stage.name}
Delivery Date: ${purchaseRequest.deliveryDate}
Stage: ${stage.name}`;
      }
    }

    return { title, description };
  }

  /**
   * Calculate due date based on stage configuration
   */
  private calculateDueDate(_stage: WorkflowStage): Date | null {
    // Default to 48 hours from now
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + 48);
    return dueDate;
  }

  /**
   * Get next task order for board lane
   */
  private async getNextTaskOrder(
    boardLaneId: number,
    prismaClient?: any,
  ): Promise<number> {
    const client = prismaClient || this.prisma;
    const lastTask = await client.task.findFirst({
      where: { boardLaneId },
      orderBy: { order: 'desc' },
    });

    return (lastTask?.order || 0) + 1;
  }

  /**
   * Send task notification
   */
  private async sendTaskNotification(
    task: Task,
    assigneeId: string,
    createdById: string,
    sourceModule?: string,
    sourceId?: string,
  ): Promise<void> {
    // Don't send notification to the same person who created it
    if (!assigneeId || assigneeId === createdById) {
      return;
    }

    try {
      let notificationMessage = 'You have been assigned a new task';

      // Customize message for petty cash liquidation
      if (sourceModule === 'petty_cash_liquidation' && sourceId) {
        const liquidation = await this.prisma.pettyCashLiquidation.findUnique({
          where: { id: parseInt(sourceId) },
          select: {
            amount: true,
            requestedBy: {
              select: { firstName: true, lastName: true },
            },
          },
        });

        if (liquidation) {
          const formattedAmount = new Intl.NumberFormat('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(liquidation.amount);
          const requesterName = `${liquidation.requestedBy.firstName} ${liquidation.requestedBy.lastName}`;
          notificationMessage = `New petty cash liquidation approval: ₱${formattedAmount} from ${requesterName}`;
        }
      }

      await this.notificationService.sendNotifications(
        null, // No specific project
        createdById, // Sender is the task creator
        [assigneeId], // Send only to assignee
        notificationMessage,
        notificationTypeReference.TASK_ASSIGNED.key,
        task.id.toString(), // Task ID for opening the dialog when clicked
      );
    } catch (error) {
      console.error('Failed to send task notification:', error);
      // Don't throw - we don't want to fail task creation if notification fails
    }

    // Still emit event for other listeners
    this.eventEmitter.emit('task.assigned', {
      taskId: task.id,
      title: task.title,
      description: task.description,
      assigneeId,
      createdById,
      dueDate: task.dueDate,
    });
  }

  /**
   * Get workflow tasks by instance
   */
  async getTasksByInstance(instanceId: number): Promise<WorkflowTask[]> {
    return this.prisma.workflowTask.findMany({
      where: { instanceId },
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
    });
  }

  /**
   * Get pending workflow tasks for user
   */
  async getPendingTasksForUser(userId: string): Promise<WorkflowTask[]> {
    return this.prisma.workflowTask.findMany({
      where: {
        task: {
          assignedToId: userId,
          isOpen: true,
        },
        completedAt: null,
      },
      include: {
        task: {
          include: {
            boardLane: true,
          },
        },
        stage: true,
        instance: {
          include: {
            workflow: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get tasks for a workflow instance
   */
  async getWorkflowTasks(instanceId: number) {
    return this.prisma.workflowTask.findMany({
      where: { instanceId },
      include: {
        task: {
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            boardLane: true,
          },
        },
        stage: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}

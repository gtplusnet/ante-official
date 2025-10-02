import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import {
  WorkflowInstance,
  WorkflowInstanceStatus,
  Prisma,
} from '@prisma/client';

export interface WorkflowInstanceFilter {
  workflowId?: number;
  sourceModule?: string;
  status?: WorkflowInstanceStatus;
  startedById?: string;
  currentStageId?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface WorkflowInstanceWithDetails extends WorkflowInstance {
  workflow?: any;
  currentStage?: any;
  startedBy?: any;
  history?: any[];
  tasks?: any[];
}

@Injectable()
export class WorkflowInstanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get workflow instance by ID
   */
  async findOne(instanceId: number): Promise<WorkflowInstanceWithDetails> {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        workflow: {
          include: {
            stages: {
              orderBy: { sequence: 'asc' },
            },
            buttonConfigs: true,
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
        startedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        history: {
          include: {
            fromStage: true,
            toStage: true,
            performedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            performedAt: 'desc',
          },
        },
        tasks: {
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
            createdAt: 'desc',
          },
        },
      },
    });

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    return instance;
  }

  /**
   * Get workflow instance by source
   */
  async findBySource(
    sourceModule: string,
    sourceId: string,
  ): Promise<WorkflowInstanceWithDetails | null> {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: {
        sourceModule_sourceId: {
          sourceModule,
          sourceId,
        },
      },
      include: {
        workflow: {
          include: {
            stages: {
              orderBy: { sequence: 'asc' },
            },
            buttonConfigs: true,
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
        startedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        history: {
          include: {
            fromStage: true,
            toStage: true,
            performedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            performedAt: 'desc',
          },
          take: 10, // Limit history for performance
        },
        tasks: {
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
            createdAt: 'desc',
          },
        },
      },
    });

    return instance;
  }

  /**
   * List workflow instances with filters
   */
  async findAll(
    filter: WorkflowInstanceFilter,
    pagination?: { skip?: number; take?: number },
  ): Promise<{ instances: WorkflowInstanceWithDetails[]; total: number }> {
    const where: Prisma.WorkflowInstanceWhereInput = {};

    if (filter.workflowId) {
      where.workflowId = filter.workflowId;
    }
    if (filter.sourceModule) {
      where.sourceModule = filter.sourceModule;
    }
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.startedById) {
      where.startedById = filter.startedById;
    }
    if (filter.currentStageId) {
      where.currentStageId = filter.currentStageId;
    }
    if (filter.startDate || filter.endDate) {
      where.startedAt = {};
      if (filter.startDate) {
        where.startedAt.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.startedAt.lte = filter.endDate;
      }
    }

    const [instances, total] = await Promise.all([
      this.prisma.workflowInstance.findMany({
        where,
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          currentStage: {
            select: {
              id: true,
              name: true,
              key: true,
              color: true,
            },
          },
          startedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          tasks: {
            where: {
              completedAt: null,
            },
            select: {
              id: true,
              taskId: true,
            },
          },
        },
        skip: pagination?.skip,
        take: pagination?.take || 50,
        orderBy: {
          startedAt: 'desc',
        },
      }),
      this.prisma.workflowInstance.count({ where }),
    ]);

    return { instances, total };
  }

  /**
   * Get workflow instance statistics
   */
  async getStatistics(filter?: WorkflowInstanceFilter) {
    const where: Prisma.WorkflowInstanceWhereInput = {};

    if (filter?.workflowId) {
      where.workflowId = filter.workflowId;
    }
    if (filter?.sourceModule) {
      where.sourceModule = filter.sourceModule;
    }
    if (filter?.startedById) {
      where.startedById = filter.startedById;
    }

    const [active, completed, cancelled, suspended, avgCompletionTime] =
      await Promise.all([
        this.prisma.workflowInstance.count({
          where: { ...where, status: WorkflowInstanceStatus.ACTIVE },
        }),
        this.prisma.workflowInstance.count({
          where: { ...where, status: WorkflowInstanceStatus.COMPLETED },
        }),
        this.prisma.workflowInstance.count({
          where: { ...where, status: WorkflowInstanceStatus.CANCELLED },
        }),
        this.prisma.workflowInstance.count({
          where: { ...where, status: WorkflowInstanceStatus.SUSPENDED },
        }),
        this.getAverageCompletionTime(where),
      ]);

    return {
      active,
      completed,
      cancelled,
      suspended,
      total: active + completed + cancelled + suspended,
      avgCompletionTimeHours: avgCompletionTime,
    };
  }

  /**
   * Get average completion time in hours
   */
  private async getAverageCompletionTime(
    where: Prisma.WorkflowInstanceWhereInput,
  ): Promise<number> {
    const completedInstances = await this.prisma.workflowInstance.findMany({
      where: {
        ...where,
        status: WorkflowInstanceStatus.COMPLETED,
        completedAt: { not: null },
      },
      select: {
        startedAt: true,
        completedAt: true,
      },
    });

    if (completedInstances.length === 0) {
      return 0;
    }

    const totalTime = completedInstances.reduce((sum, instance) => {
      if (instance.completedAt) {
        const diff =
          instance.completedAt.getTime() - instance.startedAt.getTime();
        return sum + diff;
      }
      return sum;
    }, 0);

    const avgTime = totalTime / completedInstances.length;
    return Math.round(avgTime / (1000 * 60 * 60)); // Convert to hours
  }

  /**
   * Get workflow instance timeline
   */
  async getTimeline(instanceId: number) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        workflow: {
          include: {
            stages: {
              orderBy: { sequence: 'asc' },
            },
          },
        },
        history: {
          include: {
            fromStage: true,
            toStage: true,
            performedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            performedAt: 'asc',
          },
        },
      },
    });

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    // Build timeline
    const timeline = [];

    // Add workflow start
    timeline.push({
      type: 'start',
      timestamp: instance.startedAt,
      stage: instance.workflow.stages.find((s) => s.isInitial),
      performer: { id: instance.startedById },
      action: 'Workflow Started',
    });

    // Add transitions
    for (const history of instance.history) {
      timeline.push({
        type: 'transition',
        timestamp: history.performedAt,
        fromStage: history.fromStage,
        toStage: history.toStage,
        performer: history.performedBy,
        action: history.action,
        remarks: history.remarks,
      });
    }

    // Add completion if completed
    if (instance.completedAt) {
      timeline.push({
        type: 'end',
        timestamp: instance.completedAt,
        stage: { id: instance.currentStageId },
        status: instance.status,
        action:
          instance.status === WorkflowInstanceStatus.COMPLETED
            ? 'Workflow Completed'
            : 'Workflow Cancelled',
      });
    }

    return timeline;
  }

  /**
   * Suspend workflow instance
   */
  async suspend(
    instanceId: number,
    suspendedById: string,
    reason: string,
  ): Promise<void> {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    if (instance.status !== WorkflowInstanceStatus.ACTIVE) {
      throw new BadRequestException('Can only suspend active workflows');
    }

    await this.prisma.$transaction(async (tx) => {
      // Update instance status
      await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          status: WorkflowInstanceStatus.SUSPENDED,
        },
      });

      // Add history entry
      await tx.workflowHistory.create({
        data: {
          instanceId,
          fromStageId: instance.currentStageId,
          toStageId: instance.currentStageId,
          action: 'WORKFLOW_SUSPENDED',
          performedById: suspendedById,
          remarks: reason,
        },
      });
    });
  }

  /**
   * Resume workflow instance
   */
  async resume(
    instanceId: number,
    resumedById: string,
    reason: string,
  ): Promise<void> {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    if (instance.status !== WorkflowInstanceStatus.SUSPENDED) {
      throw new BadRequestException('Can only resume suspended workflows');
    }

    await this.prisma.$transaction(async (tx) => {
      // Update instance status
      await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          status: WorkflowInstanceStatus.ACTIVE,
        },
      });

      // Add history entry
      await tx.workflowHistory.create({
        data: {
          instanceId,
          fromStageId: instance.currentStageId,
          toStageId: instance.currentStageId,
          action: 'WORKFLOW_RESUMED',
          performedById: resumedById,
          remarks: reason,
        },
      });
    });
  }

  /**
   * Get instances requiring action by user
   */
  async getInstancesRequiringAction(userId: string) {
    // Get instances where user has pending tasks
    const instances = await this.prisma.workflowInstance.findMany({
      where: {
        status: WorkflowInstanceStatus.ACTIVE,
        tasks: {
          some: {
            task: {
              assignedToId: userId,
              isOpen: true,
            },
            completedAt: null,
          },
        },
      },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        currentStage: {
          select: {
            id: true,
            name: true,
            key: true,
            color: true,
          },
        },
        tasks: {
          where: {
            task: {
              assignedToId: userId,
              isOpen: true,
            },
            completedAt: null,
          },
          include: {
            task: {
              select: {
                id: true,
                title: true,
                description: true,
                dueDate: true,
                priorityLevel: true,
              },
            },
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return instances;
  }

  /**
   * Find many workflow instances with pagination
   */
  async findMany(params: {
    workflowId?: number;
    sourceModule?: string;
    status?: WorkflowInstanceStatus;
    startedById?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 10, ...filters } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.WorkflowInstanceWhereInput = {};

    if (filters.workflowId) where.workflowId = filters.workflowId;
    if (filters.sourceModule) where.sourceModule = filters.sourceModule;
    if (filters.status) where.status = filters.status;
    if (filters.startedById) where.startedById = filters.startedById;

    const [instances, total] = await Promise.all([
      this.prisma.workflowInstance.findMany({
        where,
        include: {
          workflow: true,
          currentStage: true,
          startedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.workflowInstance.count({ where }),
    ]);

    return {
      instances,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get user's pending workflow instances
   */
  async getUserPendingInstances(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    // Find instances where user has pending tasks
    const [instances, total] = await Promise.all([
      this.prisma.workflowInstance.findMany({
        where: {
          status: WorkflowInstanceStatus.ACTIVE,
          tasks: {
            some: {
              task: {
                assignedToId: userId,
                isOpen: true,
              },
            },
          },
        },
        include: {
          workflow: true,
          currentStage: true,
          tasks: {
            where: {
              task: {
                assignedToId: userId,
                isOpen: true,
              },
            },
            include: {
              task: true,
              stage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.workflowInstance.count({
        where: {
          status: WorkflowInstanceStatus.ACTIVE,
          tasks: {
            some: {
              task: {
                assignedToId: userId,
                isOpen: true,
              },
            },
          },
        },
      }),
    ]);

    return {
      instances,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get overdue workflow instances
   */
  async getOverdueInstances(companyId: number) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24); // 24 hours ago

    return this.prisma.workflowInstance.findMany({
      where: {
        status: WorkflowInstanceStatus.ACTIVE,
        startedAt: { lt: cutoffDate },
        startedBy: {
          company: {
            id: companyId,
          },
        },
      },
      include: {
        workflow: true,
        currentStage: true,
        startedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tasks: {
          where: {
            completedAt: null,
          },
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
              },
            },
          },
        },
      },
      orderBy: { startedAt: 'asc' },
    });
  }
}

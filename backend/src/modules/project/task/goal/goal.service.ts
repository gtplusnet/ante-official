import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { GoalStatus, Prisma, BoardLaneKeys } from '@prisma/client';
import {
  GoalCreateDto,
  GoalUpdateDto,
  GoalFilterDto,
  GoalLinkTaskDto,
  GoalUnlinkTaskDto,
  GoalLinkMultipleTasksDto,
} from '../../../../dto/goal.validator.dto';

@Injectable()
export class GoalService {
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly utilityService: UtilityService;

  /**
   * Get all goals with filtering by status
   * Goals are company-wide - all employees see all company goals
   */
  async getGoals(filter?: GoalFilterDto) {
    const companyId = this.utilityService.accountInformation.company?.id;

    if (!companyId) {
      throw new BadRequestException('User must belong to a company to access goals');
    }

    const where: Prisma.GoalWhereInput = {
      companyId,
      isDeleted: false,
    };

    // Filter by status if provided
    if (filter?.status) {
      where.status = filter.status;
    }

    // Filter by search term if provided
    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const goals = await this.prisma.goal.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
        tasks: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            title: true,
            boardLane: {
              select: {
                key: true,
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING first, then COMPLETED
        { deadline: 'asc' }, // Closest deadline first
        { createdAt: 'desc' }, // Newest first for same deadline
      ],
    });

    // Calculate progress for each goal
    const goalsWithProgress = goals.map((goal) => {
      const totalTasks = goal.tasks.length;
      const completedTasks = goal.tasks.filter(
        (task) => task.boardLane.key === BoardLaneKeys.DONE,
      ).length;

      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        ...this.formatGoalResponse(goal),
        totalTasks,
        completedTasks,
        progress,
      };
    });

    return goalsWithProgress;
  }

  /**
   * Get a single goal by ID with linked tasks
   * Goals are company-wide - any company member can access
   */
  async getGoalById(id: number) {
    const companyId = this.utilityService.accountInformation.company?.id;

    if (!companyId) {
      throw new BadRequestException('User must belong to a company to access goals');
    }

    const goal = await this.prisma.goal.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
        tasks: {
          where: {
            isDeleted: false,
          },
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                image: true,
              },
            },
            boardLane: {
              select: {
                id: true,
                name: true,
                key: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!goal || goal.isDeleted) {
      throw new NotFoundException('Goal not found');
    }

    // Check company access - must belong to same company
    if (goal.companyId !== companyId) {
      throw new NotFoundException('Goal not found');
    }

    // Calculate progress
    const totalTasks = goal.tasks.length;
    const completedTasks = goal.tasks.filter(
      (task) => task.boardLane.key === BoardLaneKeys.DONE,
    ).length;
    const progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      ...this.formatGoalResponse(goal),
      totalTasks,
      completedTasks,
      progress,
      tasks: goal.tasks.map((task) => this.formatTaskResponse(task)),
    };
  }

  /**
   * Get goal progress data with accurate completion dates
   * Returns daily completion data for chart rendering
   */
  async getGoalProgress(id: number) {
    const companyId = this.utilityService.accountInformation.company?.id;

    if (!companyId) {
      throw new BadRequestException('User must belong to a company to access goals');
    }

    const goal = await this.prisma.goal.findUnique({
      where: { id },
      include: {
        tasks: {
          where: {
            isDeleted: false,
            boardLane: {
              key: BoardLaneKeys.DONE,
            },
            completedAt: {
              not: null,
            },
          },
          select: {
            id: true,
            completedAt: true,
            title: true,
          },
          orderBy: {
            completedAt: 'asc',
          },
        },
      },
    });

    if (!goal || goal.isDeleted) {
      throw new NotFoundException('Goal not found');
    }

    // Check company access - must belong to same company
    if (goal.companyId !== companyId) {
      throw new NotFoundException('Goal not found');
    }

    // Get total tasks (including incomplete ones)
    const totalTasks = await this.prisma.task.count({
      where: {
        goalId: id,
        isDeleted: false,
      },
    });

    // Group completions by date
    const completionsByDate = new Map<string, number>();

    goal.tasks.forEach((task) => {
      if (task.completedAt) {
        const date = new Date(task.completedAt);
        // Normalize to local date string (YYYY-MM-DD)
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        completionsByDate.set(dateKey, (completionsByDate.get(dateKey) || 0) + 1);
      }
    });

    // Build progress array
    const progressData: Array<{
      date: string;
      tasksCompleted: number;
      cumulativeCompleted: number;
    }> = [];

    let cumulative = 0;
    const sortedDates = Array.from(completionsByDate.keys()).sort();

    sortedDates.forEach((date) => {
      const count = completionsByDate.get(date) || 0;
      cumulative += count;
      progressData.push({
        date,
        tasksCompleted: count,
        cumulativeCompleted: cumulative,
      });
    });

    return {
      goalId: goal.id,
      totalTasks,
      completedTasks: goal.tasks.length,
      createdAt: goal.createdAt.toISOString(),
      deadline: goal.deadline ? goal.deadline.toISOString() : null,
      progressData,
    };
  }

  /**
   * Create a new goal
   */
  async createGoal(createDto: GoalCreateDto) {
    const accountId = this.utilityService.accountInformation.id;
    const companyId = this.utilityService.accountInformation.company?.id;

    const goal = await this.prisma.goal.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        deadline: createDto.deadline ? new Date(createDto.deadline) : null,
        createdById: accountId,
        ...(companyId && { companyId }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return this.formatGoalResponse(goal);
  }

  /**
   * Update goal details
   */
  async updateGoal(id: number, updateDto: GoalUpdateDto) {
    const goal = await this.validateGoalAccess(id);

    const updateData: Prisma.GoalUpdateInput = {};

    if (updateDto.name) {
      updateData.name = updateDto.name;
    }

    if (updateDto.description !== undefined) {
      updateData.description = updateDto.description;
    }

    if (updateDto.deadline !== undefined) {
      updateData.deadline = updateDto.deadline
        ? new Date(updateDto.deadline)
        : null;
    }

    if (updateDto.status) {
      updateData.status = updateDto.status;
    }

    const updatedGoal = await this.prisma.goal.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return this.formatGoalResponse(updatedGoal);
  }

  /**
   * Mark goal as completed
   */
  async completeGoal(id: number) {
    await this.validateGoalAccess(id);

    const updatedGoal = await this.prisma.goal.update({
      where: { id },
      data: { status: GoalStatus.COMPLETED },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return this.formatGoalResponse(updatedGoal);
  }

  /**
   * Soft delete a goal (unlinks all tasks)
   */
  async deleteGoal(id: number) {
    await this.validateGoalAccess(id);

    // Unlink all tasks from this goal
    await this.prisma.task.updateMany({
      where: { goalId: id },
      data: { goalId: null },
    });

    // Soft delete the goal
    const deletedGoal = await this.prisma.goal.update({
      where: { id },
      data: { isDeleted: true },
    });

    return { success: true, id: deletedGoal.id };
  }

  /**
   * Link a task to a goal
   */
  async linkTaskToGoal(linkDto: GoalLinkTaskDto) {
    const { goalId, taskId } = linkDto;

    // Validate goal access
    await this.validateGoalAccess(goalId);

    // Check if task exists and user has access
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        goal: true,
      },
    });

    if (!task || task.isDeleted) {
      throw new NotFoundException('Task not found');
    }

    // Check if task already belongs to another goal
    if (task.goalId && task.goalId !== goalId) {
      throw new BadRequestException(
        `Task is already linked to goal: ${task.goal?.name}`,
      );
    }

    // Link task to goal
    await this.prisma.task.update({
      where: { id: taskId },
      data: { goalId },
    });

    // Update goal progress
    await this.updateGoalProgress(goalId);

    return { success: true, message: 'Task linked to goal successfully' };
  }

  /**
   * Link multiple tasks to a goal
   */
  async linkMultipleTasksToGoal(linkDto: GoalLinkMultipleTasksDto) {
    const { goalId, taskIds } = linkDto;

    // Validate goal access
    await this.validateGoalAccess(goalId);

    // Check all tasks exist and none are already linked to other goals
    const tasks = await this.prisma.task.findMany({
      where: {
        id: { in: taskIds },
        isDeleted: false,
      },
      include: {
        goal: true,
      },
    });

    if (tasks.length !== taskIds.length) {
      throw new BadRequestException('One or more tasks not found');
    }

    // Check for tasks already linked to other goals
    const conflictingTasks = tasks.filter(
      (task) => task.goalId && task.goalId !== goalId,
    );

    if (conflictingTasks.length > 0) {
      const conflictNames = conflictingTasks
        .map((task) => `"${task.title}" (linked to ${task.goal?.name})`)
        .join(', ');
      throw new BadRequestException(
        `The following tasks are already linked to other goals: ${conflictNames}`,
      );
    }

    // Link all tasks to goal
    await this.prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { goalId },
    });

    // Update goal progress
    await this.updateGoalProgress(goalId);

    return {
      success: true,
      message: `${taskIds.length} task(s) linked to goal successfully`,
    };
  }

  /**
   * Unlink a task from its goal
   */
  async unlinkTaskFromGoal(unlinkDto: GoalUnlinkTaskDto) {
    const { taskId } = unlinkDto;

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { goalId: true },
    });

    if (!task || !task.goalId) {
      throw new BadRequestException('Task is not linked to any goal');
    }

    const goalId = task.goalId;

    // Unlink task
    await this.prisma.task.update({
      where: { id: taskId },
      data: { goalId: null },
    });

    // Update goal progress
    await this.updateGoalProgress(goalId);

    return { success: true, message: 'Task unlinked from goal successfully' };
  }

  /**
   * Update goal progress based on linked tasks
   */
  private async updateGoalProgress(goalId: number) {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        tasks: {
          where: { isDeleted: false },
          include: {
            boardLane: {
              select: { key: true },
            },
          },
        },
      },
    });

    if (!goal) return;

    const totalTasks = goal.tasks.length;
    const completedTasks = goal.tasks.filter(
      (task) => task.boardLane.key === BoardLaneKeys.DONE,
    ).length;

    const progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    await this.prisma.goal.update({
      where: { id: goalId },
      data: { progress },
    });
  }

  /**
   * Validate that user has access to the goal
   * Goals are company-wide - any company member can access/modify
   */
  private async validateGoalAccess(goalId: number) {
    const companyId = this.utilityService.accountInformation.company?.id;

    if (!companyId) {
      throw new BadRequestException('User must belong to a company to access goals');
    }

    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal || goal.isDeleted) {
      throw new NotFoundException('Goal not found');
    }

    // Check company access - must belong to same company
    if (goal.companyId !== companyId) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  /**
   * Format goal response
   */
  private formatGoalResponse(goal: any) {
    return {
      id: goal.id,
      name: goal.name,
      description: goal.description,
      deadline: goal.deadline
        ? this.utilityService.formatDate(goal.deadline)
        : null,
      status: goal.status,
      progress: goal.progress,
      createdAt: this.utilityService.formatDate(goal.createdAt),
      updatedAt: this.utilityService.formatDate(goal.updatedAt),
      createdBy: goal.createdBy
        ? {
            id: goal.createdBy.id,
            firstName: goal.createdBy.firstName,
            lastName: goal.createdBy.lastName,
            email: goal.createdBy.email,
            image: goal.createdBy.image,
          }
        : null,
    };
  }

  /**
   * Format task response
   */
  private formatTaskResponse(task: any) {
    return {
      id: task.id,
      title: task.title,
      assignedTo: task.assignedTo
        ? {
            id: task.assignedTo.id,
            firstName: task.assignedTo.firstName,
            lastName: task.assignedTo.lastName,
            image: task.assignedTo.image,
          }
        : null,
      boardLane: task.boardLane
        ? {
            id: task.boardLane.id,
            name: task.boardLane.name,
            key: task.boardLane.key,
          }
        : null,
      project: task.project
        ? {
            id: task.project.id,
            name: task.project.name,
          }
        : null,
      dueDate: task.dueDate ? this.utilityService.formatDate(task.dueDate) : null,
      createdAt: this.utilityService.formatDate(task.createdAt),
      updatedAt: this.utilityService.formatDate(task.updatedAt),
    };
  }
}

import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { StartTimerDto } from './dto/start-timer.dto';
import { StopTimerDto } from './dto/stop-timer.dto';
import { GetHistoryDto } from './dto/get-history.dto';
import { CreateTaskAndStartDto } from './dto/create-task-and-start.dto';
import { TagTimerDto } from './dto/tag-timer.dto';
import { 
  CurrentTimerResponse, 
  TimeHistoryResponse, 
  DailySummaryResponse 
} from './interfaces/time-tracking.interface';
import { EmployeeTimekeepingRaw, Prisma, Task, BoardLaneKeys } from '@prisma/client';

@Injectable()
export class TimeTrackingService {
  @Inject() private readonly utilityService: UtilityService;
  
  constructor(private readonly prisma: PrismaService) {}

  async startTimer(
    accountId: string,
    dto: StartTimerDto,
    timeInIpAddress?: string
  ): Promise<EmployeeTimekeepingRaw> {
    // If taskId is provided, verify task exists and belongs to the user
    let task = null;
    if (dto.taskId) {
      task = await this.prisma.task.findFirst({
        where: {
          id: dto.taskId,
          assignedToId: accountId,
          taskType: { not: 'APPROVAL' },
        },
        include: {
          project: true,
          boardLane: true,
        },
      });

      if (!task) {
        throw new NotFoundException('Task not found or not assigned to you');
      }
    }

    // Check if there's already a running timer
    const existingTimer = await this.getCurrentTimer(accountId);

    // Use transaction to ensure consistency
    return this.prisma.$transaction(async (prisma) => {
      // If there's an existing timer for a different task, stop it first
      if (existingTimer) {
        // If it's the same task, just return error
        if (dto.taskId && existingTimer.taskId === dto.taskId) {
          throw new BadRequestException('Timer is already running for this task');
        }

        // Stop the existing timer
        const timeOut = new Date();
        const timeIn = new Date(existingTimer.timeIn);
        const timeSpan = (timeOut.getTime() - timeIn.getTime()) / 1000 / 60; // Convert to minutes

        await prisma.employeeTimekeepingRaw.update({
          where: { id: existingTimer.id },
          data: {
            timeOut,
            timeSpan,
          },
        });
      }

      // Move task to IN_PROGRESS if task is provided and not already there
      if (task && task.boardLane.key !== BoardLaneKeys.IN_PROGRESS) {
        // Get IN_PROGRESS board lane
        const inProgressLane = await prisma.boardLane.findFirst({
          where: { key: BoardLaneKeys.IN_PROGRESS },
        });

        if (!inProgressLane) {
          throw new BadRequestException('IN_PROGRESS board lane not found');
        }

        // Update task to IN_PROGRESS
        await prisma.task.update({
          where: { id: task.id },
          data: { boardLaneId: inProgressLane.id },
        });
      }

      // Create the time entry with TIME-IN geolocation
      return prisma.employeeTimekeepingRaw.create({
        data: {
          accountId,
          timeIn: new Date(),
          timeOut: new Date(), // Will be updated when stopped
          timeSpan: 0,
          source: 'TIMER',
          taskId: task?.id || null,
          taskTitle: task?.title || 'Manual Entry',
          projectId: task?.projectId || null,
          // TIME-IN GEOLOCATION FIELDS
          timeInLatitude: dto.timeInLatitude,
          timeInLongitude: dto.timeInLongitude,
          timeInLocation: dto.timeInLocation,
          timeInIpAddress: timeInIpAddress,
          timeInGeolocationEnabled: dto.timeInGeolocationEnabled,
        },
        include: {
          task: {
            include: {
              project: true,
            },
          },
          project: true,
        },
      });
    });
  }

  async stopTimer(
    accountId: string,
    dto: StopTimerDto,
    timeOutIpAddress?: string
  ): Promise<EmployeeTimekeepingRaw> {
    // Find the current running timer
    const currentTimer = await this.getCurrentTimer(accountId);
    if (!currentTimer) {
      throw new NotFoundException('No running timer found');
    }

    const timeOut = dto.timeOut ? new Date(dto.timeOut) : new Date();
    const timeIn = new Date(currentTimer.timeIn);
    const timeSpan = (timeOut.getTime() - timeIn.getTime()) / 1000 / 60; // Convert to minutes

    // Update the timer with TIME-OUT geolocation
    return this.prisma.employeeTimekeepingRaw.update({
      where: { id: currentTimer.id },
      data: {
        timeOut,
        timeSpan,
        // TIME-OUT GEOLOCATION FIELDS
        timeOutLatitude: dto.timeOutLatitude,
        timeOutLongitude: dto.timeOutLongitude,
        timeOutLocation: dto.timeOutLocation,
        timeOutIpAddress: timeOutIpAddress,
        timeOutGeolocationEnabled: dto.timeOutGeolocationEnabled,
      },
      include: {
        task: {
          include: {
            project: true,
          },
        },
        project: true,
      },
    });
  }

  async getCurrentTimer(accountId: string): Promise<CurrentTimerResponse | null> {
    // Find timer entries from today where timeIn equals timeOut (not stopped)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timer = await this.prisma.employeeTimekeepingRaw.findFirst({
      where: {
        accountId,
        source: 'TIMER',
        timeIn: {
          gte: today,
        },
        // When timer is running, timeIn equals timeOut
        AND: {
          timeSpan: 0,
        },
      },
      include: {
        task: {
          include: {
            project: true,
          },
        },
      },
      orderBy: {
        timeIn: 'desc',
      },
    });

    if (!timer) {
      return null;
    }

    // Calculate elapsed seconds
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - new Date(timer.timeIn).getTime()) / 1000);

    return {
      id: timer.id,
      taskId: timer.taskId,
      taskTitle: timer.taskTitle,
      timeIn: timer.timeIn,
      elapsedSeconds,
      task: timer.task,
      // Include TIME-IN geolocation
      timeInLatitude: timer.timeInLatitude,
      timeInLongitude: timer.timeInLongitude,
      timeInLocation: timer.timeInLocation,
      timeInIpAddress: timer.timeInIpAddress,
      timeInGeolocationEnabled: timer.timeInGeolocationEnabled,
    };
  }

  async getHistory(accountId: string, dto: GetHistoryDto): Promise<TimeHistoryResponse> {
    const { page = 1, limit = 20, startDate, endDate, source, taskId, projectId } = dto;

    const where: Prisma.EmployeeTimekeepingRawWhereInput = {
      accountId,
    };

    if (startDate || endDate) {
      where.timeIn = {};
      if (startDate) {
        where.timeIn.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.timeIn.lte = end;
      }
    }

    if (source) {
      where.source = source;
    }

    if (taskId) {
      where.taskId = taskId;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    const [items, total] = await Promise.all([
      this.prisma.employeeTimekeepingRaw.findMany({
        where,
        include: {
          task: {
            include: {
              project: true,
            },
          },
          project: true,
        },
        orderBy: {
          timeIn: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.employeeTimekeepingRaw.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDailySummary(accountId: string, date?: string): Promise<DailySummaryResponse> {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const entries = await this.prisma.employeeTimekeepingRaw.findMany({
      where: {
        accountId,
        timeIn: {
          gte: targetDate,
          lt: nextDay,
        },
      },
      include: {
        task: {
          include: {
            project: true,
          },
        },
        project: true,
      },
      orderBy: {
        timeIn: 'asc',
      },
    });

    const totalMinutes = entries.reduce((sum, entry) => sum + (entry.timeSpan || 0), 0);

    return {
      date: targetDate,
      totalMinutes,
      entries,
    };
  }

  async getTimerTasks(accountId: string) {
    return this.prisma.task.findMany({
      where: {
        assignedToId: accountId,
        taskType: { not: 'APPROVAL' },
        isOpen: true,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        boardLane: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
      },
      orderBy: [
        { priorityLevel: 'desc' },
        { updatedAt: 'desc' },
      ],
    });
  }

  async createTaskAndStart(
    accountId: string,
    dto: CreateTaskAndStartDto,
    timeInIpAddress?: string
  ): Promise<{
    task: Task;
    timer: EmployeeTimekeepingRaw;
  }> {
    // Check if there's already a running timer
    const existingTimer = await this.getCurrentTimer(accountId);

    // Get IN_PROGRESS board lane (tasks with timers should start in progress)
    const inProgressLane = await this.prisma.boardLane.findFirst({
      where: {
        key: BoardLaneKeys.IN_PROGRESS,
      },
    });

    if (!inProgressLane) {
      throw new BadRequestException('IN_PROGRESS board lane not found');
    }

    // Create the task in a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // If there's an existing timer, stop it first
      if (existingTimer) {
        const timeOut = new Date();
        const timeIn = new Date(existingTimer.timeIn);
        const timeSpan = (timeOut.getTime() - timeIn.getTime()) / 1000 / 60; // Convert to minutes
        
        await prisma.employeeTimekeepingRaw.update({
          where: { id: existingTimer.id },
          data: {
            timeOut,
            timeSpan,
          },
        });
      }
      
      // Create the task directly in IN_PROGRESS
      const companyId = this.utilityService.accountInformation.company?.id;
      const task = await prisma.task.create({
        data: {
          title: dto.title,
          description: dto.description || '',
          projectId: dto.projectId || null,
          boardLaneId: inProgressLane.id,  // Create directly in IN_PROGRESS
          assignedToId: accountId,
          createdById: accountId,
          updatedById: accountId,
          isSelfAssigned: true,
          order: 0,
          priorityLevel: 1,
          taskType: 'NORMAL',
          isOpen: true,
          ...(companyId && { companyId }),
        },
        include: {
          project: true,
          boardLane: true,
        },
      });

      // Start the timer with TIME-IN geolocation
      const timer = await prisma.employeeTimekeepingRaw.create({
        data: {
          accountId,
          timeIn: new Date(),
          timeOut: new Date(), // Will be updated when stopped
          timeSpan: 0,
          source: 'TIMER',
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId,
          // TIME-IN GEOLOCATION FIELDS
          timeInLatitude: dto.timeInLatitude,
          timeInLongitude: dto.timeInLongitude,
          timeInLocation: dto.timeInLocation,
          timeInIpAddress: timeInIpAddress,
          timeInGeolocationEnabled: dto.timeInGeolocationEnabled,
        },
        include: {
          task: {
            include: {
              project: true,
            },
          },
          project: true,
        },
      });

      return { task, timer };
    });

    return result;
  }

  async getTaskSummary(
    accountId: string,
    taskId: number,
    date?: string,
    currentSessionSeconds?: number // Pass current session to avoid recursion
  ): Promise<{ totalMinutes: number; totalSeconds: number; currentSessionSeconds: number }> {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get all completed time entries for this task today
    const completedEntries = await this.prisma.employeeTimekeepingRaw.findMany({
      where: {
        accountId,
        taskId,
        timeIn: {
          gte: targetDate,
          lt: nextDay,
        },
        timeSpan: {
          gt: 0, // Only completed entries
        },
      },
    });

    // Use provided current session seconds (to avoid recursion)
    const sessionSeconds = currentSessionSeconds || 0;

    // Calculate total minutes from completed entries
    const completedMinutes = completedEntries.reduce((sum, entry) => sum + (entry.timeSpan || 0), 0);

    // Total includes completed + current session
    const totalMinutes = completedMinutes + (sessionSeconds / 60);
    const totalSeconds = (completedMinutes * 60) + sessionSeconds;

    return {
      totalMinutes,
      totalSeconds,
      currentSessionSeconds: sessionSeconds,
    };
  }

  async tagTimerWithTask(
    accountId: string,
    dto: TagTimerDto
  ): Promise<EmployeeTimekeepingRaw> {
    // Get the current running timer
    const currentTimer = await this.getCurrentTimer(accountId);
    if (!currentTimer) {
      throw new NotFoundException('No running timer found');
    }

    // Verify task exists and belongs to the user
    const task = await this.prisma.task.findFirst({
      where: {
        id: dto.taskId,
        assignedToId: accountId,
        taskType: { not: 'APPROVAL' },
      },
      include: {
        project: true,
        boardLane: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found or not assigned to you');
    }

    // Use transaction to ensure consistency
    return this.prisma.$transaction(async (prisma) => {
      // Move task to IN_PROGRESS if not already there
      if (task.boardLane.key !== BoardLaneKeys.IN_PROGRESS) {
        const inProgressLane = await prisma.boardLane.findFirst({
          where: { key: BoardLaneKeys.IN_PROGRESS },
        });

        if (!inProgressLane) {
          throw new BadRequestException('IN_PROGRESS board lane not found');
        }

        await prisma.task.update({
          where: { id: task.id },
          data: { boardLaneId: inProgressLane.id },
        });
      }

      // Update the timer with task information
      return prisma.employeeTimekeepingRaw.update({
        where: { id: currentTimer.id },
        data: {
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId,
        },
        include: {
          task: {
            include: {
              project: true,
            },
          },
          project: true,
        },
      });
    });
  }
}
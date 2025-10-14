import { BoardLaneService } from '@modules/project/board/board-lane/board-lane.service';
import { NotificationService } from '@modules/communication/notification/notification/notification.service';
import { ProjectService } from '@modules/project/project/project/project.service';
import { SocketService } from '@modules/communication/socket/socket/socket.service';
import { DiscussionService } from '@modules/communication/discussion/discussion/discussion.service';
import { TaskAssignMode, TaskWatcherType } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DISCUSSION_EVENTS } from '../../../../shared/events/discussion.events';
import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, BoardLaneKeys } from '@prisma/client';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import {
  TaskAssignToIdDto,
  TaskCreateDto,
  TaskDeleteDto,
  TaskFilterDto,
  TaskIdDto,
  TaskUpdateDto,
  TaskWatcherDto,
  TaskStatus,
  ClaimTaskParamsDto,
  AssignTaskParamsDto,
  AddWatcherDTO,
} from '../../../../dto/task.validator.dto';
import { CustomWsException } from '../../../../filters/custom-ws.exception';
import {
  CombinedTaskResponseInterface,
  TaskCountByStatusResponseInterface,
  TaskInterface,
  TaskListResponseInterface,
} from '../../../../shared/response/task.response';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import notificationTypeReference from '../../../../reference/notification-type.reference';
import taskPriorityReference from '../../../../reference/task-priority.reference';
import taskDifficultyReference from '../../../../reference/task-difficulty.reference';
import boardLaneReference from '../../../../reference/board-lane.reference';
import { UserOrgService } from '@modules/user/user-org/user-org.service';
import watcherTypeReference from '../../../../reference/watcher-type.reference';

@Injectable()
export class TaskService {
  @Inject() public utilityService: UtilityService;
  @Inject() public prisma: PrismaService;
  @Inject() public socketService: SocketService;
  @Inject() public projectService: ProjectService;
  @Inject() public boardLaneService: BoardLaneService;
  @Inject() public notificationService: NotificationService;
  @Inject() public userOrgService: UserOrgService;
  @Inject() public discussionService: DiscussionService;
  @Inject() private eventEmitter: EventEmitter2;

  async getTaskCountByStatus(): Promise<TaskCountByStatusResponseInterface> {
    const companyId = this.utilityService.accountInformation.company?.id;

    const activeTaskCount = await this.prisma.task.count({
      where: {
        isDeleted: false,
        assignedToId: this.utilityService.accountInformation.id,
        ...(companyId && { companyId }),
        boardLane: { key: { not: BoardLaneKeys.DONE } },
      },
    });

    const assignedTaskCount = await this.prisma.task.count({
      where: {
        isDeleted: false,
        createdById: this.utilityService.accountInformation.id,
        ...(companyId && { companyId }),
        isSelfAssigned: false,
        isOpen: true,
      },
    });

    const completedTaskCount = await this.prisma.task.count({
      where: {
        isDeleted: false,
        assignedToId: this.utilityService.accountInformation.id,
        ...(companyId && { companyId }),
        boardLane: { key: BoardLaneKeys.DONE },
      },
    });

    return {
      activeTaskCount,
      assignedTaskCount,
      completedTaskCount,
    };
  }

  /**
   * Get dashboard tasks for TaskWidget
   * Supports three tabs: active, assigned, approvals
   * Includes counts for all tabs (for badges)
   */
  async getDashboardTasks(tab: 'active' | 'assigned' | 'approvals', search?: string) {
    const userId = this.utilityService.accountInformation.id;
    const companyId = this.utilityService.accountInformation.company?.id;

    // Base where conditions
    const baseWhere: Prisma.TaskWhereInput = {
      isDeleted: false,
      ...(companyId && { companyId }),
    };

    // Tab-specific filters
    let tabWhere: Prisma.TaskWhereInput = {};

    switch (tab) {
      case 'active':
        tabWhere = {
          assignedToId: userId,
          taskType: 'NORMAL',
          boardLane: { key: { not: BoardLaneKeys.DONE } },
        };
        break;

      case 'assigned':
        tabWhere = {
          createdById: userId,
          isSelfAssigned: false,
          isOpen: true,
          taskType: 'NORMAL',
        };
        break;

      case 'approvals':
        tabWhere = {
          assignedToId: userId,
          taskType: 'APPROVAL',
          boardLane: { key: { not: BoardLaneKeys.DONE } },
        };
        break;
    }

    // Search filter
    const searchWhere: Prisma.TaskWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // Combine all filters
    const where: Prisma.TaskWhereInput = {
      ...baseWhere,
      ...tabWhere,
      ...searchWhere,
    };

    // Fetch tasks with all relations
    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            image: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        company: {
          select: {
            id: true,
            companyName: true,
          },
        },
        boardLane: {
          select: {
            id: true,
            name: true,
            key: true,
            order: true,
          },
        },
        ApprovalMetadata: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get counts for all tabs (for badges) - run in parallel
    const [activeCount, assignedCount, approvalsCount] = await Promise.all([
      this.prisma.task.count({
        where: {
          ...baseWhere,
          assignedToId: userId,
          taskType: 'NORMAL',
          boardLane: { key: { not: BoardLaneKeys.DONE } },
        },
      }),
      this.prisma.task.count({
        where: {
          ...baseWhere,
          createdById: userId,
          isSelfAssigned: false,
          isOpen: true,
          taskType: 'NORMAL',
        },
      }),
      this.prisma.task.count({
        where: {
          ...baseWhere,
          assignedToId: userId,
          taskType: 'APPROVAL',
          boardLane: { key: { not: BoardLaneKeys.DONE } },
        },
      }),
    ]);

    // Format tasks
    const formattedTasks = tasks.map((task) => this.formatTaskResponse(task));

    return {
      tasks: formattedTasks,
      counts: {
        active: activeCount,
        assigned: assignedCount,
        approvals: approvalsCount,
      },
    };
  }

  async removeWatcher(params: AddWatcherDTO) {
    const taskInformation = await this.#getTaskInformation(params.taskId);
    const accountInformation = await this.prisma.account.findUnique({
      where: { id: params.accountId },
    });

    if (!taskInformation) {
      throw new NotFoundException('Task Id not found');
    }

    if (!accountInformation) {
      throw new NotFoundException('Account Id not found');
    }

    // check if already a watcher
    const watcher = await this.prisma.taskWatcher.findFirst({
      where: {
        taskId: params.taskId,
        accountId: params.accountId,
      },
    });

    if (!watcher) {
      throw new HttpException(
        'Account is not a watcher',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.taskWatcher.delete({
      where: {
        taskId_accountId: {
          taskId: params.taskId,
          accountId: params.accountId,
        },
      },
    });

    const responseTaskInformation = this.formatTaskResponse(taskInformation);

    return responseTaskInformation;
  }
  async addWatcher(params: AddWatcherDTO) {
    const taskInformation = await this.#getTaskInformation(params.taskId);
    const accountInformation = await this.prisma.account.findUnique({
      where: { id: params.accountId },
    });

    if (!taskInformation) {
      throw new NotFoundException('Task Id not found');
    }

    if (!accountInformation) {
      throw new NotFoundException('Account Id not found');
    }

    // check if already a watcher
    const watcher = await this.prisma.taskWatcher.findFirst({
      where: {
        taskId: params.taskId,
        accountId: params.accountId,
      },
    });

    if (watcher) {
      throw new HttpException(
        'Account is already a watcher',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.addToTaskWatcher({
      taskId: params.taskId,
      accountIds: [params.accountId],
      watcherType: TaskWatcherType.WATCHER,
    });
    const responseTaskInformation = this.formatTaskResponse(taskInformation);

    return responseTaskInformation;
  }
  async getTaskUsers() {
    let list;

    // Get companyId for filtering (multi-tenant isolation)
    const companyId = this.utilityService.accountInformation.company?.id;

    if (this.utilityService.accountInformation.role.level === 0) {
      // Admin users - fetch all accounts filtered by company
      list = await this.prisma.account.findMany({
        where: {
          isDeleted: false,
          ...(companyId && { companyId })  // Filter by company if available
        },
      });
    } else {
      // Non-admin users - fetch child accounts from org hierarchy
      list = await this.userOrgService.getListOfChildAccount(
        this.utilityService.accountInformation.id,
        [],
        new Set(),
      );

      // Additional safety: filter child accounts by company
      if (companyId) {
        list = list.filter(account => account.companyId === companyId);
      }
    }

    const response = list.map((account) => this.formatAccountResponse(account));

    await Promise.all(
      response.map(async (user) => {
        const taskList = await this.prisma.task.findMany({
          where: {
            assignedToId: user.id,
            isDeleted: false,
            ...(companyId && { companyId }),
          },
          select: {
            assignedByDifficultySet: true,
            assignedToDifficultySet: true,
          },
        });

        user['taskCount'] = taskList.length;
        user['totalDifficultyBy'] = taskList.reduce(
          (total, task) => total + task.assignedByDifficultySet,
          0,
        );
        user['totalDifficultyTo'] = taskList.reduce(
          (total, task) => total + task.assignedToDifficultySet,
          0,
        );
      }),
    );

    // sort by taskCount
    response.sort((a, b) => b.taskCount - a.taskCount);

    return this.formatResponse(response);
  }

  async acceptTask(taskId: number) {
    const taskInformation = await this.#getTaskInformation(taskId);
    await this.prisma.task.update({
      where: { id: taskId },
      data: { isOpen: false },
    });
    return this.formatTaskResponse(taskInformation);
  }

  async rejectTask(taskId: number) {
    return await this.moveTask({ id: taskId }, BoardLaneKeys.IN_PROGRESS);
  }

  async getTaskInformation(id: number) {
    id = Number(id);

    // Validate input
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid task ID provided');
    }

    try {
      const taskInformation = await this.#getTaskInformation(id);
      const permissions = await this.#getTaskPermission(id);

      // Use imported references
      const taskPriorityRef = taskPriorityReference;
      const taskDifficultyRef = taskDifficultyReference;

      // For HR_FILING approval tasks, fetch fresh filing data
      let approvalMetadata = taskInformation.ApprovalMetadata;
      if (
        taskInformation.taskType === 'APPROVAL' &&
        approvalMetadata?.sourceModule === 'HR_FILING' &&
        approvalMetadata?.sourceData &&
        typeof approvalMetadata.sourceData === 'object' &&
        'filingId' in approvalMetadata.sourceData
      ) {
        try {
          // Fetch the current filing data
          const sourceData = approvalMetadata.sourceData as any;
          const filing = await this.prisma.payrollFiling.findUnique({
            where: { id: sourceData.filingId },
            include: {
              file: {
                select: {
                  id: true,
                  name: true,
                  url: true,
                },
              },
            },
          });

          if (filing) {
            // Extract JSON data for specific filing types
            const shiftData = (filing.shiftData as any) || {};
            const leaveData = (filing.leaveData as any) || {};

            // Create enriched approval metadata with fresh filing data
            approvalMetadata = {
              ...approvalMetadata,
              sourceData: {
                ...sourceData,
                // Add fresh data from filing
                date: filing.date,
                timeIn: filing.timeIn,
                timeOut: filing.timeOut,
                hours: filing.hours,
                remarks: filing.remarks,
                fileId: filing.fileId,
                fileName: filing.file?.name,
                shiftData: filing.shiftData,
                status: filing.status,
                rejectReason: filing.rejectReason,
                // Add fields from JSON data
                originalTimeIn: shiftData.originalTimeIn,
                originalTimeOut: shiftData.originalTimeOut,
                adjustmentType: shiftData.adjustmentType,
                destination: shiftData.destination || leaveData.destination,
                purpose: shiftData.purpose || leaveData.purpose,
                eventName: leaveData.eventName,
                venue: leaveData.venue,
                certificatePurpose: leaveData.certificatePurpose,
              },
            };
          }
        } catch (error) {
          console.warn(
            'Failed to fetch fresh filing data for task:',
            id,
            error,
          );
        }
      }

      // Format response directly without using formatData
      return {
        id: taskInformation.id,
        title: taskInformation.title,
        description: taskInformation.description,
        order: taskInformation.order,
        createdAt: this.utilityService.formatDate(taskInformation.createdAt),
        updatedAt: this.utilityService.formatDate(taskInformation.updatedAt),
        assignedTo: taskInformation.assignedTo
          ? this.formatAccountResponse(taskInformation.assignedTo)
          : null,
        createdBy: taskInformation.createdBy
          ? this.formatAccountResponse(taskInformation.createdBy)
          : null,
        boardLane: taskInformation.boardLane
          ? this.formatBoardLaneResponse(taskInformation.boardLane)
          : null,
        project: taskInformation.project
          ? this.formatProjectResponse(taskInformation.project)
          : null,
        dueDate: taskInformation.dueDate
          ? this.utilityService.formatDate(taskInformation.dueDate)
          : null,
        isRead: taskInformation.isRead,
        priorityLevel:
          taskPriorityRef.find(
            (ref) => ref.key === taskInformation.priorityLevel,
          ) || taskPriorityRef[0],
        roleGroup: null, // Task doesn't have direct roleGroup relation, only roleGroupdId
        assignedByDifficultySet:
          taskDifficultyRef.find(
            (ref) => ref.key === taskInformation.assignedByDifficultySet,
          ) || taskDifficultyRef[0],
        assignedToDifficultySet:
          taskDifficultyRef.find(
            (ref) => ref.key === taskInformation.assignedToDifficultySet,
          ) || taskDifficultyRef[0],
        isOpen: taskInformation.isOpen,
        taskType: taskInformation.taskType,
        approvalMetadata: approvalMetadata,
        permissions,
        // Add workflow fields with null safety
        WorkflowTask: taskInformation.WorkflowTask
          ? {
              id: taskInformation.WorkflowTask.id,
              instanceId: taskInformation.WorkflowTask.instanceId,
              stageId: taskInformation.WorkflowTask.stageId,
              taskId: taskInformation.WorkflowTask.taskId,
              instance: taskInformation.WorkflowTask.instance
                ? {
                    id: taskInformation.WorkflowTask.instance.id,
                    sourceModule:
                      taskInformation.WorkflowTask.instance.sourceModule,
                    sourceId: taskInformation.WorkflowTask.instance.sourceId,
                    status: taskInformation.WorkflowTask.instance.status,
                    currentStageId:
                      taskInformation.WorkflowTask.instance.currentStageId,
                    metadata: taskInformation.WorkflowTask.instance.metadata,
                    createdAt: this.utilityService.formatDate(
                      taskInformation.WorkflowTask.instance.createdAt,
                    ),
                    updatedAt: this.utilityService.formatDate(
                      taskInformation.WorkflowTask.instance.updatedAt,
                    ),
                  }
                : null,
              stage: taskInformation.WorkflowTask.stage
                ? {
                    id: taskInformation.WorkflowTask.stage.id,
                    key: taskInformation.WorkflowTask.stage.key,
                    name: taskInformation.WorkflowTask.stage.name,
                    description: taskInformation.WorkflowTask.stage.description,
                    color: taskInformation.WorkflowTask.stage.color,
                    textColor: taskInformation.WorkflowTask.stage.textColor,
                    isInitial: taskInformation.WorkflowTask.stage.isInitial,
                    isFinal: taskInformation.WorkflowTask.stage.isFinal,
                    sequence: taskInformation.WorkflowTask.stage.sequence,
                  }
                : null,
              createdAt: this.utilityService.formatDate(
                taskInformation.WorkflowTask.createdAt,
              ),
              completedAt: taskInformation.WorkflowTask.completedAt
                ? this.utilityService.formatDate(
                    taskInformation.WorkflowTask.completedAt,
                  )
                : null,
            }
          : null,
        workflowInstanceId: taskInformation.WorkflowTask?.instanceId || null,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error fetching task information:', error);
      throw new HttpException(
        'Failed to retrieve task information',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async getCollaborators(taskId: number) {
    taskId = Number(taskId);

    // check if task id is provided
    if (!taskId) {
      throw new NotFoundException('Task ID not found');
    }

    const taskWatchers = await this.prisma.taskWatcher.findMany({
      where: {
        taskId,
      },
      select: {
        watcherType: true,
        account: {
          include: {
            role: {
              include: {
                roleGroup: true,
              },
            },
          },
        },
      },
    });

    const reponseAccounts = taskWatchers.map((watcher) => {
      const response = watcher.account;
      response['watcherType'] = watcher.watcherType;
      return response;
    });

    const formattedWatchers = reponseAccounts.map((account) =>
      this.formatAccountResponse(account),
    );

    return this.formatResponse(formattedWatchers);
  }
  async assignTask(assignTaskParams: AssignTaskParamsDto) {
    const { taskId, assignedToId } = assignTaskParams;

    // Verify task exists
    const taskInformation = await this.#getTaskInformation(taskId);
    if (!taskInformation) {
      throw new NotFoundException('Task not found');
    }

    // If no assignee provided, remove assignment
    if (!assignedToId) {
      return await this.prisma.task.update({
        where: { id: taskId },
        data: {
          assignedToId: null,
          assignMode: 'OTHER'
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true
            }
          }
        }
      });
    }

    // Verify assignee exists
    const assigneeInformation = await this.prisma.account.findUnique({
      where: { id: assignedToId },
    });

    if (!assigneeInformation) {
      throw new NotFoundException('Assignee not found');
    }

    // Update task with new assignee (allow reassignment)
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: assignedToId,
        assignMode: 'OTHER'
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    // Handle task watchers if needed
    if (taskInformation.assignedToId !== assignedToId) {
      // Remove old assignee as watcher if they exist
      if (taskInformation.assignedToId) {
        await this.prisma.taskWatcher.deleteMany({
          where: {
            taskId: taskId,
            accountId: taskInformation.assignedToId,
            watcherType: 'ASSIGNEE'
          }
        });
      }

      // Add new assignee as watcher
      await this.prisma.taskWatcher.create({
        data: {
          taskId: taskId,
          accountId: assignedToId,
          watcherType: 'ASSIGNEE'
        }
      }).catch(() => {
        // Ignore if watcher already exists
      });
    }

    return updatedTask;
  }
  async claimTask(assignTaskParams: ClaimTaskParamsDto) {
    const taskInformation = await this.#getTaskInformation(
      assignTaskParams.taskId,
    );

    if (!taskInformation) {
      throw new NotFoundException('Task Id not found');
    }

    if (taskInformation.assignedToId) {
      throw new HttpException(
        'Task is already assigned',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      taskInformation.createdById === this.utilityService.accountInformation.id
    ) {
      throw new HttpException(
        `You can't claim a task that you have created.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.#assignTask(
      assignTaskParams.taskId,
      this.utilityService.accountInformation.id,
    );
  }

  async getTaskByLoggedInUser(taskFilter: TaskFilterDto) {
    const accountId = this.utilityService.accountInformation.id;
    const companyId = this.utilityService.accountInformation.company?.id;

    // add default sort by
    if (!taskFilter.sortBy) {
      taskFilter.sortBy = 'createdAt';
    }

    // sort by mapping
    const sortByMapping = {
      title: 'title',
      createdAt: 'createdAt',
      dueDate: 'dueDate',
      priority: 'priorityLevel',
      difficulty: 'assignedToDifficultySet',
    };

    // check if sort by value is valid
    if (!sortByMapping[taskFilter.sortBy]) {
      throw new HttpException('Invalid sort by value', HttpStatus.BAD_REQUEST);
    }

    // replace sort by with mapped value
    taskFilter.sortBy = sortByMapping[taskFilter.sortBy];

    // check if project id is provided
    if (taskFilter.projectId) {
      taskFilter.projectId = Number(taskFilter.projectId);
    }

    // build query - not deleted and filtered by company
    const query: Prisma.TaskWhereInput = {
      isDeleted: false,
    };

    // Add company filter if user has a company
    if (companyId) {
      query.companyId = companyId;
    }

    // check if project id is provided
    if (taskFilter.projectId) {
      query.projectId = taskFilter.projectId;
    }

    // check if task status is provided
    if (taskFilter.hasOwnProperty('taskStatus')) {
      const taskStatus: TaskStatus = taskFilter.taskStatus;

      switch (taskStatus) {
        case TaskStatus.active:
          query.assignedToId = accountId;
          query.boardLane = { key: { not: BoardLaneKeys.DONE } };
          break;
        case TaskStatus.assigned:
          query.createdById = accountId;
          query.isSelfAssigned = false;
          query.isOpen = true;
          break;
        case TaskStatus.completed:
          query.assignedToId = accountId;
          query.boardLane = { key: BoardLaneKeys.DONE };

          break;
        case TaskStatus.past_due:
          query.assignedToId = accountId;
          break;
      }
    }

    // check if search term is provided
    if (taskFilter.search) {
      query.OR = [
        { title: { contains: taskFilter.search, mode: 'insensitive' } },
        { description: { contains: taskFilter.search, mode: 'insensitive' } },
      ];
    }

    // get task information
    const taskList = await this.prisma.task.findMany({
      relationLoadStrategy: Prisma.RelationLoadStrategy.join,
      where: query,
      orderBy: {
        [taskFilter.sortBy]: taskFilter.sortType ? taskFilter.sortType : 'desc',
      },
      include: {
        assignedTo: true,
        createdBy: true,
        boardLane: true,
        project: true,
        ApprovalMetadata: true,
      },
    });

    const currentDate = new Date();

    // format task information
    const responseTaskList = taskList.map((task) =>
      this.formatTaskResponse(task),
    );

    // check if task is past due and add taskType/approvalMetadata
    responseTaskList.forEach((task, index) => {
      task.isPastDue = task.dueDate
        ? new Date(task.dueDate.raw) < currentDate
        : false;

      // Add taskType and approvalMetadata from original data
      const originalTask = taskList[index];
      task.taskType = originalTask.taskType;
      task.approvalMetadata = originalTask.ApprovalMetadata;
    });

    // get task permissions and enrich approval metadata
    await Promise.all(
      responseTaskList.map(async (task, index) => {
        task.permissions = await this.#getTaskPermission(task.id);

        // For HR_FILING approval tasks, fetch fresh filing data
        const originalTask = taskList[index];
        if (
          originalTask.taskType === 'APPROVAL' &&
          originalTask.ApprovalMetadata?.sourceModule === 'HR_FILING' &&
          originalTask.ApprovalMetadata?.sourceData &&
          typeof originalTask.ApprovalMetadata.sourceData === 'object' &&
          'filingId' in originalTask.ApprovalMetadata.sourceData
        ) {
          try {
            // Fetch the current filing data
            const sourceData = originalTask.ApprovalMetadata.sourceData as any;
            const filing = await this.prisma.payrollFiling.findUnique({
              where: { id: sourceData.filingId },
              include: {
                file: {
                  select: {
                    id: true,
                    name: true,
                    url: true,
                  },
                },
              },
            });

            if (filing) {
              // Extract JSON data for specific filing types
              const shiftData = (filing.shiftData as any) || {};
              const leaveData = (filing.leaveData as any) || {};

              // Merge fresh filing data with the minimal sourceData
              task.approvalMetadata.sourceData = {
                ...sourceData,
                // Add fresh data from filing
                date: filing.date,
                timeIn: filing.timeIn,
                timeOut: filing.timeOut,
                hours: filing.hours,
                remarks: filing.remarks,
                fileId: filing.fileId,
                fileName: filing.file?.name,
                shiftData: filing.shiftData,
                status: filing.status,
                rejectReason: filing.rejectReason,
                // Add fields from JSON data
                originalTimeIn: shiftData.originalTimeIn,
                originalTimeOut: shiftData.originalTimeOut,
                adjustmentType: shiftData.adjustmentType,
                destination: shiftData.destination || leaveData.destination,
                purpose: shiftData.purpose || leaveData.purpose,
                eventName: leaveData.eventName,
                venue: leaveData.venue,
                certificatePurpose: leaveData.certificatePurpose,
              };
            }
          } catch (error) {
            console.warn(
              'Failed to fetch fresh filing data for task:',
              task.id,
              error,
            );
          }
        }
      }),
    );

    return this.formatResponse(responseTaskList);
  }

  async getQuestTask(taskFilter: TaskFilterDto) {
    const loggedInUserRoleGroup =
      this.utilityService.accountInformation.role.roleGroupId;
    const companyId = this.utilityService.accountInformation.company?.id;

    if (taskFilter.projectId) {
      taskFilter.projectId = Number(taskFilter.projectId);
    }
    const query = {
      assignedToId: null,
      isDeleted: false,
      roleGroupdId: loggedInUserRoleGroup,
      ...(companyId && { companyId }),
    };

    if (taskFilter.projectId) {
      query['projectId'] = taskFilter.projectId;
    }

    const unAssignedTaskList = await this.prisma.task.findMany({
      where: query,
      include: {
        assignedTo: true,
        createdBy: true,
        boardLane: true,
        project: true,
        ApprovalMetadata: true,
      },
    });

    const responseTaskList = unAssignedTaskList.map((task) =>
      this.formatTaskResponse(task),
    );

    // get task permissions
    await Promise.all(
      responseTaskList.map(async (task) => {
        task.permissions = await this.#getTaskPermission(task.id);
      }),
    );

    return this.formatResponse(responseTaskList);
  }

  /**
   * Creates a task for the logged-in user.
   * @param createTaskDto The data for the new task.
   * @param collaboratorIds Optional array of IDs for the collaborators to be created.
   * @returns The newly created task.
   */
  async createAndAssignTask(
    createTaskDto: TaskCreateDto,
    collaboratorIds?: string[],
  ): Promise<CombinedTaskResponseInterface> {
    console.log('=== TaskService.createAndAssignTask STARTED ===');
    console.log('Input DTO:', JSON.stringify(createTaskDto, null, 2));
    console.log('Collaborator IDs:', collaboratorIds || 'None');
    console.log('Current User:', this.utilityService.accountInformation?.email || 'Unknown');

    // get information of assignee
    const assignedToId = this.getAssignedToId(createTaskDto);
    console.log('Assigned To ID:', assignedToId || 'None');

    // validate assignee ID
    if (assignedToId) {
      const account = await this.prisma.account.findUnique({
        where: { id: assignedToId },
      });

      if (!account) {
        throw new NotFoundException('Assignee ID not found');
      }
    }

    const dueDate = createTaskDto.dueDate
      ? new Date(createTaskDto.dueDate)
      : null;

    // check if project exist
    if (createTaskDto.projectId) {
      const checkProjectId = await this.projectService.checkIfProjectExists(
        createTaskDto.projectId,
      );
      if (!checkProjectId)
        throw new NotFoundException(
          'Project Id is not existing in the database',
        );
    }

    // check if project and board lane exist
    const firstBoardLane = await this.boardLaneService.getFirstBoardLane();
    createTaskDto.boardLaneId = firstBoardLane.id;

    // build task information
    const newTaskData: Prisma.TaskCreateInput = {
      title: createTaskDto.title,
      description: createTaskDto.description,
      dueDate: dueDate,
      createdBy: { connect: { id: this.utilityService.accountInformation.id } },
      updatedBy: { connect: { id: this.utilityService.accountInformation.id } },
      order: createTaskDto.order ?? await this.getNextTaskOrder(createTaskDto.boardLaneId),
      assignedByDifficultySet: createTaskDto.difficulty,
      priorityLevel: createTaskDto.difficulty,  // Set priority level from difficulty
      boardLane: { connect: { id: createTaskDto.boardLaneId } },
      assignMode: createTaskDto.assignedMode,
    };

    // Add companyId from the current user's company
    if (this.utilityService.accountInformation.company?.id) {
      newTaskData.company = { connect: { id: this.utilityService.accountInformation.company.id } };
    }

    if (createTaskDto.projectId) {
      newTaskData.project = { connect: { id: createTaskDto.projectId } };
    }

    // assign task to user if assignee is provided
    if (assignedToId) {
      newTaskData.assignedTo = { connect: { id: assignedToId } };

      if (assignedToId === this.utilityService.accountInformation.id) {
        newTaskData.isSelfAssigned = true;
        newTaskData.assignedToDifficultySet = createTaskDto.difficulty;
      }
    }

    // assign task to role group if role group is provided
    if (createTaskDto.roleGroupId) {
      newTaskData.roleGroup = { connect: { id: createTaskDto.roleGroupId } };
    }

    // save task to database
    console.log('Creating task in database with data:', {
      title: newTaskData.title,
      boardLaneId: createTaskDto.boardLaneId,
      assignMode: newTaskData.assignMode,
      order: newTaskData.order,
    });
    const createResponse = await this.prisma.task.create({ data: newTaskData });
    console.log('✅ Task created successfully! ID:', createResponse.id);

    const rawTaskInformation = await this.#getTaskInformation(
      createResponse.id,
    );
    const taskInformation = this.formatTaskResponse(rawTaskInformation);

    // build enhanced response
    const enhancedResponse = {
      ...taskInformation,
    };

    // add watcher watchers
    if (collaboratorIds && collaboratorIds.length > 0) {
      console.log('Adding collaborators as watchers:', collaboratorIds);
      await this.addToTaskWatcher({
        taskId: createResponse.id,
        accountIds: collaboratorIds,
        watcherType: TaskWatcherType.WATCHER,
      });
    }

    // creator as watcher
    await this.addToTaskWatcher({
      taskId: createResponse.id,
      accountIds: [this.utilityService.accountInformation.id],
      watcherType: TaskWatcherType.CREATOR,
    });

    // add assignee as watcher
    if (
      assignedToId &&
      assignedToId !== this.utilityService.accountInformation.id
    ) {
      await this.addToTaskWatcher({
        taskId: createResponse.id,
        accountIds: [assignedToId],
        watcherType: TaskWatcherType.ASSIGNEE,
      });
    }

    // create notification for task receiver
    if (createResponse) {
      // log task creation
      this.utilityService.log(
        `${this.utilityService.accountInformation.email} created a new task "${createResponse.title}."`,
      );

      // create notification for project
      if (assignedToId) {
        console.log('Sending notification to assignee:', assignedToId);
      }
      this.notificationService.sendNotifications(
        createResponse.projectId ? createResponse.projectId : null,
        this.utilityService.accountInformation.id,
        [assignedToId],
        createResponse.title,
        notificationTypeReference.TASK_ASSIGNED.key,
        createResponse.id.toString(),
      );
    }

    // Emit event to create discussion for the task
    try {
      // Collect all watchers
      const allWatchers = new Set<string>();
      allWatchers.add(this.utilityService.accountInformation.id); // creator
      if (assignedToId) {
        allWatchers.add(assignedToId); // assignee
      }
      if (collaboratorIds && collaboratorIds.length > 0) {
        collaboratorIds.forEach((id) => allWatchers.add(id)); // collaborators
      }

      // Emit discussion create event
      this.eventEmitter.emit(DISCUSSION_EVENTS.CREATE, {
        module: 'Task',
        targetId: createResponse.id.toString(),
        title: createTaskDto.title,
        actorId: this.utilityService.accountInformation.id,
        initialWatchers: Array.from(allWatchers),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        'Failed to emit discussion event for task creation:',
        error,
      );
    }

    console.log('=== TaskService.createAndAssignTask COMPLETED ===');
    console.log('Task ID:', createResponse.id);
    console.log('Task Title:', createResponse.title);
    console.log('==============================================');

    return enhancedResponse as CombinedTaskResponseInterface;
  }

  async updateTaskInformation(taskId: number, taskUpdateDto: TaskUpdateDto) {
    taskId = Number(taskId);

    const taskInformation = await this.#getTaskInformation(taskId);

    if (!taskInformation) {
      throw new NotFoundException('Task Id not found');
    }

    // Track changes for discussion event
    const changes = [];

    const updateParams: any = {};

    // Track title change
    if (taskUpdateDto.title && taskUpdateDto.title !== taskInformation.title) {
      updateParams.title = taskUpdateDto.title;
      changes.push({
        field: 'title',
        oldValue: taskInformation.title,
        newValue: taskUpdateDto.title,
      });
    }

    // Track description change
    if (
      taskUpdateDto.description &&
      taskUpdateDto.description !== taskInformation.description
    ) {
      updateParams.description = taskUpdateDto.description;
      changes.push({
        field: 'description',
        oldValue: taskInformation.description,
        newValue: taskUpdateDto.description,
      });
    }

    // Track priority change
    if (
      taskUpdateDto.priorityLevel !== undefined &&
      Number(taskUpdateDto.priorityLevel) !== taskInformation.priorityLevel
    ) {
      updateParams.priorityLevel = Number(taskUpdateDto.priorityLevel);
      changes.push({
        field: 'priorityLevel',
        oldValue: taskInformation.priorityLevel,
        newValue: Number(taskUpdateDto.priorityLevel),
        displayName: 'priority',
      });
    }

    // Track difficulty change
    if (
      taskUpdateDto.difficultyLevel !== undefined &&
      Number(taskUpdateDto.difficultyLevel) !==
        taskInformation.assignedToDifficultySet
    ) {
      updateParams.assignedToDifficultySet = Number(
        taskUpdateDto.difficultyLevel,
      );
      changes.push({
        field: 'difficultyLevel',
        oldValue: taskInformation.assignedToDifficultySet,
        newValue: Number(taskUpdateDto.difficultyLevel),
        displayName: 'difficulty',
      });
    }

    // check if assignee is provided (support both assignee and assignedToId fields)
    const assigneeId = taskUpdateDto.assignedToId || taskUpdateDto.assignee;
    if (assigneeId !== undefined) {
      updateParams['assignedToId'] = assigneeId;
      if (assigneeId !== taskInformation.assignedToId) {
        // Handle null assignment (unassigning)
        if (assigneeId === null) {
          // When unassigning, just set assignedToId to null
          changes.push({
            field: 'assignee',
            oldValue: taskInformation.assignedTo
              ? `${taskInformation.assignedTo.firstName} ${taskInformation.assignedTo.lastName}`
              : taskInformation.assignedToId,
            newValue: null,
            displayName: 'assignee',
          });
        } else {
          // Fetch new assignee information
          const newAssignee = await this.prisma.account.findUnique({
            where: { id: assigneeId },
            select: { firstName: true, lastName: true },
          });

          if (!newAssignee) {
            throw new NotFoundException('Assignee not found');
          }

          updateParams['assignMode'] = 'OTHER';
          changes.push({
            field: 'assignee',
            oldValue: taskInformation.assignedTo
              ? `${taskInformation.assignedTo.firstName} ${taskInformation.assignedTo.lastName}`
              : taskInformation.assignedToId,
            newValue: `${newAssignee.firstName} ${newAssignee.lastName}`,
            displayName: 'assignee',
          });
        }
      }
    }

    // Track project change
    if (taskUpdateDto.projectId !== undefined && taskUpdateDto.projectId !== taskInformation.projectId) {
      // Validate project exists
      if (taskUpdateDto.projectId !== null) {
        const project = await this.prisma.project.findUnique({
          where: { id: taskUpdateDto.projectId },
        });
        if (!project) {
          throw new NotFoundException('Project not found');
        }
      }
      updateParams.projectId = taskUpdateDto.projectId;
      changes.push({
        field: 'projectId',
        oldValue: taskInformation.projectId,
        newValue: taskUpdateDto.projectId,
        displayName: 'project',
      });
    }

    // Track board lane change
    if (taskUpdateDto.boardLaneId !== undefined && taskUpdateDto.boardLaneId !== taskInformation.boardLaneId) {
      // Validate board lane exists
      if (taskUpdateDto.boardLaneId !== null) {
        const boardLane = await this.prisma.boardLane.findUnique({
          where: { id: taskUpdateDto.boardLaneId },
        });
        if (!boardLane) {
          throw new NotFoundException('Board lane not found');
        }
      }
      updateParams.boardLaneId = taskUpdateDto.boardLaneId;
      changes.push({
        field: 'boardLaneId',
        oldValue: taskInformation.boardLaneId,
        newValue: taskUpdateDto.boardLaneId,
        displayName: 'board lane',
      });
    }

    // check if due date is provided
    if (taskUpdateDto.dueDate) {
      updateParams['dueDate'] = new Date(taskUpdateDto.dueDate);
      const oldDueDate = taskInformation.dueDate
        ? new Date(taskInformation.dueDate)
        : null;
      const newDueDate = new Date(taskUpdateDto.dueDate);
      if (oldDueDate?.toISOString() !== newDueDate.toISOString()) {
        changes.push({
          field: 'dueDate',
          oldValue: oldDueDate,
          newValue: newDueDate,
          displayName: 'due date',
        });
      }
    }

    const result = await this.prisma.task.update({
      where: { id: taskId },
      data: updateParams,
    });

    // Emit update event if there were changes
    if (changes.length > 0) {
      this.eventEmitter.emit(DISCUSSION_EVENTS.UPDATE, {
        module: 'Task',
        targetId: taskId.toString(),
        changes,
        actorId: this.utilityService.accountInformation.id,
        timestamp: new Date().toISOString(),
      });
    }

    return result;
  }

  async deleteTask(deleteTaskDto: TaskDeleteDto) {
    const taskDeleteDtoInstance = plainToClass(TaskDeleteDto, deleteTaskDto);

    const errors = await validate(taskDeleteDtoInstance);
    if (errors.length > 0)
      throw new CustomWsException(
        400,
        'Validation failed',
        'VALIDATION_FAILED',
      );

    const deleteResponse = await this.prisma.task.update({
      where: { id: deleteTaskDto.id },
      data: { isDeleted: true },
    });

    return deleteResponse;
  }

  async restoreTask(restoreTaskDto: TaskDeleteDto) {
    const taskRestoreDtoInstance = plainToClass(TaskDeleteDto, restoreTaskDto);

    const errors = await validate(taskRestoreDtoInstance);
    if (errors.length > 0)
      throw new CustomWsException(
        400,
        'Validation failed',
        'VALIDATION_FAILED',
      );

    const restoreResponse = await this.prisma.task.update({
      where: { id: restoreTaskDto.id },
      data: { isDeleted: false },
    });

    return restoreResponse;
  }

  async reOrderTaskVertical(containerArray) {
    await Promise.all(
      containerArray.map(async (item, index) => {
        const newOrder = index + 1;

        for (const subItem of item.items) {
          const task = await this.prisma.task.findUnique({
            where: { id: subItem.id },
          });

          if (!task) {
            throw new BadRequestException(
              `Task with id ${subItem.id} not found.`,
            );
          }

          await this.prisma.task.update({
            where: { id: task.id },
            data: { order: newOrder },
          });
        }
      }),
    );
  }

  async addToTaskWatcher(taskWatcherDto: TaskWatcherDto): Promise<void> {
    // Use atomic upsert to prevent race condition duplicates (TASK-BACKEND-API-MIGRATION)
    await Promise.all(
      taskWatcherDto.accountIds.map(async (accountId) => {
        await this.prisma.taskWatcher.upsert({
          where: {
            taskId_accountId: {
              taskId: taskWatcherDto.taskId,
              accountId: accountId,
            },
          },
          update: {
            watcherType: taskWatcherDto.watcherType,
          },
          create: {
            taskId: taskWatcherDto.taskId,
            accountId: accountId,
            watcherType: taskWatcherDto.watcherType,
          },
        });
      }),
    );
  }

  async getTaskById(taskFilter: { id: string }) {
    const taskId = Number(taskFilter.id);
    const query = {
      id: taskId,
    };

    if (taskFilter.id) {
      query['id'] = taskId;
    }

    const taskInformation = await this.prisma.task.findUnique({
      where: query,
      include: {
        assignedTo: true,
        createdBy: true,
        boardLane: true,
      },
    });

    const response = this.formatTaskResponse(taskInformation);
    return response;
  }

  async readTask(taskFilter: { id: string }) {
    let task = null;
    let filter: Prisma.TaskWhereInput = { id: 0 };

    // check if task id is provided or not
    if (taskFilter.id) {
      task = await this.getTaskById(taskFilter);
      filter = { id: task.id };

      if (!task) {
        throw new NotFoundException(`Task with ID ${taskFilter.id} not found.`);
      }
    } else {
      // if task id is not provided, then read all tasks assigned to the logged in user
      filter = {
        assignedToId: this.utilityService.accountInformation.id,
        isRead: false,
      };
    }

    // update task information
    const updateParameters: Prisma.TaskUpdateInput = {
      isRead: true,
    };

    // update task information
    const readTask = await this.prisma.task.updateMany({
      where: filter,
      data: updateParameters,
    });

    return readTask;
  }

  async moveTaskToProject(params: { taskId: number; boardLaneId?: number; projectId?: number; order?: number }) {
    const { taskId, boardLaneId, projectId, order } = params;

    const taskInformation = await this.validateTaskId(taskId);

    const updateData: any = {};

    if (projectId !== undefined) {
      // Validate project exists
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        throw new NotFoundException('Project not found');
      }
      updateData.projectId = projectId;
    }

    if (boardLaneId !== undefined) {
      // Validate board lane exists
      const boardLane = await this.prisma.boardLane.findUnique({
        where: { id: boardLaneId },
      });
      if (!boardLane) {
        throw new NotFoundException('Board lane not found');
      }
      updateData.boardLaneId = boardLaneId;
    }

    if (order !== undefined) {
      updateData.order = order;
    }

    return await this.prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });
  }

  async moveTask(taskId: TaskIdDto, keyValue: BoardLaneKeys) {
    const taskInformation = await this.validateTaskId(taskId.id);
    const newBoardLaneInformation = await this.prisma.boardLane.findFirst({
      where: { key: keyValue },
    });

    // task watchers
    const taskWatchers = await this.prisma.taskWatcher.findMany({
      where: {
        taskId: taskId.id,
        watcherType: { not: TaskWatcherType.ASSIGNEE },
      },
    });
    const watcherIds = taskWatchers.map((watcher) => watcher.accountId);

    // check if task is moved to another lane
    // Skip notification for workflow tasks as they handle their own notifications
    if (
      taskInformation.boardLane.key !== keyValue &&
      newBoardLaneInformation &&
      !taskInformation.WorkflowTask
    ) {
      this.notificationService.sendNotifications(
        taskInformation.projectId,
        this.utilityService.accountInformation.id,
        watcherIds,
        `${taskInformation.title} (${taskInformation.boardLane.name} to ${newBoardLaneInformation.name})`,
        notificationTypeReference.TASK_MOVED.key,
        taskId.id.toString(),
      );
    }

    // get board lane information
    const boardLaneInformation = await this.prisma.boardLane.findFirst({
      where: {
        key: keyValue,
      },
    });

    if (!boardLaneInformation)
      throw new NotFoundException('Board lane not found');

    // update task information
    const result = await this.prisma.task.update({
      where: { id: taskId.id },
      data: {
        boardLaneId: boardLaneInformation.id,
      },
    });

    // Emit discussion event for status change
    if (taskInformation.boardLane.key !== keyValue) {
      this.eventEmitter.emit(DISCUSSION_EVENTS.ACTION, {
        module: 'Task',
        targetId: taskId.id.toString(),
        action: 'moved',
        details: {
          fromLane: taskInformation.boardLane.name,
          toLane: boardLaneInformation.name,
          oldStatus: taskInformation.boardLane.key,
          newStatus: keyValue,
        },
        actorId: this.utilityService.accountInformation.id,
        timestamp: new Date().toISOString(),
      });
    }

    return result;
  }

  async editTaskInformation(
    _taskId: number,
    _taskUpdateDto: TaskUpdateDto,
  ): Promise<TaskInterface> {
    return null;
  }

  private async validateTaskId(id: number): Promise<any> {
    const companyId = this.utilityService.accountInformation.company?.id;
    const taskInformation = await this.prisma.task.findUnique({
      where: { id },
      include: {
        boardLane: true,
        WorkflowTask: true,
      },
    });
    if (!taskInformation) {
      throw new NotFoundException('Task Id not found');
    }

    // Validate company access
    if (companyId && taskInformation.companyId && taskInformation.companyId !== companyId) {
      throw new NotFoundException('Task Id not found');
    }

    return this.formatTaskResponse(taskInformation);
  }

  private async checkAllAccountIdsExist(
    accountIds: string[],
  ): Promise<boolean> {
    const allExist = await Promise.all(
      accountIds.map(async (accountId) => {
        const account = await this.prisma.account.findUnique({
          where: { id: accountId.toString() },
        });
        return !!account;
      }),
    );

    return allExist.every(Boolean);
  }

  private getAssignedToId(
    taskAssignedToIdDto: TaskAssignToIdDto | TaskCreateDto,
  ): string | null {
    let assignedToId: string | null = null;

    if (taskAssignedToIdDto.assignedMode === TaskAssignMode.SELF) {
      assignedToId = this.utilityService.accountInformation.id;
    } else if (taskAssignedToIdDto.assignedMode === TaskAssignMode.OTHER) {
      // Allow OTHER mode without assignedToId for unassigned tasks
      // If assignedToId is provided, use it; otherwise, leave as null
      assignedToId = taskAssignedToIdDto.assignedToId || null;
    } else if (taskAssignedToIdDto.assignedMode === TaskAssignMode.ROLE_GROUP) {
      if (!taskAssignedToIdDto.roleGroupId) {
        throw new HttpException(
          'Role group ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      assignedToId = null;
    } else {
      throw new HttpException('Invalid Assign Mode', HttpStatus.BAD_REQUEST);
    }

    return assignedToId;
  }

  private async getNextTaskOrder(boardLaneId: number): Promise<number> {
    // Always place new tasks at top with order -1
    // Secondary sorting by createdAt DESC will handle multiple tasks with same order
    return -1;
  }

  async #getTaskPermission(taskId: number) {
    const taskInformation = await this.#getTaskInformation(taskId);
    const accountInformation = this.utilityService.accountInformation;

    const permissions = {
      isOwner: false,
      isAssignee: false,
      isAllowedChangeAssignee: false,
      isAllowedChangeDueDate: false,
      isAllowedStartTask: false,
      isAllowedEditTask: false,
      isAllowedDeleteTask: false,
      isAllowedAssignTask: false,
      isAllowedClaimTask: false,
      isAllowedToAssignTask: false,
      isAllowedCompleteTask: false,
      isAllowedAcceptTask: false,
      isAllowedRejectTask: false,
      isShowCreator: false,
    };

    // check if task is assigned to the logged in user
    if (taskInformation.assignedToId === accountInformation.id) {
      permissions.isAssignee = true;

      if (taskInformation.boardLane.key == BoardLaneKeys.BACKLOG)
        permissions.isAllowedStartTask = true;
      if (taskInformation.boardLane.key == BoardLaneKeys.IN_PROGRESS)
        permissions.isAllowedCompleteTask = true;

      // if assignee and there is no due date yet
      if (!taskInformation.dueDate) {
        permissions.isAllowedChangeDueDate = true;
      }
    }

    // check if creator of task
    if (taskInformation.createdById === accountInformation.id) {
      permissions.isOwner = true;
      permissions.isAllowedEditTask = true;
      permissions.isAllowedDeleteTask = true;
      permissions.isAllowedChangeAssignee = true;
      permissions.isAllowedChangeDueDate = true;

      if (taskInformation.boardLane.key == BoardLaneKeys.DONE)
        permissions.isAllowedAcceptTask = true;
      if (taskInformation.boardLane.key == BoardLaneKeys.DONE)
        permissions.isAllowedRejectTask = true;
    }

    if (taskInformation.assignedToId === null) {
      permissions.isAllowedAssignTask = true;

      if (taskInformation.createdById != accountInformation.id) {
        permissions.isAllowedClaimTask = true;
      }
    }

    if (taskInformation.assignedToId != taskInformation.createdById) {
      permissions.isShowCreator = true;
    }

    return permissions;
  }
  async #assignTask(taskId, assigneeId) {
    const taskInformation = await this.#getTaskInformation(taskId);

    if (!taskInformation) {
      throw new NotFoundException('Task Id not found');
    }

    if (taskInformation.assignedToId) {
      throw new HttpException(
        'Task is already assigned',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updateParameters = {
      assignedToId: assigneeId,
    };

    const result = await this.prisma.task.update({
      where: { id: taskId },
      data: updateParameters,
    });

    // Get assignee information for the event
    const assigneeInfo = await this.prisma.account.findUnique({
      where: { id: assigneeId },
      select: { id: true, firstName: true, lastName: true },
    });

    // Emit discussion event for assignment
    this.eventEmitter.emit(DISCUSSION_EVENTS.ACTION, {
      module: 'Task',
      targetId: taskId.toString(),
      action: 'assigned',
      details: {
        assigneeId: assigneeId,
        assigneeName: assigneeInfo
          ? `${assigneeInfo.firstName} ${assigneeInfo.lastName}`
          : assigneeId,
      },
      actorId: this.utilityService.accountInformation.id,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  async #getTaskInformation(id: number) {
    try {
      const companyId = this.utilityService.accountInformation.company?.id;
      const taskInformation = await this.prisma.task.findUnique({
        where: { id },
        include: {
          assignedTo: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              image: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              image: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          boardLane: true,
          ApprovalMetadata: true,
          WorkflowTask: {
            include: {
              instance: {
                select: {
                  id: true,
                  sourceModule: true,
                  sourceId: true,
                  status: true,
                  currentStageId: true,
                  metadata: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
              stage: {
                select: {
                  id: true,
                  key: true,
                  name: true,
                  description: true,
                  color: true,
                  textColor: true,
                  isInitial: true,
                  isFinal: true,
                  sequence: true,
                },
              },
            },
          },
        },
      });

      if (!taskInformation) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      // Validate company access
      if (companyId && taskInformation.companyId && taskInformation.companyId !== companyId) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      return taskInformation;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Database error while fetching task ${id}:`, error);
      throw new HttpException(
        'Database error while fetching task',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Formats response according to the response interface standard
   * @param data The data to be formatted
   * @returns Formatted response following the interface standard
   */
  private formatResponse<T>(data: T[]): TaskListResponseInterface<T> {
    const currentDate = new Date();
    return {
      items: data,
      total: data.length,
      timestamp: this.utilityService.formatDate(currentDate),
    };
  }

  async getTasksForToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const companyId = this.utilityService.accountInformation.company?.id;

    const tasks = await this.prisma.task.findMany({
      where: {
        assignedToId: userId,
        isDeleted: false,
        ...(companyId && { companyId }),
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return tasks.map((task) => this.formatTaskResponse(task));
  }

  async getActiveTasksForUser(userId: string) {
    const companyId = this.utilityService.accountInformation.company?.id;

    const tasks = await this.prisma.task.findMany({
      where: {
        assignedToId: userId,
        isDeleted: false,
        ...(companyId && { companyId }),
        boardLane: { key: { not: BoardLaneKeys.DONE } },
      },
      orderBy: [{ dueDate: 'asc' }, { priorityLevel: 'desc' }],
    });
    return tasks.map((task) => this.formatTaskResponse(task));
  }

  /**
   * Formats a task response according to the standard format
   */
  private formatTaskResponse(task: any): any {
    if (!task) return null;

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      order: task.order,
      companyId: task.companyId,
      createdAt: this.utilityService.formatDate(task.createdAt),
      updatedAt: this.utilityService.formatDate(task.updatedAt),
      assignedTo: task.assignedTo
        ? this.formatAccountResponse(task.assignedTo)
        : null,
      createdBy: task.createdBy
        ? this.formatAccountResponse(task.createdBy)
        : null,
      boardLane: task.boardLane
        ? this.formatBoardLaneResponse(task.boardLane)
        : null,
      project: task.project ? this.formatProjectResponse(task.project) : null,
      dueDate: task.dueDate
        ? this.utilityService.formatDate(task.dueDate)
        : null,
      isRead: task.isRead,
      priorityLevel: taskPriorityReference.find(
        (ref) => ref.key === task.priorityLevel,
      ) || {
        key: task.priorityLevel,
        label: task.priorityLevel || 'Very Low',
        color: 'grey',
        textColor: 'white',
      },
      roleGroup: task.roleGroup
        ? this.formatRoleGroupResponse(task.roleGroup)
        : null,
      assignedByDifficultySet: taskDifficultyReference.find(
        (ref) => ref.key === task.assignedByDifficultySet,
      ) || {
        key: task.assignedByDifficultySet,
        label: task.assignedByDifficultySet || '0 - Very Easy',
        color: 'green',
        textColor: 'white',
      },
      assignedToDifficultySet: taskDifficultyReference.find(
        (ref) => ref.key === task.assignedToDifficultySet,
      ) || {
        key: task.assignedToDifficultySet,
        label: task.assignedToDifficultySet || '0 - Very Easy',
        color: 'green',
        textColor: 'white',
      },
      isOpen: task.isOpen,
      taskType: task.taskType,
      ApprovalMetadata: task.ApprovalMetadata,
      isPastDue: task.isPastDue,
      permissions: task.permissions,
      approvalMetadata: task.approvalMetadata,
      WorkflowTask: task.WorkflowTask
        ? {
            id: task.WorkflowTask.id,
            instanceId: task.WorkflowTask.instanceId,
            stageId: task.WorkflowTask.stageId,
            taskId: task.WorkflowTask.taskId,
            instance: task.WorkflowTask.instance || null,
            stage: task.WorkflowTask.stage || null,
            createdAt: task.WorkflowTask.createdAt
              ? this.utilityService.formatDate(task.WorkflowTask.createdAt)
              : null,
            completedAt: task.WorkflowTask.completedAt
              ? this.utilityService.formatDate(task.WorkflowTask.completedAt)
              : null,
          }
        : null,
      workflowInstanceId: task.WorkflowTask?.instanceId || null,
    };
  }

  /**
   * Formats an account response
   */
  private formatAccountResponse(account: any): any {
    if (!account) return null;

    const response: any = {
      id: account.id,
      email: account.email,
      username: account.username,
      firstName: account.firstName,
      middleName: account.middleName,
      lastName: account.lastName,
      contactNumber: account.contactNumber,
      status: account.status,
      createdAt: this.utilityService.formatDate(account.createdAt),
      role: account.role ? this.formatRoleResponse(account.role) : null,
      parentAccountId: account.parentAccountId,
      image: account.image,
      parent: account.parent
        ? this.formatAccountResponse(account.parent)
        : null,
    };

    // Add watcherType if it exists
    if (account.watcherType) {
      response.watcherType = watcherTypeReference.find(
        (ref) => ref.key === account.watcherType,
      ) || { key: account.watcherType, label: account.watcherType };
    }

    // Add any extra properties that might exist
    if (account.taskCount !== undefined) response.taskCount = account.taskCount;
    if (account.totalDifficultyBy !== undefined)
      response.totalDifficultyBy = account.totalDifficultyBy;
    if (account.totalDifficultyTo !== undefined)
      response.totalDifficultyTo = account.totalDifficultyTo;

    return response;
  }

  /**
   * Formats a board lane response
   */
  private formatBoardLaneResponse(boardLane: any): any {
    if (!boardLane) return null;

    return {
      id: boardLane.id,
      name: boardLane.name,
      description: boardLane.description,
      order: boardLane.order,
      key: boardLaneReference.find((ref) => ref.key === boardLane.key) || {
        key: boardLane.key,
        label: boardLane.key,
        color: 'grey',
        textColor: 'white',
      },
    };
  }

  /**
   * Formats a project response
   */
  private formatProjectResponse(project: any): any {
    if (!project) return null;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      budget: this.utilityService.formatCurrency(project.budget),
      address: project.address,
      isDeleted: project.isDeleted,
      startDate: this.utilityService.formatDate(project.startDate),
      endDate: this.utilityService.formatDate(project.endDate),
      status: project.status,
      isLead: project.isLead,
      location: project.location
        ? this.formatLocationResponse(project.location)
        : null,
      client: project.client ? this.formatClientResponse(project.client) : null,
      downpaymentAmount: this.utilityService.formatCurrency(
        project.downpaymentAmount,
      ),
      retentionAmount: this.utilityService.formatCurrency(
        project.retentionAmount,
      ),
      totalCollection: this.utilityService.formatCurrency(
        project.totalCollection,
      ),
      totalCollectionBalance: this.utilityService.formatCurrency(
        project.totalCollectionBalance,
      ),
      totalCollected: this.utilityService.formatCurrency(
        project.totalCollected,
      ),
      progressPercentage: project.progressPercentage,
      isProjectStarted: project.isProjectStarted,
      winProbability: project.winProbability,
      personInCharge: project.personInCharge
        ? this.formatAccountResponse(project.personInCharge)
        : null,
    };
  }

  /**
   * Formats a role response
   */
  private formatRoleResponse(role: any): any {
    if (!role) return null;

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isDeveloper: role.isDeveloper,
      isDeleted: role.isDeleted,
      updatedAt: this.utilityService.formatDate(role.updatedAt),
      createdAt: this.utilityService.formatDate(role.createdAt),
      roleScope: role.roleScope,
      roleGroupId: role.roleGroupId,
      roleGroup: role.roleGroup
        ? this.formatRoleGroupResponse(role.roleGroup)
        : null,
      parentRole: role.parentRole
        ? this.formatRoleResponse(role.parentRole)
        : null,
      level: role.level,
    };
  }

  /**
   * Formats a role group response
   */
  private formatRoleGroupResponse(roleGroup: any): any {
    if (!roleGroup) return null;

    return {
      id: roleGroup.id,
      name: roleGroup.name,
      description: roleGroup.description,
      isDeleted: roleGroup.isDeleted,
    };
  }

  /**
   * Formats a location response
   */
  private formatLocationResponse(location: any): any {
    if (!location) return null;

    return {
      id: location.id,
      name: location.name,
      region: location.region,
      province: location.province,
      municipality: location.municipality,
      barangay: location.barangay,
      zipCode: location.zipCode,
      landmark: location.landmark,
      description: location.description,
      createdAt: this.utilityService.formatDate(location.createdAt),
      updatedAt: this.utilityService.formatDate(location.updatedAt),
      isDeleted: location.isDeleted,
    };
  }

  /**
   * Formats a client response
   */
  private formatClientResponse(client: any): any {
    if (!client) return null;

    return {
      id: client.id,
      name: client.name,
      contactNumber: client.contactNumber,
      email: client.email,
      totalCollection: this.utilityService.formatCurrency(
        client.totalCollection,
      ),
      totalCollectionBalance: this.utilityService.formatCurrency(
        client.totalCollectionBalance,
      ),
      totalCollected: this.utilityService.formatCurrency(client.totalCollected),
      location: client.location
        ? this.formatLocationResponse(client.location)
        : null,
      isDeleted: client.isDeleted,
      createdAt: this.utilityService.formatDate(client.createdAt),
    };
  }

  /**
   * Updates task ordering for drag-and-drop functionality
   * Supports both personal (My Tasks) and global ordering
   */
  async updateTaskOrdering(params: {
    taskOrders: Array<{ id: number; order: number }>;
    viewType: string;
    groupingMode: string;
    groupingValue?: string;
    userId?: string;
  }): Promise<void> {
    const { taskOrders, viewType, groupingMode, groupingValue, userId } = params;

    // Determine if this is personal or global ordering
    const isPersonalOrdering = viewType === 'my' && userId;

    // Start a transaction to ensure atomicity with increased timeout for bulk operations
    await this.prisma.$transaction(async (prisma) => {
      // Delete existing order contexts for this view/grouping combination
      if (isPersonalOrdering) {
        // Personal ordering - delete user-specific contexts
        await prisma.taskOrderContext.deleteMany({
          where: {
            userId,
            viewType,
            groupingMode,
            groupingValue: groupingValue || null,
            taskId: {
              in: taskOrders.map(t => t.id),
            },
          },
        });
      } else {
        // Global ordering - delete global contexts (userId is null)
        await prisma.taskOrderContext.deleteMany({
          where: {
            userId: null,
            viewType,
            groupingMode,
            groupingValue: groupingValue || null,
            taskId: {
              in: taskOrders.map(t => t.id),
            },
          },
        });
      }

      // Create new order contexts
      await prisma.taskOrderContext.createMany({
        data: taskOrders.map(taskOrder => ({
          userId: isPersonalOrdering ? userId : null,
          taskId: taskOrder.id,
          orderIndex: taskOrder.order,
          viewType,
          groupingMode,
          groupingValue: groupingValue || null,
        })),
      });

      // Also update the Task table's order field for backward compatibility
      // This is used when no specific ordering context exists
      // Use bulk update with raw SQL for better performance
      if (taskOrders.length > 0) {
        // Build the CASE statement for each task
        const whenClauses = taskOrders
          .map(t => `WHEN ${t.id} THEN ${t.order}`)
          .join(' ');

        // Build the ID list for WHERE clause
        const idList = taskOrders.map(t => t.id).join(', ');

        // Execute the bulk update in a single query
        await prisma.$executeRawUnsafe(
          `UPDATE "Task"
           SET "order" = CASE "id" ${whenClauses} END
           WHERE "id" IN (${idList})`
        );
      }
    }, {
      maxWait: 10000,  // 10 seconds to acquire transaction slot
      timeout: 60000,  // 60 seconds for transaction to complete
    });
  }

  /**
   * Gets tasks with appropriate ordering based on view type and user
   */
  async getTasksWithOrdering(params: {
    viewType: string;
    groupingMode: string;
    groupingValue?: string;
    userId?: string;
    filter?: any;
  }): Promise<any[]> {
    const { viewType, groupingMode, groupingValue, userId, filter } = params;
    const companyId = this.utilityService.accountInformation.company?.id;

    // Determine if we should use personal or global ordering
    const usePersonalOrdering = viewType === 'my' && userId;

    // Get task order contexts
    const orderContexts = await this.prisma.taskOrderContext.findMany({
      where: {
        userId: usePersonalOrdering ? userId : null,
        viewType,
        groupingMode,
        groupingValue: groupingValue || null,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });

    // Fetch ALL tasks matching the filter (including new tasks not in orderContext)
    const tasks = await this.prisma.task.findMany({
      where: {
        ...filter,
        ...(companyId && { companyId }),
      },
      include: {
        assignedTo: true,
        createdBy: true,
        boardLane: true,
        project: true,
        // Add other includes as needed
      },
    });

    // If we have custom ordering, apply it
    if (orderContexts.length > 0) {
      const orderMap = new Map(orderContexts.map(ctx => [ctx.taskId, ctx.orderIndex]));

      // Sort tasks: ordered tasks first (by orderIndex), then unordered tasks (by createdAt DESC)
      tasks.sort((a, b) => {
        const orderA = orderMap.get(a.id);
        const orderB = orderMap.get(b.id);

        // Both tasks have custom order - compare order indices
        if (orderA !== undefined && orderB !== undefined) {
          return orderA - orderB;
        }

        // Only task A has custom order - it comes after unordered tasks
        if (orderA !== undefined && orderB === undefined) {
          return 1;
        }

        // Only task B has custom order - it comes after unordered tasks
        if (orderA === undefined && orderB !== undefined) {
          return -1;
        }

        // Neither task has custom order - sort by createdAt DESC (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return tasks;
    }

    // Fall back to default ordering by the Task table's order field, then createdAt DESC
    tasks.sort((a, b) => {
      // First sort by order field (if defined)
      if (a.order !== b.order) {
        return (a.order || 0) - (b.order || 0);
      }
      // Then by createdAt DESC (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return tasks;
  }

  /**
   * Copies global ordering to a user's personal ordering
   * Used when a user first accesses My Tasks with custom ordering
   */
  async initializePersonalOrdering(params: {
    userId: string;
    viewType: string;
    groupingMode: string;
    groupingValue?: string;
  }): Promise<void> {
    const { userId, viewType, groupingMode, groupingValue } = params;

    // Check if user already has personal ordering
    const existingPersonalOrder = await this.prisma.taskOrderContext.findFirst({
      where: {
        userId,
        viewType,
        groupingMode,
        groupingValue: groupingValue || null,
      },
    });

    if (existingPersonalOrder) {
      return; // Already initialized
    }

    // Copy global ordering to personal
    const globalOrdering = await this.prisma.taskOrderContext.findMany({
      where: {
        userId: null,
        viewType,
        groupingMode,
        groupingValue: groupingValue || null,
      },
    });

    if (globalOrdering.length > 0) {
      await this.prisma.taskOrderContext.createMany({
        data: globalOrdering.map(order => ({
          userId,
          taskId: order.taskId,
          orderIndex: order.orderIndex,
          viewType: order.viewType,
          groupingMode: order.groupingMode,
          groupingValue: order.groupingValue,
        })),
      });
    }
  }
}

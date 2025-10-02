import {
  Controller,
  Post,
  Response as NestResponse,
  Inject,
  Body,
  Get,
  Query,
  Put,
  Delete,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { TaskService } from './task.service';
import {
  AssignTaskParamsDto,
  ClaimTaskParamsDto,
  TaskCreateDto,
  TaskFilterDto,
  TaskIdDto,
  TaskUpdateDto,
  AddWatcherDTO,
} from '../../../../dto/task.validator.dto';

@Controller('task')
export class TaskController {
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly taskService: TaskService;

  @Get()
  async getTaskInformation(
    @NestResponse() response: Response,
    @Query('id') id,
  ) {
    return this.utilityService.responseHandler(
      this.taskService.getTaskInformation(id),
      response,
    );
  }

  @Put('assign')
  async assignTask(
    @NestResponse() response: Response,
    @Body() params: AssignTaskParamsDto,
  ) {
    return this.utilityService.responseHandler(
      this.taskService.assignTask(params),
      response,
    );
  }

  @Put('accept')
  async acceptTask(
    @NestResponse() response: Response,
    @Body('id') taskId: number,
  ) {
    return this.utilityService.responseHandler(
      this.taskService.acceptTask(taskId),
      response,
    );
  }

  @Put('reject')
  async rejectTask(
    @NestResponse() response: Response,
    @Body('id') taskId: number,
  ) {
    return this.utilityService.responseHandler(
      this.taskService.rejectTask(taskId),
      response,
    );
  }

  @Put('claim')
  async claimTask(
    @NestResponse() response: Response,
    @Body() params: ClaimTaskParamsDto,
  ) {
    return this.utilityService.responseHandler(
      this.taskService.claimTask(params),
      response,
    );
  }

  @Post('create')
  async createTask(
    @NestResponse() response: Response,
    @Body() taskCreateDto: TaskCreateDto,
    @Body('collaboratorAccountIds') collaboratorDto?: string[],
  ) {
    console.log('=== TASK CREATE ENDPOINT CALLED ===');
    console.log('Task Data:', JSON.stringify(taskCreateDto, null, 2));
    if (collaboratorDto && collaboratorDto.length > 0) {
      console.log('Collaborators:', collaboratorDto);
    }
    console.log('===================================');

    return this.utilityService.responseHandler(
      this.taskService.createAndAssignTask(taskCreateDto, collaboratorDto),
      response,
    );
  }

  @Get('count-by-status')
  async getTaskCountByStatus(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.taskService.getTaskCountByStatus(),
      response,
    );
  }

  @Get('users')
  async getTaskUsers(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.taskService.getTaskUsers(),
      response,
    );
  }

  @Get('own-task')
  async getOwnTaskList(
    @NestResponse() response: Response,
    @Query() taskFilter: TaskFilterDto,
  ) {
    return this.utilityService.responseHandler(
      this.taskService.getTaskByLoggedInUser(taskFilter),
      response,
    );
  }

  @Get('quest-task')
  async getQuestTask(
    @NestResponse() response: Response,
    @Query() taskFilter: TaskFilterDto,
  ) {
    return this.utilityService.responseHandler(
      this.taskService.getQuestTask(taskFilter),
      response,
    );
  }

  @Get('task-by-id')
  async getTaskById(
    @NestResponse() response: Response,
    @Query() taskFilter: { id: string },
  ) {
    return this.utilityService.responseHandler(
      this.taskService.getTaskById(taskFilter),
      response,
    );
  }

  @Get('collaborators')
  async getCollaborators(
    @NestResponse() response: Response,
    @Query('taskId') taskId: number,
  ) {
    return this.utilityService.responseHandler(
      this.taskService.getCollaborators(taskId),
      response,
    );
  }

  @Put('/read')
  async readTask(
    @NestResponse() response: Response,
    @Query('id') taskId: string,
  ) {
    return this.utilityService.responseHandler(
      this.taskService.readTask({ id: taskId }),
      response,
    );
  }

  @Put('start')
  async startTask(
    @NestResponse() response: Response,
    @Body() taskId: TaskIdDto,
  ) {
    return this.utilityService.responseHandler(
      this.taskService.moveTask(taskId, 'IN_PROGRESS'),
      response,
    );
  }

  @Put('complete')
  async markTaskAsDone(
    @NestResponse() response: Response,
    @Body() taskId: TaskIdDto,
  ) {
    return this.utilityService.responseHandler(
      this.taskService.moveTask(taskId, 'DONE'),
      response,
    );
  }

  @Put('add-watcher')
  async addCollaborators(
    @NestResponse() response: Response,
    @Body() params: AddWatcherDTO,
  ) {
    return this.utilityService.responseHandler(
      this.taskService.addWatcher(params),
      response,
    );
  }

  @Put('remove-watcher')
  async removeCollaborators(
    @NestResponse() response: Response,
    @Body() params: AddWatcherDTO,
  ) {
    return this.utilityService.responseHandler(
      this.taskService.removeWatcher(params),
      response,
    );
  }

  @Put('move-task-to-backlog')
  async moveTaskToBacklog(
    @NestResponse() response: Response,
    @Body() taskId: TaskIdDto,
  ) {
    return this.utilityService.responseHandler(
      this.taskService.moveTask(taskId, 'BACKLOG'),
      response,
    );
  }

  @Put('update')
  async updateTask(
    @NestResponse() response: Response,
    @Body() params: any,
  ) {
    const { id, ...updates } = params;
    return this.utilityService.responseHandler(
      this.taskService.updateTaskInformation(id, updates),
      response,
    );
  }

  @Put('move')
  async moveTaskToProject(
    @NestResponse() response: Response,
    @Body() params: { taskId: number; boardLaneId?: number; projectId?: number; order?: number },
  ) {
    return this.utilityService.responseHandler(
      this.taskService.moveTaskToProject(params),
      response,
    );
  }

  @Put()
  async updateTaskInformation(
    @NestResponse() response: Response,
    @Query('id') taskId: number,
    @Body() taskUpdateDto: TaskUpdateDto,
  ) {
    return this.utilityService.responseHandler(
      this.taskService.updateTaskInformation(taskId, taskUpdateDto),
      response,
    );
  }

  @Put('update-order')
  async updateTaskOrder(
    @NestResponse() response: Response,
    @Body() params: {
      taskOrders: Array<{ id: number; order: number }>;
      viewType: string;
      groupingMode: string;
      groupingValue?: string;
    },
  ) {
    // Get the current user's ID from the utility service
    const userId = this.utilityService.accountInformation?.id;

    return this.utilityService.responseHandler(
      this.taskService.updateTaskOrdering({
        ...params,
        userId: params.viewType === 'my' ? userId : undefined,
      }),
      response,
    );
  }

  @Get('ordered')
  async getOrderedTasks(
    @NestResponse() response: Response,
    @Query() query: {
      viewType: string;
      groupingMode: string;
      groupingValue?: string;
      filter?: string;
    },
  ) {
    // Get the current user's ID from the utility service
    const userId = this.utilityService.accountInformation?.id;

    // Parse filter if provided
    const filter = query.filter ? JSON.parse(query.filter) : {};

    return this.utilityService.responseHandler(
      this.taskService.getTasksWithOrdering({
        viewType: query.viewType,
        groupingMode: query.groupingMode,
        groupingValue: query.groupingValue,
        userId: query.viewType === 'my' ? userId : undefined,
        filter,
      }),
      response,
    );
  }

  @Post('initialize-personal-order')
  async initializePersonalOrder(
    @NestResponse() response: Response,
    @Body() params: {
      viewType: string;
      groupingMode: string;
      groupingValue?: string;
    },
  ) {
    // Get the current user's ID from the utility service
    const userId = this.utilityService.accountInformation?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.utilityService.responseHandler(
      this.taskService.initializePersonalOrdering({
        ...params,
        userId,
      }),
      response,
    );
  }

  @Delete(':id')
  async deleteTask(
    @NestResponse() response: Response,
    @Param('id') id: string,
  ) {
    const taskId = Number(id);

    // Validate ID
    if (!taskId || isNaN(taskId)) {
      throw new BadRequestException('Invalid task ID');
    }

    return this.utilityService.responseHandler(
      this.taskService.deleteTask({ id: taskId }),
      response,
    );
  }

  @Put('restore/:id')
  async restoreTask(
    @NestResponse() response: Response,
    @Param('id') id: string,
  ) {
    const taskId = Number(id);

    // Validate ID
    if (!taskId || isNaN(taskId)) {
      throw new BadRequestException('Invalid task ID');
    }

    return this.utilityService.responseHandler(
      this.taskService.restoreTask({ id: taskId }),
      response,
    );
  }
}

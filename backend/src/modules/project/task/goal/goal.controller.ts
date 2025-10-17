import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Response as NestResponse,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { GoalService } from './goal.service';
import { UtilityService } from '@common/utility.service';
import {
  GoalCreateDto,
  GoalUpdateDto,
  GoalIdDto,
  GoalFilterDto,
  GoalLinkTaskDto,
  GoalUnlinkTaskDto,
  GoalLinkMultipleTasksDto,
} from '../../../../dto/goal.validator.dto';

@Controller('task/goal')
export class GoalController {
  @Inject() private readonly goalService: GoalService;
  @Inject() private readonly utilityService: UtilityService;

  /**
   * Get all goals (with optional filtering)
   * GET /task/goal
   * Query params: status (PENDING|COMPLETED), search (string)
   */
  @Get()
  async getGoals(
    @NestResponse() response: Response,
    @Query() filter: GoalFilterDto,
  ) {
    return this.utilityService.responseHandler(
      this.goalService.getGoals(filter),
      response,
    );
  }

  /**
   * Get goal progress data with accurate completion dates
   * GET /task/goal/:id/progress
   * NOTE: Must come before /:id route to avoid route conflicts
   */
  @Get(':id/progress')
  async getGoalProgress(
    @NestResponse() response: Response,
    @Param() params: GoalIdDto,
  ) {
    return this.utilityService.responseHandler(
      this.goalService.getGoalProgress(params.id),
      response,
    );
  }

  /**
   * Get single goal by ID with linked tasks
   * GET /task/goal/:id
   */
  @Get(':id')
  async getGoalById(
    @NestResponse() response: Response,
    @Param() params: GoalIdDto,
  ) {
    return this.utilityService.responseHandler(
      this.goalService.getGoalById(params.id),
      response,
    );
  }

  /**
   * Create a new goal
   * POST /task/goal/create
   */
  @Post('create')
  async createGoal(
    @NestResponse() response: Response,
    @Body() createDto: GoalCreateDto,
  ) {
    return this.utilityService.responseHandler(
      this.goalService.createGoal(createDto),
      response,
    );
  }

  /**
   * Link a task to a goal
   * PUT /task/goal/link-task
   * NOTE: Must come before /:id routes to avoid route conflicts
   */
  @Put('link-task')
  async linkTaskToGoal(
    @NestResponse() response: Response,
    @Body() linkDto: GoalLinkTaskDto,
  ) {
    return this.utilityService.responseHandler(
      this.goalService.linkTaskToGoal(linkDto),
      response,
    );
  }

  /**
   * Link multiple tasks to a goal
   * PUT /task/goal/link-tasks
   * NOTE: Must come before /:id routes to avoid route conflicts
   */
  @Put('link-tasks')
  async linkMultipleTasksToGoal(
    @NestResponse() response: Response,
    @Body() linkDto: GoalLinkMultipleTasksDto,
  ) {
    return this.utilityService.responseHandler(
      this.goalService.linkMultipleTasksToGoal(linkDto),
      response,
    );
  }

  /**
   * Unlink a task from its goal
   * PUT /task/goal/unlink-task
   * NOTE: Must come before /:id routes to avoid route conflicts
   */
  @Put('unlink-task')
  async unlinkTaskFromGoal(
    @NestResponse() response: Response,
    @Body() unlinkDto: GoalUnlinkTaskDto,
  ) {
    return this.utilityService.responseHandler(
      this.goalService.unlinkTaskFromGoal(unlinkDto),
      response,
    );
  }

  /**
   * Mark goal as completed
   * PUT /task/goal/:id/complete
   */
  @Put(':id/complete')
  async completeGoal(
    @NestResponse() response: Response,
    @Param() params: GoalIdDto,
  ) {
    return this.utilityService.responseHandler(
      this.goalService.completeGoal(params.id),
      response,
    );
  }

  /**
   * Update goal details
   * PUT /task/goal/:id
   */
  @Put(':id')
  async updateGoal(
    @NestResponse() response: Response,
    @Param() params: GoalIdDto,
    @Body() updateDto: GoalUpdateDto,
  ) {
    return this.utilityService.responseHandler(
      this.goalService.updateGoal(params.id, updateDto),
      response,
    );
  }

  /**
   * Delete goal (soft delete, unlinks all tasks)
   * DELETE /task/goal/:id
   */
  @Delete(':id')
  async deleteGoal(
    @NestResponse() response: Response,
    @Param() params: GoalIdDto,
  ) {
    return this.utilityService.responseHandler(
      this.goalService.deleteGoal(params.id),
      response,
    );
  }
}

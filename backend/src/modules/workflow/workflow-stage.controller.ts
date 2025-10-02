import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { WorkflowStageService } from './workflow-stage.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateWorkflowStageValidator,
  UpdateWorkflowStageValidator,
  CreateWorkflowTransitionValidator,
  UpdateWorkflowTransitionValidator,
  ReorderStagesValidator,
} from './workflow.validator';

@Controller('workflow-stage')
export class WorkflowStageController {
  constructor(
    private workflowStageService: WorkflowStageService,
    private utilityService: UtilityService,
  ) {}

  @Get()
  async findAll(
    @Query('workflowId', ParseIntPipe) workflowId: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.workflowStageService.findAll(workflowId),
      response,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.workflowStageService.findOne(id),
      response,
    );
  }

  @Post()
  async create(
    @Body() body: CreateWorkflowStageValidator,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.workflowStageService.create(body),
      response,
    );
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateWorkflowStageValidator,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.workflowStageService.update(id, body),
      response,
    );
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    await this.workflowStageService.delete(id);
    return this.utilityService.responseHandler(
      Promise.resolve({ success: true }),
      response,
    );
  }

  @Put('reorder/:workflowId')
  async reorder(
    @Param('workflowId', ParseIntPipe) workflowId: number,
    @Body() body: ReorderStagesValidator,
    @Res() response: Response,
  ) {
    await this.workflowStageService.reorderStages(workflowId, body);
    return this.utilityService.responseHandler(
      Promise.resolve({ success: true }),
      response,
    );
  }

  @Post('transition')
  async createTransition(
    @Body() body: CreateWorkflowTransitionValidator,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.workflowStageService.createTransition(body),
      response,
    );
  }

  @Put('transition/:id')
  async updateTransition(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateWorkflowTransitionValidator,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.workflowStageService.updateTransition(id, body),
      response,
    );
  }

  @Delete('transition/:id')
  async deleteTransition(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    await this.workflowStageService.deleteTransition(id);
    return this.utilityService.responseHandler(
      Promise.resolve({ success: true }),
      response,
    );
  }
}

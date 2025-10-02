import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Inject,
  Response as NestResponse,
} from '@nestjs/common';
import { Response } from 'express';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowInstanceService } from './workflow-instance.service';
import { WorkflowTaskService } from './workflow-task.service';
import { WorkflowValidatorService } from './workflow-validator.service';
import { UtilityService } from '@common/utility.service';

@Controller('workflow-instance')
export class WorkflowInstanceController {
  @Inject() private workflowEngineService: WorkflowEngineService;
  @Inject() private workflowInstanceService: WorkflowInstanceService;
  @Inject() private workflowTaskService: WorkflowTaskService;
  @Inject() private workflowValidatorService: WorkflowValidatorService;
  @Inject() private utilityService: UtilityService;

  /**
   * Start a new workflow instance
   */
  @Post()
  async startWorkflow(
    @Body()
    body: {
      workflowCode: string;
      sourceModule: string;
      sourceId: string;
      metadata?: any;
    },
    @NestResponse() response: Response,
  ) {
    const { workflowCode, sourceModule, sourceId, metadata } = body;

    this.utilityService.responseHandler(
      this.workflowEngineService.startWorkflow({
        workflowCode,
        sourceModule,
        sourceId,
        initiatorId: this.utilityService.accountInformation.id,
        companyId: this.utilityService.accountInformation.company?.id || 1,
        metadata,
      }),
      response,
    );
  }

  /**
   * Get workflow instance details
   */
  @Get(':id')
  async getInstance(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.workflowInstanceService.findOne(parseInt(id)),
      response,
    );
  }

  /**
   * Get workflow instance by source
   */
  @Get('source/:module/:id')
  async getInstanceBySource(
    @Param('module') module: string,
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.workflowInstanceService.findBySource(module, id),
      response,
    );
  }

  /**
   * List workflow instances
   */
  @Get()
  async listInstances(
    @Query()
    query: {
      workflowId?: string;
      sourceModule?: string;
      status?: string;
      startedById?: string;
      page?: string;
      limit?: string;
    },
    @NestResponse() response: Response,
  ) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    this.utilityService.responseHandler(
      this.workflowInstanceService.findMany({
        workflowId: query.workflowId ? parseInt(query.workflowId) : undefined,
        sourceModule: query.sourceModule,
        status: query.status as any,
        startedById: query.startedById,
        page,
        limit,
      }),
      response,
    );
  }

  /**
   * Get workflow instance timeline
   */
  @Get(':id/timeline')
  async getTimeline(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.workflowInstanceService.getTimeline(parseInt(id)),
      response,
    );
  }

  /**
   * Get available actions for workflow instance
   */
  @Get(':id/actions')
  async getAvailableActions(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.workflowEngineService.getAvailableActions(
        parseInt(id),
        this.utilityService.accountInformation.id,
      ),
      response,
    );
  }

  /**
   * Get available transitions for workflow instance (alias for actions)
   */
  @Get(':id/available-transitions')
  async getAvailableTransitions(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.workflowEngineService.getAvailableActions(
        parseInt(id),
        this.utilityService.accountInformation.id,
      ),
      response,
    );
  }

  /**
   * Perform workflow transition
   */
  @Post(':id/transition')
  async performTransition(
    @Param('id') id: string,
    @Body()
    body: {
      action: string;
      remarks?: string;
      metadata?: any;
    },
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.workflowEngineService.transitionWorkflow({
        instanceId: parseInt(id),
        action: body.action,
        performedById: this.utilityService.accountInformation.id,
        remarks: body.remarks,
        metadata: body.metadata,
      }),
      response,
    );
  }

  /**
   * Cancel workflow instance
   */
  @Post(':id/cancel')
  async cancelWorkflow(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.workflowEngineService.cancelWorkflow(
        parseInt(id),
        this.utilityService.accountInformation.id,
        body.reason,
      ),
      response,
    );
  }

  /**
   * Suspend workflow instance
   */
  @Post(':id/suspend')
  async suspendWorkflow(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.workflowEngineService.suspendWorkflow(
        parseInt(id),
        this.utilityService.accountInformation.id,
        body.reason,
      ),
      response,
    );
  }

  /**
   * Resume workflow instance
   */
  @Post(':id/resume')
  async resumeWorkflow(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.workflowEngineService.resumeWorkflow(
        parseInt(id),
        this.utilityService.accountInformation.id,
      ),
      response,
    );
  }

  /**
   * Get workflow tasks
   */
  @Get(':id/tasks')
  async getWorkflowTasks(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.workflowTaskService.getWorkflowTasks(parseInt(id)),
      response,
    );
  }

  /**
   * Get user's pending workflow instances
   */
  @Get('user/pending')
  async getUserPendingInstances(
    @Query() query: { page?: string; limit?: string },
    @NestResponse() response: Response,
  ) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');

    this.utilityService.responseHandler(
      this.workflowInstanceService.getUserPendingInstances(
        this.utilityService.accountInformation.id,
        page,
        limit,
      ),
      response,
    );
  }

  /**
   * Get overdue workflow instances (admin only)
   */
  @Get('monitoring/overdue')
  async getOverdueInstances(
    @Query() query: { hours?: string },
    @NestResponse() response: Response,
  ) {
    const _hours = parseInt(query.hours || '24');

    this.utilityService.responseHandler(
      this.workflowInstanceService.getOverdueInstances(
        this.utilityService.accountInformation.company?.id || 1,
      ),
      response,
    );
  }
}

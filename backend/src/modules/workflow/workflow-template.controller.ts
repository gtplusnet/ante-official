import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { WorkflowTemplateService } from './workflow-template.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateWorkflowTemplateValidator,
  UpdateWorkflowTemplateValidator,
  CloneWorkflowValidator,
} from './workflow.validator';

@Controller('workflow-template')
export class WorkflowTemplateController {
  constructor(
    private workflowTemplateService: WorkflowTemplateService,
    private utilityService: UtilityService,
  ) {}

  @Get()
  async findAll(@Res() response: Response) {
    const companyId = this.utilityService.companyId;
    return this.utilityService.responseHandler(
      this.workflowTemplateService.findAll(companyId),
      response,
    );
  }

  @Get('dialogs/:workflowCode')
  async getAvailableDialogs(
    @Param('workflowCode') workflowCode: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.workflowTemplateService.getAvailableDialogs(workflowCode),
      response,
    );
  }

  @Get('options/assignees')
  async getAssigneeOptions(@Res() response: Response) {
    const companyId = this.utilityService.companyId;
    return this.utilityService.responseHandler(
      this.workflowTemplateService.getAssigneeOptions(companyId),
      response,
    );
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string, @Res() response: Response) {
    const companyId = this.utilityService.companyId;
    return this.utilityService.responseHandler(
      this.workflowTemplateService.findByCode(code, companyId),
      response,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    const companyId = this.utilityService.companyId;
    return this.utilityService.responseHandler(
      this.workflowTemplateService.findOne(id, companyId),
      response,
    );
  }

  @Post()
  async create(
    @Body() body: CreateWorkflowTemplateValidator,
    @Res() response: Response,
  ) {
    const companyId = this.utilityService.companyId;
    return this.utilityService.responseHandler(
      this.workflowTemplateService.create(body, companyId),
      response,
    );
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateWorkflowTemplateValidator,
    @Res() response: Response,
  ) {
    const companyId = this.utilityService.companyId;
    return this.utilityService.responseHandler(
      this.workflowTemplateService.update(id, body, companyId),
      response,
    );
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    const companyId = this.utilityService.companyId;
    const deletedById = this.utilityService.accountInformation.id;
    await this.workflowTemplateService.delete(id, companyId, deletedById);
    return this.utilityService.responseHandler(
      Promise.resolve({ success: true }),
      response,
    );
  }

  @Post('clone')
  async clone(@Body() body: CloneWorkflowValidator, @Res() response: Response) {
    const companyId = this.utilityService.companyId;
    return this.utilityService.responseHandler(
      this.workflowTemplateService.clone(body, companyId),
      response,
    );
  }

  @Put(':id/toggle')
  async toggle(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    const companyId = this.utilityService.companyId;
    return this.utilityService.responseHandler(
      this.workflowTemplateService.toggle(id, companyId),
      response,
    );
  }

  @Get('archived/list')
  async findArchived(@Res() response: Response) {
    const companyId = this.utilityService.companyId;
    return this.utilityService.responseHandler(
      this.workflowTemplateService.findDeleted(companyId),
      response,
    );
  }

  @Put(':id/restore')
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    const companyId = this.utilityService.companyId;
    return this.utilityService.responseHandler(
      this.workflowTemplateService.restore(id, companyId),
      response,
    );
  }
}

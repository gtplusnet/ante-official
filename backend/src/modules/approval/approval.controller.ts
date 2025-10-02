import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ApprovalService, ProcessApprovalParams } from './approval.service';

@Controller('approval')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  /**
   * Get approval details for a task
   */
  @Get('task/:id')
  async getApprovalDetails(@Param('id') id: string) {
    return this.approvalService.getApprovalDetails(Number(id));
  }

  /**
   * Process an approval action
   */
  @Patch('task/:id')
  async processApproval(
    @Param('id') id: string,
    @Body() body: { action: string; remarks?: string },
  ) {
    const params: ProcessApprovalParams = {
      taskId: Number(id),
      action: body.action,
      remarks: body.remarks,
    };

    await this.approvalService.processApproval(params);

    return { success: true };
  }

  /**
   * Get approval history for a source
   */
  @Get('history/:module/:sourceId')
  async getApprovalHistory(
    @Param('module') module: string,
    @Param('sourceId') sourceId: string,
  ) {
    return this.approvalService.getApprovalHistory(module, sourceId);
  }
}

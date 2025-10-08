import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Inject,
  Response as NestResponse,
} from '@nestjs/common';
import { Response } from 'express';
import { CRMActivityService } from './crm-activity.service';
import { UtilityService } from '@common/utility.service';
import { GetActivitiesQueryDto } from './crm-activity.validator.dto';

@Controller('crm-activity')
export class CRMActivityController {
  @Inject() private readonly crmActivityService: CRMActivityService;
  @Inject() private readonly utilityService: UtilityService;

  @Get('recent')
  async getRecentActivities(
    @Query() query: GetActivitiesQueryDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.crmActivityService.getRecentActivities(query),
      response,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.crmActivityService.getUnreadCount(),
      response,
    );
  }

  @Patch(':id/mark-read')
  async markAsRead(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.crmActivityService.markAsRead(Number(id)),
      response,
    );
  }

  @Patch('mark-all-read')
  async markAllAsRead(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.crmActivityService.markAllAsRead(),
      response,
    );
  }
}

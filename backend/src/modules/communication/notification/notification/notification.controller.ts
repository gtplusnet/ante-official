import {
  Controller,
  Response as NestResponse,
  Inject,
  Get,
  Patch,
  Query,
} from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import { Response } from 'express';
import { NotificationService } from './notification.service';
import { NotificationFilterDto } from '../../../../dto/notification.validator.dto';

@Controller('notification')
export class NotificationController {
  @Inject() public utilityService: UtilityService;
  @Inject() public notificationService: NotificationService;

  @Get('pending-count')
  async getOwnPendingNotificationCount(@NestResponse() response: Response) {
    this.utilityService.responseHandler(
      this.notificationService.getOwnPendingNotificationCount(),
      response,
    );
  }

  @Get('by-account')
  async getNotificationsByLoggedInUser(
    @NestResponse() response: Response,
    @Query() notificationFilter: NotificationFilterDto,
  ) {
    this.utilityService.responseHandler(
      this.notificationService.getNotificationsListByLoggedInUser(
        notificationFilter,
      ),
      response,
    );
  }

  @Patch('read')
  async markNotificationAsRead(
    @NestResponse() response: Response,
    @Query('id') notificationId: number,
  ) {
    this.utilityService.responseHandler(
      this.notificationService.markNotificationAsRead(notificationId),
      response,
    );
  }
}

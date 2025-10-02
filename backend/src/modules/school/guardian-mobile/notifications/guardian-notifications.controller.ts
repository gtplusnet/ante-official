import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GuardianNotificationsService } from './guardian-notifications.service';
import { GuardianAuthGuard } from '../auth/guardian-mobile-auth.guard';
import {
  GetNotificationsDto,
  CreateNotificationDto,
} from './guardian-notifications.dto';

@Controller('api/guardian/notifications')
@UseGuards(GuardianAuthGuard)
export class GuardianNotificationsController {
  constructor(
    private readonly notificationsService: GuardianNotificationsService,
  ) {}

  @Get()
  async getNotifications(@Req() req: any, @Query() query: GetNotificationsDto) {
    const result = await this.notificationsService.getNotifications(
      req.user.id,
      query,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const result = await this.notificationsService.getUnreadCount(req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  async getNotification(@Req() req: any, @Param('id') id: string) {
    const notification = await this.notificationsService.getNotification(
      req.user.id,
      id,
    );
    return {
      success: true,
      data: notification,
    };
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    const result = await this.notificationsService.markAsRead(req.user.id, id);
    return {
      success: true,
      data: result,
    };
  }

  @Put('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Req() req: any) {
    const result = await this.notificationsService.markAllAsRead(req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteNotification(@Req() req: any, @Param('id') id: string) {
    const result = await this.notificationsService.deleteNotification(
      req.user.id,
      id,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createNotification(@Req() req: any, @Body() body: any) {
    const notification = await this.notificationsService.createNotification(
      req.user.id,
      body,
    );
    return {
      success: true,
      data: notification,
    };
  }

  @Post('payment-reminder')
  @HttpCode(HttpStatus.CREATED)
  async createPaymentReminder(@Req() req: any, @Body() body: any) {
    const notification = await this.notificationsService.createPaymentReminder(
      req.user.id,
      body,
    );
    return {
      success: true,
      data: notification,
    };
  }

  @Post('announcement')
  @HttpCode(HttpStatus.CREATED)
  async createAnnouncement(@Req() req: any, @Body() body: any) {
    const notification = await this.notificationsService.createAnnouncement(
      req.user.id,
      body,
    );
    return {
      success: true,
      data: notification,
    };
  }
}

// Also create alias controller for frontend compatibility
@Controller('api/notifications')
@UseGuards(GuardianAuthGuard)
export class GuardianNotificationsAliasController {
  constructor(
    private readonly notificationsService: GuardianNotificationsService,
  ) {}

  @Get()
  async getNotifications(@Req() req: any, @Query() query: GetNotificationsDto) {
    const result = await this.notificationsService.getNotifications(
      req.user.id,
      query,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const result = await this.notificationsService.getUnreadCount(req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  async getNotification(@Req() req: any, @Param('id') id: string) {
    const notification = await this.notificationsService.getNotification(
      req.user.id,
      id,
    );
    return {
      success: true,
      data: notification,
    };
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    const result = await this.notificationsService.markAsRead(req.user.id, id);
    return {
      success: true,
      data: result,
    };
  }

  @Put('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Req() req: any) {
    const result = await this.notificationsService.markAllAsRead(req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteNotification(@Req() req: any, @Param('id') id: string) {
    const result = await this.notificationsService.deleteNotification(
      req.user.id,
      id,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createNotification(
    @Req() req: any,
    @Body() body: CreateNotificationDto,
  ) {
    const notification = await this.notificationsService.createNotification(
      req.user.id,
      body,
    );
    return {
      success: true,
      data: notification,
    };
  }

  @Post('payment-reminder')
  @HttpCode(HttpStatus.CREATED)
  async createPaymentReminder(@Req() req: any, @Body() body: any) {
    const notification = await this.notificationsService.createPaymentReminder(
      req.user.id,
      body,
    );
    return {
      success: true,
      data: notification,
    };
  }

  @Post('announcement')
  @HttpCode(HttpStatus.CREATED)
  async createAnnouncement(@Req() req: any, @Body() body: any) {
    const notification = await this.notificationsService.createAnnouncement(
      req.user.id,
      body,
    );
    return {
      success: true,
      data: notification,
    };
  }
}

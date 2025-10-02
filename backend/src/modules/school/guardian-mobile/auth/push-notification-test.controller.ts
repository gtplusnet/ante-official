import {
  Controller,
  Post,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { GuardianAuthGuard } from './guardian-mobile-auth.guard';
import { GuardianPushNotificationService } from '../services/guardian-push-notification.service';

export class TestPushNotificationDto {
  type?: 'test' | 'attendance' | 'payment' | 'announcement';
  title?: string;
  body?: string;
}

@Controller('api/guardian/push-notification')
@UseGuards(GuardianAuthGuard)
export class GuardianPushNotificationTestController {
  constructor(
    private readonly pushNotificationService: GuardianPushNotificationService,
  ) {}

  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testPushNotification(
    @Req() req: any,
    @Body() dto?: TestPushNotificationDto,
  ) {
    try {
      const guardianId = req.user.id;

      let success = false;

      if (dto?.type === 'attendance') {
        // Test attendance notification
        await this.pushNotificationService.sendAttendanceNotification(
          [guardianId],
          'John Doe (Test)',
          'check_in',
          new Date(),
        );
        success = true;
      } else if (dto?.type === 'payment') {
        // Test payment notification
        await this.pushNotificationService.sendPaymentReminder(
          guardianId,
          'John Doe (Test)',
          5000,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        );
        success = true;
      } else if (dto?.type === 'announcement') {
        // Test announcement notification
        await this.pushNotificationService.sendAnnouncement(
          [guardianId],
          dto.title || 'School Announcement',
          dto.body || 'This is a test announcement from ANTE Guardian App',
        );
        success = true;
      } else {
        // Default test notification
        success =
          await this.pushNotificationService.testPushNotification(guardianId);
      }

      return {
        success,
        message: success
          ? 'Test push notification sent successfully'
          : 'Failed to send test push notification. Please check if you have enabled notifications.',
      };
    } catch (error) {
      console.error('Error sending test push notification:', error);
      return {
        success: false,
        message: 'Failed to send test push notification',
        error: error.message,
      };
    }
  }
}

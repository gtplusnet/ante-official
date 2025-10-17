import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { PrismaService } from '@common/prisma.service';
import { GuardianPushNotificationService } from '../guardian-mobile/services/guardian-push-notification.service';

class SendNotificationDTO {
  title: string;
  body: string;
  guardianIds: string[]; // Empty array means broadcast to all
}

@Controller('school/guardian/notifications')
export class GuardianNotificationController {
  constructor(
    private readonly utilityService: UtilityService,
    private readonly prisma: PrismaService,
    private readonly pushNotificationService: GuardianPushNotificationService,
  ) {}

  /**
   * Get list of subscribed guardians with push notification tokens
   */
  @Get('subscribers')
  async getSubscribers(@Res() res: Response) {
    try {
      const companyId = this.utilityService.companyId;

      // Get all guardian tokens with FCM tokens, grouped by guardian
      const guardianTokens = await this.prisma.guardianToken.findMany({
        where: {
          isRevoked: false,
          guardian: {
            companyId,
          },
        },
        include: {
          guardian: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Filter tokens that have FCM tokens and group by guardian
      const guardianMap = new Map();

      for (const token of guardianTokens) {
        const deviceInfo = token.deviceInfo as any;
        if (deviceInfo?.fcmToken) {
          const guardianId = token.guardian.id;

          if (!guardianMap.has(guardianId)) {
            guardianMap.set(guardianId, {
              guardianId: guardianId,
              firstName: token.guardian.firstName,
              lastName: token.guardian.lastName,
              email: token.guardian.email,
              devices: [],
            });
          }

          const guardian = guardianMap.get(guardianId);

          // Determine device type
          let deviceType = 'Web';
          if (deviceInfo.platform) {
            deviceType = deviceInfo.platform === 'ios' ? 'iOS' : 
                        deviceInfo.platform === 'android' ? 'Android' : 
                        'Web';
          } else if (deviceInfo.deviceType) {
            deviceType = deviceInfo.deviceType;
          }

          guardian.devices.push({
            deviceId: token.deviceId || 'Unknown',
            deviceType: deviceType,
            subscribedAt: token.createdAt,
            lastActive: token.updatedAt,
          });
        }
      }

      const subscribers = Array.from(guardianMap.values());

      return res.status(HttpStatus.OK).json({
        subscribers,
        totalSubscribers: subscribers.length,
        totalDevices: subscribers.reduce((sum, g) => sum + g.devices.length, 0),
      });
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch subscribers',
        error: error.message,
      });
    }
  }

  /**
   * Send custom notification to selected guardians or broadcast to all
   */
  @Post('send')
  async sendNotification(
    @Body() data: SendNotificationDTO,
    @Res() res: Response,
  ) {
    try {
      const { title, body, guardianIds } = data;

      // Validate input
      if (!title || !body) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Title and body are required',
        });
      }

      const companyId = this.utilityService.companyId;

      // Determine target guardians
      let targetGuardianIds: string[] = guardianIds;

      if (!guardianIds || guardianIds.length === 0) {
        // Broadcast to all subscribed guardians
        const allGuardians = await this.prisma.guardianToken.findMany({
          where: {
            isRevoked: false,
            guardian: {
              companyId,
            },
          },
          select: {
            guardianId: true,
            deviceInfo: true,
          },
        });

        // Filter guardians with FCM tokens
        const guardiansWithTokens = new Set<string>();
        for (const token of allGuardians) {
          const deviceInfo = token.deviceInfo as any;
          if (deviceInfo?.fcmToken) {
            guardiansWithTokens.add(token.guardianId);
          }
        }

        targetGuardianIds = Array.from(guardiansWithTokens);
      }

      if (targetGuardianIds.length === 0) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'No guardians to send notification to',
        });
      }

      // Send notification
      const notification = {
        title,
        body,
        data: {
          type: 'admin',
          timestamp: new Date().toISOString(),
        },
      };

      await this.pushNotificationService.sendToGuardians(
        targetGuardianIds,
        notification,
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        sentTo: targetGuardianIds.length,
        message: `Notification sent to ${targetGuardianIds.length} guardian(s)`,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send notification',
        error: error.message,
      });
    }
  }
}


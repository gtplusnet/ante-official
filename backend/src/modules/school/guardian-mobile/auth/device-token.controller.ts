import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GuardianAuthGuard } from './guardian-mobile-auth.guard';
import { PrismaService } from '@common/prisma.service';

export class RegisterDeviceTokenDto {
  token: string;
  platform?: string;
  deviceId?: string;
}

@Controller('api/guardian/device-token')
@UseGuards(GuardianAuthGuard)
export class GuardianDeviceTokenController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async registerDeviceToken(
    @Req() req: any,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    try {
      // Find the current guardian token
      const guardianToken = await this.prisma.guardianToken.findFirst({
        where: {
          guardianId: req.user.id,
          isRevoked: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!guardianToken) {
        return {
          success: false,
          message: 'No active session found',
        };
      }

      // Update the device info with FCM token
      const deviceInfo = (guardianToken.deviceInfo as any) || {};
      deviceInfo.fcmToken = dto.token;
      deviceInfo.platform = dto.platform || deviceInfo.platform;
      deviceInfo.deviceId = dto.deviceId || deviceInfo.deviceId;
      deviceInfo.fcmTokenUpdatedAt = new Date();

      await this.prisma.guardianToken.update({
        where: { id: guardianToken.id },
        data: { deviceInfo },
      });

      return {
        success: true,
        message: 'Device token registered successfully',
      };
    } catch (error) {
      console.error('Error registering device token:', error);
      return {
        success: false,
        message: 'Failed to register device token',
      };
    }
  }

  @Delete(':token')
  @HttpCode(HttpStatus.OK)
  async removeDeviceToken(@Req() req: any, @Param('token') token: string) {
    try {
      // Find all guardian tokens with this FCM token
      const guardianTokens = await this.prisma.guardianToken.findMany({
        where: {
          guardianId: req.user.id,
        },
      });

      // Remove FCM token from device info
      for (const guardianToken of guardianTokens) {
        const deviceInfo = (guardianToken.deviceInfo as any) || {};
        if (deviceInfo.fcmToken === token) {
          delete deviceInfo.fcmToken;
          delete deviceInfo.fcmTokenUpdatedAt;

          await this.prisma.guardianToken.update({
            where: { id: guardianToken.id },
            data: { deviceInfo },
          });
        }
      }

      return {
        success: true,
        message: 'Device token removed successfully',
      };
    } catch (error) {
      console.error('Error removing device token:', error);
      return {
        success: false,
        message: 'Failed to remove device token',
      };
    }
  }
}

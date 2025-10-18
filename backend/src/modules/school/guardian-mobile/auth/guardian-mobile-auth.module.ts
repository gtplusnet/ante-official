import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { GuardianMobileAuthController } from './guardian-mobile-auth.controller';
import { GuardianMobileAuthService } from './guardian-mobile-auth.service';
import { GuardianAuthGuard } from './guardian-mobile-auth.guard';
import { GuardianDeviceTokenController } from './device-token.controller';
import { GuardianPushNotificationTestController } from './push-notification-test.controller';
import { GuardianPushNotificationService } from '../services/guardian-push-notification.service';
import { GuardianNotificationsModule } from '../notifications/guardian-notifications.module';
import { PrismaService } from '@common/prisma.service';
import { EncryptionService } from '@common/encryption.service';
import { UtilityService } from '@common/utility.service';
import { TelegramService } from '@modules/communication/telegram/telegram/telegram.service';
import { winstonConfig } from '@common/logger';

@Module({
  imports: [
    ConfigModule,
    GuardianNotificationsModule,
    WinstonModule.forRoot({
      transports: winstonConfig.transports,
      format: winstonConfig.format,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>(
          'GUARDIAN_JWT_SECRET',
          'guardian-default-secret',
        ),
        signOptions: {
          expiresIn: configService.get<string>('GUARDIAN_JWT_EXPIRY', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    GuardianMobileAuthController,
    GuardianDeviceTokenController,
    GuardianPushNotificationTestController,
  ],
  providers: [
    GuardianMobileAuthService,
    GuardianAuthGuard,
    GuardianPushNotificationService,
    PrismaService,
    EncryptionService,
    UtilityService,
    TelegramService,
  ],
  exports: [
    GuardianMobileAuthService,
    GuardianAuthGuard,
    GuardianPushNotificationService,
  ],
})
export class GuardianMobileAuthModule { }

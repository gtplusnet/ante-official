import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Sub-modules
import { GuardianMobileAuthModule } from './auth/guardian-mobile-auth.module';
import { GuardianProfileModule } from './profile/guardian-profile.module';
import { GuardianStudentsModule } from './students/guardian-students.module';
import { GuardianAttendanceModule } from './attendance/guardian-attendance.module';
import { GuardianNotificationsModule } from './notifications/guardian-notifications.module';
import { GuardianBillingModule } from './billing/guardian-billing.module';

@Module({
  imports: [
    ConfigModule,
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
    GuardianMobileAuthModule,
    GuardianProfileModule,
    GuardianStudentsModule,
    GuardianAttendanceModule,
    GuardianNotificationsModule,
    GuardianBillingModule,
  ],
  exports: [
    GuardianMobileAuthModule,
    GuardianProfileModule,
    GuardianStudentsModule,
    GuardianAttendanceModule,
    GuardianNotificationsModule,
    GuardianBillingModule,
  ],
})
export class GuardianMobileModule {}

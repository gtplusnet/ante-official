import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from '@common/common.module';
import { GuardianAuthGuard } from '../auth/guardian-mobile-auth.guard';
import {
  GuardianNotificationsController,
  GuardianNotificationsAliasController,
} from './guardian-notifications.controller';
import { GuardianNotificationsService } from './guardian-notifications.service';

@Module({
  imports: [
    CommonModule,
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
  ],
  controllers: [
    GuardianNotificationsController,
    GuardianNotificationsAliasController,
  ],
  providers: [GuardianNotificationsService, GuardianAuthGuard],
  exports: [GuardianNotificationsService],
})
export class GuardianNotificationsModule {}

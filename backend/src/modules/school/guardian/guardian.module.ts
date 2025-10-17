import { Module } from '@nestjs/common';
import { GuardianController } from './guardian.controller';
import { GuardianNotificationController } from './guardian-notification.controller';
import { GuardianService } from './guardian.service';
import { CommonModule } from '@common/common.module';
import { GuardianMobileAuthModule } from '../guardian-mobile/auth/guardian-mobile-auth.module';
import { GuardianNotificationsModule } from '../guardian-mobile/notifications/guardian-notifications.module';

@Module({
  imports: [CommonModule, GuardianMobileAuthModule, GuardianNotificationsModule],
  controllers: [GuardianController, GuardianNotificationController],
  providers: [GuardianService],
  exports: [GuardianService],
})
export class GuardianModule { }

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { DeviceLicenseMiddleware } from './middleware/device-license.middleware';
import { DeviceLicenseModule } from '../device-license/device-license.module';
import { StudentModule } from '../student/student.module';
import { GuardianModule } from '../guardian/guardian.module';
import { GuardianAttendanceModule } from '../guardian-mobile/attendance/guardian-attendance.module';
import { GuardianMobileAuthModule } from '../guardian-mobile/auth/guardian-mobile-auth.module';
import { SupabaseAuthService } from '@modules/auth/supabase-auth/supabase-auth.service';

@Module({
  imports: [
    CommonModule,
    DeviceLicenseModule,
    StudentModule,
    GuardianModule,
    GuardianAttendanceModule,
    GuardianMobileAuthModule,
  ],
  controllers: [SyncController],
  providers: [SyncService, DeviceLicenseMiddleware, SupabaseAuthService],
  exports: [SyncService],
})
export class SyncModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply DeviceLicenseMiddleware to all sync routes
    // This will run instead of the default AuthMiddleware
    consumer.apply(DeviceLicenseMiddleware).forRoutes(SyncController);
  }
}

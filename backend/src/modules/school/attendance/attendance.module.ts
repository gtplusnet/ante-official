import { forwardRef, Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { SocketModule } from '@modules/communication/socket/socket/socket.module';
import { GuardianMobileAuthModule } from '../guardian-mobile/auth/guardian-mobile-auth.module';

@Module({
  imports: [
    CommonModule,
    forwardRef(() => SocketModule),
    GuardianMobileAuthModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}

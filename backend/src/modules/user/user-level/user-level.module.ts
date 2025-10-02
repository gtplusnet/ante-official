import { Module } from '@nestjs/common';
import { UserLevelService } from './user-level.service';
import { UserLevelController } from './user-level.controller';
import { CommonModule } from '@common/common.module';
import { OTPModule } from '@modules/communication/otp/otp/otp.module';

@Module({
  imports: [CommonModule, OTPModule],
  controllers: [UserLevelController],
  providers: [UserLevelService],
})
export class UserLevelModule {}

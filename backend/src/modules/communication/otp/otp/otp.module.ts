import { Module } from '@nestjs/common';
import { OTPService } from './otp.service';
import { OTPController } from './otp.controller';
import { CommonModule } from '@common/common.module';

@Module({
  imports: [CommonModule],
  providers: [OTPService],
  controllers: [OTPController],
  exports: [OTPService],
})
export class OTPModule {}

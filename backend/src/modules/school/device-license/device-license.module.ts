import { Module } from '@nestjs/common';
import { DeviceLicenseController } from './device-license.controller';
import { DeviceLicenseService } from './device-license.service';
import { CommonModule } from '@common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [DeviceLicenseController],
  providers: [DeviceLicenseService],
  exports: [DeviceLicenseService],
})
export class DeviceLicenseModule {}

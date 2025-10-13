import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { POSDeviceController } from './pos-device.controller';
import { POSDeviceService } from './pos-device.service';

@Module({
  imports: [CommonModule],
  controllers: [POSDeviceController],
  providers: [POSDeviceService],
  exports: [POSDeviceService],
})
export class POSDeviceModule {}

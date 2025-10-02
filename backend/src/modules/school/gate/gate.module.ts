import { Module } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { GateController } from './gate.controller';
import { SchoolGatePublicController } from './school-gate-public.controller';
import { GateService } from './gate.service';
import { DeviceLicenseModule } from '../device-license/device-license.module';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [CommonModule, DeviceLicenseModule, AttendanceModule],
  controllers: [GateController, SchoolGatePublicController],
  providers: [GateService],
  exports: [GateService],
})
export class GateModule {}

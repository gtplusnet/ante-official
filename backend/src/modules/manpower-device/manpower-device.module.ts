import { Module, forwardRef } from '@nestjs/common';
import { CommonModule } from '@common/common.module';
import { ManpowerDeviceController } from './manpower-device.controller';
import { ManpowerDeviceService } from './manpower-device.service';
import { ManpowerDevicePublicController } from './manpower-device-public.controller';
import { ManpowerQueueController } from './controllers/manpower-queue.controller';
import { ManpowerQueueService } from './services/manpower-queue.service';
import { ManpowerQueueProcessorService } from './services/manpower-queue-processor.service';
import { RedisModule } from '@infrastructure/redis/redis.module';
import { HrConfigurationModule } from '@modules/hr/configuration/hr-configuration/hr-configuration.module';
import { HrisModule } from '../../hris/hris.module';
import { QueueModule } from '@infrastructure/queue/queue/queue.module';
import { AttendanceConflictsModule } from '@modules/hr/timekeeping/attendance-conflicts/attendance-conflicts.module';
import { HrisComputationModule } from '@modules/hr/computation/hris-computation/hris-computation.module';
import { HrFilingModule } from '@modules/hr/filing/hr-filing/hr-filing.module';

@Module({
  imports: [
    CommonModule,
    RedisModule,
    forwardRef(() => HrConfigurationModule),
    forwardRef(() => HrisModule),
    forwardRef(() => QueueModule),
    AttendanceConflictsModule,
    forwardRef(() => HrisComputationModule),
    forwardRef(() => HrFilingModule),
  ],
  controllers: [
    ManpowerDeviceController,
    ManpowerDevicePublicController,
    ManpowerQueueController,
  ],
  providers: [
    ManpowerDeviceService,
    ManpowerQueueService,
    ManpowerQueueProcessorService,
  ],
  exports: [
    ManpowerDeviceService,
    ManpowerQueueService,
  ],
})
export class ManpowerDeviceModule {}
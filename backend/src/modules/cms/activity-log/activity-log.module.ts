import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogService } from './activity-log.service';
import { ActivityLog, ActivityLogSchema } from '../schemas/activity-log.schema';
import { CommonModule } from '@common/common.module';
import { CacheConfigModule } from '@infrastructure/cache/cache.module';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: ActivityLog.name, schema: ActivityLogSchema }],
      'mongo',
    ),
    CommonModule,
    CacheConfigModule,
  ],
  controllers: [ActivityLogController],
  providers: [ActivityLogService],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}

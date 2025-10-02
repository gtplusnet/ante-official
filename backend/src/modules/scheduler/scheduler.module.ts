import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '@common/common.module';
import { MongoDbModule } from '@infrastructure/mongodb/mongodb.module';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { SchedulerRegistryService } from './scheduler-registry.service';
import { SchedulerExecutorService } from './scheduler-executor.service';
import { SchedulerMongoService } from './mongodb/scheduler-mongo.service';
import { SchedulerExecutionMongoService } from './mongodb/scheduler-execution-mongo.service';
import {
  SchedulerMongo,
  SchedulerMongoSchema,
} from './mongodb/scheduler-mongo.schema';
import {
  SchedulerExecutionMongo,
  SchedulerExecutionMongoSchema,
} from './mongodb/scheduler-execution-mongo.schema';
import { DatabaseCleanupTask } from './tasks/database-cleanup.task';
import { ReportGenerationTask } from './tasks/report-generation.task';
import { LogCleanupTask } from './tasks/log-cleanup.task';
import { TimekeepingDailyProcessingTask } from './tasks/timekeeping-daily-processing.task';
import { CutoffDateRangeGenerationTask } from './tasks/cutoff-date-range-generation.task';
import { HrisAccountCheckTask } from './tasks/hris-account-check.task';
import { QueueModule } from '@infrastructure/queue/queue/queue.module';
import { ActionCenterModule } from '@modules/hr/action-center/action-center.module';
import { HrConfigurationModule } from '@modules/hr/configuration/hr-configuration/hr-configuration.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CommonModule,
    MongoDbModule,
    QueueModule,
    ActionCenterModule,
    forwardRef(() => HrConfigurationModule),
    MongooseModule.forFeature(
      [
        { name: SchedulerMongo.name, schema: SchedulerMongoSchema },
        {
          name: SchedulerExecutionMongo.name,
          schema: SchedulerExecutionMongoSchema,
        },
      ],
      'mongo',
    ),
  ],
  controllers: [SchedulerController],
  providers: [
    SchedulerService,
    SchedulerRegistryService,
    SchedulerExecutorService,
    SchedulerMongoService,
    SchedulerExecutionMongoService,
    DatabaseCleanupTask,
    ReportGenerationTask,
    LogCleanupTask,
    TimekeepingDailyProcessingTask,
    CutoffDateRangeGenerationTask,
    HrisAccountCheckTask,
  ],
  exports: [
    SchedulerService,
    SchedulerMongoService,
    SchedulerExecutionMongoService,
  ],
})
export class SchedulerModule {}

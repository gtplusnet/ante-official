import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TaskQueueProcessor } from './processors/task-queue.processor';
import { TaskScriptExecutorService } from '../../services/task-script-executor.service';
import { PrismaService } from '@common/prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationModule } from '@modules/communication/notification/notification/notification.module';
import { DiscussionModule } from '@modules/communication/discussion/discussion/discussion.module';
import { SocketModule } from '@modules/communication/socket/socket/socket.module';
@Module({
  imports: [
    ConfigModule,
    EventEmitterModule,
    NotificationModule,
    DiscussionModule,
    SocketModule,
    BullModule.registerQueueAsync({
      name: 'task-processing',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 100,      // Keep last 100 completed jobs
          },
          removeOnFail: {
            age: 48 * 3600,  // Keep failed jobs for 48 hours
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    TaskQueueProcessor,
    TaskScriptExecutorService,
    PrismaService,
  ],
  exports: [BullModule],
})
export class TaskQueueModule {
  constructor() {
    console.log('[TaskQueueModule] Initialized');
  }
}
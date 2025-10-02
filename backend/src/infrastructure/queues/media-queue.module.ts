import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/prisma.service';
import { MediaProcessorModule } from '../media-processor/media-processor.module';
import { StorageModule } from '../storage/storage.module';
import { MediaQueueProcessor } from './processors/media-queue.processor';
import { QueueService } from './services/queue.service';

@Module({
  imports: [
    MediaProcessorModule,
    StorageModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'redis'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 50,
          removeOnFail: 100,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: 'media-processing',
      },
      {
        name: 'media-optimization',
      },
      {
        name: 'video-transcoding',
      },
    ),
  ],
  providers: [PrismaService, ...MediaQueueProcessor, QueueService],
  exports: [BullModule, QueueService],
})
export class MediaQueueModule {}

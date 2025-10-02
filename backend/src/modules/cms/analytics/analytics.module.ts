import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { ContentType, ContentTypeSchema } from '../schemas/content-type.schema';
import { ActivityLog, ActivityLogSchema } from '../schemas/activity-log.schema';
import { ApiUsage, ApiUsageSchema } from '../schemas/api-usage.schema';
import { ApiToken, ApiTokenSchema } from '../schemas/api-token.schema';
import { CommonModule } from '@common/common.module';
import { CacheConfigModule } from '@infrastructure/cache/cache.module';

@Module({
  imports: [
    CommonModule,
    CacheConfigModule,
    MongooseModule.forFeature(
      [
        { name: ContentType.name, schema: ContentTypeSchema },
        { name: ActivityLog.name, schema: ActivityLogSchema },
        { name: ApiUsage.name, schema: ApiUsageSchema },
        { name: ApiToken.name, schema: ApiTokenSchema },
      ],
      'mongo',
    ),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheConfigModule } from '@infrastructure/cache/cache.module';
import { CommonModule } from '@common/common.module';
import { ContentTypesModule } from './content-types/content-types.module';
import { ContentModule } from './content/content.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { ApiTokenModule } from './api-tokens/api-token.module';
import { WebhookModule } from './webhooks/webhook.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FieldsModule } from './fields/fields.module';
import { MigrationModule } from './migration/migration.module';
import { PublicCmsModule } from './public/public-cms.module';

// Import schemas
import { ContentType, ContentTypeSchema } from './schemas/content-type.schema';
import {
  ContentEntry,
  ContentEntrySchema,
} from './schemas/content-entry.schema';
import { ActivityLog, ActivityLogSchema } from './schemas/activity-log.schema';
import { ApiToken, ApiTokenSchema } from './schemas/api-token.schema';
import { Webhook, WebhookSchema } from './schemas/webhook.schema';

@Module({
  imports: [
    // Core dependencies
    CommonModule,
    CacheConfigModule,

    // CMS feature modules (schemas are defined within each module)
    ActivityLogModule, // Import this first as others depend on it
    FieldsModule, // Import early as ContentTypes depends on it
    MigrationModule, // Migration utilities
    ContentTypesModule,
    ContentModule,
    ApiTokenModule,
    WebhookModule,
    AnalyticsModule,
    PublicCmsModule,
  ],
  exports: [
    FieldsModule,
    MigrationModule,
    ContentTypesModule,
    ContentModule,
    ActivityLogModule,
    ApiTokenModule,
    WebhookModule,
    AnalyticsModule,
    PublicCmsModule,
  ],
})
export class CMSModule {}

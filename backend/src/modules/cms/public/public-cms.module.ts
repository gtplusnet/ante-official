import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicCmsController } from './public-cms.controller';
import { ContentModule } from '../content/content.module';
import { ContentTypesModule } from '../content-types/content-types.module';
import { ApiTokenModule } from '../api-tokens/api-token.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CommonModule } from '@common/common.module';
import { PublicResponseFormatterService } from './public-response-formatter.service';
import { ApiTrackingInterceptor } from '../interceptors/api-tracking.interceptor';
import { ApiUsage, ApiUsageSchema } from '../schemas/api-usage.schema';

@Module({
  imports: [
    CommonModule,
    ContentModule, // Import to use ContentService
    ContentTypesModule, // Import to use ContentTypesService
    ApiTokenModule, // Import to use ApiTokenService
    AnalyticsModule, // Import to use AnalyticsService for API tracking
    MongooseModule.forFeature(
      [{ name: ApiUsage.name, schema: ApiUsageSchema }],
      'mongo',
    ), // Required for ApiTrackingInterceptor
  ],
  controllers: [PublicCmsController],
  providers: [PublicResponseFormatterService, ApiTrackingInterceptor],
  exports: [PublicResponseFormatterService],
})
export class PublicCmsModule {}

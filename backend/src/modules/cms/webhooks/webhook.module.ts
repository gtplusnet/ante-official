import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { Webhook, WebhookSchema } from '../schemas/webhook.schema';
import { CommonModule } from '@common/common.module';
import { CacheConfigModule } from '@infrastructure/cache/cache.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Webhook.name, schema: WebhookSchema }],
      'mongo',
    ),
    CommonModule,
    CacheConfigModule,
    forwardRef(() => ActivityLogModule),
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}

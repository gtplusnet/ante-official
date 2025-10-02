import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import {
  ContentEntry,
  ContentEntrySchema,
} from '../schemas/content-entry.schema';
import { CommonModule } from '@common/common.module';
import { CacheConfigModule } from '@infrastructure/cache/cache.module';
import { WebhookModule } from '../webhooks/webhook.module';
import { ContentTypesModule } from '../content-types/content-types.module';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: ContentEntry.name, schema: ContentEntrySchema }],
      'mongo',
    ),
    CommonModule,
    CacheConfigModule,
    WebhookModule,
    ContentTypesModule,
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}

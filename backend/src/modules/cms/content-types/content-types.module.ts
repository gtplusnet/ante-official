import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentTypesController } from './content-types.controller';
import { ContentTypesService } from './content-types.service';
import { ContentType, ContentTypeSchema } from '../schemas/content-type.schema';
import { CacheConfigModule } from '@infrastructure/cache/cache.module';
import { CommonModule } from '@common/common.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { FieldsModule } from '../fields/fields.module';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: ContentType.name, schema: ContentTypeSchema }],
      'mongo',
    ),
    CacheConfigModule,
    CommonModule,
    FieldsModule,
    forwardRef(() => ActivityLogModule),
  ],
  controllers: [ContentTypesController],
  providers: [ContentTypesService],
  exports: [ContentTypesService],
})
export class ContentTypesModule {}

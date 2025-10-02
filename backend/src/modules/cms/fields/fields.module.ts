import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FieldsService } from './fields.service';
import { Field, FieldSchema } from '../schemas/field.schema';
import { CacheConfigModule } from '@infrastructure/cache/cache.module';
import { CommonModule } from '@common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Field.name, schema: FieldSchema }],
      'mongo',
    ),
    CacheConfigModule,
    CommonModule,
  ],
  providers: [FieldsService],
  exports: [FieldsService],
})
export class FieldsModule {}

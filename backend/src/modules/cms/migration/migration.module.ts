import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MigrateFieldsScript } from './migrate-fields.script';
import { Field, FieldSchema } from '../schemas/field.schema';
import { ContentType, ContentTypeSchema } from '../schemas/content-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Field.name, schema: FieldSchema },
        { name: ContentType.name, schema: ContentTypeSchema },
      ],
      'mongo',
    ),
  ],
  providers: [MigrateFieldsScript],
  exports: [MigrateFieldsScript],
})
export class MigrationModule {}

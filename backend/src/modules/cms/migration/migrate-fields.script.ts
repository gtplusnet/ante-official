import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import {
  ContentType,
  ContentTypeDocument,
} from '../schemas/content-type.schema';
import { Field, FieldDocument } from '../schemas/field.schema';

@Injectable()
export class MigrateFieldsScript {
  private readonly logger = new Logger(MigrateFieldsScript.name);

  constructor(
    @InjectModel(ContentType.name, 'mongo')
    private contentTypeModel: Model<ContentTypeDocument>,
    @InjectModel(Field.name, 'mongo')
    private fieldModel: Model<FieldDocument>,
    @InjectConnection('mongo')
    private mongoConnection: Connection,
  ) {}

  async migrateEmbeddedFieldsToCollection(): Promise<void> {
    this.logger.log(
      'Starting migration of embedded fields to separate collection...',
    );

    let migratedCount = 0;
    let totalFieldsCount = 0;

    try {
      // Find all content types with embedded fields
      const contentTypes = await this.contentTypeModel.find({
        fields: { $exists: true, $ne: [] },
        deletedAt: null,
      });

      this.logger.log(
        `Found ${contentTypes.length} content types with embedded fields`,
      );

      for (const contentType of contentTypes) {
        const { fields = [] } = contentType;
        totalFieldsCount += fields.length;

        if (fields.length > 0) {
          this.logger.log(
            `Migrating ${fields.length} fields for content type: ${contentType.name} (${contentType._id})`,
          );

          // Check if fields already exist in separate collection
          const existingFields = await this.fieldModel.find({
            contentTypeId: contentType._id,
            companyId: contentType.companyId,
          });

          if (existingFields.length > 0) {
            this.logger.log(
              `  Skipping content type ${contentType.name} - fields already migrated`,
            );
            continue;
          }

          // Create field documents in separate collection
          const fieldDocuments = fields.map((field, index) => ({
            contentTypeId: contentType._id,
            companyId: contentType.companyId,
            position: index,
            id: field.id || `field_${field.name}_${index}`,
            name: field.name,
            displayName: field.displayName || field.name,
            type: field.type,
            required: field.required || false,
            unique: field.unique || false,
            private: field.private || false,
            searchable:
              field.searchable !== undefined ? field.searchable : true,
            sortable: field.sortable !== undefined ? field.sortable : true,
            repeatable: field.repeatable || false,
            defaultValue: field.defaultValue,
            size: field.size || 'full',
            validations: field.validations || [],
            minLength: field.minLength,
            maxLength: field.maxLength,
            min: field.min,
            max: field.max,
            enumValues: field.enumValues || [],
            targetContentType: field.targetContentType,
            relationType: field.relationType,
            allowedTypes: field.allowedTypes || [],
            component: field.component,
            components: field.components || [],
            placeholder: field.placeholder,
            hint: field.hint,
            tooltip: field.tooltip,
            disabled: field.disabled || false,
            readonly: field.readonly || false,
            createdBy: contentType.createdBy,
            updatedBy: contentType.updatedBy,
            createdAt: contentType.createdAt || new Date(),
            updatedAt: contentType.updatedAt || new Date(),
          }));

          // Insert field documents
          await this.fieldModel.insertMany(fieldDocuments);

          this.logger.log(
            `  Successfully migrated ${fieldDocuments.length} fields for content type: ${contentType.name}`,
          );
          migratedCount++;
        }
      }

      this.logger.log(`Migration completed successfully!`);
      this.logger.log(`- Content types processed: ${contentTypes.length}`);
      this.logger.log(`- Content types migrated: ${migratedCount}`);
      this.logger.log(`- Total fields migrated: ${totalFieldsCount}`);
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    }
  }

  async verifyMigration(): Promise<void> {
    this.logger.log('Verifying field migration...');

    const contentTypes = await this.contentTypeModel.find({
      fields: { $exists: true, $ne: [] },
      deletedAt: null,
    });

    let verificationIssues = 0;

    for (const contentType of contentTypes) {
      const embeddedFieldsCount = contentType.fields?.length || 0;
      const separateFieldsCount = await this.fieldModel.countDocuments({
        contentTypeId: contentType._id,
        companyId: contentType.companyId,
        deletedAt: { $exists: false },
      });

      if (embeddedFieldsCount !== separateFieldsCount) {
        this.logger.warn(
          `Verification issue for content type ${contentType.name}:`,
        );
        this.logger.warn(`  Embedded fields: ${embeddedFieldsCount}`);
        this.logger.warn(
          `  Separate collection fields: ${separateFieldsCount}`,
        );
        verificationIssues++;
      } else {
        this.logger.log(
          `✓ Content type ${contentType.name}: ${separateFieldsCount} fields match`,
        );
      }
    }

    if (verificationIssues === 0) {
      this.logger.log(
        '✅ Migration verification passed - all fields migrated correctly!',
      );
    } else {
      this.logger.error(
        `❌ Migration verification failed - ${verificationIssues} content types have mismatched field counts`,
      );
    }
  }

  async rollbackMigration(): Promise<void> {
    this.logger.warn(
      'Rolling back migration - deleting all migrated fields...',
    );

    const result = await this.fieldModel.deleteMany({});
    this.logger.log(
      `Deleted ${result.deletedCount} fields from separate collection`,
    );

    this.logger.log('Migration rollback completed');
  }
}

// Standalone script execution
if (require.main === module) {
  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('../../../app.module');

  async function runMigration() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const migrationScript = app.get(MigrateFieldsScript);

    try {
      console.log('🚀 Starting field migration...');
      await migrationScript.migrateEmbeddedFieldsToCollection();

      console.log('🔍 Verifying migration...');
      await migrationScript.verifyMigration();

      console.log('✅ Migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    } finally {
      await app.close();
    }
  }

  runMigration();
}

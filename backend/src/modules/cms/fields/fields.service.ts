import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Field, FieldDocument } from '../schemas/field.schema';
import { FieldDefinition } from '../common/interfaces/cms.interface';
import { CacheService } from '@infrastructure/cache/cache.service';
import { UtilityService } from '@common/utility.service';

@Injectable()
export class FieldsService {
  constructor(
    @InjectModel(Field.name, 'mongo')
    private readonly fieldModel: Model<FieldDocument>,
    private readonly cacheService: CacheService,
    private readonly utility: UtilityService,
  ) {}

  /**
   * Get all fields for a content type, ordered by position
   */
  async getFieldsByContentType(
    contentTypeId: string | ObjectId,
    companyId: number,
  ): Promise<FieldDocument[]> {
    return this.fieldModel
      .find({
        contentTypeId,
        companyId,
        deletedAt: { $exists: false },
      })
      .sort({ position: 1 })
      .exec();
  }

  /**
   * Create a new field
   */
  async createField(
    contentTypeId: string | ObjectId,
    companyId: number,
    fieldData: Partial<FieldDefinition>,
    userId: string,
  ): Promise<FieldDocument> {
    console.log('[CMS DEBUG] Creating new field:', {
      contentTypeId,
      fieldData,
    });

    // Get the next position
    const nextPosition = await this.getNextPosition(contentTypeId, companyId);

    const field = new this.fieldModel({
      contentTypeId,
      companyId,
      ...fieldData,
      position: nextPosition,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedField = await field.save();
    console.log('[CMS DEBUG] Field created successfully:', {
      fieldId: savedField._id,
      position: nextPosition,
    });

    return savedField;
  }

  /**
   * Update a field
   */
  async updateField(
    fieldId: string,
    companyId: number,
    fieldData: Partial<FieldDefinition>,
    userId: string,
  ): Promise<FieldDocument> {
    console.log('[CMS DEBUG] Updating field:', { fieldId, fieldData });

    const updatedField = await this.fieldModel
      .findOneAndUpdate(
        {
          id: fieldId,
          companyId,
          deletedAt: { $exists: false },
        },
        {
          ...fieldData,
          updatedBy: userId,
          updatedAt: new Date(),
        },
        { new: true },
      )
      .exec();

    if (!updatedField) {
      throw new NotFoundException(`Field with ID ${fieldId} not found`);
    }

    console.log('[CMS DEBUG] Field updated successfully:', {
      fieldId: updatedField.id,
      updatedSize: updatedField.size,
      updatedAt: updatedField.updatedAt,
    });

    // Clear cache for the content type that owns this field
    const contentTypeId = updatedField.contentTypeId.toString();
    await this.cacheService.invalidateContentType(companyId, contentTypeId);
    await this.cacheService.invalidateQueries(companyId, 'content-types');

    console.log('[CMS DEBUG] Cache invalidated for content type:', {
      contentTypeId,
      companyId,
    });

    return updatedField;
  }

  /**
   * Delete a field
   */
  async deleteField(
    fieldId: string,
    companyId: number,
    userId: string,
  ): Promise<void> {
    console.log('[CMS DEBUG] Deleting field:', { fieldId });

    const field = await this.fieldModel
      .findOneAndUpdate(
        {
          id: fieldId,
          companyId,
          deletedAt: { $exists: false },
        },
        {
          deletedAt: new Date(),
          updatedBy: userId,
          updatedAt: new Date(),
        },
      )
      .exec();

    if (!field) {
      throw new NotFoundException(`Field with ID ${fieldId} not found`);
    }

    console.log('[CMS DEBUG] Field deleted successfully:', { fieldId });
  }

  /**
   * Reorder fields
   */
  async reorderFields(
    contentTypeId: string | ObjectId,
    companyId: number,
    fieldIds: string[],
    userId: string,
  ): Promise<FieldDocument[]> {
    console.log('[CMS DEBUG] Reordering fields:', { contentTypeId, fieldIds });

    // Update positions based on the new order
    const updatePromises = fieldIds.map((fieldId, index) =>
      this.fieldModel
        .findOneAndUpdate(
          {
            id: fieldId,
            contentTypeId,
            companyId,
            deletedAt: { $exists: false },
          },
          {
            position: index,
            updatedBy: userId,
            updatedAt: new Date(),
          },
          { new: true },
        )
        .exec(),
    );

    const updatedFields = await Promise.all(updatePromises);

    // Filter out null values (fields not found)
    const validFields = updatedFields.filter((field) => field !== null);

    if (validFields.length !== fieldIds.length) {
      throw new BadRequestException(
        'Some fields were not found during reordering',
      );
    }

    console.log('[CMS DEBUG] Fields reordered successfully');
    return validFields;
  }

  /**
   * Get a single field by ID
   */
  async getField(fieldId: string, companyId: number): Promise<FieldDocument> {
    const field = await this.fieldModel
      .findOne({
        id: fieldId,
        companyId,
        deletedAt: { $exists: false },
      })
      .exec();

    if (!field) {
      throw new NotFoundException(`Field with ID ${fieldId} not found`);
    }

    return field;
  }

  /**
   * Get the next position for a new field in a content type
   */
  private async getNextPosition(
    contentTypeId: string | ObjectId,
    companyId: number,
  ): Promise<number> {
    const lastField = await this.fieldModel
      .findOne({
        contentTypeId,
        companyId,
        deletedAt: { $exists: false },
      })
      .sort({ position: -1 })
      .exec();

    return lastField ? lastField.position + 1 : 0;
  }

  /**
   * Convert field document to FieldDefinition interface
   */
  fieldToDefinition(field: FieldDocument): FieldDefinition {
    return {
      id: field.id,
      name: field.name,
      displayName: field.displayName,
      type: field.type,
      required: field.required,
      unique: field.unique,
      private: field.private,
      searchable: field.searchable,
      sortable: field.sortable,
      repeatable: field.repeatable,
      defaultValue: field.defaultValue,
      size: field.size as 'full' | 'two-thirds' | 'half' | 'third',
      validations: field.validations,
      minLength: field.minLength,
      maxLength: field.maxLength,
      min: field.min,
      max: field.max,
      enumValues: field.enumValues,
      targetContentType: field.targetContentType,
      relationType: field.relationType as any,
      allowedTypes: field.allowedTypes,
      component: field.component,
      components: field.components,
      placeholder: field.placeholder,
      hint: field.hint,
      tooltip: field.tooltip,
      disabled: field.disabled,
      readonly: field.readonly,
    };
  }

  /**
   * Convert multiple field documents to FieldDefinition interfaces
   */
  fieldsToDefinitions(fields: FieldDocument[]): FieldDefinition[] {
    return fields.map((field) => this.fieldToDefinition(field));
  }
}

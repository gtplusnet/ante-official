import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import {
  ContentType,
  ContentTypeDocument,
} from '../schemas/content-type.schema';
import { CreateContentTypeDto } from './dto/create-content-type.dto';
import { UpdateContentTypeDto } from './dto/update-content-type.dto';
import { QueryContentTypeDto } from './dto/query-content-type.dto';
import { CacheService } from '@infrastructure/cache/cache.service';
import { UtilityService } from '@common/utility.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { FieldsService } from '../fields/fields.service';
import {
  PaginatedResponse,
  FieldDefinition,
  ContentTypeType,
} from '../common/interfaces/cms.interface';

@Injectable()
export class ContentTypesService {
  constructor(
    @InjectModel(ContentType.name, 'mongo')
    private contentTypeModel: Model<ContentTypeDocument>,
    @InjectConnection('mongo')
    private mongoConnection: Connection,
    private cacheService: CacheService,
    private utility: UtilityService,
    private fieldsService: FieldsService,
    @Inject(forwardRef(() => ActivityLogService))
    private activityLogService: ActivityLogService,
  ) {}

  async create(dto: CreateContentTypeDto): Promise<ContentType> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    // Auto-generate name if empty (for frontend compatibility)
    let finalName = dto.name;
    if (!finalName && dto.singularName) {
      finalName = dto.singularName;
    }

    // Validate that we have a name after generation
    if (!finalName) {
      throw new BadRequestException('Name or singularName is required');
    }

    // Validate unique name within company
    const existing = await this.contentTypeModel.findOne({
      companyId,
      name: finalName,
      deletedAt: null,
    });

    if (existing) {
      throw new ConflictException('Content type name already exists');
    }

    // Fields are now managed separately via Field endpoints

    // Transform frontend compatibility fields to proper settings structure
    const transformedSettings = {
      draftAndPublish: dto.draftPublish !== undefined ? dto.draftPublish : true,
      versionable: false,
      localizable:
        dto.internationalization !== undefined
          ? dto.internationalization
          : false,
      softDelete: true,
      timestamps: true,
      reviewWorkflow: false,
      ...dto.settings, // Override with explicit settings if provided
    };

    // Create content type without the compatibility fields
    const { draftPublish, internationalization, ...cleanDto } = dto;

    const contentType = new this.contentTypeModel({
      ...cleanDto,
      name: finalName, // Use the generated/validated name
      companyId,
      createdBy: userId,
      updatedBy: userId,
      // Fields are managed separately in cms_fields collection
      settings: transformedSettings,
      permissions: {
        create: [],
        read: [],
        update: [],
        delete: [],
        publish: [],
        ...dto.permissions,
      },
    });

    // Save content type
    const saved = await contentType.save();

    // Fields are now added separately via POST /cms/content-types/:id/fields endpoint

    // Create dynamic collection and indexes if it is a collection type
    if (dto.type === ContentTypeType.COLLECTION) {
      await this.createDynamicIndexes(saved);
    }

    // Log activity
    if (this.activityLogService) {
      await this.activityLogService.logContentTypeActivity(
        'create',
        saved,
        null,
        { source: 'web' },
      );
    }
    return saved;
  }

  async findAll(
    query: QueryContentTypeDto,
  ): Promise<PaginatedResponse<ContentType>> {
    const companyId = this.utility.companyId;

    // Build filter
    const filter: any = {
      companyId,
      // Only include archived items if specifically requested
      ...(query.includeArchived
        ? {} // Include both active and archived
        : { deletedAt: null }), // Only active
      ...(query.type && { type: query.type }),
      ...(query.category && { category: query.category }),
      ...(query.search && {
        $or: [
          { name: new RegExp(query.search, 'i') },
          { displayName: new RegExp(query.search, 'i') },
          { description: new RegExp(query.search, 'i') },
        ],
      }),
    };

    // Build sort
    const sort = query.sort || { createdAt: -1 };

    // Execute query with pagination
    const [items, total] = await Promise.all([
      this.contentTypeModel
        .find(filter, query.fields ? query.fields.join(' ') : '')
        .sort(sort)
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean(),
      this.contentTypeModel.countDocuments(filter),
    ]);

    // Populate fields from separate collection for each content type
    const populatedItems = await Promise.all(
      items.map(async (contentType) => {
        try {
          const fields = await this.fieldsService.getFieldsByContentType(
            contentType._id,
            companyId,
          );
          const fieldDefinitions =
            this.fieldsService.fieldsToDefinitions(fields);

          console.log(
            '[CMS DEBUG] findAll - Populating fields for content type:',
            {
              contentTypeId: contentType._id,
              contentTypeName: contentType.name,
              separateFieldsCount: fieldDefinitions.length,
              usingSource: 'separate collection only',
            },
          );

          return {
            ...contentType,
            fields: fieldDefinitions,
          };
        } catch (error) {
          console.error(
            '[CMS DEBUG] Error populating fields for content type:',
            contentType._id,
            error,
          );
          // Return content type with empty fields array if error occurs
          return {
            ...contentType,
            fields: [],
          };
        }
      }),
    );

    const response = {
      data: populatedItems,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        pageCount: Math.ceil(total / query.pageSize),
      },
    };

    return response;
  }

  async findOne(id: string): Promise<ContentType> {
    const companyId = this.utility.companyId;

    const contentType = await this.contentTypeModel.findOne({
      _id: id,
      companyId,
      deletedAt: null,
    });

    if (!contentType) {
      throw new NotFoundException('Content type not found');
    }

    // Populate fields from separate collection
    const fields = await this.fieldsService.getFieldsByContentType(
      id,
      companyId,
    );
    const fieldDefinitions = this.fieldsService.fieldsToDefinitions(fields);

    console.log('[CMS DEBUG] Content type fields populated:', {
      contentTypeId: id,
      separateFieldsCount: fieldDefinitions.length,
      firstField:
        fieldDefinitions.length > 0
          ? {
              id: fieldDefinitions[0].id,
              name: fieldDefinitions[0].name,
              size: fieldDefinitions[0].size,
            }
          : null,
      usingSource: 'separate collection only',
    });

    // Create enhanced content type with populated fields from separate collection only
    const populatedContentType = {
      ...contentType.toObject(),
      fields: fieldDefinitions,
    };

    console.log('[CMS DEBUG] Final populated content type first field:', {
      finalFirstField:
        populatedContentType.fields?.length > 0
          ? {
              id: populatedContentType.fields[0].id,
              name: populatedContentType.fields[0].name,
              size: populatedContentType.fields[0].size,
            }
          : null,
      usingSource: 'separate collection only',
    });

    return populatedContentType;
  }

  async findByName(name: string): Promise<ContentType> {
    const companyId = this.utility.companyId;

    const contentType = await this.contentTypeModel.findOne({
      name,
      companyId,
      deletedAt: null,
    });

    if (!contentType) {
      throw new NotFoundException(`Content type "${name}" not found`);
    }

    // Populate fields from separate collection
    const fields = await this.fieldsService.getFieldsByContentType(
      contentType._id,
      companyId,
    );
    const fieldDefinitions = this.fieldsService.fieldsToDefinitions(fields);

    console.log('[CMS DEBUG] findByName - Content type fields populated:', {
      contentTypeName: name,
      contentTypeId: contentType._id,
      separateFieldsCount: fieldDefinitions.length,
      usingSource: 'separate collection only',
    });

    // Create enhanced content type with populated fields from separate collection only
    const populatedContentType = {
      ...contentType.toObject(),
      fields: fieldDefinitions,
    };

    return populatedContentType;
  }

  async update(id: string, dto: UpdateContentTypeDto): Promise<ContentType> {
    const companyId = this.utility.companyId;

    const userId = this.utility.accountInformation.id;

    const contentType = await this.findOne(id);

    // Save original for change tracking
    const original = JSON.parse(JSON.stringify(contentType));

    // Check for name conflicts if name is being changed
    if (dto.name && dto.name !== contentType.name) {
      const existing = await this.contentTypeModel.findOne({
        companyId,
        name: dto.name,
        _id: { $ne: id },
        deletedAt: null,
      });

      if (existing) {
        throw new ConflictException('Content type name already exists');
      }
    }

    // Fields are now managed separately via Field endpoints

    // Transform frontend compatibility fields to proper settings structure
    const updateData: any = { ...dto };

    if (
      dto.draftPublish !== undefined ||
      dto.internationalization !== undefined
    ) {
      // If frontend compatibility fields are provided, transform them
      updateData.settings = {
        ...contentType.settings, // Keep existing settings
        ...dto.settings, // Apply any explicit settings
      };

      if (dto.draftPublish !== undefined) {
        updateData.settings.draftAndPublish = dto.draftPublish;
      }
      if (dto.internationalization !== undefined) {
        updateData.settings.localizable = dto.internationalization;
      }

      // Remove compatibility fields from update data
      delete updateData.draftPublish;
      delete updateData.internationalization;
    }

    // Update content type
    const updatedContentType = await this.contentTypeModel.findOneAndUpdate(
      { _id: id, companyId },
      {
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!updatedContentType) {
      throw new NotFoundException('Content type not found');
    }

    // Index updates are handled automatically when fields are modified via Field endpoints

    // Clear cache

    // Log activity
    if (this.activityLogService) {
      const changes = this.activityLogService.createChangesDiff(
        original,
        JSON.parse(JSON.stringify(updatedContentType)),
      );
      await this.activityLogService.logContentTypeActivity(
        'update',
        updatedContentType,
        changes,
        { source: 'web' },
      );
    }

    return updatedContentType;
  }

  async remove(id: string): Promise<ContentType> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    const contentType = await this.findOne(id);

    // Check if content type has content entries
    if (contentType.type === ContentTypeType.COLLECTION) {
      const hasContent = await this.hasContentEntries(contentType.name);
      if (hasContent) {
        throw new BadRequestException(
          'Cannot delete content type that has content entries. Delete all entries first.',
        );
      }
    }

    // Soft delete
    const deleted = await this.contentTypeModel.findOneAndUpdate(
      { _id: id, companyId },
      {
        deletedAt: new Date(),
        updatedBy: userId,
      },
      { new: true },
    );

    if (!deleted) {
      throw new NotFoundException('Content type not found');
    }

    // Drop dynamic collection if exists
    if (contentType.type === ContentTypeType.COLLECTION) {
      await this.dropDynamicCollection(contentType.name);
    }

    // Clear cache

    // Log activity
    if (this.activityLogService) {
      await this.activityLogService.logContentTypeActivity(
        'delete',
        deleted,
        null,
        { source: 'web' },
      );
    }

    return deleted;
  }

  async restore(id: string): Promise<ContentType> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    // Find the deleted content type (including deleted ones)
    const contentType = await this.contentTypeModel.findOne({
      _id: id,
      companyId,
      deletedAt: { $ne: null },
    });

    if (!contentType) {
      throw new NotFoundException('Deleted content type not found');
    }

    // Check if name conflicts with existing active content type
    const existing = await this.contentTypeModel.findOne({
      companyId,
      name: contentType.name,
      deletedAt: null,
      _id: { $ne: id },
    });

    if (existing) {
      throw new ConflictException(
        `Cannot restore: A content type named "${contentType.name}" already exists. Please rename the existing content type first.`,
      );
    }

    // Restore the content type by clearing deletedAt
    const restored = await this.contentTypeModel.findOneAndUpdate(
      { _id: id, companyId },
      {
        deletedAt: null,
        updatedBy: userId,
      },
      { new: true },
    );

    if (!restored) {
      throw new NotFoundException('Content type not found');
    }

    // Dynamic collection will be created automatically when content is added

    // Clear cache

    // Log activity
    if (this.activityLogService) {
      await this.activityLogService.logContentTypeActivity(
        'restore',
        restored,
        null,
        { source: 'web' },
      );
    }

    return restored;
  }

  async duplicate(id: string, newName: string): Promise<ContentType> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    const original = await this.findOne(id);

    // Check if new name is available
    const existing = await this.contentTypeModel.findOne({
      companyId,
      name: newName,
      deletedAt: null,
    });

    if (existing) {
      throw new ConflictException('Content type name already exists');
    }

    // Create duplicate
    const duplicate = new this.contentTypeModel({
      ...JSON.parse(JSON.stringify(original)),
      _id: undefined,
      name: newName,
      displayName: `${original.displayName} (Copy)`,
      singularName: newName,
      pluralName: `${newName}s`,
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await duplicate.save();

    // Create indexes for collection types
    if (saved.type === ContentTypeType.COLLECTION) {
      await this.createDynamicIndexes(saved);
    }

    // Log activity
    if (this.activityLogService) {
      await this.activityLogService.logContentTypeActivity(
        'duplicate',
        saved,
        null,
        { source: 'web' },
      );
    }

    return saved;
  }

  // Field management methods
  async addField(id: string, field: FieldDefinition): Promise<ContentType> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    const contentType = await this.findOne(id);

    // Validate field
    this.validateFields([field]);

    // Check for duplicate field names in separate collection
    const existingFields = await this.fieldsService.getFieldsByContentType(
      id,
      companyId,
    );
    const duplicateField = existingFields.find((f) => f.name === field.name);
    if (duplicateField) {
      throw new BadRequestException('Field name already exists');
    }

    // Create field in separate collection
    const fieldId = field.id || `field_${field.name}_${Date.now()}`;
    await this.fieldsService.createField(
      id,
      companyId,
      {
        ...field,
        id: fieldId,
      },
      userId,
    );

    console.log('[CMS DEBUG] Field added to separate collection:', {
      contentTypeId: id,
      fieldId,
      fieldName: field.name,
    });

    // Update content type timestamp
    await this.contentTypeModel.findOneAndUpdate(
      { _id: id, companyId },
      {
        updatedBy: userId,
        updatedAt: new Date(),
      },
    );

    // Update indexes for collection types
    if (contentType.type === ContentTypeType.COLLECTION) {
      // Get updated content type with new field for index update
      const updatedContentType = await this.findOne(id);
      await this.updateDynamicIndexes(updatedContentType);
    }

    // Clear cache

    // Return updated content type with populated fields
    return this.findOne(id);
  }

  async updateField(
    id: string,
    fieldId: string,
    fieldData: Partial<FieldDefinition>,
  ): Promise<ContentType> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    console.log('[CMS DEBUG] updateField called (NEW IMPLEMENTATION):', {
      contentTypeId: id,
      fieldId,
      fieldData,
      receivedSize: fieldData.size,
    });

    try {
      // Try to update field in separate collection
      await this.fieldsService.updateField(
        fieldId,
        companyId,
        fieldData,
        userId,
      );
      console.log(
        '[CMS DEBUG] Field updated successfully in separate collection',
      );
    } catch (error) {
      console.log(
        '[CMS DEBUG] Field not found in separate collection:',
        error.message,
      );
      throw new NotFoundException(`Field with ID ${fieldId} not found`);
    }

    // Update content type timestamp
    await this.contentTypeModel.findOneAndUpdate(
      { _id: id, companyId },
      {
        updatedBy: userId,
        updatedAt: new Date(),
      },
    );

    // Clear cache

    // Return updated content type with populated fields
    return this.findOne(id);
  }

  async removeField(id: string, fieldId: string): Promise<ContentType> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    // Delete field from separate collection
    await this.fieldsService.deleteField(fieldId, companyId, userId);

    // Update content type timestamp
    await this.contentTypeModel.findOneAndUpdate(
      { _id: id, companyId },
      {
        updatedBy: userId,
        updatedAt: new Date(),
      },
    );

    // Get content type for index update
    const contentType = await this.findOne(id);

    // Update indexes
    if (contentType.type === ContentTypeType.COLLECTION) {
      await this.updateDynamicIndexes(contentType);
    }

    // Clear cache

    console.log('[CMS DEBUG] Field removed from separate collection:', {
      contentTypeId: id,
      fieldId,
    });

    return contentType;
  }

  // Utility methods
  private validateFields(fields: FieldDefinition[]): void {
    const fieldNames = new Set<string>();

    for (const field of fields) {
      // Skip validation for existing fields without names (backward compatibility)
      if (!field.name) {
        continue;
      }

      // Check for duplicate names
      if (fieldNames.has(field.name)) {
        throw new BadRequestException(`Duplicate field name: ${field.name}`);
      }
      fieldNames.add(field.name);

      // Validate field name format
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.name)) {
        throw new BadRequestException(`Invalid field name: ${field.name}`);
      }

      // Validate required fields
      if (!field.type) {
        throw new BadRequestException(
          `Field type is required for field: ${field.name}`,
        );
      }

      // Type-specific validations
      if (field.type === 'relation' && !field.targetContentType) {
        throw new BadRequestException(
          `Target content type is required for relation field: ${field.name}`,
        );
      }

      if (
        field.type === 'enumeration' &&
        (!field.enumValues || field.enumValues.length === 0)
      ) {
        throw new BadRequestException(
          `Enum values are required for enumeration field: ${field.name}`,
        );
      }
    }
  }

  private async createDynamicIndexes(contentType: ContentType): Promise<void> {
    const collectionName = `content_${contentType.name}`;
    const collection = this.mongoConnection.collection(collectionName);

    // Create base indexes
    await collection.createIndex(
      { companyId: 1, createdAt: -1 },
      { background: true },
    );
    await collection.createIndex(
      { companyId: 1, status: 1 },
      { background: true },
    );
    await collection.createIndex(
      { companyId: 1, locale: 1 },
      { background: true },
    );

    // Create field-specific indexes if fields exist
    // Fields are now managed separately, so they may not be present during initial creation
    if (contentType.fields && Array.isArray(contentType.fields)) {
      for (const field of contentType.fields) {
        const fieldPath = `data.${field.name}`;

        if (field.searchable || field.sortable) {
          await collection.createIndex(
            { companyId: 1, [fieldPath]: 1 },
            {
              sparse: true,
              background: true,
              name: `${field.name}_index`,
            },
          );
        }

        if (field.unique) {
          await collection.createIndex(
            { companyId: 1, [fieldPath]: 1 },
            {
              unique: true,
              sparse: true,
              background: true,
              name: `${field.name}_unique`,
            },
          );
        }
      }
    }

    // Create custom indexes if specified
    //     if (contentType.indexes && contentType.indexes.length > 0) {
    //       for (const index of contentType.indexes) {
    //         const indexSpec = {};
    //         for (const fieldName of index.fields) {
    //           indexSpec[`data.${fieldName}`] = 1;
    //         }
    //
    //         await collection.createIndex(
    //           { companyId: 1, ...indexSpec },
    //           {
    //             unique: index.unique,
    //             sparse: index.sparse,
    //             background: true
    //           }
    //         );
    //       }
    //     }
  }

  private async updateDynamicIndexes(contentType: ContentType): Promise<void> {
    const collectionName = `content_${contentType.name}`;
    const collection = this.mongoConnection.collection(collectionName);

    try {
      // Drop existing field-specific indexes
      const indexes = await collection.indexes();
      for (const index of indexes) {
        if (
          index.name &&
          (index.name.endsWith('_index') || index.name.endsWith('_unique'))
        ) {
          await collection.dropIndex(index.name);
        }
      }

      // Recreate indexes
      await this.createDynamicIndexes(contentType);
    } catch (error) {
      console.warn(`Failed to update indexes for ${collectionName}:`, error);
    }
  }

  private async dropDynamicCollection(contentTypeName: string): Promise<void> {
    const collectionName = `content_${contentTypeName}`;
    try {
      await this.mongoConnection.dropCollection(collectionName);
    } catch (error) {
      // Collection might not exist, which is fine
      console.warn(`Failed to drop collection ${collectionName}:`, error);
    }
  }

  private async hasContentEntries(contentTypeName: string): Promise<boolean> {
    const collectionName = `content_${contentTypeName}`;
    try {
      const collection = this.mongoConnection.collection(collectionName);
      const count = await collection.countDocuments({
        companyId: this.utility.companyId,
        deletedAt: null,
      });
      return count > 0;
    } catch (error) {
      // Collection doesn't exist, which means no entries
      return false;
    }
  }

  async reorderFields(id: string, fieldIds: string[]): Promise<ContentType> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    // Reorder fields in separate collection
    await this.fieldsService.reorderFields(id, companyId, fieldIds, userId);

    // Update content type timestamp
    await this.contentTypeModel.findOneAndUpdate(
      { _id: id, companyId, deletedAt: null },
      {
        updatedBy: userId,
        updatedAt: new Date(),
      },
    );

    console.log('[CMS DEBUG] Fields reordered in separate collection:', {
      contentTypeId: id,
      fieldIds,
    });

    // Clear cache

    // Return updated content type with reordered fields
    return this.findOne(id);
  }

  async searchContentTypes(params: {
    query: string;
    type?: ContentTypeType;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<ContentType>> {
    const companyId = this.utility.companyId;
    const { query, type, page = 1, pageSize = 25 } = params;

    const filter: any = {
      companyId,
      deletedAt: null,
    };

    // Add search conditions
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ];
    }

    // Add type filter if specified
    if (type) {
      filter.type = type;
    }

    const skip = (page - 1) * pageSize;
    const sort = { updatedAt: -1 as any, name: 1 as any };

    const [data, total] = await Promise.all([
      this.contentTypeModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .lean(),
      this.contentTypeModel.countDocuments(filter),
    ]);

    return {
      data: data.map((item) => ({
        ...item,
        id: item._id.toString(),
      })),
      meta: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
    };
  }

  async exportSingle(id: string): Promise<ContentType> {
    const companyId = this.utility.companyId;

    const contentType = await this.contentTypeModel
      .findOne({
        _id: id,
        companyId,
        deletedAt: null,
      })
      .lean();

    if (!contentType) {
      throw new NotFoundException('Content type not found');
    }

    // Log activity (commented out due to enum validation issues)
    // if (this.activityLogService) {
    //   await this.activityLogService.create({
    //     action: 'export',
    //     resource: 'content-type',
    //     resourceId: id,
    //     resourceName: contentType.name,
    //     metadata: {
    //       source: 'cms'
    //     }
    //   });
    // }

    // Return clean export data
    const exportData = {
      ...contentType,
      id: contentType._id.toString(),
    };

    // Remove internal fields from export
    delete exportData._id;
    delete exportData.__v;
    delete exportData.companyId;
    delete exportData.createdBy;
    delete exportData.updatedBy;
    delete exportData.createdAt;
    delete exportData.updatedAt;
    delete exportData.deletedAt;

    return exportData;
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import {
  ContentEntry,
  ContentEntryDocument,
} from '../schemas/content-entry.schema';
import { ContentTypesService } from '../content-types/content-types.service';
import { UtilityService } from '@common/utility.service';
import { WebhookService } from '../webhooks/webhook.service';
import {
  PaginatedResponse,
  ContentStatus,
  FieldDefinition,
  FieldType,
} from '../common/interfaces/cms.interface';
import { PrismaService } from '@common/prisma.service';

export interface CreateContentDto {
  data: Record<string, any>;
  status?: ContentStatus;
  locale?: string;
  publishedAt?: Date;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
    metaImage?: string;
    structuredData?: any;
  };
}

export interface UpdateContentDto {
  data?: Record<string, any>;
  status?: ContentStatus;
  locale?: string;
  publishedAt?: Date;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
    metaImage?: string;
    structuredData?: any;
  };
}

export interface QueryContentDto {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ContentStatus;
  locale?: string;
  sort?: Record<string, 1 | -1>;
  fields?: string[];
  filters?: Record<string, any>;
  populate?: string[];
  dateRange?: {
    field: string;
    from?: Date;
    to?: Date;
  };
}

@Injectable()
export class ContentService {
  constructor(
    @InjectModel(ContentEntry.name, 'mongo')
    private contentEntryModel: Model<ContentEntryDocument>,
    @InjectConnection('mongo')
    private mongoConnection: Connection,
    private contentTypesService: ContentTypesService,
    private utility: UtilityService,
    private webhookService: WebhookService,
    private prisma: PrismaService,
  ) {}

  async create(contentTypeName: string, dto: CreateContentDto): Promise<any> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    // Get content type definition
    const contentType =
      await this.contentTypesService.findByName(contentTypeName);

    // Validate content data against content type fields
    this.validateContentData(dto.data, contentType.fields);

    // Get dynamic collection
    const collection = this.getDynamicCollection(contentTypeName);

    // Create content entry
    const contentEntry = {
      companyId,
      contentType: contentTypeName,
      data: dto.data,
      status: dto.status || ContentStatus.DRAFT,
      locale: dto.locale || 'en',
      publishedAt: dto.publishedAt || null,
      metadata: dto.metadata || {},
      version: 1,
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const saved = await collection.insertOne(contentEntry);
    const result = await collection.findOne({ _id: saved.insertedId });

    // Trigger webhooks
    await this.webhookService.triggerWebhooks(
      'entry.create',
      contentTypeName,
      result,
    );
    return result;
  }

  async findAll(
    contentTypeName: string,
    query: QueryContentDto = {},
  ): Promise<PaginatedResponse<any>> {
    const companyId = this.utility.companyId;

    // Set defaults
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    // Get dynamic collection
    const collection = this.getDynamicCollection(contentTypeName);

    // Build filter
    const filter: any = {
      companyId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.locale && { locale: query.locale }),
      ...(query.search && {
        $or: [
          { 'data.title': new RegExp(query.search, 'i') },
          { 'data.name': new RegExp(query.search, 'i') },
          { 'data.description': new RegExp(query.search, 'i') },
        ],
      }),
    };

    // Add custom filters
    if (query.filters) {
      Object.keys(query.filters).forEach((key) => {
        if (key.startsWith('data.')) {
          filter[key] = query.filters[key];
        }
      });
    }

    // Add date range filter
    if (query.dateRange) {
      const dateField = query.dateRange.field || 'createdAt';
      filter[dateField] = {};
      if (query.dateRange.from) {
        filter[dateField]['$gte'] = query.dateRange.from;
      }
      if (query.dateRange.to) {
        filter[dateField]['$lte'] = query.dateRange.to;
      }
    }

    // Build sort
    const sort = query.sort || { createdAt: -1 };

    // Execute query with pagination
    const [items, total] = await Promise.all([
      collection
        .find(filter)
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    // Get content type definition to know field types
    const contentType =
      await this.contentTypesService.findByName(contentTypeName);

    // Populate media fields for all items
    const populatedItems = await Promise.all(
      items.map((item) => this.populateMediaFields(item, contentType.fields)),
    );

    const response = {
      data: populatedItems,
      meta: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
    };

    return response;
  }

  async findOne(contentTypeName: string, id: string): Promise<any> {
    const companyId = this.utility.companyId;

    console.log(`[CMS Content Service] FindOne operation started:`, {
      contentTypeName,
      entryId: id,
      companyId,
    });

    // Validate ObjectId format
    if (!this.mongoConnection.base.Types.ObjectId.isValid(id)) {
      console.error(
        `[CMS Content Service] Invalid ObjectId format for findOne: ${id}`,
      );
      throw new BadRequestException(`Invalid entry ID format: ${id}`);
    }

    const collection = this.getDynamicCollection(contentTypeName);

    let objectId;
    try {
      objectId = new this.mongoConnection.base.Types.ObjectId(id);
    } catch (error) {
      console.error(
        `[CMS Content Service] Failed to create ObjectId for findOne: ${id}`,
        error,
      );
      throw new BadRequestException(`Invalid entry ID format: ${id}`);
    }

    const findQuery = {
      _id: objectId,
      companyId,
      deletedAt: null,
    };

    console.log(
      `[CMS Content Service] Searching for single entry with query:`,
      {
        collection: `content_${contentTypeName}`,
        query: findQuery,
      },
    );

    const content = await collection.findOne(findQuery);

    if (!content) {
      // Try to find the entry without company/delete filters to provide better error messages
      const anyEntry = await collection.findOne({ _id: objectId });

      if (!anyEntry) {
        console.error(`[CMS Content Service] Entry not found in findOne:`, {
          id,
          contentTypeName,
        });
        throw new NotFoundException(
          `Content entry with ID ${id} does not exist`,
        );
      } else if (anyEntry.deletedAt) {
        console.error(`[CMS Content Service] Entry is deleted in findOne:`, {
          id,
          contentTypeName,
          deletedAt: anyEntry.deletedAt,
        });
        throw new NotFoundException(
          `Content entry with ID ${id} has been deleted`,
        );
      } else if (anyEntry.companyId !== companyId) {
        console.error(
          `[CMS Content Service] Entry belongs to different company in findOne:`,
          {
            id,
            contentTypeName,
            entryCompanyId: anyEntry.companyId,
            currentCompanyId: companyId,
          },
        );
        throw new NotFoundException(
          `Content entry with ID ${id} not found for your organization`,
        );
      } else {
        console.error(
          `[CMS Content Service] Entry exists but findOne failed for unknown reason:`,
          {
            id,
            contentTypeName,
            entry: anyEntry,
          },
        );
        throw new NotFoundException(
          `Content entry with ID ${id} is not accessible`,
        );
      }
    }

    console.log(`[CMS Content Service] Found entry in findOne:`, {
      id: content._id,
      status: content.status,
    });

    // Get content type definition to know field types
    const contentType =
      await this.contentTypesService.findByName(contentTypeName);

    // Populate media fields
    const populatedContent = await this.populateMediaFields(
      content,
      contentType.fields,
    );

    return populatedContent;
  }

  async update(
    contentTypeName: string,
    id: string,
    dto: UpdateContentDto,
  ): Promise<any> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    console.log(`[CMS Content Service] Update operation started:`, {
      contentTypeName,
      entryId: id,
      companyId,
      userId,
      updateData: dto,
    });

    // Validate ObjectId format
    if (!this.mongoConnection.base.Types.ObjectId.isValid(id)) {
      console.error(`[CMS Content Service] Invalid ObjectId format: ${id}`);
      throw new BadRequestException(`Invalid entry ID format: ${id}`);
    }

    // Get content type definition
    const contentType =
      await this.contentTypesService.findByName(contentTypeName);

    // Validate content data if provided
    if (dto.data) {
      this.validateContentData(dto.data, contentType.fields);
    }

    const collection = this.getDynamicCollection(contentTypeName);

    let objectId;
    try {
      objectId = new this.mongoConnection.base.Types.ObjectId(id);
    } catch (error) {
      console.error(
        `[CMS Content Service] Failed to create ObjectId for update: ${id}`,
        error,
      );
      throw new BadRequestException(`Invalid entry ID format: ${id}`);
    }

    // Enhanced query with detailed logging
    const searchQuery = {
      _id: objectId,
      companyId,
      deletedAt: null,
    };

    console.log(`[CMS Content Service] Searching for entry with query:`, {
      collection: `content_${contentTypeName}`,
      query: searchQuery,
    });

    // Check if content exists
    const existing = await collection.findOne(searchQuery);

    if (!existing) {
      // Try to find the entry without company/delete filters to provide better error messages
      const anyEntry = await collection.findOne({ _id: objectId });

      if (!anyEntry) {
        console.error(`[CMS Content Service] Entry not found at all:`, {
          id,
          contentTypeName,
        });
        throw new NotFoundException(
          `Content entry with ID ${id} does not exist`,
        );
      } else if (anyEntry.deletedAt) {
        console.error(`[CMS Content Service] Entry is soft deleted:`, {
          id,
          contentTypeName,
          deletedAt: anyEntry.deletedAt,
        });
        throw new NotFoundException(
          `Content entry with ID ${id} has been deleted`,
        );
      } else if (anyEntry.companyId !== companyId) {
        console.error(
          `[CMS Content Service] Entry belongs to different company:`,
          {
            id,
            contentTypeName,
            entryCompanyId: anyEntry.companyId,
            currentCompanyId: companyId,
          },
        );
        throw new NotFoundException(
          `Content entry with ID ${id} not found for your organization`,
        );
      } else {
        console.error(
          `[CMS Content Service] Entry exists but failed unknown condition:`,
          {
            id,
            contentTypeName,
            entry: anyEntry,
          },
        );
        throw new NotFoundException(
          `Content entry with ID ${id} is not accessible`,
        );
      }
    }

    console.log(`[CMS Content Service] Found entry for update:`, {
      id: existing._id,
      status: existing.status,
      version: existing.version,
    });

    // Update content
    const updateData: any = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (dto.data) {
      updateData.data = { ...existing.data, ...dto.data };
      updateData.version = existing.version + 1;
    }

    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === ContentStatus.PUBLISHED && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    if (dto.locale) updateData.locale = dto.locale;
    if (dto.publishedAt) updateData.publishedAt = dto.publishedAt;
    if (dto.metadata)
      updateData.metadata = { ...existing.metadata, ...dto.metadata };

    const updated = await collection.findOneAndUpdate(
      { _id: new this.mongoConnection.base.Types.ObjectId(id), companyId },
      { $set: updateData },
      { returnDocument: 'after' },
    );

    // Trigger webhooks - check for status changes
    if (
      dto.status === ContentStatus.PUBLISHED &&
      existing.status !== ContentStatus.PUBLISHED
    ) {
      await this.webhookService.triggerWebhooks(
        'entry.publish',
        contentTypeName,
        updated.value,
      );
    } else if (
      dto.status !== ContentStatus.PUBLISHED &&
      existing.status === ContentStatus.PUBLISHED
    ) {
      await this.webhookService.triggerWebhooks(
        'entry.unpublish',
        contentTypeName,
        updated.value,
      );
    } else {
      await this.webhookService.triggerWebhooks(
        'entry.update',
        contentTypeName,
        updated.value,
      );
    }
    return updated.value;
  }

  async remove(contentTypeName: string, id: string): Promise<any> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    console.log(`[CMS Content Service] Delete operation started:`, {
      contentTypeName,
      entryId: id,
      companyId,
      userId,
    });

    // Validate ObjectId format
    if (!this.mongoConnection.base.Types.ObjectId.isValid(id)) {
      console.error(
        `[CMS Content Service] Invalid ObjectId format for delete: ${id}`,
      );
      throw new BadRequestException(`Invalid entry ID format: ${id}`);
    }

    const collection = this.getDynamicCollection(contentTypeName);

    let objectId;
    try {
      objectId = new this.mongoConnection.base.Types.ObjectId(id);
    } catch (error) {
      console.error(
        `[CMS Content Service] Failed to create ObjectId for delete: ${id}`,
        error,
      );
      throw new BadRequestException(`Invalid entry ID format: ${id}`);
    }

    const deleteQuery = {
      _id: objectId,
      companyId,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    };

    console.log(
      `[CMS Content Service] Attempting to delete entry with query:`,
      {
        collection: `content_${contentTypeName}`,
        query: deleteQuery,
      },
    );

    const deleted = await collection.findOneAndUpdate(
      deleteQuery,
      {
        $set: {
          deletedAt: new Date(),
          updatedBy: userId,
        },
      },
      { returnDocument: 'after' },
    );

    console.log(`[CMS Content Service] Delete operation result:`, {
      deleted: !!deleted,
      hasValue: !!deleted?.value,
      deletedResult: deleted,
    });

    // If the findOneAndUpdate response is problematic, verify by querying the updated document
    if (!deleted || !deleted.value) {
      console.log(
        `[CMS Content Service] Checking if delete actually worked by querying document...`,
      );
      const updatedEntry = await collection.findOne({ _id: objectId });

      if (updatedEntry && updatedEntry.deletedAt) {
        console.log(
          `[CMS Content Service] Delete actually worked! Document has deletedAt:`,
          updatedEntry.deletedAt,
        );

        // Trigger webhooks for successful delete
        await this.webhookService.triggerWebhooks(
          'entry.delete',
          contentTypeName,
          updatedEntry,
        );

        return updatedEntry;
      }
      // Try to find the entry without company/delete filters to provide better error messages
      const anyEntry = await collection.findOne({ _id: objectId });

      if (!anyEntry) {
        console.error(`[CMS Content Service] Entry not found for delete:`, {
          id,
          contentTypeName,
        });
        throw new NotFoundException(
          `Content entry with ID ${id} does not exist`,
        );
      } else if (anyEntry.deletedAt) {
        console.error(`[CMS Content Service] Entry already deleted:`, {
          id,
          contentTypeName,
          deletedAt: anyEntry.deletedAt,
        });
        throw new NotFoundException(
          `Content entry with ID ${id} has already been deleted`,
        );
      } else if (anyEntry.companyId !== companyId) {
        console.error(
          `[CMS Content Service] Entry belongs to different company for delete:`,
          {
            id,
            contentTypeName,
            entryCompanyId: anyEntry.companyId,
            currentCompanyId: companyId,
          },
        );
        throw new NotFoundException(
          `Content entry with ID ${id} not found for your organization`,
        );
      } else {
        console.error(
          `[CMS Content Service] Entry exists but delete failed for unknown reason:`,
          {
            id,
            contentTypeName,
            entry: anyEntry,
          },
        );
        throw new NotFoundException(
          `Content entry with ID ${id} could not be deleted`,
        );
      }
    }

    console.log(`[CMS Content Service] Successfully deleted entry:`, {
      id: deleted.value._id,
      deletedAt: deleted.value.deletedAt,
    });

    // Trigger webhooks
    await this.webhookService.triggerWebhooks(
      'entry.delete',
      contentTypeName,
      deleted.value,
    );

    return deleted.value;
  }

  async publish(contentTypeName: string, id: string): Promise<any> {
    return this.update(contentTypeName, id, {
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    });
  }

  async unpublish(contentTypeName: string, id: string): Promise<any> {
    return this.update(contentTypeName, id, {
      status: ContentStatus.DRAFT,
    });
  }

  async duplicate(contentTypeName: string, id: string): Promise<any> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    const original = await this.findOne(contentTypeName, id);

    const duplicateData = {
      ...original,
      _id: undefined,
      status: ContentStatus.DRAFT,
      publishedAt: null,
      version: 1,
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Add "(Copy)" to title if it exists
      data: {
        ...original.data,
        ...(original.data.title && { title: `${original.data.title} (Copy)` }),
      },
    };

    const collection = this.getDynamicCollection(contentTypeName);
    const saved = await collection.insertOne(duplicateData);
    const result = await collection.findOne({ _id: saved.insertedId });

    return result;
  }

  async getVersions(contentTypeName: string, id: string): Promise<any[]> {
    // This is a placeholder for version history functionality
    // In a full implementation, you would store version history in a separate collection
    const current = await this.findOne(contentTypeName, id);
    return [current];
  }

  // Utility methods
  private getDynamicCollection(contentTypeName: string) {
    const collectionName = `content_${contentTypeName}`;
    return this.mongoConnection.collection(collectionName);
  }

  private validateContentData(
    data: Record<string, any>,
    fields: FieldDefinition[],
  ): void {
    const fieldMap = new Map(fields.map((f) => [f.name, f]));

    // Validate required fields
    for (const field of fields) {
      if (
        field.required &&
        (data[field.name] === undefined ||
          data[field.name] === null ||
          data[field.name] === '')
      ) {
        throw new BadRequestException(`Field "${field.name}" is required`);
      }
    }

    // Validate field types and constraints
    Object.keys(data).forEach((fieldName) => {
      const fieldDef = fieldMap.get(fieldName);
      if (!fieldDef) {
        // Allow extra fields for flexibility
        return;
      }

      const value = data[fieldName];
      if (value === null || value === undefined) {
        return; // Already checked for required fields above
      }

      // Type-specific validations
      switch (fieldDef.type) {
        case 'number':
          if (typeof value !== 'number') {
            throw new BadRequestException(
              `Field "${fieldName}" must be a number`,
            );
          }
          if (fieldDef.min !== undefined && value < fieldDef.min) {
            throw new BadRequestException(
              `Field "${fieldName}" must be at least ${fieldDef.min}`,
            );
          }
          if (fieldDef.max !== undefined && value > fieldDef.max) {
            throw new BadRequestException(
              `Field "${fieldName}" must be at most ${fieldDef.max}`,
            );
          }
          break;

        case 'email':
          if (
            typeof value !== 'string' ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ) {
            throw new BadRequestException(
              `Field "${fieldName}" must be a valid email address`,
            );
          }
          break;

        case 'enumeration':
          if (!fieldDef.enumValues?.includes(value)) {
            throw new BadRequestException(
              `Field "${fieldName}" must be one of: ${fieldDef.enumValues?.join(', ')}`,
            );
          }
          break;

        case 'text':
        case 'richtext':
          if (typeof value !== 'string') {
            throw new BadRequestException(
              `Field "${fieldName}" must be a string`,
            );
          }
          if (
            fieldDef.minLength !== undefined &&
            value.length < fieldDef.minLength
          ) {
            throw new BadRequestException(
              `Field "${fieldName}" must be at least ${fieldDef.minLength} characters`,
            );
          }
          if (
            fieldDef.maxLength !== undefined &&
            value.length > fieldDef.maxLength
          ) {
            throw new BadRequestException(
              `Field "${fieldName}" must be at most ${fieldDef.maxLength} characters`,
            );
          }
          break;

        case 'boolean':
          if (typeof value !== 'boolean') {
            throw new BadRequestException(
              `Field "${fieldName}" must be a boolean`,
            );
          }
          break;

        case 'datetime':
          if (!(value instanceof Date) && !Date.parse(value)) {
            throw new BadRequestException(
              `Field "${fieldName}" must be a valid date`,
            );
          }
          break;
      }
    });
  }

  // Single Type Methods
  async getSingleTypeContent(contentTypeName: string): Promise<any> {
    const companyId = this.utility.companyId;

    // Get content type definition and validate it's a single type
    const contentType =
      await this.contentTypesService.findByName(contentTypeName);

    const collection = this.getDynamicCollection(contentTypeName);

    // Try to find existing single type entry
    let singleEntry = await collection.findOne({
      companyId,
      contentType: contentTypeName,
      deletedAt: null,
    });

    // If no entry exists, create a default one with empty data based on content type fields
    if (!singleEntry) {
      const userId = this.utility.accountInformation.id;

      // Generate default data based on content type fields
      const defaultData = this.generateDefaultData(contentType.fields);

      const defaultEntry = {
        companyId,
        contentType: contentTypeName,
        data: defaultData,
        status: ContentStatus.DRAFT,
        locale: 'en',
        publishedAt: null,
        metadata: {},
        version: 1,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const saved = await collection.insertOne(defaultEntry);
      singleEntry = await collection.findOne({ _id: saved.insertedId });

      // Trigger webhooks for creation
      await this.webhookService.triggerWebhooks(
        'entry.create',
        contentTypeName,
        singleEntry,
      );
    }

    // Populate media fields
    const populatedEntry = await this.populateMediaFields(
      singleEntry,
      contentType.fields,
    );

    return populatedEntry;
  }

  async updateSingleTypeContent(
    contentTypeName: string,
    dto: UpdateContentDto,
  ): Promise<any> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    // Get content type definition
    const contentType =
      await this.contentTypesService.findByName(contentTypeName);

    // Validate content data if provided
    if (dto.data) {
      this.validateContentData(dto.data, contentType.fields);
    }

    const collection = this.getDynamicCollection(contentTypeName);

    // Find existing single type entry or create one
    let existing = await collection.findOne({
      companyId,
      contentType: contentTypeName,
      deletedAt: null,
    });

    if (!existing) {
      // Create new entry if doesn't exist
      const defaultData = this.generateDefaultData(contentType.fields);
      const newEntry = {
        companyId,
        contentType: contentTypeName,
        data: defaultData,
        status: ContentStatus.DRAFT,
        locale: 'en',
        publishedAt: null,
        metadata: {},
        version: 1,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const saved = await collection.insertOne(newEntry);
      existing = await collection.findOne({ _id: saved.insertedId });
    }

    // Update content
    const updateData: any = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (dto.data) {
      updateData.data = { ...existing.data, ...dto.data };
      updateData.version = existing.version + 1;
    }

    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === ContentStatus.PUBLISHED && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      } else if (dto.status !== ContentStatus.PUBLISHED) {
        updateData.publishedAt = null;
      }
    }

    if (dto.locale) updateData.locale = dto.locale;
    if (dto.publishedAt !== undefined) updateData.publishedAt = dto.publishedAt;
    if (dto.metadata)
      updateData.metadata = { ...existing.metadata, ...dto.metadata };

    const updated = await collection.findOneAndUpdate(
      { _id: existing._id },
      { $set: updateData },
      { returnDocument: 'after' },
    );

    // Trigger webhooks
    await this.webhookService.triggerWebhooks(
      'entry.update',
      contentTypeName,
      updated.value,
    );

    return updated.value;
  }

  async publishSingleType(contentTypeName: string): Promise<any> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    const collection = this.getDynamicCollection(contentTypeName);

    // Get or create single type entry
    const entry = await this.getSingleTypeContent(contentTypeName);

    const updated = await collection.findOneAndUpdate(
      { _id: entry._id },
      {
        $set: {
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date(),
          updatedBy: userId,
          updatedAt: new Date(),
          version: entry.version + 1,
        },
      },
      { returnDocument: 'after' },
    );

    // Trigger webhooks
    await this.webhookService.triggerWebhooks(
      'entry.publish',
      contentTypeName,
      updated.value,
    );

    return updated.value;
  }

  async unpublishSingleType(contentTypeName: string): Promise<any> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    const collection = this.getDynamicCollection(contentTypeName);

    // Get single type entry
    const entry = await this.getSingleTypeContent(contentTypeName);

    const updated = await collection.findOneAndUpdate(
      { _id: entry._id },
      {
        $set: {
          status: ContentStatus.DRAFT,
          publishedAt: null,
          updatedBy: userId,
          updatedAt: new Date(),
          version: entry.version + 1,
        },
      },
      { returnDocument: 'after' },
    );

    // Trigger webhooks
    await this.webhookService.triggerWebhooks(
      'entry.unpublish',
      contentTypeName,
      updated.value,
    );

    return updated.value;
  }

  private generateDefaultData(fields: FieldDefinition[]): Record<string, any> {
    const defaultData: Record<string, any> = {};

    fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        defaultData[field.name] = field.defaultValue;
      } else {
        // Set type-appropriate defaults
        switch (field.type) {
          case 'text':
          case 'richtext':
          case 'email':
          case 'uid':
            defaultData[field.name] = '';
            break;
          case 'number':
            defaultData[field.name] = 0;
            break;
          case 'boolean':
            defaultData[field.name] = false;
            break;
          case 'datetime':
            defaultData[field.name] = null;
            break;
          case 'json':
            defaultData[field.name] = {};
            break;
          case 'enumeration':
            defaultData[field.name] = field.enumValues?.[0] || null;
            break;
          default:
            defaultData[field.name] = null;
        }
      }
    });

    return defaultData;
  }

  /**
   * Populate media fields with full file data including variants
   */
  private async populateMediaFields(
    content: any,
    fields: FieldDefinition[],
  ): Promise<any> {
    if (!content || !content.data) {
      return content;
    }

    const populatedData = { ...content.data };

    // Find all media fields
    const mediaFields = fields.filter(
      (field) => field.type === FieldType.MEDIA,
    );

    for (const field of mediaFields) {
      const mediaValue = populatedData[field.name];

      if (mediaValue) {
        // Handle single media
        if (typeof mediaValue === 'number' || typeof mediaValue === 'string') {
          const mediaId = parseInt(mediaValue.toString());
          const mediaFile = await this.prisma.files.findUnique({
            where: { id: mediaId },
          });

          if (mediaFile) {
            populatedData[field.name] = mediaFile;
          }
        }
        // Handle array of media
        else if (Array.isArray(mediaValue)) {
          const mediaIds = mediaValue.map((id) => parseInt(id.toString()));
          const mediaFiles = await this.prisma.files.findMany({
            where: { id: { in: mediaIds } },
          });

          populatedData[field.name] = mediaFiles;
        }
        // Already populated object
        else if (typeof mediaValue === 'object' && mediaValue.id) {
          // If it's already an object with id, fetch fresh data to get variants
          const mediaId = parseInt(mediaValue.id.toString());
          const mediaFile = await this.prisma.files.findUnique({
            where: { id: mediaId },
          });

          if (mediaFile) {
            populatedData[field.name] = mediaFile;
          }
        }
      }
    }

    return {
      ...content,
      data: populatedData,
    };
  }
}

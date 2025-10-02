import { Injectable } from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import {
  FieldDefinition,
  FieldType,
  ContentStatus,
} from '../common/interfaces/cms.interface';

export interface FormattedContentResponse {
  id: string;
  attributes: Record<string, any>;
  meta: {
    status: ContentStatus;
    publishedAt: any | null;
    locale: string;
  };
}

export interface FormattedListResponse {
  data: FormattedContentResponse[];
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
}

@Injectable()
export class PublicResponseFormatterService {
  constructor(private readonly utility: UtilityService) {}

  /**
   * Format a single content entry for public API response
   */
  formatContentEntry(
    rawContent: any,
    fields: FieldDefinition[],
  ): FormattedContentResponse {
    const attributes = this.formatContentData(rawContent.data, fields);

    return {
      id: rawContent._id.toString(),
      attributes,
      meta: {
        status: rawContent.status,
        publishedAt: rawContent.publishedAt
          ? this.utility.formatDate(rawContent.publishedAt)
          : null,
        locale: rawContent.locale || 'en',
      },
    };
  }

  /**
   * Format a list of content entries for public API response
   */
  formatContentList(
    rawContents: any[],
    fields: FieldDefinition[],
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      pageCount: number;
    },
  ): FormattedListResponse {
    const data = rawContents.map((content) =>
      this.formatContentEntry(content, fields),
    );

    return {
      data,
      pagination,
    };
  }

  /**
   * Format content data based on field types
   */
  private formatContentData(
    data: Record<string, any>,
    fields: FieldDefinition[],
  ): Record<string, any> {
    const formatted: Record<string, any> = {};

    // Create a field lookup for efficient access
    const fieldMap = new Map(fields.map((field) => [field.name, field]));

    for (const [fieldName, value] of Object.entries(data)) {
      const field = fieldMap.get(fieldName);

      if (field) {
        formatted[fieldName] = this.formatFieldValue(value, field);
      } else {
        // For fields not in definition (legacy or dynamic), include as-is
        formatted[fieldName] = value;
      }
    }

    return formatted;
  }

  /**
   * Format a field value based on its type
   */
  private formatFieldValue(value: any, field: FieldDefinition): any {
    if (value === null || value === undefined) {
      return null;
    }

    switch (field.type) {
      case FieldType.DATETIME:
        return this.formatDateTimeField(value);

      case FieldType.NUMBER:
        return this.formatNumberField(value);

      case FieldType.BOOLEAN:
        return this.formatBooleanField(value);

      case FieldType.TEXT:
      case FieldType.EMAIL:
      case FieldType.UID:
        return this.formatTextField(value);

      case FieldType.RICHTEXT:
        return this.formatRichTextField(value);

      case FieldType.MEDIA:
        return this.formatMediaField(value);

      case FieldType.RELATION:
        return this.formatRelationField(value);

      case FieldType.JSON:
        return this.formatJsonField(value);

      case FieldType.ENUMERATION:
        return this.formatEnumerationField(value, field);

      case FieldType.COMPONENT:
      case FieldType.DYNAMICZONE:
        return this.formatComponentField(value, field);

      default:
        // For unknown types, return as-is
        return value;
    }
  }

  /**
   * Format datetime field using utility service
   */
  private formatDateTimeField(value: any): any {
    if (typeof value === 'string' || value instanceof Date) {
      return this.utility.formatDate(value);
    }
    return null;
  }

  /**
   * Format number field
   */
  private formatNumberField(value: any): number | null {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  /**
   * Format boolean field
   */
  private formatBooleanField(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  }

  /**
   * Format text field
   */
  private formatTextField(value: any): string {
    return String(value).trim();
  }

  /**
   * Format rich text field
   */
  private formatRichTextField(value: any): string {
    // For now, return as string. Could add HTML sanitization here
    return String(value);
  }

  /**
   * Format media field
   */
  private formatMediaField(value: any): any {
    if (!value) return null;

    // If it's an array of media
    if (Array.isArray(value)) {
      return value.map((item) => this.formatSingleMedia(item));
    }

    // Single media item
    return this.formatSingleMedia(value);
  }

  /**
   * Format single media item
   */
  private formatSingleMedia(media: any): any {
    if (!media) return null;

    // If media is populated object
    if (typeof media === 'object' && media.url) {
      return {
        id: media._id?.toString() || media.id,
        url: media.url,
        alt: media.alternativeText || media.alt || null,
        caption: media.caption || null,
        width: media.width || null,
        height: media.height || null,
        size: media.size || null,
        mime: media.mimetype || media.mime || null,
        // Include all image versions/variants
        variants: media.variants || null,
        // Include optimization data
        blurPlaceholder: media.blurPlaceholder || null,
        dominantColor: media.dominantColor || null,
        processingStatus: media.processingStatus || null,
        // Additional metadata
        duration: media.duration || null, // For videos
        tags: media.tags || [],
      };
    }

    // If it's just an ID
    return {
      id: media.toString(),
      url: null,
      alt: null,
      caption: null,
      variants: null,
    };
  }

  /**
   * Format relation field
   */
  private formatRelationField(value: any): any {
    if (!value) return null;

    // If it's an array of relations
    if (Array.isArray(value)) {
      return value.map((item) => this.formatSingleRelation(item));
    }

    // Single relation
    return this.formatSingleRelation(value);
  }

  /**
   * Format single relation item
   */
  private formatSingleRelation(relation: any): any {
    if (!relation) return null;

    // If relation is populated
    if (typeof relation === 'object' && relation.data) {
      return {
        id: relation._id?.toString() || relation.id,
        // Include only essential data from related content
        ...relation.data,
      };
    }

    // If it's just an ID
    return {
      id: relation.toString(),
    };
  }

  /**
   * Format JSON field
   */
  private formatJsonField(value: any): any {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }

  /**
   * Format enumeration field
   */
  private formatEnumerationField(value: any, field: FieldDefinition): any {
    const strValue = String(value);

    // Validate against allowed enum values if available
    if (field.enumValues && field.enumValues.length > 0) {
      return field.enumValues.includes(strValue) ? strValue : null;
    }

    return strValue;
  }

  /**
   * Format component field (nested components)
   */
  private formatComponentField(value: any, _field: FieldDefinition): any {
    // For components, we'd need to recursively format based on component definition
    // For now, return as-is
    return value;
  }
}

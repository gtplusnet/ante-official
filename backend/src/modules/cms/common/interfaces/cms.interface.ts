import { Document, ObjectId } from 'mongoose';

export enum FieldType {
  TEXT = 'text',
  RICHTEXT = 'richtext',
  NUMBER = 'number',
  DATETIME = 'datetime',
  BOOLEAN = 'boolean',
  MEDIA = 'media',
  RELATION = 'relation',
  JSON = 'json',
  UID = 'uid',
  EMAIL = 'email',
  PASSWORD = 'password',
  ENUMERATION = 'enumeration',
  COMPONENT = 'component',
  DYNAMICZONE = 'dynamiczone',
}

export enum RelationType {
  ONE_TO_ONE = 'oneToOne',
  ONE_TO_MANY = 'oneToMany',
  MANY_TO_ONE = 'manyToOne',
  MANY_TO_MANY = 'manyToMany',
  ONE_WAY = 'oneWay',
  MANY_WAY = 'manyWay',
}

export enum ContentTypeType {
  COLLECTION = 'collection',
  SINGLE = 'single',
  COMPONENT = 'component',
}

export enum ContentStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export interface ValidationRule {
  type: string;
  value?: any;
  message?: string;
}

export interface FieldDefinition {
  id: string;
  name: string;
  displayName: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  private?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  repeatable?: boolean;
  defaultValue?: any;
  size?: 'full' | 'two-thirds' | 'half' | 'third';

  // Validation rules
  validations?: ValidationRule[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;

  // Type-specific properties
  enumValues?: string[];
  targetContentType?: string;
  relationType?: RelationType;
  allowedTypes?: string[];
  component?: string;
  components?: string[];

  // UI properties
  placeholder?: string;
  hint?: string;
  tooltip?: string;
  disabled?: boolean;
  readonly?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
}

export interface CMSResponse<T = any> {
  data: T;
  meta?: any;
}

// Base document interfaces
export interface CMSDocument extends Document {
  _id: ObjectId;
  companyId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface TimestampedDocument extends CMSDocument {
  createdBy: string;
  updatedBy: string;
}

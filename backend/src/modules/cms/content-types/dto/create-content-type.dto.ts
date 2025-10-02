import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  FieldDefinition,
  ContentTypeType,
} from '../../common/interfaces/cms.interface';

export class CreateContentTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsString()
  @IsOptional()
  singularName?: string;

  @IsString()
  @IsOptional()
  pluralName?: string;

  @IsEnum(ContentTypeType)
  type: ContentTypeType;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Fields are now managed separately via Field endpoints
  // Use POST /cms/content-types/:id/fields to add fields

  @IsOptional()
  @Type(() => Object)
  settings?: {
    draftAndPublish?: boolean;
    versionable?: boolean;
    localizable?: boolean;
    softDelete?: boolean;
    timestamps?: boolean;
    reviewWorkflow?: boolean;
  };

  // Frontend compatibility fields (will be moved to settings)
  @IsOptional()
  draftPublish?: boolean;

  @IsOptional()
  internationalization?: boolean;

  @IsOptional()
  @Type(() => Object)
  permissions?: {
    create?: string[];
    read?: string[];
    update?: string[];
    delete?: string[];
    publish?: string[];
  };

  @IsArray()
  @IsOptional()
  @Type(() => Object)
  indexes?: Array<{
    fields: string[];
    unique?: boolean;
    sparse?: boolean;
  }>;
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import {
  FieldDefinition,
  ContentTypeType,
  TimestampedDocument,
} from '../common/interfaces/cms.interface';

export type ContentTypeDocument = ContentType & Document;

@Schema({
  timestamps: true,
  collection: 'cms_content_types',
})
export class ContentType {
  @Prop({ required: true })
  companyId: number;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop({ trim: true })
  singularName?: string;

  @Prop({ trim: true })
  pluralName?: string;

  @Prop({
    required: true,
    enum: Object.values(ContentTypeType),
    default: ContentTypeType.COLLECTION,
  })
  type: ContentTypeType;

  @Prop({ trim: true })
  category?: string;

  @Prop({ trim: true })
  icon?: string;

  @Prop({ trim: true })
  description?: string;

  // Fields are now stored in separate cms_fields collection
  // This property is populated dynamically by the service layer
  fields?: FieldDefinition[];

  @Prop({
    type: {
      draftAndPublish: { type: Boolean, default: true },
      versionable: { type: Boolean, default: false },
      localizable: { type: Boolean, default: false },
      softDelete: { type: Boolean, default: true },
      timestamps: { type: Boolean, default: true },
      reviewWorkflow: { type: Boolean, default: false },
    },
    default: {
      draftAndPublish: true,
      versionable: false,
      localizable: false,
      softDelete: true,
      timestamps: true,
      reviewWorkflow: false,
    },
  })
  settings: {
    draftAndPublish: boolean;
    versionable: boolean;
    localizable: boolean;
    softDelete: boolean;
    timestamps: boolean;
    reviewWorkflow?: boolean;
  };

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true })
  updatedBy: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop()
  deletedAt?: Date;

  // Virtual properties
  _id: any;
}

export const ContentTypeSchema = SchemaFactory.createForClass(ContentType);

// Add indexes
ContentTypeSchema.index({ companyId: 1, name: 1 }, { unique: true });
ContentTypeSchema.index({ companyId: 1, type: 1 });
ContentTypeSchema.index({ companyId: 1, category: 1 });
ContentTypeSchema.index({ createdAt: -1 });
ContentTypeSchema.index({ updatedAt: -1 });
ContentTypeSchema.index({ deletedAt: 1 }, { sparse: true });

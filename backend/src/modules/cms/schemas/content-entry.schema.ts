import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as MongooseSchema } from 'mongoose';
import {
  ContentStatus,
  TimestampedDocument,
} from '../common/interfaces/cms.interface';

export type ContentEntryDocument = ContentEntry & Document;

@Schema({
  timestamps: true,
  collection: 'cms_content_entries',
})
export class ContentEntry {
  @Prop({ required: true })
  companyId: number;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'ContentType',
  })
  contentTypeId: ObjectId;

  @Prop({ required: true, trim: true })
  contentType: string; // Name of the content type for easier querying

  @Prop({ default: 'en', trim: true })
  locale: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  data: Record<string, any>;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  relations: Record<
    string,
    {
      target: ObjectId | ObjectId[];
      type: string;
      metadata?: any;
    }
  >;

  @Prop({ default: 1, min: 1 })
  version: number;

  @Prop({ min: 0 })
  publishedVersion?: number;

  @Prop({ default: true })
  isDraft: boolean;

  @Prop()
  publishedAt?: Date;

  @Prop()
  publishedBy?: string;

  @Prop({
    type: String,
    enum: Object.values(ContentStatus),
    default: ContentStatus.DRAFT,
  })
  status: ContentStatus;

  @Prop({ trim: true })
  workflowStage?: string;

  @Prop({ type: [String], default: [] })
  assignedTo: string[];

  @Prop({
    type: {
      metaTitle: String,
      metaDescription: String,
      metaImage: { type: MongooseSchema.Types.ObjectId, ref: 'Media' },
      keywords: [String],
      canonicalUrl: String,
      structuredData: MongooseSchema.Types.Mixed,
    },
  })
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaImage?: ObjectId;
    keywords?: string[];
    canonicalUrl?: string;
    structuredData?: any;
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

export const ContentEntrySchema = SchemaFactory.createForClass(ContentEntry);

// Add indexes for performance
ContentEntrySchema.index({ companyId: 1, contentType: 1 });
ContentEntrySchema.index({ companyId: 1, contentTypeId: 1 });
ContentEntrySchema.index({ companyId: 1, status: 1 });
ContentEntrySchema.index({ companyId: 1, locale: 1 });
ContentEntrySchema.index({ companyId: 1, isDraft: 1 });
ContentEntrySchema.index({ companyId: 1, publishedAt: -1 });
ContentEntrySchema.index({ createdAt: -1 });
ContentEntrySchema.index({ updatedAt: -1 });
ContentEntrySchema.index({ deletedAt: 1 }, { sparse: true });

// Compound indexes for common queries
ContentEntrySchema.index({
  companyId: 1,
  contentType: 1,
  status: 1,
  locale: 1,
});
ContentEntrySchema.index({
  companyId: 1,
  contentType: 1,
  createdAt: -1,
});

// Text index for search functionality
ContentEntrySchema.index(
  {
    'data.title': 'text',
    'data.content': 'text',
    'data.description': 'text',
  },
  {
    weights: {
      'data.title': 10,
      'data.content': 5,
      'data.description': 1,
    },
    name: 'content_text_search',
  },
);

// Pre-save middleware
ContentEntrySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.isNew) {
    this.createdAt = new Date();
  }
  next();
});

// Pre-update middleware
ContentEntrySchema.pre(['updateOne', 'findOneAndUpdate'], function () {
  this.set({ updatedAt: new Date() });
});

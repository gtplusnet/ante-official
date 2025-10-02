import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as MongooseSchema } from 'mongoose';
import { FieldType } from '../common/interfaces/cms.interface';

export type FieldDocument = Field & Document;

@Schema({
  timestamps: true,
  collection: 'cms_fields',
})
export class Field {
  @Prop({ required: true })
  companyId: number;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'ContentType',
  })
  contentTypeId: ObjectId;

  @Prop({ required: true, trim: true })
  id: string; // Unique field identifier (used in frontend)

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop({
    required: true,
    enum: Object.values(FieldType),
  })
  type: FieldType;

  @Prop({ required: true, default: 0 })
  position: number;

  @Prop({ default: false })
  required: boolean;

  @Prop({ default: false })
  unique: boolean;

  @Prop({ default: false })
  private: boolean;

  @Prop({ default: true })
  searchable: boolean;

  @Prop({ default: true })
  sortable: boolean;

  @Prop({ default: false })
  repeatable: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed })
  defaultValue: any;

  @Prop({
    type: String,
    enum: ['full', 'two-thirds', 'half', 'third'],
    default: 'full',
  })
  size: string;

  // Validation
  @Prop({
    type: [
      {
        type: String,
        value: MongooseSchema.Types.Mixed,
        message: String,
      },
    ],
    default: [],
  })
  validations: Array<{
    type: string;
    value: any;
    message?: string;
  }>;

  @Prop()
  minLength?: number;

  @Prop()
  maxLength?: number;

  @Prop()
  min?: number;

  @Prop()
  max?: number;

  // Type-specific properties
  @Prop({ type: [String], default: [] })
  enumValues: string[];

  @Prop({ trim: true })
  targetContentType?: string;

  @Prop({
    type: String,
    enum: [
      'oneToOne',
      'oneToMany',
      'manyToOne',
      'manyToMany',
      'oneWay',
      'manyWay',
    ],
  })
  relationType?: string;

  @Prop({ type: [String], default: [] })
  allowedTypes: string[];

  @Prop({ trim: true })
  component?: string;

  @Prop({ type: [String], default: [] })
  components: string[];

  // UI properties
  @Prop({ trim: true })
  placeholder?: string;

  @Prop({ trim: true })
  hint?: string;

  @Prop({ trim: true })
  tooltip?: string;

  @Prop({ default: false })
  disabled: boolean;

  @Prop({ default: false })
  readonly: boolean;

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

export const FieldSchema = SchemaFactory.createForClass(Field);

// Add indexes for performance
FieldSchema.index({ contentTypeId: 1, companyId: 1, position: 1 });
FieldSchema.index({ contentTypeId: 1 });
FieldSchema.index({ companyId: 1 });
FieldSchema.index({ companyId: 1, id: 1 }, { unique: true });
FieldSchema.index({ createdAt: -1 });
FieldSchema.index({ updatedAt: -1 });
FieldSchema.index({ deletedAt: 1 }, { sparse: true });

// Pre-save middleware
FieldSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.isNew) {
    this.createdAt = new Date();
  }
  next();
});

// Pre-update middleware
FieldSchema.pre(['updateOne', 'findOneAndUpdate'], function () {
  this.set({ updatedAt: new Date() });
});

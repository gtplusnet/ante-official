import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as MongooseSchema } from 'mongoose';
import { CMSDocument } from '../common/interfaces/cms.interface';

export type ActivityLogDocument = ActivityLog & Document;

@Schema({
  timestamps: true,
  collection: 'cms_activity_logs',
})
export class ActivityLog {
  @Prop({ required: true })
  companyId: number;

  @Prop({
    required: true,
    enum: [
      'create',
      'update',
      'delete',
      'publish',
      'unpublish',
      'restore',
      'duplicate',
    ],
  })
  action: string;

  @Prop({
    required: true,
    enum: [
      'content',
      'contentType',
      'media',
      'component',
      'folder',
      'token',
      'webhook',
    ],
  })
  resource: string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId })
  resourceId: ObjectId;

  @Prop({ required: true, trim: true })
  resourceName: string;

  @Prop({
    type: {
      before: MongooseSchema.Types.Mixed,
      after: MongooseSchema.Types.Mixed,
      fields: [String],
    },
  })
  changes?: {
    before?: any;
    after?: any;
    fields?: string[];
  };

  @Prop({
    type: {
      ip: String,
      userAgent: String,
      source: { type: String, enum: ['web', 'api', 'webhook', 'system'] },
    },
  })
  metadata?: {
    ip?: string;
    userAgent?: string;
    source?: string;
  };

  @Prop({ required: true })
  performedBy: string;

  @Prop({ default: Date.now })
  performedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop()
  deletedAt?: Date;

  // Virtual properties
  _id: any;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);

// Add indexes
ActivityLogSchema.index({ companyId: 1, performedAt: -1 });
ActivityLogSchema.index({ companyId: 1, action: 1, performedAt: -1 });
ActivityLogSchema.index({ companyId: 1, resource: 1, performedAt: -1 });
ActivityLogSchema.index({ companyId: 1, resourceId: 1, performedAt: -1 });
ActivityLogSchema.index({ companyId: 1, performedBy: 1, performedAt: -1 });
ActivityLogSchema.index({ performedAt: -1 });
ActivityLogSchema.index({ deletedAt: 1 }, { sparse: true });

// TTL index to automatically remove old logs (optional, 90 days)
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Pre-save middleware
ActivityLogSchema.pre('save', function (next) {
  if (this.isNew) {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
  next();
});

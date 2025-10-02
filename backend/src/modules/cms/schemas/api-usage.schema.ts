import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as MongooseSchema } from 'mongoose';

export type ApiUsageDocument = ApiUsage & Document;

@Schema({
  timestamps: true,
  collection: 'cms_api_usage',
})
export class ApiUsage {
  @Prop({ required: true })
  companyId: number;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId })
  tokenId: ObjectId;

  @Prop({ required: true, trim: true })
  endpoint: string;

  @Prop({
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
  method: string;

  @Prop({ trim: true })
  contentType?: string;

  @Prop({ required: true })
  statusCode: number;

  @Prop({ required: true, min: 0 })
  responseTime: number;

  @Prop({ required: true })
  success: boolean;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop({
    type: {
      userAgent: String,
      ip: String,
      apiType: { type: String, enum: ['REST', 'GraphQL'], default: 'REST' },
      requestSize: Number,
      responseSize: Number,
    },
  })
  metadata?: {
    userAgent?: string;
    ip?: string;
    apiType?: 'REST' | 'GraphQL';
    requestSize?: number;
    responseSize?: number;
  };

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  // Virtual properties
  _id: any;
}

export const ApiUsageSchema = SchemaFactory.createForClass(ApiUsage);

// Add indexes for efficient queries
ApiUsageSchema.index({ companyId: 1, timestamp: -1 });
ApiUsageSchema.index({ companyId: 1, tokenId: 1, timestamp: -1 });
ApiUsageSchema.index({ companyId: 1, endpoint: 1, timestamp: -1 });
ApiUsageSchema.index({ companyId: 1, method: 1, timestamp: -1 });
ApiUsageSchema.index({ companyId: 1, success: 1, timestamp: -1 });
ApiUsageSchema.index({ companyId: 1, contentType: 1, timestamp: -1 });
ApiUsageSchema.index({ timestamp: -1 });

// TTL index to automatically remove old logs after 90 days
ApiUsageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Pre-save middleware
ApiUsageSchema.pre('save', function (next) {
  if (this.isNew) {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
  next();
});

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { TimestampedDocument } from '../common/interfaces/cms.interface';

export type WebhookDocument = Webhook & Document;

@Schema({
  timestamps: true,
  collection: 'cms_webhooks',
})
export class Webhook {
  @Prop({ required: true })
  companyId: number;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  url: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  headers?: Record<string, string>;

  @Prop({
    type: [String],
    required: true,
    validate: {
      validator: function (events: string[]) {
        return events.length > 0;
      },
      message: 'At least one event must be specified',
    },
  })
  events: string[];

  @Prop({ type: [String] })
  contentTypes?: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: {
      maxRetries: { type: Number, min: 0, max: 10, default: 3 },
      retryDelay: { type: Number, min: 1000, default: 5000 },
    },
    default: {
      maxRetries: 3,
      retryDelay: 5000,
    },
  })
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
  };

  @Prop()
  lastTriggeredAt?: Date;

  @Prop({ default: 0, min: 0 })
  failureCount: number;

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

export const WebhookSchema = SchemaFactory.createForClass(Webhook);

// Add indexes
WebhookSchema.index({ companyId: 1, name: 1 }, { unique: true });
WebhookSchema.index({ companyId: 1, isActive: 1 });
WebhookSchema.index({ companyId: 1, events: 1 });
WebhookSchema.index({ companyId: 1, contentTypes: 1 });
WebhookSchema.index({ companyId: 1, lastTriggeredAt: -1 });
WebhookSchema.index({ deletedAt: 1 }, { sparse: true });

// Pre-save middleware
WebhookSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.isNew) {
    this.createdAt = new Date();
  }
  next();
});

// Pre-update middleware
WebhookSchema.pre(['updateOne', 'findOneAndUpdate'], function () {
  this.set({ updatedAt: new Date() });
});

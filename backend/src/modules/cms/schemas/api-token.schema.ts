import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { TimestampedDocument } from '../common/interfaces/cms.interface';

export type ApiTokenDocument = ApiToken & Document;

@Schema({
  timestamps: true,
  collection: 'cms_api_tokens',
})
export class ApiToken {
  @Prop({ required: true })
  companyId: number;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, trim: true })
  token: string; // This should be hashed

  @Prop({ trim: true })
  rawToken?: string; // Store raw token for read-only tokens only (for testing)

  @Prop({
    required: true,
    enum: ['read-only', 'full-access', 'custom'],
    default: 'read-only',
  })
  type: string;

  @Prop({
    type: {
      contentTypes: {
        type: MongooseSchema.Types.Mixed,
        default: {},
      },
    },
    default: {
      contentTypes: {},
    },
  })
  permissions: {
    contentTypes: {
      [contentType: string]: {
        find: boolean;
        findOne: boolean;
        create: boolean;
        update: boolean;
        delete: boolean;
      };
    };
  };

  @Prop({
    type: {
      requests: { type: Number, min: 1, default: 1000 },
      window: { type: Number, min: 60, default: 3600 }, // in seconds
    },
  })
  rateLimit?: {
    requests: number;
    window: number;
  };

  @Prop()
  lastUsedAt?: Date;

  @Prop()
  expiresAt?: Date;

  @Prop({ default: true })
  isActive: boolean;

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

export const ApiTokenSchema = SchemaFactory.createForClass(ApiToken);

// Add indexes
ApiTokenSchema.index({ companyId: 1, token: 1 }, { unique: true });
ApiTokenSchema.index({ companyId: 1, name: 1 }, { unique: true });
ApiTokenSchema.index({ companyId: 1, isActive: 1 });
ApiTokenSchema.index({ companyId: 1, expiresAt: 1 });
ApiTokenSchema.index({ token: 1 }, { unique: true });
ApiTokenSchema.index({ expiresAt: 1 }, { sparse: true });
ApiTokenSchema.index({ deletedAt: 1 }, { sparse: true });

// Pre-save middleware
ApiTokenSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.isNew) {
    this.createdAt = new Date();
  }
  next();
});

// Pre-update middleware
ApiTokenSchema.pre(['updateOne', 'findOneAndUpdate'], function () {
  this.set({ updatedAt: new Date() });
});

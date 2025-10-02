import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { QueueType } from '@prisma/client';

@Schema({ timestamps: true })
export class QueueMongo extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Object, default: {} })
  queueSettings: Record<string, any>;

  @Prop({ type: String, required: true, enum: QueueType })
  type: QueueType;

  @Prop({ default: 'PENDING' })
  status: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  processedAt?: Date;

  @Prop({ type: String })
  errorStatus?: string;

  @Prop({ type: Number, default: 0 })
  totalCount?: number;

  @Prop({ type: Number, default: 0 })
  currentCount?: number;

  @Prop({ type: Number, default: 0 })
  completePercentage?: number;
}

export const QueueMongoSchema = SchemaFactory.createForClass(QueueMongo);

QueueMongoSchema.index({ status: 1 });
QueueMongoSchema.index({ type: 1 });
QueueMongoSchema.index({ createdAt: -1 });

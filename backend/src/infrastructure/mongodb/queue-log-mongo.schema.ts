import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class QueueLogMongo extends Document {
  @Prop({ required: true })
  queueId: string;

  @Prop({ type: Object, required: true })
  params: object;

  @Prop({ required: true })
  message: string;

  @Prop({ default: 'PENDING' })
  status: string;

  @Prop({ type: String })
  errorStatus?: string;
}

export const QueueLogMongoSchema = SchemaFactory.createForClass(QueueLogMongo);

QueueLogMongoSchema.index({ queueId: 1 });
QueueLogMongoSchema.index({ status: 1 });
QueueLogMongoSchema.index({ queueId: 1, status: 1 });
QueueLogMongoSchema.index({ createdAt: -1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum SchedulerStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  ERROR = 'ERROR',
}

export enum SchedulerLastStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  NONE = 'NONE',
}

@Schema({ timestamps: true })
export class SchedulerMongo extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ unique: true, sparse: true })
  referenceKey?: string;

  @Prop({ required: true })
  cronExpression: string;

  @Prop({ required: true })
  taskType: string;

  @Prop({ type: Object, default: {} })
  taskConfig: Record<string, any>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, default: SchedulerStatus.IDLE, enum: SchedulerStatus })
  status: SchedulerStatus;

  @Prop({ type: Date })
  lastRunAt?: Date;

  @Prop({ type: Date })
  nextRunAt?: Date;

  @Prop({
    type: String,
    default: SchedulerLastStatus.NONE,
    enum: SchedulerLastStatus,
  })
  lastStatus: SchedulerLastStatus;

  @Prop({ type: Number })
  lastDuration?: number;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const SchedulerMongoSchema =
  SchemaFactory.createForClass(SchedulerMongo);

// Indexes for performance
// Note: name field already has unique index from @Prop({ unique: true })
SchedulerMongoSchema.index({ isActive: 1 });
SchedulerMongoSchema.index({ status: 1 });
SchedulerMongoSchema.index({ taskType: 1 });
SchedulerMongoSchema.index({ nextRunAt: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum ExecutionStatus {
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class SchedulerExecutionMongo extends Document {
  @Prop({ required: true })
  schedulerId: string;

  @Prop({ required: true })
  schedulerName: string;

  @Prop({ type: String, required: true, enum: ExecutionStatus })
  status: ExecutionStatus;

  @Prop({ type: Date, required: true })
  startedAt: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: Number })
  duration?: number;

  @Prop({ type: String })
  output?: string;

  @Prop({ type: String })
  error?: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const SchedulerExecutionMongoSchema = SchemaFactory.createForClass(
  SchedulerExecutionMongo,
);

// Indexes for performance
SchedulerExecutionMongoSchema.index({ schedulerId: 1 });
SchedulerExecutionMongoSchema.index({ status: 1 });
SchedulerExecutionMongoSchema.index({ startedAt: -1 });
SchedulerExecutionMongoSchema.index({ createdAt: -1 });
SchedulerExecutionMongoSchema.index({ schedulerId: 1, createdAt: -1 });

// TTL index to automatically delete old execution logs after 30 days
SchedulerExecutionMongoSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 },
);

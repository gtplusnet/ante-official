import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum ActionCheckType {
  CONTRACT = 'CONTRACT',
  LEAVE = 'LEAVE',
  DOCUMENT = 'DOCUMENT',
}

export enum ActionIssueType {
  // Contract related
  CONTRACT_EXPIRING_30D = 'CONTRACT_EXPIRING_30D',
  CONTRACT_EXPIRING_7D = 'CONTRACT_EXPIRING_7D',
  CONTRACT_EXPIRING_3D = 'CONTRACT_EXPIRING_3D',
  CONTRACT_EXPIRED = 'CONTRACT_EXPIRED',
  NO_CONTRACT = 'NO_CONTRACT',
  NO_EMPLOYEE_DATA = 'NO_EMPLOYEE_DATA',

  // Leave related (future)
  LEAVE_BALANCE_LOW = 'LEAVE_BALANCE_LOW',

  // Document related (future)
  DOCUMENT_EXPIRING = 'DOCUMENT_EXPIRING',
  DOCUMENT_EXPIRED = 'DOCUMENT_EXPIRED',
}

export type AccountActionDocument = AccountAction & Document;

@Schema({
  timestamps: true,
  collection: 'account_actions',
})
export class AccountAction {
  @Prop({ required: true, index: true })
  accountId: string;

  @Prop({ required: true })
  employeeName: string;

  @Prop()
  employeeCode?: string;

  @Prop({ required: true, enum: ActionCheckType, index: true })
  checkType: ActionCheckType;

  @Prop({ required: true, enum: ActionIssueType })
  issueType: ActionIssueType;

  @Prop({ required: true, min: 1, max: 9, index: true })
  priority: number;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ default: false, index: true })
  isIgnored: boolean;

  @Prop()
  ignoredBy?: string;

  @Prop()
  ignoredAt?: Date;

  @Prop()
  resolvedAt?: Date;

  @Prop()
  resolvedBy?: string;

  @Prop()
  resolutionNotes?: string;

  @Prop()
  lastCheckedAt: Date;

  @Prop()
  daysUntilExpiry?: number;

  @Prop()
  daysSinceExpiry?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AccountActionSchema = SchemaFactory.createForClass(AccountAction);

// Compound indexes for performance
AccountActionSchema.index({
  accountId: 1,
  checkType: 1,
  priority: 1,
  isIgnored: 1,
});
AccountActionSchema.index({ priority: 1, isIgnored: 1, resolvedAt: 1 });

// TTL index to auto-delete resolved items after 90 days
AccountActionSchema.index(
  { resolvedAt: 1 },
  {
    expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
    partialFilterExpression: { resolvedAt: { $exists: true } },
  },
);

// Text index for search
AccountActionSchema.index({ description: 'text', employeeName: 'text' });

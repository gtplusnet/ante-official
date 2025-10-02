import { QueueLogStatus, QueueStatus, QueueType } from '@prisma/client';
import { DateFormat, PercentageFormat } from './utility.format';

export interface QueueResponse {
  id: string;
  name: string;
  type: QueueType;
  status: QueueStatus;
  completePercentage: PercentageFormat;
  currentCount: number;
  totalCount: number;
  queueSettings: object;
  logs: QueueLogResponse[];
  createdAt: DateFormat;
  updatedAt: DateFormat;
}

export interface QueueLogResponse {
  id: number;
  queueId: string;
  params: object;
  message: string;
  status: QueueLogStatus;
  errorStatus?: string;
  createdAt: DateFormat;
}

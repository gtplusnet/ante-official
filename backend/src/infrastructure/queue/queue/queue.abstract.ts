import { Queue, QueueLogs } from '@prisma/client';

export abstract class QueueAbstract {
  abstract processPendingQueue(data: Queue): Promise<void>;
  abstract processQueueLog(data: QueueLogs): Promise<void>;
}

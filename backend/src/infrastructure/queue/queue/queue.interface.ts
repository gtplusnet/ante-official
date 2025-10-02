import { QueueType } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Exists } from '@common/validators/exists.validator';
import { QueueStatus } from '@prisma/client';

export class ReinitializeQueueDTO {
  @IsNotEmpty()
  @Exists('queue', 'id', { message: 'Queue ID does not exist.' })
  queueId: number;

  @IsNotEmpty()
  @IsEnum(QueueStatus)
  status: QueueStatus;
}

export interface QueueCreateDTO {
  name: string;
  type: QueueType;
  fileId?: number;
  queueSettings: object;
}

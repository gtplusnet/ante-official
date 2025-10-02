import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueueLogMongo } from '@infrastructure/mongodb/queue-log-mongo.schema';

@Injectable()
export class QueueLogMongoService {
  constructor(
    @InjectModel(QueueLogMongo.name, 'mongo')
    private readonly queueLogModel: Model<QueueLogMongo>,
  ) {}

  async create(data: Partial<QueueLogMongo>): Promise<QueueLogMongo> {
    return this.queueLogModel.create(data);
  }

  async findByQueueId(queueId: string): Promise<QueueLogMongo[]> {
    return this.queueLogModel.find({ queueId }).exec();
  }

  async findByQueueIDAndStatus(
    queueId: string,
    status: string,
    limit = 10,
  ): Promise<QueueLogMongo[]> {
    return this.queueLogModel.find({ queueId, status }).limit(limit).exec();
  }

  async updateStatus(
    id: string,
    status: string,
    errorStatus?: string,
  ): Promise<QueueLogMongo | null> {
    const update: any = { status };
    if (errorStatus) update.errorStatus = errorStatus;
    return this.queueLogModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
  }
}

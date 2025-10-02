import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueueMongo } from '@infrastructure/mongodb/queue-mongo.schema';
import { QueueStatus } from '@prisma/client';

@Injectable()
export class QueueMongoService {
  constructor(
    @InjectModel(QueueMongo.name, 'mongo')
    private readonly queueModel: Model<QueueMongo>,
  ) {}

  async create(data: Partial<QueueMongo>): Promise<QueueMongo> {
    return this.queueModel.create(data);
  }

  async findAll(): Promise<QueueMongo[]> {
    return this.queueModel.find().exec();
  }

  async findById(id: string): Promise<QueueMongo | null> {
    return this.queueModel.findById(id).exec();
  }

  async findByStatus(status: QueueStatus): Promise<QueueMongo[]> {
    return this.queueModel.find({ status }).exec();
  }

  async updateStatus(id: string, status: string): Promise<QueueMongo | null> {
    return this.queueModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<any> {
    return this.queueModel.findByIdAndDelete(id).exec();
  }

  async update(
    id: string,
    data: Partial<QueueMongo>,
  ): Promise<QueueMongo | null> {
    return this.queueModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async paginate(
    page = 1,
    limit = 10,
    filter: import('mongoose').FilterQuery<QueueMongo> = {},
  ): Promise<{
    data: QueueMongo[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    // Ensure page and limit are valid numbers
    const validPage = Math.max(1, Math.floor(page));
    const validLimit = Math.max(1, Math.floor(limit));
    const skip = (validPage - 1) * validLimit;
    const [data, total] = await Promise.all([
      this.queueModel
        .find(filter)
        .skip(skip)
        .limit(validLimit)
        .sort({ createdAt: 'desc' })
        .exec(),
      this.queueModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page: validPage,
      lastPage: Math.ceil(total / validLimit) || 1,
    };
  }
}

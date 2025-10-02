import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SchedulerMongo } from './scheduler-mongo.schema';

@Injectable()
export class SchedulerMongoService {
  constructor(
    @InjectModel(SchedulerMongo.name, 'mongo')
    private readonly schedulerModel: Model<SchedulerMongo>,
  ) {}

  async create(data: Partial<SchedulerMongo>): Promise<SchedulerMongo> {
    return this.schedulerModel.create(data);
  }

  async findAll(): Promise<SchedulerMongo[]> {
    return this.schedulerModel.find().sort({ createdAt: -1 }).exec();
  }

  async findActive(): Promise<SchedulerMongo[]> {
    return this.schedulerModel.find({ isActive: true }).exec();
  }

  async findById(id: string): Promise<SchedulerMongo | null> {
    return this.schedulerModel.findById(id).exec();
  }

  async findByName(name: string): Promise<SchedulerMongo | null> {
    return this.schedulerModel.findOne({ name }).exec();
  }

  async findOne(query: any): Promise<SchedulerMongo | null> {
    return this.schedulerModel.findOne(query).exec();
  }

  async update(
    id: string,
    data: Partial<SchedulerMongo>,
  ): Promise<SchedulerMongo | null> {
    return this.schedulerModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  async updateStatus(
    id: string,
    status: string,
  ): Promise<SchedulerMongo | null> {
    return this.schedulerModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
  }

  async updateLastRun(
    id: string,
    data: {
      lastRunAt: Date;
      lastStatus: string;
      lastDuration?: number;
      nextRunAt?: Date;
    },
  ): Promise<SchedulerMongo | null> {
    return this.schedulerModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  async toggleActive(id: string): Promise<SchedulerMongo | null> {
    const scheduler = await this.findById(id);
    if (!scheduler) return null;

    return this.schedulerModel
      .findByIdAndUpdate(id, { isActive: !scheduler.isActive }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<any> {
    return this.schedulerModel.findByIdAndDelete(id).exec();
  }

  async paginate(
    page = 1,
    limit = 10,
    filter: import('mongoose').FilterQuery<SchedulerMongo> = {},
  ): Promise<{
    data: SchedulerMongo[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const validPage = Math.max(1, Math.floor(page));
    const validLimit = Math.max(1, Math.floor(limit));
    const skip = (validPage - 1) * validLimit;

    const [data, total] = await Promise.all([
      this.schedulerModel
        .find(filter)
        .skip(skip)
        .limit(validLimit)
        .sort({ createdAt: -1 })
        .exec(),
      this.schedulerModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page: validPage,
      lastPage: Math.ceil(total / validLimit) || 1,
    };
  }
}

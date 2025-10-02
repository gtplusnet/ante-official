import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SchedulerExecutionMongo,
  ExecutionStatus,
} from './scheduler-execution-mongo.schema';

@Injectable()
export class SchedulerExecutionMongoService {
  constructor(
    @InjectModel(SchedulerExecutionMongo.name, 'mongo')
    private readonly executionModel: Model<SchedulerExecutionMongo>,
  ) {}

  async create(
    data: Partial<SchedulerExecutionMongo>,
  ): Promise<SchedulerExecutionMongo> {
    return this.executionModel.create(data);
  }

  async findById(id: string): Promise<SchedulerExecutionMongo | null> {
    return this.executionModel.findById(id).exec();
  }

  async findBySchedulerId(
    schedulerId: string,
    limit = 50,
  ): Promise<SchedulerExecutionMongo[]> {
    return this.executionModel
      .find({ schedulerId })
      .sort({ startedAt: -1 })
      .limit(limit)
      .exec();
  }

  async findRunning(): Promise<SchedulerExecutionMongo[]> {
    return this.executionModel.find({ status: ExecutionStatus.RUNNING }).exec();
  }

  async update(
    id: string,
    data: Partial<SchedulerExecutionMongo>,
  ): Promise<SchedulerExecutionMongo | null> {
    return this.executionModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  async completeExecution(
    id: string,
    status: ExecutionStatus,
    output?: string,
    error?: string,
  ): Promise<SchedulerExecutionMongo | null> {
    const completedAt = new Date();
    const execution = await this.findById(id);

    if (!execution) return null;

    const duration = completedAt.getTime() - execution.startedAt.getTime();

    return this.executionModel
      .findByIdAndUpdate(
        id,
        {
          status,
          completedAt,
          duration,
          output,
          error,
        },
        { new: true },
      )
      .exec();
  }

  async getStats(
    schedulerId: string,
    days = 30,
  ): Promise<{
    totalExecutions: number;
    successCount: number;
    failureCount: number;
    averageDuration: number;
    successRate: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const executions = await this.executionModel
      .find({
        schedulerId,
        startedAt: { $gte: startDate },
      })
      .exec();

    const totalExecutions = executions.length;
    const successCount = executions.filter(
      (e) => e.status === ExecutionStatus.SUCCESS,
    ).length;
    const failureCount = executions.filter(
      (e) => e.status === ExecutionStatus.FAILED,
    ).length;

    const completedExecutions = executions.filter((e) => e.duration);
    const averageDuration =
      completedExecutions.length > 0
        ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) /
          completedExecutions.length
        : 0;

    const successRate =
      totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;

    return {
      totalExecutions,
      successCount,
      failureCount,
      averageDuration: Math.round(averageDuration),
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  async paginate(
    schedulerId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    data: SchedulerExecutionMongo[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const validPage = Math.max(1, Math.floor(page));
    const validLimit = Math.max(1, Math.floor(limit));
    const skip = (validPage - 1) * validLimit;

    const filter = schedulerId ? { schedulerId } : {};

    const [data, total] = await Promise.all([
      this.executionModel
        .find(filter)
        .skip(skip)
        .limit(validLimit)
        .sort({ startedAt: -1 })
        .exec(),
      this.executionModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page: validPage,
      lastPage: Math.ceil(total / validLimit) || 1,
    };
  }
}

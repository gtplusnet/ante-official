import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AccountAction,
  AccountActionDocument,
  ActionCheckType,
} from './account-action-mongo.schema';

@Injectable()
export class AccountActionMongoService {
  private readonly logger = new Logger(AccountActionMongoService.name);

  constructor(
    @InjectModel(AccountAction.name, 'mongo')
    private readonly accountActionModel: Model<AccountActionDocument>,
  ) {}

  async create(data: Partial<AccountAction>): Promise<AccountActionDocument> {
    const action = new this.accountActionModel(data);
    return action.save();
  }

  async bulkUpsert(actions: Partial<AccountAction>[]): Promise<void> {
    if (actions.length === 0) return;

    const bulkOps = actions.map((action) => ({
      updateOne: {
        filter: {
          accountId: action.accountId,
          checkType: action.checkType,
          issueType: action.issueType,
        },
        update: {
          $set: {
            ...action,
            lastCheckedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    try {
      const result = await this.accountActionModel.bulkWrite(bulkOps);
      this.logger.log(
        `Bulk upserted ${result.upsertedCount} new items, modified ${result.modifiedCount} existing items`,
      );
    } catch (error) {
      this.logger.error('Failed to bulk upsert account actions', error);
      throw error;
    }
  }

  async findByAccountId(accountId: string): Promise<AccountActionDocument[]> {
    return this.accountActionModel
      .find({ accountId, resolvedAt: null, isIgnored: false })
      .sort({ priority: 1 })
      .exec();
  }

  async paginate(
    page = 1,
    limit = 50,
    filters: {
      checkType?: ActionCheckType;
      priority?: number;
      isIgnored?: boolean;
      resolved?: boolean;
      search?: string;
    } = {},
  ): Promise<{
    data: AccountActionDocument[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const query: any = {};

    if (filters.checkType) {
      query.checkType = filters.checkType;
    }

    if (filters.priority) {
      query.priority = filters.priority;
    }

    if (filters.isIgnored !== undefined) {
      query.isIgnored = filters.isIgnored;
    }

    if (filters.resolved !== undefined) {
      if (filters.resolved) {
        query.resolvedAt = { $exists: true };
      } else {
        query.resolvedAt = null;
      }
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.accountActionModel
        .find(query)
        .sort({ priority: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.accountActionModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async getStats(): Promise<{
    totalActive: number;
    byPriority: Record<number, number>;
    byCheckType: Record<string, number>;
    recentlyResolved: number;
  }> {
    const [totalActive, byPriority, byCheckType, recentlyResolved] =
      await Promise.all([
        this.accountActionModel.countDocuments({
          resolvedAt: null,
          isIgnored: false,
        }),
        this.accountActionModel.aggregate([
          { $match: { resolvedAt: null, isIgnored: false } },
          { $group: { _id: '$priority', count: { $sum: 1 } } },
        ]),
        this.accountActionModel.aggregate([
          { $match: { resolvedAt: null, isIgnored: false } },
          { $group: { _id: '$checkType', count: { $sum: 1 } } },
        ]),
        this.accountActionModel.countDocuments({
          resolvedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),
      ]);

    const priorityMap = byPriority.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const checkTypeMap = byCheckType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return {
      totalActive,
      byPriority: priorityMap,
      byCheckType: checkTypeMap,
      recentlyResolved,
    };
  }

  async ignoreAction(
    id: string,
    ignoredBy: string,
  ): Promise<AccountActionDocument> {
    return this.accountActionModel.findByIdAndUpdate(
      id,
      {
        isIgnored: true,
        ignoredBy,
        ignoredAt: new Date(),
      },
      { new: true },
    );
  }

  async resolveAction(
    id: string,
    resolvedBy: string,
    resolutionNotes?: string,
  ): Promise<AccountActionDocument> {
    return this.accountActionModel.findByIdAndUpdate(
      id,
      {
        resolvedAt: new Date(),
        resolvedBy,
        resolutionNotes,
      },
      { new: true },
    );
  }

  async clearResolvedByAccount(
    accountId: string,
    checkType?: ActionCheckType,
  ): Promise<void> {
    const query: any = { accountId, resolvedAt: null };
    if (checkType) {
      query.checkType = checkType;
    }

    await this.accountActionModel.updateMany(query, {
      $set: {
        resolvedAt: new Date(),
        resolutionNotes: 'Auto-resolved: Issue no longer exists',
      },
    });
  }

  async findById(id: string): Promise<AccountActionDocument> {
    return this.accountActionModel.findById(id);
  }

  async deleteOldResolved(daysOld = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    const result = await this.accountActionModel.deleteMany({
      resolvedAt: { $lt: cutoffDate },
    });
    return result.deletedCount;
  }
}

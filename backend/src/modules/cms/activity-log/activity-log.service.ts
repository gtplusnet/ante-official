import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import {
  ActivityLog,
  ActivityLogDocument,
} from '../schemas/activity-log.schema';
import { UtilityService } from '@common/utility.service';
import { CacheService } from '@infrastructure/cache/cache.service';
import { PaginatedResponse } from '../common/interfaces/cms.interface';

export interface CreateActivityLogDto {
  action: string;
  resource: string;
  resourceId: string;
  resourceName: string;
  changes?: {
    before?: any;
    after?: any;
    fields?: string[];
  };
  metadata?: {
    ip?: string;
    userAgent?: string;
    source?: string;
  };
}

export interface QueryActivityLogDto {
  page?: number;
  pageSize?: number;
  action?: string;
  resource?: string;
  resourceId?: string;
  performedBy?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  sort?: Record<string, 1 | -1>;
}

export interface ActivityLogStats {
  totalActivities: number;
  actionsBreakdown: Record<string, number>;
  resourcesBreakdown: Record<string, number>;
  activeUsers: number;
  recentActivities: any[];
  topUsers: Array<{
    userId: string;
    count: number;
  }>;
}

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectModel(ActivityLog.name, 'mongo')
    private activityLogModel: Model<ActivityLogDocument>,
    @InjectConnection('mongo')
    private mongoConnection: Connection,
    private utility: UtilityService,
    private cacheService: CacheService,
  ) {}

  async create(dto: CreateActivityLogDto): Promise<any> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    const activityLog = new this.activityLogModel({
      companyId,
      action: dto.action,
      resource: dto.resource,
      resourceId: new this.mongoConnection.base.Types.ObjectId(dto.resourceId),
      resourceName: dto.resourceName,
      changes: dto.changes,
      metadata: {
        ...dto.metadata,
        source: dto.metadata?.source || 'web',
      },
      performedBy: userId,
      performedAt: new Date(),
    });

    const saved = await activityLog.save();

    // Clear cache for activity logs
    await this.cacheService.invalidateQueries(companyId, 'activity-logs');

    return saved.toObject();
  }

  async logContentTypeActivity(
    action: string,
    contentType: any,
    changes?: any,
    metadata?: any,
  ): Promise<any> {
    return this.create({
      action,
      resource: 'contentType',
      resourceId: contentType._id.toString(),
      resourceName: contentType.displayName || contentType.name,
      changes,
      metadata,
    });
  }

  async logContentActivity(
    action: string,
    contentTypeName: string,
    content: any,
    changes?: any,
    metadata?: any,
  ): Promise<any> {
    const resourceName =
      content.data?.title || content.data?.name || `${contentTypeName} Entry`;

    return this.create({
      action,
      resource: 'content',
      resourceId: content._id.toString(),
      resourceName,
      changes,
      metadata,
    });
  }

  async logMediaActivity(
    action: string,
    media: any,
    changes?: any,
    metadata?: any,
  ): Promise<any> {
    return this.create({
      action,
      resource: 'media',
      resourceId: media._id.toString(),
      resourceName: media.originalName || media.filename,
      changes,
      metadata,
    });
  }

  async logFolderActivity(
    action: string,
    folder: any,
    changes?: any,
    metadata?: any,
  ): Promise<any> {
    return this.create({
      action,
      resource: 'folder',
      resourceId: folder._id.toString(),
      resourceName: folder.name,
      changes,
      metadata,
    });
  }

  async findAll(
    query: QueryActivityLogDto = {},
  ): Promise<PaginatedResponse<any>> {
    const companyId = this.utility.companyId;

    // Set defaults
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100); // Max 100 items per page

    // Try to get from cache first
    const cacheKey = this.cacheService.generateQueryHash(query);
    const cached = await this.cacheService.getQueryResult(
      companyId,
      'activity-logs',
      cacheKey,
    );
    if (cached) {
      return cached;
    }

    // Build filter
    const filter: any = {
      companyId,
      deletedAt: null,
      ...(query.action && { action: query.action }),
      ...(query.resource && { resource: query.resource }),
      ...(query.performedBy && { performedBy: query.performedBy }),
    };

    if (query.resourceId) {
      filter.resourceId = new this.mongoConnection.base.Types.ObjectId(
        query.resourceId,
      );
    }

    // Add date range filter
    if (query.dateRange) {
      filter.performedAt = {};
      if (query.dateRange.from) {
        filter.performedAt['$gte'] = query.dateRange.from;
      }
      if (query.dateRange.to) {
        filter.performedAt['$lte'] = query.dateRange.to;
      }
    }

    // Build sort
    const sort = query.sort || { performedAt: -1 };

    // Execute query with pagination
    const [items, total] = await Promise.all([
      this.activityLogModel
        .find(filter)
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
      this.activityLogModel.countDocuments(filter),
    ]);

    const response = {
      data: items,
      meta: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
    };

    // Cache the result for 2 minutes
    await this.cacheService.setQueryResult(
      companyId,
      'activity-logs',
      cacheKey,
      response,
      120,
    );

    return response;
  }

  async findOne(id: string): Promise<any> {
    const companyId = this.utility.companyId;

    const activityLog = await this.activityLogModel
      .findOne({
        _id: new this.mongoConnection.base.Types.ObjectId(id),
        companyId,
        deletedAt: null,
      })
      .lean()
      .exec();

    if (!activityLog) {
      throw new NotFoundException('Activity log not found');
    }

    return activityLog;
  }

  async getStats(dateRange?: {
    from?: Date;
    to?: Date;
  }): Promise<ActivityLogStats> {
    const companyId = this.utility.companyId;

    const filter: any = {
      companyId,
      deletedAt: null,
    };

    // Add date range filter if provided
    if (dateRange) {
      filter.performedAt = {};
      if (dateRange.from) {
        filter.performedAt['$gte'] = dateRange.from;
      }
      if (dateRange.to) {
        filter.performedAt['$lte'] = dateRange.to;
      }
    }

    const [
      totalActivities,
      actionsBreakdown,
      resourcesBreakdown,
      activeUsers,
      recentActivities,
      topUsers,
    ] = await Promise.all([
      // Total activities count
      this.activityLogModel.countDocuments(filter),

      // Actions breakdown
      this.activityLogModel.aggregate([
        { $match: filter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Resources breakdown
      this.activityLogModel.aggregate([
        { $match: filter },
        { $group: { _id: '$resource', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Active users count
      this.activityLogModel.distinct('performedBy', filter),

      // Recent activities (last 10)
      this.activityLogModel
        .find(filter)
        .sort({ performedAt: -1 })
        .limit(10)
        .select('action resource resourceName performedBy performedAt')
        .lean()
        .exec(),

      // Top users by activity count
      this.activityLogModel.aggregate([
        { $match: filter },
        { $group: { _id: '$performedBy', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { userId: '$_id', count: 1, _id: 0 } },
      ]),
    ]);

    return {
      totalActivities,
      actionsBreakdown: actionsBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      resourcesBreakdown: resourcesBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      activeUsers: activeUsers.length,
      recentActivities,
      topUsers,
    };
  }

  async getResourceHistory(
    resource: string,
    resourceId: string,
  ): Promise<any[]> {
    const companyId = this.utility.companyId;

    const activities = await this.activityLogModel
      .find({
        companyId,
        resource,
        resourceId: new this.mongoConnection.base.Types.ObjectId(resourceId),
        deletedAt: null,
      })
      .sort({ performedAt: -1 })
      .lean()
      .exec();

    return activities;
  }

  async getUserActivity(
    userId: string,
    query: QueryActivityLogDto = {},
  ): Promise<PaginatedResponse<any>> {
    const companyId = this.utility.companyId;

    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);

    const filter: any = {
      companyId,
      performedBy: userId,
      deletedAt: null,
      ...(query.action && { action: query.action }),
      ...(query.resource && { resource: query.resource }),
    };

    // Add date range filter
    if (query.dateRange) {
      filter.performedAt = {};
      if (query.dateRange.from) {
        filter.performedAt['$gte'] = query.dateRange.from;
      }
      if (query.dateRange.to) {
        filter.performedAt['$lte'] = query.dateRange.to;
      }
    }

    const sort = query.sort || { performedAt: -1 };

    const [items, total] = await Promise.all([
      this.activityLogModel
        .find(filter)
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
      this.activityLogModel.countDocuments(filter),
    ]);

    return {
      data: items,
      meta: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize),
      },
    };
  }

  async cleanup(retentionDays = 90): Promise<{ deletedCount: number }> {
    const companyId = this.utility.companyId;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.activityLogModel.deleteMany({
      companyId,
      createdAt: { $lt: cutoffDate },
    });

    // Clear cache
    await this.cacheService.invalidateQueries(companyId, 'activity-logs');

    return { deletedCount: result.deletedCount || 0 };
  }

  async exportActivities(query: QueryActivityLogDto = {}): Promise<any[]> {
    const companyId = this.utility.companyId;

    const filter: any = {
      companyId,
      deletedAt: null,
      ...(query.action && { action: query.action }),
      ...(query.resource && { resource: query.resource }),
      ...(query.performedBy && { performedBy: query.performedBy }),
    };

    if (query.resourceId) {
      filter.resourceId = new this.mongoConnection.base.Types.ObjectId(
        query.resourceId,
      );
    }

    // Add date range filter
    if (query.dateRange) {
      filter.performedAt = {};
      if (query.dateRange.from) {
        filter.performedAt['$gte'] = query.dateRange.from;
      }
      if (query.dateRange.to) {
        filter.performedAt['$lte'] = query.dateRange.to;
      }
    }

    const activities = await this.activityLogModel
      .find(filter)
      .sort({ performedAt: -1 })
      .limit(10000) // Max 10k records for export
      .lean()
      .exec();

    return activities.map((activity) => ({
      id: activity._id,
      action: activity.action,
      resource: activity.resource,
      resourceName: activity.resourceName,
      performedBy: activity.performedBy,
      performedAt: activity.performedAt,
      changes: activity.changes,
      metadata: activity.metadata,
    }));
  }

  // Utility method for creating change tracking
  createChangesDiff(
    before: any,
    after: any,
  ): { before: any; after: any; fields: string[] } {
    const changes: { before: any; after: any; fields: string[] } = {
      before: {},
      after: {},
      fields: [],
    };

    const allKeys = new Set([
      ...Object.keys(before || {}),
      ...Object.keys(after || {}),
    ]);

    allKeys.forEach((key) => {
      if (JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key])) {
        changes.fields.push(key);
        changes.before[key] = before?.[key];
        changes.after[key] = after?.[key];
      }
    });

    return changes;
  }
}

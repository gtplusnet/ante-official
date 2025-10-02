import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ContentType,
  ContentTypeDocument,
} from '../schemas/content-type.schema';
import {
  ActivityLog,
  ActivityLogDocument,
} from '../schemas/activity-log.schema';
import { ApiUsage, ApiUsageDocument } from '../schemas/api-usage.schema';
import { ApiToken, ApiTokenDocument } from '../schemas/api-token.schema';
import { UtilityService } from '@common/utility.service';
import { CacheService } from '@infrastructure/cache/cache.service';
import { ContentTypeType } from '../common/interfaces/cms.interface';
import { PrismaService } from '@common/prisma.service';
import { FileType } from '@prisma/client';

export interface DashboardStats {
  contentTypes: {
    collections: number;
    singles: number;
    components: number;
    total: number;
  };
  media: {
    totalFiles: number;
    totalSize: number;
    totalSizeFormatted: string;
  };
  apiCalls: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  activity: {
    recentActions: number;
    activeUsers: number;
  };
}

export interface WeeklyApiUsage {
  name: string;
  rest: number;
  graphql: number;
  restCount: number;
  graphqlCount: number;
}

export interface ApiStatistics {
  totalRequests: number;
  avgResponseTime: number;
  successRate: number;
  activeTokens: number;
}

export interface TopEndpoint {
  method: string;
  path: string;
  calls: string;
  callCount: number;
}

export interface MediaTypeStats {
  type: 'image' | 'video' | 'document' | 'other';
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  count: number;
  size: number;
  sizeFormatted: string;
}

export interface RecentMediaUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  type: 'image' | 'video' | 'document' | 'other';
  icon: string;
  size: number;
  sizeFormatted: string;
  uploadedAt: Date;
  timeAgo: string;
  thumbnail?: string;
}

export interface DetailedMediaStats {
  storage: {
    used: number;
    total: number;
    percentage: number;
    usedFormatted: string;
    totalFormatted: string;
  };
  mediaTypes: MediaTypeStats[];
  recentUploads: RecentMediaUpload[];
  totalFiles: number;
  totalSize: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(ContentType.name, 'mongo')
    private contentTypeModel: Model<ContentTypeDocument>,
    @InjectModel(ActivityLog.name, 'mongo')
    private activityLogModel: Model<ActivityLogDocument>,
    @InjectModel(ApiUsage.name, 'mongo')
    private apiUsageModel: Model<ApiUsageDocument>,
    @InjectModel(ApiToken.name, 'mongo')
    private apiTokenModel: Model<ApiTokenDocument>,
    private utility: UtilityService,
    private cacheService: CacheService,
    private prisma: PrismaService,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const companyId = this.utility.companyId;
    const cacheKey = `cms:dashboard:stats:${companyId}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return cached as DashboardStats;
    }

    const [contentTypeStats, mediaStats, apiStats, activityStats] =
      await Promise.all([
        this.getContentTypeStats(),
        this.getMediaStats(),
        this.getApiUsageStats(),
        this.getActivityStats(),
      ]);

    const stats: DashboardStats = {
      contentTypes: contentTypeStats,
      media: mediaStats,
      apiCalls: apiStats,
      activity: activityStats,
    };

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, stats, 300);
    return stats;
  }

  async getContentTypeStats() {
    const companyId = this.utility.companyId;

    const [collections, singles, components] = await Promise.all([
      this.contentTypeModel.countDocuments({
        companyId,
        type: ContentTypeType.COLLECTION,
        deletedAt: { $exists: false },
      }),
      this.contentTypeModel.countDocuments({
        companyId,
        type: ContentTypeType.SINGLE,
        deletedAt: { $exists: false },
      }),
      this.contentTypeModel.countDocuments({
        companyId,
        type: ContentTypeType.COMPONENT,
        deletedAt: { $exists: false },
      }),
    ]);

    return {
      collections,
      singles,
      components,
      total: collections + singles + components,
    };
  }

  async getMediaStats() {
    const companyId = this.utility.companyId;

    // Get media stats from PostgreSQL Files table
    const mediaStats = await this.prisma.files.aggregate({
      where: {
        companyId,
      },
      _count: {
        id: true,
      },
      _sum: {
        size: true,
      },
    });

    const totalFiles = mediaStats._count.id || 0;
    const totalSize = mediaStats._sum.size || 0;

    return {
      totalFiles,
      totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
    };
  }

  async getDetailedMediaStats(): Promise<DetailedMediaStats> {
    const companyId = this.utility.companyId;

    // Get aggregated media stats by type from PostgreSQL
    const mediaTypeStats = await this.prisma.files.groupBy({
      by: ['type'],
      where: {
        companyId,
      },
      _count: {
        id: true,
      },
      _sum: {
        size: true,
      },
    });

    // Get recent uploads from PostgreSQL
    const recentUploads = await this.prisma.files.findMany({
      where: {
        companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get total stats from PostgreSQL
    const [totalStats] = await Promise.all([
      this.prisma.files.aggregate({
        where: {
          companyId,
        },
        _count: {
          id: true,
        },
        _sum: {
          size: true,
        },
      }),
    ]);

    const totalFiles = totalStats._count.id || 0;
    const totalSize = totalStats._sum.size || 0;
    const storageLimit = 10 * 1024 * 1024 * 1024; // 10GB default limit
    const storagePercentage = Math.round((totalSize / storageLimit) * 100);

    // Map PostgreSQL media types to display format
    const mediaTypes: MediaTypeStats[] =
      this.mapPrismaMediaTypes(mediaTypeStats);

    // Format recent uploads from PostgreSQL data
    const recentMediaUploads: RecentMediaUpload[] = recentUploads.map(
      (media) => ({
        id: media.id.toString(),
        filename: media.name,
        originalName: media.originalName,
        mimeType: media.mimetype || 'application/octet-stream',
        type: this.getPrismaMediaTypeFromFileType(media.type),
        icon: this.getIconForPrismaFileType(media.type),
        size: media.size,
        sizeFormatted: this.formatBytes(media.size),
        uploadedAt: media.createdAt,
        timeAgo: this.getTimeAgo(media.createdAt),
        thumbnail: this.getPrismaThumbnailUrl(media),
      }),
    );

    return {
      storage: {
        used: totalSize,
        total: storageLimit,
        percentage: storagePercentage,
        usedFormatted: this.formatBytes(totalSize),
        totalFormatted: this.formatBytes(storageLimit),
      },
      mediaTypes,
      recentUploads: recentMediaUploads,
      totalFiles,
      totalSize,
    };
  }

  async getActivityStats() {
    const companyId = this.utility.companyId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [recentActions, activeUsersAggregation] = await Promise.all([
      this.activityLogModel.countDocuments({
        companyId,
        createdAt: { $gte: today },
      }),
      this.activityLogModel.aggregate([
        {
          $match: {
            companyId,
            createdAt: { $gte: today },
          },
        },
        {
          $group: {
            _id: '$userId',
          },
        },
        {
          $count: 'uniqueUsers',
        },
      ]),
    ]);

    const activeUsers = activeUsersAggregation[0]?.uniqueUsers || 0;

    return {
      recentActions,
      activeUsers,
    };
  }

  async getApiUsageStats() {
    // For now, we'll use Redis counters for API usage
    // In a real implementation, you'd want to track this properly
    const companyId = this.utility.companyId;
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = this.getWeekStart().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7);

    const [todayCount, weekCount, monthCount] = await Promise.all([
      this.getApiCallCount(`api:calls:${companyId}:${today}`),
      this.getApiCallCount(`api:calls:${companyId}:week:${thisWeek}`),
      this.getApiCallCount(`api:calls:${companyId}:month:${thisMonth}`),
    ]);

    return {
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
    };
  }

  async getPerformanceMetrics() {
    // Placeholder for performance metrics
    return {
      avgResponseTime: 0,
      uptime: 100,
      errorRate: 0,
    };
  }

  async generateReport(type: string, dateRange?: any) {
    // Placeholder for report generation
    return {
      type,
      dateRange,
      data: [],
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getWeekStart(): Date {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  }

  private async getApiCallCount(key: string): Promise<number> {
    try {
      const count = await this.cacheService.get(key);
      return parseInt(count as string) || 0;
    } catch {
      return 0;
    }
  }

  // Method to increment API call counter (to be called from middleware)
  async incrementApiCall(): Promise<void> {
    const companyId = this.utility.companyId;
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = this.getWeekStart().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7);

    await Promise.all([
      this.incrementCacheValue(`api:calls:${companyId}:${today}`, 86400), // 1 day TTL
      this.incrementCacheValue(
        `api:calls:${companyId}:week:${thisWeek}`,
        604800,
      ), // 1 week TTL
      this.incrementCacheValue(
        `api:calls:${companyId}:month:${thisMonth}`,
        2592000,
      ), // 30 days TTL
    ]);
  }

  private async incrementCacheValue(key: string, ttl: number): Promise<void> {
    const currentValue = await this.cacheService.get<string>(key);
    const newValue = (parseInt(currentValue || '0') + 1).toString();
    await this.cacheService.set(key, newValue, ttl);
  }

  async getWeeklyApiUsage(): Promise<WeeklyApiUsage[]> {
    const companyId = this.utility.companyId;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyData = await this.apiUsageModel.aggregate([
      {
        $match: {
          companyId,
          timestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            apiType: '$metadata.apiType',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          rest: {
            $sum: {
              $cond: [{ $eq: ['$_id.apiType', 'REST'] }, '$count', 0],
            },
          },
          graphql: {
            $sum: {
              $cond: [{ $eq: ['$_id.apiType', 'GraphQL'] }, '$count', 0],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Create 7-day array with proper day names
    const result: WeeklyApiUsage[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];

      const dayData = weeklyData.find((d) => d._id === dateStr);
      const restCount = dayData?.rest || 0;
      const graphqlCount = dayData?.graphql || 0;
      const maxCount = Math.max(restCount, graphqlCount) || 1;

      result.push({
        name: dayName,
        rest: Math.round((restCount / maxCount) * 100),
        graphql: Math.round((graphqlCount / maxCount) * 100),
        restCount,
        graphqlCount,
      });
    }

    return result;
  }

  async getApiStatistics(): Promise<ApiStatistics> {
    const companyId = this.utility.companyId;

    const [totalData, avgResponseData, successData, activeTokensData] =
      await Promise.all([
        // Total requests
        this.apiUsageModel.countDocuments({ companyId }),

        // Average response time
        this.apiUsageModel.aggregate([
          { $match: { companyId } },
          { $group: { _id: null, avgResponseTime: { $avg: '$responseTime' } } },
        ]),

        // Success rate
        this.apiUsageModel.aggregate([
          { $match: { companyId } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              successful: { $sum: { $cond: ['$success', 1, 0] } },
            },
          },
        ]),

        // Active tokens (unique tokens used in last 30 days)
        this.apiUsageModel.aggregate([
          {
            $match: {
              companyId,
              timestamp: {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
          { $group: { _id: '$tokenId' } },
          { $count: 'activeTokens' },
        ]),
      ]);

    const totalRequests = totalData;
    const avgResponseTime = Math.round(
      avgResponseData[0]?.avgResponseTime || 0,
    );
    const successRate = successData[0]
      ? Math.round(
          (successData[0].successful / successData[0].total) * 100 * 10,
        ) / 10
      : 100;
    const activeTokens = activeTokensData[0]?.activeTokens || 0;

    return {
      totalRequests,
      avgResponseTime,
      successRate,
      activeTokens,
    };
  }

  async getTopEndpoints(): Promise<TopEndpoint[]> {
    const companyId = this.utility.companyId;

    const topEndpoints = await this.apiUsageModel.aggregate([
      { $match: { companyId } },
      {
        $group: {
          _id: { method: '$method', endpoint: '$endpoint' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return topEndpoints.map((endpoint) => ({
      method: endpoint._id.method,
      path: endpoint._id.endpoint,
      calls: this.formatCount(endpoint.count),
      callCount: endpoint.count,
    }));
  }

  private formatCount(count: number): string {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  }

  private mapMediaTypes(aggregatedStats: any[]): MediaTypeStats[] {
    const typeMapping = {
      image: {
        name: 'Images',
        icon: 'o_image',
        color: '#2e7d32',
        bgColor: '#e8f5e9',
      },
      video: {
        name: 'Videos',
        icon: 'o_videocam',
        color: '#1565c0',
        bgColor: '#e3f2fd',
      },
      application: {
        name: 'Documents',
        icon: 'o_description',
        color: '#e65100',
        bgColor: '#fff3e0',
      },
      text: {
        name: 'Documents',
        icon: 'o_description',
        color: '#e65100',
        bgColor: '#fff3e0',
      },
      audio: {
        name: 'Audio',
        icon: 'o_music_note',
        color: '#7b1fa2',
        bgColor: '#f3e5f5',
      },
      other: {
        name: 'Others',
        icon: 'o_folder',
        color: '#5e35b1',
        bgColor: '#f3e5f5',
      },
    };

    const result: MediaTypeStats[] = [];
    const processedTypes = new Set<string>();

    // Process aggregated stats
    for (const stat of aggregatedStats) {
      const mimeTypePrefix = stat._id || 'other';
      let targetType: string;
      let targetData: any;

      if (mimeTypePrefix === 'image') {
        targetType = 'image';
        targetData = typeMapping.image;
      } else if (mimeTypePrefix === 'video') {
        targetType = 'video';
        targetData = typeMapping.video;
      } else if (
        mimeTypePrefix === 'application' ||
        mimeTypePrefix === 'text'
      ) {
        targetType = 'document';
        targetData = typeMapping.application;
      } else if (mimeTypePrefix === 'audio') {
        targetType = 'audio';
        targetData = typeMapping.audio;
      } else {
        targetType = 'other';
        targetData = typeMapping.other;
      }

      // Check if we already have this type (for combining application and text)
      const existingIndex = result.findIndex((r) => r.type === targetType);

      if (existingIndex >= 0) {
        result[existingIndex].count += stat.count;
        result[existingIndex].size += stat.totalSize;
        result[existingIndex].sizeFormatted = this.formatBytes(
          result[existingIndex].size,
        );
      } else {
        result.push({
          type: targetType as 'image' | 'video' | 'document' | 'other',
          name: targetData.name,
          icon: targetData.icon,
          color: targetData.color,
          bgColor: targetData.bgColor,
          count: stat.count,
          size: stat.totalSize,
          sizeFormatted: this.formatBytes(stat.totalSize),
        });
      }

      processedTypes.add(targetType);
    }

    // Add zero counts for missing types
    const allTypes = [
      { key: 'image', data: typeMapping.image },
      { key: 'video', data: typeMapping.video },
      { key: 'document', data: typeMapping.application },
      { key: 'other', data: typeMapping.other },
    ];

    for (const typeInfo of allTypes) {
      if (!processedTypes.has(typeInfo.key)) {
        result.push({
          type: typeInfo.key as 'image' | 'video' | 'document' | 'other',
          name: typeInfo.data.name,
          icon: typeInfo.data.icon,
          color: typeInfo.data.color,
          bgColor: typeInfo.data.bgColor,
          count: 0,
          size: 0,
          sizeFormatted: '0 Bytes',
        });
      }
    }

    return result.sort((a, b) => b.count - a.count);
  }

  private getMediaTypeFromMimeType(
    mimeType: string,
  ): 'image' | 'video' | 'document' | 'other' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('application/') || mimeType.startsWith('text/'))
      return 'document';
    return 'other';
  }

  private getIconForMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'o_image';
    if (mimeType.startsWith('video/')) return 'o_movie';
    if (mimeType.includes('pdf')) return 'o_picture_as_pdf';
    if (mimeType.startsWith('application/') || mimeType.startsWith('text/'))
      return 'o_description';
    if (mimeType.startsWith('audio/')) return 'o_music_note';
    return 'o_insert_drive_file';
  }

  private getThumbnailUrl(media: any): string | undefined {
    if (media.formats?.thumbnail?.url) {
      return media.formats.thumbnail.url;
    }
    if (media.mimeType.startsWith('image/')) {
      return media.url;
    }
    return undefined;
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - new Date(date).getTime()) / 1000,
    );

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return new Date(date).toLocaleDateString();
  }

  // New methods for Prisma/PostgreSQL data mapping
  private mapPrismaMediaTypes(aggregatedStats: any[]): MediaTypeStats[] {
    const typeMapping = {
      IMAGE: {
        name: 'Images',
        icon: 'o_image',
        color: '#2e7d32',
        bgColor: '#e8f5e9',
      },
      VIDEO: {
        name: 'Videos',
        icon: 'o_videocam',
        color: '#1565c0',
        bgColor: '#e3f2fd',
      },
      DOCUMENT: {
        name: 'Documents',
        icon: 'o_description',
        color: '#e65100',
        bgColor: '#fff3e0',
      },
      AUDIO: {
        name: 'Audio',
        icon: 'o_music_note',
        color: '#7b1fa2',
        bgColor: '#f3e5f5',
      },
      OTHER: {
        name: 'Others',
        icon: 'o_folder',
        color: '#5e35b1',
        bgColor: '#f3e5f5',
      },
    };

    const result: MediaTypeStats[] = [];
    const processedTypes = new Set<string>();

    // Process aggregated stats from Prisma
    for (const stat of aggregatedStats) {
      const fileType = stat.type as FileType;
      let targetType: string;
      let targetData: any;

      if (fileType === 'IMAGE') {
        targetType = 'image';
        targetData = typeMapping.IMAGE;
      } else if (fileType === 'VIDEO') {
        targetType = 'video';
        targetData = typeMapping.VIDEO;
      } else if (fileType === 'DOCUMENT') {
        targetType = 'document';
        targetData = typeMapping.DOCUMENT;
      } else if (fileType === 'AUDIO') {
        targetType = 'audio';
        targetData = typeMapping.AUDIO;
      } else {
        targetType = 'other';
        targetData = typeMapping.OTHER;
      }

      result.push({
        type: targetType as 'image' | 'video' | 'document' | 'other',
        name: targetData.name,
        icon: targetData.icon,
        color: targetData.color,
        bgColor: targetData.bgColor,
        count: stat._count.id,
        size: stat._sum.size || 0,
        sizeFormatted: this.formatBytes(stat._sum.size || 0),
      });

      processedTypes.add(targetType);
    }

    // Add zero counts for missing types
    const allTypes = [
      { key: 'image', data: typeMapping.IMAGE },
      { key: 'video', data: typeMapping.VIDEO },
      { key: 'document', data: typeMapping.DOCUMENT },
      { key: 'other', data: typeMapping.OTHER },
    ];

    for (const typeInfo of allTypes) {
      if (!processedTypes.has(typeInfo.key)) {
        result.push({
          type: typeInfo.key as 'image' | 'video' | 'document' | 'other',
          name: typeInfo.data.name,
          icon: typeInfo.data.icon,
          color: typeInfo.data.color,
          bgColor: typeInfo.data.bgColor,
          count: 0,
          size: 0,
          sizeFormatted: '0 Bytes',
        });
      }
    }

    return result.sort((a, b) => b.count - a.count);
  }

  private getPrismaMediaTypeFromFileType(
    fileType: FileType,
  ): 'image' | 'video' | 'document' | 'other' {
    if (fileType === 'IMAGE') return 'image';
    if (fileType === 'VIDEO') return 'video';
    if (fileType === 'DOCUMENT') return 'document';
    return 'other';
  }

  private getIconForPrismaFileType(fileType: FileType): string {
    if (fileType === 'IMAGE') return 'o_image';
    if (fileType === 'VIDEO') return 'o_movie';
    if (fileType === 'DOCUMENT') return 'o_description';
    if (fileType === 'AUDIO') return 'o_music_note';
    return 'o_insert_drive_file';
  }

  private getPrismaThumbnailUrl(media: any): string | undefined {
    // Check if there are processed variants available
    if (
      media.variants &&
      media.variants.thumbnail &&
      media.variants.thumbnail.jpg
    ) {
      return media.variants.thumbnail.jpg.url;
    }
    // For images, return the original URL as thumbnail
    if (media.type === 'IMAGE') {
      return media.url;
    }
    return undefined;
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { ApiToken, ApiTokenDocument } from '../schemas/api-token.schema';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { UtilityService } from '@common/utility.service';
import { CacheService } from '@infrastructure/cache/cache.service';
import { PaginatedResponse } from '../common/interfaces/cms.interface';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

export interface CreateApiTokenDto {
  name: string;
  description?: string;
  type: 'read-only' | 'full-access' | 'custom';
  permissions?: {
    contentTypes: {
      [contentType: string]: {
        find: boolean;
        findOne: boolean;
        create: boolean;
        update: boolean;
        delete: boolean;
      };
    };
  };
  rateLimit?: {
    requests: number;
    window: number;
  };
  expiresAt?: Date;
}

export interface UpdateApiTokenDto {
  name?: string;
  description?: string;
  type?: 'read-only' | 'full-access' | 'custom';
  permissions?: {
    contentTypes: {
      [contentType: string]: {
        find: boolean;
        findOne: boolean;
        create: boolean;
        update: boolean;
        delete: boolean;
      };
    };
  };
  rateLimit?: {
    requests: number;
    window: number;
  };
  expiresAt?: Date;
  isActive?: boolean;
}

export interface QueryApiTokenDto {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  isActive?: boolean;
  sort?: Record<string, 1 | -1>;
}

export interface ApiTokenUsageStats {
  totalRequests: number;
  uniqueTokens: number;
  activeTokens: number;
  expiredTokens: number;
  topTokens: Array<{
    name: string;
    requests: number;
    lastUsed: Date;
  }>;
}

@Injectable()
export class ApiTokenService {
  constructor(
    @InjectModel(ApiToken.name, 'mongo')
    private apiTokenModel: Model<ApiTokenDocument>,
    @InjectConnection('mongo')
    private mongoConnection: Connection,
    @Inject(forwardRef(() => ActivityLogService))
    private activityLogService: ActivityLogService,
    private utility: UtilityService,
    private cacheService: CacheService,
  ) {}

  async create(
    dto: CreateApiTokenDto,
  ): Promise<{ token: ApiToken; rawToken: string }> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    // Check for duplicate name
    const existing = await this.apiTokenModel.findOne({
      companyId,
      name: dto.name,
      deletedAt: null,
    });

    if (existing) {
      throw new ConflictException('API token name already exists');
    }

    // Generate raw token
    const rawToken = this.generateToken();
    const hashedToken = await bcrypt.hash(rawToken, 12);

    // Set default permissions based on type
    let permissions = dto.permissions;
    if (dto.type === 'read-only') {
      permissions = {
        contentTypes: {},
      };
    } else if (dto.type === 'full-access') {
      permissions = {
        contentTypes: {},
      };
    }

    const apiToken = new this.apiTokenModel({
      companyId,
      name: dto.name,
      description: dto.description,
      token: hashedToken,
      rawToken: dto.type === 'read-only' ? rawToken : undefined, // Store raw token only for read-only tokens
      type: dto.type,
      permissions: permissions || { contentTypes: {} },
      rateLimit: dto.rateLimit || { requests: 1000, window: 3600 },
      expiresAt: dto.expiresAt,
      isActive: true,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await apiToken.save();

    // Log activity
    if (this.activityLogService) {
      await this.activityLogService.create({
        action: 'create',
        resource: 'token',
        resourceId: saved._id.toString(),
        resourceName: saved.name,
        metadata: { source: 'web' },
      });
    }

    // Clear cache
    await this.cacheService.invalidateQueries(companyId, 'api-tokens');

    return {
      token: saved,
      rawToken,
    };
  }

  async findAll(query: QueryApiTokenDto = {}): Promise<PaginatedResponse<any>> {
    const companyId = this.utility.companyId;

    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);

    // Try to get from cache first
    const cacheKey = this.cacheService.generateQueryHash(query);
    const cached = await this.cacheService.getQueryResult(
      companyId,
      'api-tokens',
      cacheKey,
    );
    if (cached) {
      return cached;
    }

    // Build filter
    const filter: any = {
      companyId,
      deletedAt: null,
      ...(query.type && { type: query.type }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.search && {
        $or: [
          { name: new RegExp(query.search, 'i') },
          { description: new RegExp(query.search, 'i') },
        ],
      }),
    };

    const sort = query.sort || { createdAt: -1 };

    // Execute query with pagination
    const [items, total] = await Promise.all([
      this.apiTokenModel
        .find(filter)
        .select('-token') // Don't return the hashed token
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
      this.apiTokenModel.countDocuments(filter),
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

    // Cache the result for 5 minutes
    await this.cacheService.setQueryResult(
      companyId,
      'api-tokens',
      cacheKey,
      response,
      300,
    );

    return response;
  }

  async getCurrentToken(): Promise<any> {
    const companyId = this.utility.companyId;

    // Find the most recent active token for this company
    const apiToken = await this.apiTokenModel
      .findOne({
        companyId,
        deletedAt: null,
        isActive: true,
      })
      .select('-token') // Don't return the hashed token
      .sort({ createdAt: -1 }) // Most recent first
      .lean()
      .exec();

    return apiToken;
  }

  async getCurrentTokens(): Promise<{ readOnly: any; fullAccess: any }> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    // Find both token types for this company
    const [readOnlyToken, fullAccessToken] = await Promise.all([
      this.apiTokenModel
        .findOne({
          companyId,
          type: 'read-only',
          deletedAt: null,
          isActive: true,
        })
        .select('-token') // Include rawToken for read-only tokens
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.apiTokenModel
        .findOne({
          companyId,
          type: 'full-access',
          deletedAt: null,
          isActive: true,
        })
        .select('-token -rawToken') // Exclude both token and rawToken for full-access tokens
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
    ]);

    // Auto-generate tokens if they don't exist
    let readOnly: any = readOnlyToken;
    let fullAccess: any = fullAccessToken;

    if (!readOnlyToken) {
      const { token } = await this.create({
        name: 'Auto-generated Read-Only Token',
        description: 'Automatically created read-only token for API access',
        type: 'read-only',
      });
      readOnly = token;
    }

    if (!fullAccessToken) {
      const { token } = await this.create({
        name: 'Auto-generated Full-Access Token',
        description:
          'Automatically created full-access token for API management',
        type: 'full-access',
      });
      fullAccess = token;
    }

    return { readOnly, fullAccess };
  }

  async findOne(id: string): Promise<any> {
    const companyId = this.utility.companyId;

    const apiToken = await this.apiTokenModel
      .findOne({
        _id: new this.mongoConnection.base.Types.ObjectId(id),
        companyId,
        deletedAt: null,
      })
      .select('-token') // Don't return the hashed token
      .lean()
      .exec();

    if (!apiToken) {
      throw new NotFoundException('API token not found');
    }

    return apiToken;
  }

  async update(id: string, dto: UpdateApiTokenDto): Promise<any> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    const apiToken = await this.findOne(id);

    // Check for name conflicts if name is being changed
    if (dto.name && dto.name !== apiToken.name) {
      const existing = await this.apiTokenModel.findOne({
        companyId,
        name: dto.name,
        _id: { $ne: id },
        deletedAt: null,
      });

      if (existing) {
        throw new ConflictException('API token name already exists');
      }
    }

    // Save original for change tracking
    const original = JSON.parse(JSON.stringify(apiToken));

    const updated = await this.apiTokenModel
      .findOneAndUpdate(
        { _id: id, companyId },
        {
          ...dto,
          updatedBy: userId,
          updatedAt: new Date(),
        },
        { new: true },
      )
      .select('-token');

    if (!updated) {
      throw new NotFoundException('API token not found');
    }

    // Log activity
    if (this.activityLogService) {
      const changes = this.activityLogService.createChangesDiff(
        original,
        JSON.parse(JSON.stringify(updated)),
      );
      await this.activityLogService.create({
        action: 'update',
        resource: 'token',
        resourceId: updated._id.toString(),
        resourceName: updated.name,
        changes,
        metadata: { source: 'web' },
      });
    }

    // Clear cache
    await this.cacheService.invalidateQueries(companyId, 'api-tokens');

    return updated;
  }

  async remove(id: string): Promise<any> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    const deleted = await this.apiTokenModel
      .findOneAndUpdate(
        {
          _id: new this.mongoConnection.base.Types.ObjectId(id),
          companyId,
          deletedAt: null,
        },
        {
          $set: {
            deletedAt: new Date(),
            updatedBy: userId,
            isActive: false,
          },
        },
        { returnDocument: 'after' },
      )
      .select('-token');

    if (!deleted) {
      throw new NotFoundException('API token not found');
    }

    // Log activity
    if (this.activityLogService) {
      await this.activityLogService.create({
        action: 'delete',
        resource: 'token',
        resourceId: deleted._id.toString(),
        resourceName: deleted.name,
        metadata: { source: 'web' },
      });
    }

    // Clear cache
    await this.cacheService.invalidateQueries(companyId, 'api-tokens');

    return deleted;
  }

  async regenerate(id: string): Promise<{ token: any; rawToken: string }> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    const apiToken = await this.findOne(id);

    // Generate new token
    const rawToken = this.generateToken();
    const hashedToken = await bcrypt.hash(rawToken, 12);

    // Check if this is a read-only token to store raw token
    const existingToken = await this.findOne(id);
    const updateData: any = {
      token: hashedToken,
      updatedBy: userId,
      updatedAt: new Date(),
      lastUsedAt: null, // Reset usage
    };

    // Store raw token only for read-only tokens
    if (existingToken.type === 'read-only') {
      updateData.rawToken = rawToken;
    }

    const updated = await this.apiTokenModel
      .findOneAndUpdate({ _id: id, companyId }, updateData, { new: true })
      .select('-token');

    // Log activity
    if (this.activityLogService) {
      await this.activityLogService.create({
        action: 'update',
        resource: 'token',
        resourceId: updated._id.toString(),
        resourceName: updated.name,
        metadata: { source: 'web' },
      });
    }

    // Clear cache
    await this.cacheService.invalidateQueries(companyId, 'api-tokens');

    return {
      token: updated,
      rawToken,
    };
  }

  async validateToken(rawToken: string): Promise<ApiToken | null> {
    if (!rawToken) {
      return null;
    }

    // Try to find token by prefix (for performance)
    const tokenPrefix = rawToken.substring(0, 8);

    const tokens = await this.apiTokenModel
      .find({
        isActive: true,
        deletedAt: null,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      })
      .lean()
      .exec();

    for (const token of tokens) {
      const isValid = await bcrypt.compare(rawToken, token.token);
      if (isValid) {
        // Update last used timestamp
        await this.apiTokenModel.updateOne(
          { _id: token._id },
          { lastUsedAt: new Date() },
        );

        return token as ApiToken;
      }
    }

    return null;
  }

  async getUsageStats(dateRange?: {
    from?: Date;
    to?: Date;
  }): Promise<ApiTokenUsageStats> {
    const companyId = this.utility.companyId;

    const filter: any = {
      companyId,
      deletedAt: null,
    };

    if (dateRange?.from || dateRange?.to) {
      filter.lastUsedAt = {};
      if (dateRange.from) {
        filter.lastUsedAt['$gte'] = dateRange.from;
      }
      if (dateRange.to) {
        filter.lastUsedAt['$lte'] = dateRange.to;
      }
    }

    const [activeTokens, expiredTokens, totalTokens, recentlyUsed] =
      await Promise.all([
        this.apiTokenModel.countDocuments({
          ...filter,
          isActive: true,
          $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
        }),

        this.apiTokenModel.countDocuments({
          ...filter,
          expiresAt: { $lte: new Date() },
        }),

        this.apiTokenModel.countDocuments(filter),

        this.apiTokenModel
          .find({
            ...filter,
            lastUsedAt: { $exists: true },
          })
          .sort({ lastUsedAt: -1 })
          .limit(10)
          .select('name lastUsedAt')
          .lean()
          .exec(),
      ]);

    return {
      totalRequests: 0, // Would need to track this in usage logs
      uniqueTokens: totalTokens,
      activeTokens,
      expiredTokens,
      topTokens: recentlyUsed.map((token) => ({
        name: token.name,
        requests: 0, // Would need usage tracking
        lastUsed: token.lastUsedAt,
      })),
    };
  }

  async checkPermissions(
    token: ApiToken,
    action: string,
    contentType?: string,
  ): Promise<boolean> {
    if (!token.isActive) {
      return false;
    }

    // Check if token is expired
    if (token.expiresAt && new Date() > token.expiresAt) {
      return false;
    }

    // Full access tokens can do everything
    if (token.type === 'full-access') {
      return true;
    }

    // Read-only tokens can only read
    if (token.type === 'read-only') {
      return ['find', 'findOne'].includes(action);
    }

    // Custom tokens need specific permission checks
    if (token.type === 'custom' && contentType) {
      const permissions = token.permissions?.contentTypes?.[contentType];
      if (!permissions) {
        return false;
      }

      return permissions[action as keyof typeof permissions] === true;
    }

    return false;
  }

  private generateToken(): string {
    // Generate a secure random token
    const prefix = 'ante_'; // Company identifier
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}${randomBytes}`;
  }
}

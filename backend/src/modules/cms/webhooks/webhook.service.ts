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
import { Webhook, WebhookDocument } from '../schemas/webhook.schema';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { UtilityService } from '@common/utility.service';
import { CacheService } from '@infrastructure/cache/cache.service';
import { PaginatedResponse } from '../common/interfaces/cms.interface';
import * as crypto from 'crypto';
import axios from 'axios';

export interface CreateWebhookDto {
  name: string;
  url: string;
  events: string[];
  contentTypes?: string[];
  headers?: Record<string, string>;
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number;
  };
  isActive?: boolean;
}

export interface UpdateWebhookDto {
  name?: string;
  url?: string;
  events?: string[];
  contentTypes?: string[];
  headers?: Record<string, string>;
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number;
  };
  isActive?: boolean;
}

export interface QueryWebhookDto {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  events?: string[];
  sort?: Record<string, 1 | -1>;
}

export interface WebhookPayload {
  event: string;
  model: string;
  entry?: any;
  createdAt: Date;
  companyId: number;
  signature?: string;
}

export interface WebhookDelivery {
  webhookId: string;
  payload: WebhookPayload;
  attempt: number;
  status: 'pending' | 'success' | 'failed';
  responseStatus?: number;
  responseBody?: string;
  error?: string;
  deliveredAt?: Date;
}

@Injectable()
export class WebhookService {
  private readonly secret = process.env.WEBHOOK_SECRET || 'ante-webhook-secret';

  constructor(
    @InjectModel(Webhook.name, 'mongo')
    private webhookModel: Model<WebhookDocument>,
    @InjectConnection('mongo')
    private mongoConnection: Connection,
    @Inject(forwardRef(() => ActivityLogService))
    private activityLogService: ActivityLogService,
    private utility: UtilityService,
    private cacheService: CacheService,
  ) {}

  async create(dto: CreateWebhookDto): Promise<any> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    // Validate webhook name uniqueness
    const existing = await this.webhookModel.findOne({
      companyId,
      name: dto.name,
      deletedAt: null,
    });

    if (existing) {
      throw new ConflictException('Webhook name already exists');
    }

    // Validate events
    this.validateEvents(dto.events);

    // Validate URL
    this.validateUrl(dto.url);

    const webhook = new this.webhookModel({
      companyId,
      name: dto.name,
      url: dto.url,
      events: dto.events,
      contentTypes: dto.contentTypes || [],
      headers: dto.headers || {},
      retryPolicy: dto.retryPolicy || { maxRetries: 3, retryDelay: 5000 },
      isActive: dto.isActive !== false,
      failureCount: 0,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await webhook.save();

    // Log activity
    if (this.activityLogService) {
      await this.activityLogService.create({
        action: 'create',
        resource: 'webhook',
        resourceId: saved._id.toString(),
        resourceName: saved.name,
        metadata: { source: 'web' },
      });
    }

    // Clear cache
    await this.cacheService.invalidateQueries(companyId, 'webhooks');

    return saved;
  }

  async findAll(query: QueryWebhookDto = {}): Promise<PaginatedResponse<any>> {
    const companyId = this.utility.companyId;

    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);

    // Try to get from cache first
    const cacheKey = this.cacheService.generateQueryHash(query);
    const cached = await this.cacheService.getQueryResult(
      companyId,
      'webhooks',
      cacheKey,
    );
    if (cached) {
      return cached;
    }

    // Build filter
    const filter: any = {
      companyId,
      deletedAt: null,
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.search && {
        $or: [
          { name: new RegExp(query.search, 'i') },
          { url: new RegExp(query.search, 'i') },
        ],
      }),
      ...(query.events &&
        query.events.length > 0 && {
          events: { $in: query.events },
        }),
    };

    const sort = query.sort || { createdAt: -1 };

    // Execute query with pagination
    const [items, total] = await Promise.all([
      this.webhookModel
        .find(filter)
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
      this.webhookModel.countDocuments(filter),
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
      'webhooks',
      cacheKey,
      response,
      120,
    );

    return response;
  }

  async findOne(id: string): Promise<any> {
    const companyId = this.utility.companyId;

    const webhook = await this.webhookModel
      .findOne({
        _id: new this.mongoConnection.base.Types.ObjectId(id),
        companyId,
        deletedAt: null,
      })
      .lean()
      .exec();

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return webhook;
  }

  async update(id: string, dto: UpdateWebhookDto): Promise<any> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    const webhook = await this.findOne(id);

    // Check for name conflicts if name is being changed
    if (dto.name && dto.name !== webhook.name) {
      const existing = await this.webhookModel.findOne({
        companyId,
        name: dto.name,
        _id: { $ne: id },
        deletedAt: null,
      });

      if (existing) {
        throw new ConflictException('Webhook name already exists');
      }
    }

    // Validate events if provided
    if (dto.events) {
      this.validateEvents(dto.events);
    }

    // Validate URL if provided
    if (dto.url) {
      this.validateUrl(dto.url);
    }

    // Save original for change tracking
    const original = JSON.parse(JSON.stringify(webhook));

    const updated = await this.webhookModel.findOneAndUpdate(
      { _id: id, companyId },
      {
        ...dto,
        updatedBy: userId,
        updatedAt: new Date(),
        // Reset failure count if webhook is being reactivated
        ...(dto.isActive === true && { failureCount: 0 }),
      },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Webhook not found');
    }

    // Log activity
    if (this.activityLogService) {
      const changes = this.activityLogService.createChangesDiff(
        original,
        JSON.parse(JSON.stringify(updated)),
      );
      await this.activityLogService.create({
        action: 'update',
        resource: 'webhook',
        resourceId: updated._id.toString(),
        resourceName: updated.name,
        changes,
        metadata: { source: 'web' },
      });
    }

    // Clear cache
    await this.cacheService.invalidateQueries(companyId, 'webhooks');

    return updated;
  }

  /* async remove(id: string): Promise<any> {
    const companyId = this.utility.companyId;
    const userId = this.utility.accountInformation.id;

    const deleted = await this.webhookModel.findOneAndUpdate(
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
      { returnDocument: 'after' }
    );

    if (!deleted) {
      throw new NotFoundException('Webhook not found');
    }

    // Log activity
    if (this.activityLogService) {
      await this.activityLogService.create({
        action: 'delete',
        resource: 'webhook',
        resourceId: deleted._id.toString(),
        resourceName: deleted.name,
        metadata: { source: 'web' }
      });
    }

    // Clear cache
    await this.cacheService.invalidateQueries(companyId, 'webhooks');

    return deleted;
  } */

  async testWebhook(id: string): Promise<WebhookDelivery> {
    const webhook = await this.findOne(id);

    const testPayload: WebhookPayload = {
      event: 'test',
      model: 'test',
      entry: {
        id: 'test-id',
        message: 'This is a test webhook delivery',
      },
      createdAt: new Date(),
      companyId: webhook.companyId,
    };

    const delivery = await this.deliverWebhook(webhook, testPayload);

    // Log activity
    if (this.activityLogService) {
      await this.activityLogService.create({
        action: 'test',
        resource: 'webhook',
        resourceId: webhook._id.toString(),
        resourceName: webhook.name,
        metadata: {
          source: 'web',
        },
      });
    }

    return delivery;
  }

  async triggerWebhooks(
    event: string,
    model: string,
    entry: any,
  ): Promise<void> {
    const companyId = this.utility.companyId;

    // Find webhooks that should be triggered
    const webhooks = await this.webhookModel
      .find({
        companyId,
        isActive: true,
        deletedAt: null,
        events: event,
        $or: [
          { contentTypes: { $size: 0 } }, // No content type restriction
          { contentTypes: model },
        ],
      })
      .lean()
      .exec();

    if (webhooks.length === 0) {
      return;
    }

    const payload: WebhookPayload = {
      event,
      model,
      entry,
      createdAt: new Date(),
      companyId,
    };

    // Deliver webhooks asynchronously
    const deliveryPromises = webhooks.map((webhook) =>
      this.deliverWebhook(webhook, payload).catch((error) => {
        console.error(`Webhook delivery failed for ${webhook.name}:`, error);
      }),
    );

    // Don't wait for all deliveries to complete
    Promise.all(deliveryPromises);
  }

  private async deliverWebhook(
    webhook: any,
    payload: WebhookPayload,
  ): Promise<WebhookDelivery> {
    const delivery: WebhookDelivery = {
      webhookId: webhook._id.toString(),
      payload,
      attempt: 1,
      status: 'pending',
    };

    try {
      // Add signature to payload
      const signedPayload = {
        ...payload,
        signature: this.generateSignature(payload),
      };

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'ANTE-Webhook/1.0',
        'X-Webhook-Signature': signedPayload.signature,
        ...webhook.headers,
      };

      const response = await axios.post(webhook.url, signedPayload, {
        headers,
        timeout: 30000, // 30 second timeout
        validateStatus: (status) => status >= 200 && status < 300,
      });

      delivery.status = 'success';
      delivery.responseStatus = response.status;
      delivery.responseBody = JSON.stringify(response.data).substring(0, 1000); // Limit size
      delivery.deliveredAt = new Date();

      // Update webhook success timestamp
      await this.webhookModel.updateOne(
        { _id: webhook._id },
        {
          lastTriggeredAt: new Date(),
          failureCount: 0,
        },
      );
    } catch (error) {
      delivery.status = 'failed';
      delivery.error = error.message;

      if (error.response) {
        delivery.responseStatus = error.response.status;
        delivery.responseBody = JSON.stringify(error.response.data).substring(
          0,
          1000,
        );
      }

      // Update webhook failure count
      await this.webhookModel.updateOne(
        { _id: webhook._id },
        {
          $inc: { failureCount: 1 },
          lastTriggeredAt: new Date(),
        },
      );

      // Disable webhook if too many failures
      if (webhook.failureCount >= 10) {
        await this.webhookModel.updateOne(
          { _id: webhook._id },
          { isActive: false },
        );
      }
    }

    return delivery;
  }

  private validateEvents(events: string[]): void {
    const validEvents = [
      'entry.create',
      'entry.update',
      'entry.delete',
      'entry.publish',
      'entry.unpublish',
      'content-type.create',
      'content-type.update',
      'content-type.delete',
      'media.create',
      'media.update',
      'media.delete',
    ];

    for (const event of events) {
      if (!validEvents.includes(event)) {
        throw new BadRequestException(`Invalid event: ${event}`);
      }
    }

    if (events.length === 0) {
      throw new BadRequestException('At least one event must be specified');
    }
  }

  private validateUrl(url: string): void {
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new BadRequestException(
          'Webhook URL must use HTTP or HTTPS protocol',
        );
      }
    } catch (error) {
      throw new BadRequestException('Invalid webhook URL format');
    }
  }

  private generateSignature(payload: any): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.secret)
      .update(payloadString)
      .digest('hex');
  }

  async getStats(): Promise<any> {
    const companyId = this.utility.companyId;

    const [totalWebhooks, activeWebhooks, recentlyTriggered] =
      await Promise.all([
        this.webhookModel.countDocuments({
          companyId,
          deletedAt: null,
        }),

        this.webhookModel.countDocuments({
          companyId,
          deletedAt: null,
          isActive: true,
        }),

        this.webhookModel
          .find({
            companyId,
            deletedAt: null,
            lastTriggeredAt: { $exists: true },
          })
          .sort({ lastTriggeredAt: -1 })
          .limit(5)
          .select('name lastTriggeredAt failureCount')
          .lean()
          .exec(),
      ]);

    return {
      totalWebhooks,
      activeWebhooks,
      inactiveWebhooks: totalWebhooks - activeWebhooks,
      recentlyTriggered,
    };
  }
}

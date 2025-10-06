import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiUsage, ApiUsageDocument } from '../schemas/api-usage.schema';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class ApiTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ApiTrackingInterceptor.name);

  constructor(
    @InjectModel(ApiUsage.name, 'mongo')
    private apiUsageModel: Model<ApiUsageDocument>,
    private analyticsService: AnalyticsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Extract information from request
    const companyId = (request as any).companyId;
    const apiToken = (request as any).apiToken;
    const endpoint = request.url;
    const method = request.method;
    const userAgent = request.get('User-Agent') || '';
    const ip = request.ip || request.connection.remoteAddress || '';

    // Extract content type from URL path (e.g., /api/public/cms/articles -> articles)
    const contentType = this.extractContentTypeFromUrl(endpoint);

    // Determine API type (REST by default, could be enhanced for GraphQL detection)
    const apiType = 'REST';

    return next.handle().pipe(
      tap((responseData) => {
        // Success case
        this.logApiUsage({
          companyId,
          tokenId: apiToken?._id,
          endpoint,
          method,
          contentType,
          statusCode: response.statusCode,
          responseTime: Date.now() - startTime,
          success: response.statusCode >= 200 && response.statusCode < 300,
          metadata: {
            userAgent,
            ip,
            apiType,
            requestSize: this.getContentLength(request),
            responseSize: this.getResponseSize(responseData),
          },
        });
      }),
      catchError((error) => {
        // Error case
        this.logApiUsage({
          companyId,
          tokenId: apiToken?._id,
          endpoint,
          method,
          contentType,
          statusCode: error.status || 500,
          responseTime: Date.now() - startTime,
          success: false,
          metadata: {
            userAgent,
            ip,
            apiType,
            requestSize: this.getContentLength(request),
          },
        });
        throw error;
      }),
    );
  }

  private async logApiUsage(usageData: Partial<ApiUsage>) {
    try {
      // Save detailed usage to MongoDB
      const apiUsage = new this.apiUsageModel(usageData);
      await apiUsage.save();

      // Also increment Redis counters for the dashboard
      if (usageData.companyId) {
        // Set company context for analytics service
        this.analyticsService['utility'].setCompanyId(usageData.companyId);
        await this.analyticsService.incrementApiCall();
      }
    } catch (error) {
      this.logger.error('Failed to log API usage:', error);
    }
  }

  private extractContentTypeFromUrl(url: string): string | undefined {
    // Extract content type from URL patterns like:
    // /api/public/cms/articles -> articles
    // /api/public/cms/single/homepage -> homepage
    const match = url.match(/\/api\/public\/cms\/(?:single\/)?([^/?]+)/);
    return match ? match[1] : undefined;
  }

  private getContentLength(request: Request): number | undefined {
    const contentLength = request.get('Content-Length');
    return contentLength ? parseInt(contentLength, 10) : undefined;
  }

  private getResponseSize(responseData: any): number | undefined {
    if (!responseData) return undefined;
    try {
      return JSON.stringify(responseData).length;
    } catch {
      return undefined;
    }
  }
}

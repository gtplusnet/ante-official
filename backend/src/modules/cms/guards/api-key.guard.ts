import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { UtilityService } from '@common/utility.service';
import { ApiTokenService } from '../api-tokens/api-token.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @Inject() private apiTokenService: ApiTokenService,
    @Inject() private utilityService: UtilityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;

    // Check if API key is provided
    if (!apiKey) {
      throw new UnauthorizedException(
        'API key is required. Include x-api-key header.',
      );
    }

    // Validate the API key
    const token = await this.apiTokenService.validateToken(apiKey);
    if (!token) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    // Check if token is active
    if (!token.isActive) {
      throw new UnauthorizedException('API key is inactive');
    }

    // Check permissions based on HTTP method and token type
    const method = request.method;

    if (token.type === 'read-only' && method !== 'GET') {
      throw new ForbiddenException(
        `Read-only API key cannot perform ${method} operations. Use a full-access key for write operations.`,
      );
    }

    // Set company context for multi-tenancy
    // This ensures all database queries are scoped to the correct company
    this.utilityService.companyId = token.companyId;

    // Attach token information to request for potential use in controllers
    (request as any).apiToken = token;
    (request as any).companyId = token.companyId;

    return true;
  }
}

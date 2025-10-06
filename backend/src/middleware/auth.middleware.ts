import {
  Injectable,
  NestMiddleware,
  Inject,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { AccountService } from '@modules/account/account/account.service';
import { AccountDataResponse } from '../shared/response';
import {
  RedisService,
  CachedTokenData,
} from '@infrastructure/redis/redis.service';
import { SupabaseTokenManagerService } from '@modules/auth/supabase-auth/supabase-token-manager.service';
import { BenchmarkService } from '@common/benchmark.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  @Inject() private prisma: PrismaService;
  @Inject() private utility: UtilityService;
  @Inject() private accountService: AccountService;
  @Inject() private redisService: RedisService;
  @Inject() private supabaseTokenManager: SupabaseTokenManagerService;
  @Inject() private benchmark: BenchmarkService;
  @Inject() private cls: ClsService;

  async use(req: Request, res: Response, next: NextFunction) {
    // If CLS context is not active, create one
    if (!this.cls.isActive()) {
      // Run the middleware within a new CLS context
      return this.cls.run(async () => {
        await this.executeMiddleware(req, res, next);
      });
    }

    // CLS context is already active, proceed normally
    await this.executeMiddleware(req, res, next);
  }

  private async executeMiddleware(req: Request, res: Response, next: NextFunction) {
    const benchmarkKey = `auth-${Date.now()}`;
    const method = req.method;
    const endpoint = req.originalUrl || req.url || '';

    // Start overall benchmark
    this.benchmark.start(benchmarkKey);

    // Phase 1: Route Checking
    this.benchmark.startNested(benchmarkKey, 'Route Check');

    // Skip auth for guardian routes
    const fullPath = req.originalUrl || req.url || '';
    // Extract actual path from originalUrl if needed
    const actualPath = fullPath.split('?')[0];

    // Skip auth for guardian routes (they use their own GuardianAuthGuard)
    if (
      fullPath.includes('/api/guardian/') ||
      actualPath.includes('/api/guardian/')
    ) {
      return next();
    }

    // Skip auth for health endpoints (they are marked as @Public)
    if (
      actualPath === '/health' ||
      actualPath === '/health/version' ||
      actualPath.startsWith('/health')
    ) {
      return next();
    }

    // Skip auth for email approval endpoints (no authentication needed for email links)
    if (
      actualPath.startsWith('/email-approval') ||
      actualPath.startsWith('/api/email-approval')
    ) {
      return next();
    }

    // Skip auth for migration endpoints (they use their own developer key auth)
    if (actualPath.startsWith('/migration')) {
      return next();
    }

    // Skip auth for public CMS API endpoints (they use ApiKeyGuard instead)
    if (actualPath.startsWith('/api/public/')) {
      return next();
    }

    // Skip auth for exchange token endpoints (consume and validate are public)
    if (
      actualPath === '/auth/exchange/consume' ||
      actualPath === '/auth/exchange/validate'
    ) {
      this.benchmark.endNested(benchmarkKey, 'Route Check', { skipped: true });
      this.benchmark.end(benchmarkKey);
      return next();
    }

    // For redirect endpoint, check query parameter for token
    if (actualPath === '/auth/exchange/redirect') {
      const queryToken = (req.query as any).token;
      if (queryToken) {
        req.headers.token = queryToken;
      }
    }

    this.benchmark.endNested(benchmarkKey, 'Route Check', { skipped: false });

    if (!req.headers.token) {
      this.benchmark.end(benchmarkKey, { error: 'no-token' });
      throw new NotFoundException(`Invalid Token`);
    }

    const token = req.headers.token.toString();

    // Phase 2: Token Cache Check
    const cachedTokenData = await this.benchmark.measureAsync(
      'Token Cache Check',
      () => this.redisService.getCachedTokenData(token),
      benchmarkKey
    );

    let accountInformation: AccountDataResponse;

    if (cachedTokenData) {
      // Use cached data
      accountInformation = cachedTokenData.accountInformation;
      this.utility.log(`Auth cache hit for token: ${token.substring(0, 8)}...`);

      // Add metadata about cache hit
      const tokenCacheTiming = this.benchmark['timings'].get(`${benchmarkKey}.Token Cache Check`);
      if (tokenCacheTiming) {
        tokenCacheTiming.metadata = { ...tokenCacheTiming.metadata, result: 'HIT' };
      }
    } else {
      // Add metadata about cache miss
      const tokenCacheTiming = this.benchmark['timings'].get(`${benchmarkKey}.Token Cache Check`);
      if (tokenCacheTiming) {
        tokenCacheTiming.metadata = { ...tokenCacheTiming.metadata, result: 'MISS' };
      }

      // Phase 3: Database Operations
      this.benchmark.startNested(benchmarkKey, 'Database Operations');

      // Check token in database
      const checkToken = await this.benchmark.measureAsync(
        'Token DB Lookup',
        () => this.prisma.accountToken.findFirst({
          where: { token, status: 'active' },
        }),
        benchmarkKey
      );

      if (!checkToken) {
        this.benchmark.endNested(benchmarkKey, 'Database Operations', { error: 'invalid-token' });
        this.benchmark.end(benchmarkKey, { error: 'invalid-token' });
        throw new NotFoundException(`Invalid Token`);
      }

      // Get account information from database
      accountInformation = await this.benchmark.measureAsync(
        'Account Info Fetch',
        () => this.accountService.getAccountInformation({
          id: checkToken.accountId,
        }),
        benchmarkKey
      );

      this.benchmark.endNested(benchmarkKey, 'Database Operations');

      if (!accountInformation) {
        this.benchmark.end(benchmarkKey, { error: 'invalid-account' });
        throw new NotFoundException(`Invalid Account`);
      }

      // Phase 4: Cache Token Data
      await this.benchmark.measureAsync(
        'Cache Token Data',
        async () => {
          const tokenDataToCache: CachedTokenData = {
            accountId: checkToken.accountId,
            accountInformation,
            createdAt: checkToken.createdAt.toISOString(),
            userAgent: checkToken.userAgent,
            ipAddress: checkToken.ipAddress,
          };

          const ttl = parseInt(process.env.REDIS_AUTH_TTL) || 86400; // 24 hours default
          await this.redisService.cacheTokenData(token, tokenDataToCache, ttl);
        },
        benchmarkKey
      );

      this.utility.log(
        `Auth cache miss for token: ${token.substring(0, 8)}... - cached for future use`,
      );
    }

    // Phase 5: Set Account Information
    await this.benchmark.measureAsync(
      'Set Account Info',
      async () => this.utility.setAccountInformation(accountInformation),
      benchmarkKey
    );

    // Phase 6: Supabase Token Validation
    try {
      await this.benchmark.measureAsync(
        'Supabase Validation',
        () => this.checkAndRefreshSupabaseToken(accountInformation.id, token, benchmarkKey),
        benchmarkKey
      );
    } catch (error) {
      this.utility.log(
        `Supabase token validation failed for account ${accountInformation.id}: ${error.message}`,
      );
      this.benchmark.end(benchmarkKey, { error: 'supabase-validation-failed' });
      this.benchmark.printResults(benchmarkKey, endpoint, method);
      throw new UnauthorizedException(
        'Authentication token expired. Please login again.',
      );
    }

    // Complete benchmark and print results
    this.benchmark.end(benchmarkKey);
    this.benchmark.printResults(benchmarkKey, endpoint, method);

    next();
  }

  /**
   * Check and validate Supabase tokens - throws error if expired and cannot refresh
   */
  private async checkAndRefreshSupabaseToken(
    accountId: string,
    anteToken: string,
    benchmarkKey?: string,
  ): Promise<void> {
    try {
      // Check if we recently validated this token (cache for 5 minutes)
      const validationCacheKey = `supabase:valid:${accountId}:${anteToken.substring(0, 16)}`;

      // Start nested benchmark for validation cache check
      if (benchmarkKey) {
        this.benchmark.startNested(`${benchmarkKey}.Supabase Validation`, 'Validation Cache Check');
      }

      const isRecentlyValidated = await this.redisService.exists(validationCacheKey);

      if (benchmarkKey) {
        this.benchmark.endNested(
          `${benchmarkKey}.Supabase Validation`,
          'Validation Cache Check',
          { result: isRecentlyValidated ? 'HIT' : 'MISS' }
        );
      }

      if (isRecentlyValidated) {
        // Token was validated recently, skip expensive checks
        this.utility.log(
          `Supabase validation cache hit for account ${accountId}`,
        );
        return;
      }

      // Get the AccountToken record to check for Supabase tokens
      const accountToken = await (benchmarkKey
        ? this.benchmark.measureAsync(
            'Supabase Token DB Query',
            () => this.prisma.accountToken.findFirst({
              where: {
                accountId,
                token: anteToken,
                status: 'active',
              },
            }),
            `${benchmarkKey}.Supabase Validation`
          )
        : this.prisma.accountToken.findFirst({
            where: {
              accountId,
              token: anteToken,
              status: 'active',
            },
          })
      );

      // Check if Supabase access token exists
      if (!accountToken?.supabaseAccessToken) {
        // No Supabase token stored - this might be an older session
        // Try to get from cache
        const cachedToken =
          await this.redisService.getCachedSupabaseAccessToken(accountId);

        if (!cachedToken) {
          throw new Error('No Supabase authentication token found');
        }

        // Validate cached token
        if (benchmarkKey) {
          this.benchmark.startNested(`${benchmarkKey}.Supabase Validation`, 'Token Validation');
        }
        const validation = this.supabaseTokenManager.validateTokenExpiry(cachedToken.token);
        if (benchmarkKey) {
          this.benchmark.endNested(`${benchmarkKey}.Supabase Validation`, 'Token Validation',
            { valid: validation.valid });
        }
        if (!validation.valid) {
          // Token is expired, try to refresh
          const newToken = await (benchmarkKey
            ? this.benchmark.measureAsync(
                'Token Refresh',
                () => this.supabaseTokenManager.refreshAccessToken(accountId),
                `${benchmarkKey}.Supabase Validation`
              )
            : this.supabaseTokenManager.refreshAccessToken(accountId)
          );
          if (!newToken) {
            throw new Error('Failed to refresh expired Supabase token');
          }
        }

        // Cache validation success for 5 minutes
        await this.redisService.set(validationCacheKey, '1', 300);
        return;
      }

      // Validate the stored Supabase access token
      if (benchmarkKey) {
        this.benchmark.startNested(`${benchmarkKey}.Supabase Validation`, 'Token Validation');
      }
      const validation = this.supabaseTokenManager.validateTokenExpiry(
        accountToken.supabaseAccessToken,
      );
      if (benchmarkKey) {
        this.benchmark.endNested(`${benchmarkKey}.Supabase Validation`, 'Token Validation',
          { valid: validation.valid });
      }

      if (!validation.valid) {
        // Token is expired
        this.utility.log(
          `Supabase token expired for account ${accountId}, attempting refresh...`,
        );

        // Try to refresh using refresh token
        if (accountToken.supabaseRefreshToken) {
          const newToken = await (benchmarkKey
            ? this.benchmark.measureAsync(
                'Token Refresh',
                () => this.supabaseTokenManager.refreshAccessToken(accountId),
                `${benchmarkKey}.Supabase Validation`
              )
            : this.supabaseTokenManager.refreshAccessToken(accountId)
          );
          if (!newToken) {
            throw new Error('Failed to refresh expired Supabase token');
          }
          this.utility.log(
            `Successfully refreshed Supabase token for account ${accountId}`,
          );
        } else {
          throw new Error('No refresh token available to renew expired access token');
        }
      }
      // REMOVED: Proactive refresh for tokens near expiry
      // This was causing unnecessary latency even when tokens were still valid

      // Cache validation success for 5 minutes
      await (benchmarkKey
        ? this.benchmark.measureAsync(
            'Cache Validation Result',
            () => this.redisService.set(validationCacheKey, '1', 300),
            `${benchmarkKey}.Supabase Validation`
          )
        : this.redisService.set(validationCacheKey, '1', 300)
      );
      this.utility.log(
        `Supabase token validated and cached for account ${accountId}`,
      );
    } catch (error) {
      // Re-throw the error to be caught by the calling code
      throw error;
    }
  }
}

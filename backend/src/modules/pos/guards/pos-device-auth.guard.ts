import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { POSDeviceService } from '@modules/pos-device/pos-device.service';
import { RedisService } from '@infrastructure/redis/redis.service';
import { UtilityService } from '@common/utility.service';
import { PosDeviceRequest } from '../interfaces/pos-device.request';

@Injectable()
export class PosDeviceAuthGuard implements CanActivate {
  constructor(
    @Inject() private readonly posDeviceService: POSDeviceService,
    @Inject() private readonly prismaService: PrismaService,
    @Inject() private readonly redisService: RedisService,
    @Inject() private readonly utilityService: UtilityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PosDeviceRequest>();
    const apiKey = request.headers['x-api-key'] as string;
    const deviceId = request.headers['x-device-id'] as string;
    const sessionToken = request.headers['x-cashier-session'] as string;

    // Validate API key header
    if (!apiKey) {
      throw new BadRequestException(
        'POS Device API key is required. Include x-api-key header.',
      );
    }

    // Validate device ID header
    if (!deviceId) {
      throw new BadRequestException(
        'Device ID is required. Include x-device-id header.',
      );
    }

    // Validate cashier session header
    if (!sessionToken) {
      throw new BadRequestException(
        'Cashier session is required. Include x-cashier-session header.',
      );
    }

    // Validate device binding
    const device = await this.posDeviceService.validateDeviceBinding(
      apiKey,
      deviceId,
    );

    // Validate cashier session token
    let cashierAccountId: string;

    // Try to get from Redis cache first
    const cachedTokenData = await this.redisService.getCachedTokenData(sessionToken);

    if (cachedTokenData) {
      cashierAccountId = cachedTokenData.accountId;
    } else {
      // Fall back to database
      const tokenRecord = await this.prismaService.accountToken.findFirst({
        where: {
          token: sessionToken,
          status: 'active'
        },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Invalid or expired session token');
      }

      cashierAccountId = tokenRecord.accountId;
    }

    // Get cashier data
    const cashier = await this.prismaService.cashierData.findUnique({
      where: { accountId: cashierAccountId },
      include: {
        account: true,
      },
    });

    if (!cashier) {
      throw new UnauthorizedException('Cashier not found');
    }

    if (!cashier.isActive) {
      throw new UnauthorizedException('Cashier account is inactive');
    }

    // Verify that the cashier belongs to the same company as the device
    if (cashier.account.companyId !== device.companyId) {
      throw new ForbiddenException(
        'Cashier does not belong to the same company as the POS device',
      );
    }

    // Attach device and cashier information to request
    request.device = device as any;
    request.cashier = cashier as any;
    request.branchId = device.branchId;
    request.companyId = device.companyId;
    request['utility'] = this.utilityService;

    return true;
  }
}

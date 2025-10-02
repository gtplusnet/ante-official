import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';

export interface RequestWithLicense extends Request {
  license?: any;
  deviceConnection?: any;
}

@Injectable()
export class DeviceLicenseMiddleware implements NestMiddleware {
  constructor(
    private prisma: PrismaService,
    private utility: UtilityService,
  ) {}

  async use(req: RequestWithLicense, res: Response, next: NextFunction) {
    const licenseKey = req.headers['x-license-key'] as string;

    if (!licenseKey) {
      throw new UnauthorizedException('License key required');
    }

    try {
      // Find and validate license
      const license = await this.prisma.deviceLicense.findFirst({
        where: {
          licenseKey,
          isActive: true,
          isDeleted: false,
        },
        include: {
          company: true,
          gate: true,
          connectedDevice: true,
        },
      });

      if (!license) {
        throw new UnauthorizedException('Invalid or inactive license key');
      }

      // Check if device is connected (skip for connect and validate endpoints)
      const requestPath = req.path || req.url;
      const isConnectEndpoint = requestPath.includes('/sync/connect');
      const isValidateEndpoint = requestPath.includes('/sync/validate');

      if (
        !isConnectEndpoint &&
        !isValidateEndpoint &&
        !license.connectedDevice
      ) {
        throw new UnauthorizedException(
          'Device not connected. Please connect device first.',
        );
      }

      // Update last seen if device is connected
      if (license.connectedDevice) {
        await this.prisma.deviceConnection.update({
          where: { id: license.connectedDevice.id },
          data: { lastSeen: new Date() },
        });
      }

      // Set context
      this.utility.companyId = license.companyId;
      req.license = license;
      req.deviceConnection = license.connectedDevice;

      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('License validation failed');
    }
  }
}

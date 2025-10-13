import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { POSDevice, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import {
  POSDeviceCreateRequest,
  POSDeviceUpdateRequest,
  POSDeviceRegenerateKeyRequest,
  POSDeviceDeleteRequest,
  POSDeviceListRequest,
} from '@shared/request/pos-device.request';
import {
  POSDeviceResponse,
  POSDeviceCreateResponse,
  POSDeviceRegenerateKeyResponse,
} from '@shared/response/pos-device.response';

@Injectable()
export class POSDeviceService {
  @Inject() private readonly prismaService: PrismaService;

  /**
   * Generate a unique device ID
   */
  private generateDeviceId(): string {
    return `POS-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  }

  /**
   * Generate a secure API key
   */
  private generateApiKey(): string {
    return `ante_pos_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Transform Prisma POSDevice to response format
   */
  private toResponse(device: any): POSDeviceResponse {
    return {
      id: device.id,
      deviceId: device.deviceId,
      name: device.name,
      location: device.location,
      companyId: device.companyId,
      branchId: device.branchId,
      isActive: device.isActive,
      lastActivityAt: device.lastActivityAt,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
      branch: device.branch
        ? {
            id: device.branch.id,
            name: device.branch.name,
          }
        : null,
    };
  }

  /**
   * Get all POS devices for a company
   */
  async getAllDevices(
    companyId: number,
    request: POSDeviceListRequest = {},
  ): Promise<POSDeviceResponse[]> {
    const where: Prisma.POSDeviceWhereInput = {
      companyId,
    };

    if (!request.includeInactive) {
      where.isActive = true;
    }

    const devices = await this.prismaService.pOSDevice.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return devices.map((device) => this.toResponse(device));
  }

  /**
   * Get a single POS device by ID
   */
  async getDeviceById(
    id: string,
    companyId: number,
  ): Promise<POSDeviceResponse> {
    const device = await this.prismaService.pOSDevice.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!device) {
      throw new NotFoundException('POS Device not found');
    }

    return this.toResponse(device);
  }

  /**
   * Create a new POS device
   */
  async createDevice(
    data: POSDeviceCreateRequest,
    companyId: number,
  ): Promise<POSDeviceCreateResponse> {
    const deviceId = this.generateDeviceId();
    const apiKey = this.generateApiKey();

    // Verify branch exists and belongs to company if provided
    if (data.branchId) {
      const branch = await this.prismaService.project.findFirst({
        where: {
          id: data.branchId,
          companyId,
        },
      });

      if (!branch) {
        throw new BadRequestException('Branch not found or does not belong to your company');
      }
    }

    const device = await this.prismaService.pOSDevice.create({
      data: {
        deviceId,
        name: data.name,
        location: data.location || '',
        companyId,
        branchId: data.branchId,
        apiKey,
        isActive: true,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      device: this.toResponse(device),
      apiKey,
      message:
        'POS device created successfully. Please save the API key securely as it won\'t be shown again.',
    };
  }

  /**
   * Update POS device details
   */
  async updateDevice(
    data: POSDeviceUpdateRequest,
    companyId: number,
  ): Promise<POSDeviceResponse> {
    // Verify device belongs to company
    await this.getDeviceById(data.id, companyId);

    // Verify branch exists and belongs to company if provided
    if (data.branchId !== undefined && data.branchId !== null) {
      const branch = await this.prismaService.project.findFirst({
        where: {
          id: data.branchId,
          companyId,
        },
      });

      if (!branch) {
        throw new BadRequestException('Branch not found or does not belong to your company');
      }
    }

    const device = await this.prismaService.pOSDevice.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.branchId !== undefined && { branchId: data.branchId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.toResponse(device);
  }

  /**
   * Regenerate API key for a POS device
   */
  async regenerateApiKey(
    data: POSDeviceRegenerateKeyRequest,
    companyId: number,
  ): Promise<POSDeviceRegenerateKeyResponse> {
    // Verify device belongs to company
    await this.getDeviceById(data.id, companyId);

    const newApiKey = this.generateApiKey();

    const device = await this.prismaService.pOSDevice.update({
      where: { id: data.id },
      data: {
        apiKey: newApiKey,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      device: this.toResponse(device),
      apiKey: newApiKey,
      message:
        'API key regenerated successfully. The old key will no longer work. Please save the new key securely.',
    };
  }

  /**
   * Delete (soft delete) a POS device
   */
  async deleteDevice(
    data: POSDeviceDeleteRequest,
    companyId: number,
  ): Promise<POSDeviceResponse> {
    // Verify device belongs to company
    await this.getDeviceById(data.id, companyId);

    const device = await this.prismaService.pOSDevice.update({
      where: { id: data.id },
      data: {
        isActive: false,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.toResponse(device);
  }

  /**
   * Validate POS device by API key (for public endpoints)
   */
  async validateDevice(apiKey: string): Promise<POSDevice | null> {
    const device = await this.prismaService.pOSDevice.findUnique({
      where: { apiKey },
      include: {
        company: true,
        branch: true,
      },
    });

    if (!device || !device.isActive) {
      return null;
    }

    // Update last activity
    await this.prismaService.pOSDevice.update({
      where: { id: device.id },
      data: {
        lastActivityAt: new Date(),
      },
    });

    return device;
  }
}

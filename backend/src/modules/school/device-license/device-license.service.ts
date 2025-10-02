import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import {
  DeviceLicenseGenerateRequest,
  DeviceLicenseUpdateRequest,
  DeviceConnectionRequest,
  DeviceLicenseRegenerateRequest,
  DeviceLicenseDeleteRequest,
} from '@shared/request/device-license.request';

@Injectable()
export class DeviceLicenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utility: UtilityService,
    private readonly tableHandler: TableHandlerService,
  ) {}

  async generateLicenses(
    data: DeviceLicenseGenerateRequest,
    companyId: number,
  ) {
    // Verify gate exists and belongs to company
    const gate = await this.prisma.gate.findFirst({
      where: {
        id: data.gateId,
        companyId,
        deletedAt: null,
      },
    });

    if (!gate) {
      throw new NotFoundException('Gate not found');
    }

    const licenses = [];

    for (let i = 0; i < data.quantity; i++) {
      const licenseKey = this.generateLicenseKey();

      // Ensure license key is unique
      const existingLicense = await this.prisma.deviceLicense.findFirst({
        where: { licenseKey },
      });

      if (existingLicense) {
        i--; // Retry with a new key
        continue;
      }

      const license = await this.prisma.deviceLicense.create({
        data: {
          licenseKey,
          gateId: data.gateId,
          companyId,
        },
        include: {
          company: true,
          gate: true,
          connectedDevice: true,
        },
      });

      licenses.push(this.formatLicenseResponse(license));
    }

    return licenses;
  }

  async table(
    body: TableBodyDTO,
    query: TableQueryDTO,
    companyId: number,
  ): Promise<any> {
    this.tableHandler.initialize(query, body, 'deviceLicense');
    const tableQuery = this.tableHandler.constructTableQuery();

    tableQuery['include'] = {
      company: true,
      gate: true,
      connectedDevice: true,
    };

    tableQuery['where'] = {
      companyId,
      isDeleted: false,
      ...tableQuery.where,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandler.getTableData(
      this.prisma.deviceLicense,
      query,
      tableQuery,
    );

    const list = baseList.map((license) => this.formatLicenseResponse(license));

    return { list, pagination, currentPage };
  }

  async updateLicense(data: DeviceLicenseUpdateRequest, companyId: number) {
    const license = await this.prisma.deviceLicense.findFirst({
      where: {
        id: data.id,
        companyId,
        isDeleted: false,
      },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    // If updating gate, verify it exists
    if (data.gateId) {
      const gate = await this.prisma.gate.findFirst({
        where: {
          id: data.gateId,
          companyId,
          deletedAt: null,
        },
      });

      if (!gate) {
        throw new NotFoundException('Gate not found');
      }
    }

    const updatedLicense = await this.prisma.deviceLicense.update({
      where: { id: data.id },
      data: {
        gateId: data.gateId,
        isActive: data.isActive,
      },
      include: {
        company: true,
        gate: true,
        connectedDevice: true,
      },
    });

    return this.formatLicenseResponse(updatedLicense);
  }

  async regenerateLicense(
    data: DeviceLicenseRegenerateRequest,
    companyId: number,
  ) {
    const license = await this.prisma.deviceLicense.findFirst({
      where: {
        id: data.id,
        companyId,
        isDeleted: false,
      },
    });

    if (!license) {
      throw new NotFoundException('License not found');
    }

    const newLicenseKey = this.generateLicenseKey();

    // Ensure new license key is unique
    const existingLicense = await this.prisma.deviceLicense.findFirst({
      where: { licenseKey: newLicenseKey },
    });

    if (existingLicense) {
      throw new BadRequestException(
        'Failed to generate unique license key, please try again',
      );
    }

    const updatedLicense = await this.prisma.deviceLicense.update({
      where: { id: data.id },
      data: {
        licenseKey: newLicenseKey,
        // Reset usage dates when regenerating
        dateFirstUsed: null,
        dateLastUsed: null,
      },
      include: {
        company: true,
        gate: true,
        connectedDevice: true,
      },
    });

    return this.formatLicenseResponse(updatedLicense);
  }

  async deleteLicenses(data: DeviceLicenseDeleteRequest, companyId: number) {
    const licenses = await this.prisma.deviceLicense.findMany({
      where: {
        id: { in: data.ids },
        companyId,
        isDeleted: false,
      },
    });

    if (licenses.length !== data.ids.length) {
      throw new NotFoundException('Some licenses not found');
    }

    await this.prisma.deviceLicense.updateMany({
      where: {
        id: { in: data.ids },
        companyId,
      },
      data: {
        isDeleted: true,
      },
    });

    return { message: 'Licenses deleted successfully' };
  }

  async connectDevice(data: DeviceConnectionRequest) {
    const license = await this.prisma.deviceLicense.findFirst({
      where: {
        licenseKey: data.licenseKey,
        isActive: true,
        isDeleted: false,
      },
      include: {
        gate: true,
      },
    });

    if (!license) {
      throw new NotFoundException('Invalid or inactive license key');
    }

    // Check if device is already connected to this license
    const existingConnection = await this.prisma.deviceConnection.findFirst({
      where: { licenseId: license.id },
    });

    if (existingConnection) {
      // Update existing connection
      const updatedConnection = await this.prisma.deviceConnection.update({
        where: { id: existingConnection.id },
        data: {
          deviceName: data.deviceName,
          macAddress: data.macAddress,
          ipAddress: data.ipAddress,
          deviceInfo: data.deviceInfo,
          isConnected: true,
          lastSeen: new Date(),
          connectionCount: existingConnection.connectionCount + 1,
        },
      });

      // Update license usage dates
      await this.prisma.deviceLicense.update({
        where: { id: license.id },
        data: {
          dateLastUsed: new Date(),
          dateFirstUsed: license.dateFirstUsed || new Date(),
        },
      });

      return {
        connection: updatedConnection,
        gate: license.gate
          ? {
              id: license.gate.id,
              gateName: license.gate.gateName,
            }
          : null,
        message: 'Device connected successfully',
      };
    } else {
      // Create new connection
      const newConnection = await this.prisma.deviceConnection.create({
        data: {
          licenseId: license.id,
          deviceName: data.deviceName,
          macAddress: data.macAddress,
          ipAddress: data.ipAddress,
          deviceInfo: data.deviceInfo,
          isConnected: true,
          lastSeen: new Date(),
        },
      });

      // Update license usage dates
      await this.prisma.deviceLicense.update({
        where: { id: license.id },
        data: {
          dateFirstUsed: new Date(),
          dateLastUsed: new Date(),
        },
      });

      return {
        connection: newConnection,
        gate: license.gate
          ? {
              id: license.gate.id,
              gateName: license.gate.gateName,
            }
          : null,
        message: 'Device connected successfully',
      };
    }
  }

  private generateLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private formatLicenseResponse(license: any) {
    return {
      id: license.id,
      licenseKey: license.licenseKey,
      gateId: license.gateId,
      gate: license.gate
        ? {
            id: license.gate.id,
            gateName: license.gate.gateName,
          }
        : null,
      isActive: license.isActive,
      dateFirstUsed: license.dateFirstUsed,
      dateLastUsed: license.dateLastUsed,
      createdAt: license.createdAt,
      updatedAt: license.updatedAt,
      connectedDevice: license.connectedDevice
        ? {
            id: license.connectedDevice.id,
            deviceName: license.connectedDevice.deviceName,
            macAddress: license.connectedDevice.macAddress,
            ipAddress: license.connectedDevice.ipAddress,
            isConnected: license.connectedDevice.isConnected,
            lastSeen: license.connectedDevice.lastSeen,
            connectionCount: license.connectedDevice.connectionCount,
            createdAt: license.connectedDevice.createdAt,
          }
        : null,
    };
  }

  // Additional methods for public API
  async validateLicense(licenseKey: string) {
    const license = await this.prisma.deviceLicense.findFirst({
      where: {
        licenseKey,
        isActive: true,
        isDeleted: false,
      },
      include: {
        gate: true,
      },
    });

    return license;
  }

  async updateLastUsed(licenseId: number) {
    await this.prisma.deviceLicense.update({
      where: { id: licenseId },
      data: {
        dateLastUsed: new Date(),
        dateFirstUsed: await this.prisma.deviceLicense
          .findUnique({ where: { id: licenseId } })
          .then(l => l?.dateFirstUsed || new Date()),
      },
    });
  }

  async updateHeartbeat(
    licenseId: number,
    deviceInfo?: any,
    statistics?: any,
  ) {
    // Update last seen
    await this.updateLastUsed(licenseId);

    // Store device info if provided
    if (deviceInfo) {
      const connection = await this.prisma.deviceConnection.findFirst({
        where: { licenseId },
      });

      if (connection) {
        await this.prisma.deviceConnection.update({
          where: { id: connection.id },
          data: {
            deviceName: deviceInfo.deviceName || connection.deviceName,
            macAddress: deviceInfo.macAddress || connection.macAddress,
            ipAddress: deviceInfo.ipAddress || connection.ipAddress,
            deviceInfo: deviceInfo || connection.deviceInfo,
            lastSeen: new Date(),
          },
        });
      }
    }

    return true;
  }
}

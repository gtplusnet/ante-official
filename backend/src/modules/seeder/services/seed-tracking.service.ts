import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { CompanySeedTracking } from '@prisma/client';

export type SeedStatus = 'pending' | 'completed' | 'failed';

@Injectable()
export class SeedTrackingService {
  @Inject() private prisma: PrismaService;

  async getTracking(
    companyId: number,
    seederType: string,
  ): Promise<CompanySeedTracking | null> {
    return await this.prisma.companySeedTracking.findUnique({
      where: {
        companyId_seederType: {
          companyId,
          seederType,
        },
      },
    });
  }

  async getAllTracking(companyId: number): Promise<CompanySeedTracking[]> {
    return await this.prisma.companySeedTracking.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createTracking(
    companyId: number,
    seederType: string,
    status: SeedStatus = 'pending',
  ): Promise<CompanySeedTracking> {
    return await this.prisma.companySeedTracking.create({
      data: {
        companyId,
        seederType,
        status,
      },
    });
  }

  async updateTracking(
    companyId: number,
    seederType: string,
    data: {
      status?: SeedStatus;
      seedDate?: Date;
      errorMessage?: string | null;
      metadata?: any;
    },
  ): Promise<CompanySeedTracking> {
    return await this.prisma.companySeedTracking.upsert({
      where: {
        companyId_seederType: {
          companyId,
          seederType,
        },
      },
      update: data,
      create: {
        companyId,
        seederType,
        status: data.status || 'pending',
        seedDate: data.seedDate,
        errorMessage: data.errorMessage,
        metadata: data.metadata,
      },
    });
  }

  async markAsCompleted(
    companyId: number,
    seederType: string,
    metadata?: any,
  ): Promise<CompanySeedTracking> {
    return await this.updateTracking(companyId, seederType, {
      status: 'completed',
      seedDate: new Date(),
      errorMessage: null,
      metadata,
    });
  }

  async markAsFailed(
    companyId: number,
    seederType: string,
    errorMessage: string,
    metadata?: any,
  ): Promise<CompanySeedTracking> {
    return await this.updateTracking(companyId, seederType, {
      status: 'failed',
      errorMessage,
      metadata,
    });
  }

  async resetTracking(
    companyId: number,
    seederType: string,
  ): Promise<CompanySeedTracking> {
    return await this.updateTracking(companyId, seederType, {
      status: 'pending',
      seedDate: null,
      errorMessage: null,
      metadata: null,
    });
  }
}

import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateDealSourceDto,
  UpdateDealSourceDto,
  DealSourceQueryDto,
} from './deal-source.validator.dto';

@Injectable()
export class DealSourceService {
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly utilityService: UtilityService;

  async createDealSource(dto: CreateDealSourceDto) {
    // Check if source name already exists
    const existingSource = await this.prisma.dealSource.findFirst({
      where: {
        sourceName: dto.sourceName,
        isActive: true,
        companyId: this.utilityService.companyId,
      },
    });

    if (existingSource) {
      throw new ConflictException('Deal source with this name already exists');
    }

    const dealSource = await this.prisma.dealSource.create({
      data: {
        sourceName: dto.sourceName,
        createdById: this.utilityService.accountInformation.id,
        companyId: this.utilityService.companyId,
      },
    });

    return dealSource;
  }

  async getDealSourcesList(query: DealSourceQueryDto) {
    const where: any = {
      isActive: query.showArchived === 'true' ? undefined : true,
      companyId: this.utilityService.companyId,
    };

    if (query.search) {
      where.sourceName = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    let orderBy: any = { createdAt: 'desc' };

    if (query.sortBy) {
      switch (query.sortBy) {
        case 'Name (A-Z)':
          orderBy = { sourceName: 'asc' };
          break;
        case 'Name (Z-A)':
          orderBy = { sourceName: 'desc' };
          break;
        case 'Recent Activity':
          orderBy = { updatedAt: 'desc' };
          break;
        case 'Date Created':
        default:
          orderBy = { createdAt: 'desc' };
          break;
      }
    }

    const dealSources = await this.prisma.dealSource.findMany({
      where,
      orderBy,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return dealSources.map((source) => ({
      id: source.id,
      sourceName: source.sourceName,
      isActive: source.isActive,
      dateCreated: source.createdAt,
      createdBy: `${source.createdBy.firstName} ${source.createdBy.lastName}`,
    }));
  }

  async updateDealSource(id: number, dto: UpdateDealSourceDto) {
    const dealSource = await this.prisma.dealSource.findFirst({
      where: {
        id,
        companyId: this.utilityService.companyId,
      },
    });

    if (!dealSource) {
      throw new ConflictException('Deal source not found');
    }

    // Check for duplicate name if updating sourceName
    if (dto.sourceName && dto.sourceName !== dealSource.sourceName) {
      const existingSource = await this.prisma.dealSource.findFirst({
        where: {
          sourceName: dto.sourceName,
          isActive: true,
          companyId: this.utilityService.companyId,
          id: { not: id },
        },
      });

      if (existingSource) {
        throw new ConflictException(
          'Deal source with this name already exists',
        );
      }
    }

    return await this.prisma.dealSource.update({
      where: { id },
      data: dto,
    });
  }

  async archiveDealSource(id: number) {
    const dealSource = await this.prisma.dealSource.findFirst({
      where: {
        id,
        companyId: this.utilityService.companyId,
      },
    });

    if (!dealSource) {
      throw new ConflictException('Deal source not found');
    }

    return await this.prisma.dealSource.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getDealSourceById(id: number) {
    return await this.prisma.dealSource.findFirst({
      where: {
        id,
        companyId: this.utilityService.companyId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}

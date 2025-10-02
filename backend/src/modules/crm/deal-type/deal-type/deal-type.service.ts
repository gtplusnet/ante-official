import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateDealTypeDto,
  UpdateDealTypeDto,
  DealTypeQueryDto,
} from './deal-type.validator.dto';

@Injectable()
export class DealTypeService {
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly utilityService: UtilityService;

  async createDealType(dto: CreateDealTypeDto) {
    // Check if type name already exists
    const existingType = await this.prisma.dealType.findFirst({
      where: {
        typeName: dto.typeName,
        isActive: true,
        companyId: this.utilityService.companyId,
      },
    });

    if (existingType) {
      throw new ConflictException('Deal type with this name already exists');
    }

    const dealType = await this.prisma.dealType.create({
      data: {
        typeName: dto.typeName,
        companyId: this.utilityService.companyId,
      },
    });

    return dealType;
  }

  async getDealTypesList(query: DealTypeQueryDto) {
    const where: any = {
      isActive: query.showArchived === 'true' ? undefined : true,
      companyId: this.utilityService.companyId,
    };

    if (query.search) {
      where.typeName = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const dealTypes = await this.prisma.dealType.findMany({
      where,
      orderBy: {
        typeName: 'asc',
      },
    });

    return dealTypes.map((type) => ({
      id: type.id,
      typeName: type.typeName,
      isActive: type.isActive,
      dateCreated: type.createdAt,
    }));
  }

  async updateDealType(id: number, dto: UpdateDealTypeDto) {
    const dealType = await this.prisma.dealType.findFirst({
      where: {
        id,
        companyId: this.utilityService.companyId,
      },
    });

    if (!dealType) {
      throw new ConflictException('Deal type not found');
    }

    // Check for duplicate name if updating typeName
    if (dto.typeName && dto.typeName !== dealType.typeName) {
      const existingType = await this.prisma.dealType.findFirst({
        where: {
          typeName: dto.typeName,
          isActive: true,
          companyId: this.utilityService.companyId,
          id: { not: id },
        },
      });

      if (existingType) {
        throw new ConflictException('Deal type with this name already exists');
      }
    }

    return await this.prisma.dealType.update({
      where: { id },
      data: dto,
    });
  }

  async archiveDealType(id: number) {
    const dealType = await this.prisma.dealType.findFirst({
      where: {
        id,
        companyId: this.utilityService.companyId,
      },
    });

    if (!dealType) {
      throw new ConflictException('Deal type not found');
    }

    return await this.prisma.dealType.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getDealTypeById(id: number) {
    return await this.prisma.dealType.findFirst({
      where: {
        id,
        companyId: this.utilityService.companyId,
      },
    });
  }
}

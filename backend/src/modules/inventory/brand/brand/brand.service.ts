import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { QueryBrandDto } from '../dto/query-brand.dto';
import { BrandDataResponse, BrandSelectBoxResponse } from '@shared/response';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { Brand } from '@prisma/client';

@Injectable()
export class BrandService {
  @Inject() public prisma: PrismaService;
  @Inject() public utility: UtilityService;
  @Inject() public tableHandler: TableHandlerService;

  async create(dto: CreateBrandDto): Promise<BrandDataResponse> {
    // Check if brand code already exists for this company
    const existingBrand = await this.prisma.brand.findFirst({
      where: {
        code: dto.code,
        companyId: this.utility.companyId,
      },
    });

    if (existingBrand) {
      throw new BadRequestException(
        `Brand with code "${dto.code}" already exists`,
      );
    }

    const brand = await this.prisma.brand.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description || null,
        isActive: dto.isActive !== false,
        companyId: this.utility.companyId,
      },
    });

    return this.formatBrandResponse(brand);
  }

  async findAll(query: QueryBrandDto): Promise<BrandDataResponse[]> {
    const {
      search,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const where = {
      companyId: this.utility.companyId,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const brands = await this.prisma.brand.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return brands.map((brand) => this.formatBrandResponse(brand));
  }

  async findOne(id: number): Promise<BrandDataResponse> {
    const brand = await this.prisma.brand.findFirst({
      where: {
        id,
        companyId: this.utility.companyId,
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return this.formatBrandResponse(brand);
  }

  async update(id: number, dto: UpdateBrandDto): Promise<BrandDataResponse> {
    const brand = await this.findBrandOrThrow(id);

    // If updating code, check for duplicates
    if (dto.code && dto.code !== brand.code) {
      const existingBrand = await this.prisma.brand.findFirst({
        where: {
          code: dto.code,
          companyId: this.utility.companyId,
          id: { not: id },
        },
      });

      if (existingBrand) {
        throw new BadRequestException(
          `Brand with code "${dto.code}" already exists`,
        );
      }
    }

    const updatedBrand = await this.prisma.brand.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return this.formatBrandResponse(updatedBrand);
  }

  async delete(id: number): Promise<BrandDataResponse> {
    await this.findBrandOrThrow(id);

    // Check if brand is being used by any items
    const itemCount = await this.prisma.item.count({
      where: {
        brandId: id,
        companyId: this.utility.companyId,
      },
    });

    if (itemCount > 0) {
      throw new BadRequestException(
        `Cannot delete brand. It is being used by ${itemCount} item(s)`,
      );
    }

    const deletedBrand = await this.prisma.brand.update({
      where: { id },
      data: { isActive: false },
    });

    return this.formatBrandResponse(deletedBrand);
  }

  async getSelectBox(): Promise<BrandSelectBoxResponse[]> {
    const brands = await this.prisma.brand.findMany({
      where: {
        companyId: this.utility.companyId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    });

    return brands;
  }

  async table(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandler.initialize(query, body, 'brand');
    const tableQuery = this.tableHandler.constructTableQuery();

    tableQuery.where = {
      ...tableQuery.where,
      companyId: this.utility.companyId,
    };

    const brands = await this.prisma.brand.findMany({
      ...tableQuery,
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    const perPage = tableQuery.take;
    const currentPage = Number(query.page);

    // Remove pagination-specific properties for count query
    const countQuery = { ...tableQuery };
    delete countQuery.take;
    delete countQuery.skip;
    delete countQuery.orderBy;

    const totalCount = await this.prisma.brand.count({
      where: countQuery.where,
    });

    const pagination = this.tableHandler.paginate(
      totalCount,
      perPage,
      2,
      currentPage,
    );

    const list = brands.map((brand: any) => ({
      ...this.formatBrandResponse(brand),
      itemCount: brand._count.items,
    }));

    return {
      list,
      pagination,
    };
  }

  private async findBrandOrThrow(id: number): Promise<Brand> {
    const brand = await this.prisma.brand.findFirst({
      where: {
        id,
        companyId: this.utility.companyId,
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  private formatBrandResponse(brand: Brand): BrandDataResponse {
    return {
      id: brand.id,
      name: brand.name,
      code: brand.code,
      description: brand.description,
      isActive: brand.isActive,
      companyId: brand.companyId,
      createdAt: brand.createdAt.toISOString(),
      updatedAt: brand.updatedAt.toISOString(),
    };
  }
}

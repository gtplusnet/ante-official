import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { CreateItemCategoryDto } from '../dto/create-item-category.dto';
import { UpdateItemCategoryDto } from '../dto/update-item-category.dto';
import { QueryItemCategoryDto } from '../dto/query-item-category.dto';
import {
  ItemCategoryDataResponse,
  ItemCategorySelectBoxResponse,
} from '@shared/response/item-category.response';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { ItemCategory } from '@prisma/client';

@Injectable()
export class ItemCategoryService {
  @Inject() public prisma: PrismaService;
  @Inject() public utility: UtilityService;
  @Inject() public tableHandler: TableHandlerService;

  async create(dto: CreateItemCategoryDto): Promise<ItemCategoryDataResponse> {
    // Check if category code already exists for this company
    const existingCategory = await this.prisma.itemCategory.findFirst({
      where: {
        code: dto.code,
        companyId: this.utility.companyId,
      },
    });

    if (existingCategory) {
      throw new BadRequestException(
        `Item category with code "${dto.code}" already exists`,
      );
    }

    // Validate parent if provided
    if (dto.parentId) {
      await this.validateParentCategory(dto.parentId);
    }

    const category = await this.prisma.itemCategory.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description || null,
        isActive: dto.isActive !== false,
        parentId: dto.parentId || null,
        companyId: this.utility.companyId,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return this.formatCategoryResponse(category);
  }

  async findAll(
    query: QueryItemCategoryDto,
  ): Promise<ItemCategoryDataResponse[]> {
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
          {
            description: { contains: search, mode: 'insensitive' as const },
          },
        ],
      }),
    };

    const categories = await this.prisma.itemCategory.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        parent: true,
        children: true,
      },
    });

    return categories.map((category) => this.formatCategoryResponse(category));
  }

  async findOne(id: number): Promise<ItemCategoryDataResponse> {
    const category = await this.prisma.itemCategory.findFirst({
      where: {
        id,
        companyId: this.utility.companyId,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Item category with ID ${id} not found`);
    }

    return this.formatCategoryResponse(category);
  }

  async update(
    id: number,
    dto: UpdateItemCategoryDto,
  ): Promise<ItemCategoryDataResponse> {
    const category = await this.findCategoryOrThrow(id);

    // If updating code, check for duplicates
    if (dto.code && dto.code !== category.code) {
      const existingCategory = await this.prisma.itemCategory.findFirst({
        where: {
          code: dto.code,
          companyId: this.utility.companyId,
          id: { not: id },
        },
      });

      if (existingCategory) {
        throw new BadRequestException(
          `Item category with code "${dto.code}" already exists`,
        );
      }
    }

    // Validate parent if updating parentId
    if (dto.parentId !== undefined) {
      if (dto.parentId !== null) {
        await this.validateParentCategory(dto.parentId, id);
      }
    }

    const updatedCategory = await this.prisma.itemCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return this.formatCategoryResponse(updatedCategory);
  }

  async delete(id: number): Promise<ItemCategoryDataResponse> {
    await this.findCategoryOrThrow(id);

    // Check if category is being used by any items
    const itemCount = await this.prisma.item.count({
      where: {
        categoryId: id,
        companyId: this.utility.companyId,
      },
    });

    if (itemCount > 0) {
      throw new BadRequestException(
        `Cannot delete category. It is being used by ${itemCount} item(s)`,
      );
    }

    // Check if category has children
    const childCount = await this.prisma.itemCategory.count({
      where: {
        parentId: id,
        companyId: this.utility.companyId,
        isActive: true,
      },
    });

    if (childCount > 0) {
      throw new BadRequestException(
        `Cannot delete category. It has ${childCount} child categor${childCount === 1 ? 'y' : 'ies'}`,
      );
    }

    const deletedCategory = await this.prisma.itemCategory.update({
      where: { id },
      data: { isActive: false },
      include: {
        parent: true,
        children: true,
      },
    });

    return this.formatCategoryResponse(deletedCategory);
  }

  async getSelectBox(): Promise<ItemCategorySelectBoxResponse[]> {
    const categories = await this.prisma.itemCategory.findMany({
      where: {
        companyId: this.utility.companyId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        parentId: true,
      },
    });

    return categories;
  }

  async getParentOptions(
    excludeId?: number,
  ): Promise<ItemCategorySelectBoxResponse[]> {
    // Get all categories that can be parents
    const categories = await this.prisma.itemCategory.findMany({
      where: {
        companyId: this.utility.companyId,
        isActive: true,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: {
        id: true,
        name: true,
        code: true,
        parentId: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Start with "No Parent" option
    const options: ItemCategorySelectBoxResponse[] = [
      {
        id: null,
        name: 'No Parent',
        code: '',
        parentId: null,
      },
    ];

    if (excludeId) {
      // Filter out descendants of the excluded category
      const validCategories = [];
      for (const category of categories) {
        const isDescendant = await this.isDescendantOf(category.id, excludeId);
        if (!isDescendant) {
          validCategories.push(category);
        }
      }
      options.push(...validCategories);
    } else {
      // If no excludeId, return all categories
      options.push(...categories);
    }

    return options;
  }

  async getTree(): Promise<ItemCategoryDataResponse[]> {
    // Fetch all categories with their relations (3 levels deep)
    const categories = await this.prisma.itemCategory.findMany({
      where: {
        companyId: this.utility.companyId,
        isActive: true,
      },
      include: {
        parent: true,
        children: {
          where: {
            isActive: true,
          },
          include: {
            children: {
              where: {
                isActive: true,
              },
              include: {
                children: {
                  where: {
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Build tree structure - only return top-level categories (no parent)
    const topLevelCategories = categories.filter(
      (category) => !category.parentId,
    );

    // Format the tree structure
    const formattedTree = topLevelCategories.map((category) =>
      this.formatCategoryNode(category),
    );

    return formattedTree;
  }

  async table(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandler.initialize(query, body, 'itemCategory');
    const tableQuery = this.tableHandler.constructTableQuery();

    tableQuery.where = {
      ...tableQuery.where,
      companyId: this.utility.companyId,
    };

    const categories = await this.prisma.itemCategory.findMany({
      ...tableQuery,
      include: {
        parent: true,
        _count: {
          select: { items: true, children: true },
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

    const totalCount = await this.prisma.itemCategory.count({
      where: countQuery.where,
    });

    const pagination = this.tableHandler.paginate(
      totalCount,
      perPage,
      2,
      currentPage,
    );

    const list = categories.map((category: any) => ({
      ...this.formatCategoryResponse(category),
      itemCount: category._count.items,
      childrenCount: category._count.children,
    }));

    return {
      list,
      pagination,
    };
  }

  private async findCategoryOrThrow(id: number): Promise<ItemCategory> {
    const category = await this.prisma.itemCategory.findFirst({
      where: {
        id,
        companyId: this.utility.companyId,
      },
    });

    if (!category) {
      throw new NotFoundException(`Item category with ID ${id} not found`);
    }

    return category;
  }

  private async validateParentCategory(
    parentId: number,
    currentCategoryId?: number,
  ): Promise<void> {
    // Check if parent exists and is active
    const parent = await this.prisma.itemCategory.findFirst({
      where: {
        id: parentId,
        companyId: this.utility.companyId,
      },
    });

    if (!parent || !parent.isActive) {
      throw new BadRequestException('Invalid parent category');
    }

    // Prevent setting itself as parent
    if (currentCategoryId && parentId === currentCategoryId) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    // Prevent circular reference - check if the parent is a descendant of current category
    if (currentCategoryId) {
      const isDescendant = await this.isDescendantOf(
        parentId,
        currentCategoryId,
      );
      if (isDescendant) {
        throw new BadRequestException(
          'Cannot set a child category as parent (circular reference)',
        );
      }
    }
  }

  private async isDescendantOf(
    categoryId: number,
    potentialAncestorId: number,
  ): Promise<boolean> {
    let currentCategory = await this.prisma.itemCategory.findUnique({
      where: { id: categoryId },
      select: { parentId: true },
    });

    while (currentCategory?.parentId) {
      if (currentCategory.parentId === potentialAncestorId) {
        return true;
      }
      currentCategory = await this.prisma.itemCategory.findUnique({
        where: { id: currentCategory.parentId },
        select: { parentId: true },
      });
    }

    return false;
  }

  private formatCategoryNode(category: any): ItemCategoryDataResponse {
    const node: ItemCategoryDataResponse = {
      id: category.id,
      name: category.name,
      code: category.code,
      description: category.description,
      isActive: category.isActive,
      parentId: category.parentId,
      companyId: category.companyId,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
      children: [],
    };

    // Recursively format children
    if (category.children && category.children.length > 0) {
      node.children = category.children.map((child) =>
        this.formatCategoryNode(child),
      );
      node.childrenCount = category.children.length;
    }

    return node;
  }

  private formatCategoryResponse(
    category: any,
  ): ItemCategoryDataResponse {
    return {
      id: category.id,
      name: category.name,
      code: category.code,
      description: category.description,
      isActive: category.isActive,
      parentId: category.parentId,
      companyId: category.companyId,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
      parent: category.parent
        ? this.formatCategoryResponse(category.parent)
        : undefined,
      children: category.children
        ? category.children.map((child) => this.formatCategoryResponse(child))
        : undefined,
      childrenCount: category.children?.length || 0,
    };
  }
}

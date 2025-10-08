import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { CreateCategoryDto, UpdateCategoryDto } from './calendar-category.dto';

@Injectable()
export class CalendarCategoryService {
  @Inject() private readonly prisma: PrismaService;
  @Inject() private readonly utility: UtilityService;

  /**
   * Get all categories for the current company
   */
  async getCategories() {
    const companyId = this.utility.accountInformation.company?.id;

    if (!companyId) {
      throw new BadRequestException('Company ID not found');
    }

    const categories = await this.prisma.calendarCategory.findMany({
      where: {
        companyId,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return categories;
  }

  /**
   * Get a single category by ID
   */
  async getCategoryById(id: number) {
    const companyId = this.utility.accountInformation.company?.id;

    const category = await this.prisma.calendarCategory.findFirst({
      where: {
        id,
        companyId,
        isActive: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryDto) {
    const companyId = this.utility.accountInformation.company?.id;
    const creatorId = this.utility.accountInformation.id;

    if (!companyId) {
      throw new BadRequestException('Company ID not found');
    }

    // Get the highest sortOrder
    const highestOrder = await this.prisma.calendarCategory.findFirst({
      where: { companyId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const sortOrder = data.sortOrder ?? (highestOrder?.sortOrder ?? 0) + 1;

    const category = await this.prisma.calendarCategory.create({
      data: {
        name: data.name,
        colorCode: data.colorCode,
        icon: data.icon,
        description: data.description,
        sortOrder,
        isSystem: false, // Custom categories are never system categories
        creatorId,
        companyId,
        isActive: true,
      },
    });

    return category;
  }

  /**
   * Update a category
   */
  async updateCategory(id: number, data: UpdateCategoryDto) {
    const companyId = this.utility.accountInformation.company?.id;

    // Check if category exists and belongs to company
    const existingCategory = await this.prisma.calendarCategory.findFirst({
      where: { id, companyId, isActive: true },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    // Prevent updating system categories
    if (existingCategory.isSystem) {
      throw new BadRequestException('Cannot modify system categories');
    }

    const category = await this.prisma.calendarCategory.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.colorCode && { colorCode: data.colorCode }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return category;
  }

  /**
   * Delete a category (soft delete)
   */
  async deleteCategory(id: number) {
    const companyId = this.utility.accountInformation.company?.id;

    // Check if category exists and belongs to company
    const existingCategory = await this.prisma.calendarCategory.findFirst({
      where: { id, companyId, isActive: true },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    // Prevent deleting system categories
    if (existingCategory.isSystem) {
      throw new BadRequestException('Cannot delete system categories');
    }

    // Check if category is in use
    const eventsCount = await this.prisma.calendarEvent.count({
      where: { categoryId: id, isActive: true },
    });

    if (eventsCount > 0) {
      throw new BadRequestException(
        `Cannot delete category. It is used by ${eventsCount} event(s)`,
      );
    }

    // Soft delete
    await this.prisma.calendarCategory.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true, message: 'Category deleted successfully' };
  }
}

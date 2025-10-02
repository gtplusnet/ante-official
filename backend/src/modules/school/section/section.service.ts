import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateSectionDto,
  UpdateSectionDto,
} from './section.validator';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';

@Injectable()
export class SectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utility: UtilityService,
    private readonly tableHandler: TableHandlerService,
  ) {}

  async create(data: CreateSectionDto, companyId: number) {
    // Handle null companyId
    if (!companyId) {
      throw new BadRequestException('Company context not found');
    }
    
    // Validate grade level exists and belongs to company
    const gradeLevel = await this.prisma.gradeLevel.findFirst({
      where: {
        id: data.gradeLevelId,
        companyId,
        isActive: true,
      },
    });

    if (!gradeLevel) {
      throw new NotFoundException('Grade level not found or inactive');
    }

    // Check if section name already exists for this grade level and school year
    const existingSection = await this.prisma.schoolSection.findFirst({
      where: {
        name: data.name,
        gradeLevelId: data.gradeLevelId,
        schoolYear: data.schoolYear,
        companyId,
        isDeleted: false,
      },
    });

    if (existingSection) {
      throw new BadRequestException(
        `Section "${data.name}" already exists for ${gradeLevel.name} in school year ${data.schoolYear}`,
      );
    }

    const section = await this.prisma.schoolSection.create({
      data: {
        name: data.name,
        gradeLevelId: data.gradeLevelId,
        adviserName: data.adviserName,
        schoolYear: data.schoolYear,
        capacity: data.capacity,
        companyId,
      },
      include: {
        gradeLevel: true,
      },
    });

    return this.formatSectionResponse(section);
  }

  async update(id: string, data: UpdateSectionDto, companyId: number) {
    // Handle null companyId
    if (!companyId) {
      throw new BadRequestException('Company context not found');
    }
    
    const section = await this.prisma.schoolSection.findFirst({
      where: { id, companyId, isDeleted: false },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    // If updating grade level, validate it exists
    if (data.gradeLevelId) {
      const gradeLevel = await this.prisma.gradeLevel.findFirst({
        where: {
          id: data.gradeLevelId,
          companyId,
          isActive: true,
        },
      });

      if (!gradeLevel) {
        throw new NotFoundException('Grade level not found or inactive');
      }
    }

    // Check for duplicate name if updating
    if (data.name || data.gradeLevelId || data.schoolYear) {
      const checkData = {
        name: data.name || section.name,
        gradeLevelId: data.gradeLevelId || section.gradeLevelId,
        schoolYear: data.schoolYear || section.schoolYear,
      };

      const existingSection = await this.prisma.schoolSection.findFirst({
        where: {
          ...checkData,
          companyId,
          isDeleted: false,
          id: { not: id },
        },
      });

      if (existingSection) {
        throw new BadRequestException(
          'A section with this name already exists for the specified grade level and school year',
        );
      }
    }

    const updatedSection = await this.prisma.schoolSection.update({
      where: { id },
      data,
      include: {
        gradeLevel: true,
      },
    });

    return this.formatSectionResponse(updatedSection);
  }

  async findOne(id: string, companyId: number) {
    // Handle null companyId
    if (!companyId) {
      throw new NotFoundException('Company context not found');
    }
    
    const section = await this.prisma.schoolSection.findFirst({
      where: { id, companyId, isDeleted: false },
      include: {
        gradeLevel: true,
      },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    return this.formatSectionResponse(section);
  }

  async list(companyId: number) {
    // Handle null companyId
    if (!companyId) {
      return [];
    }
    
    const sections = await this.prisma.schoolSection.findMany({
      where: { companyId, isDeleted: false },
      include: {
        gradeLevel: true,
      },
      orderBy: [
        { gradeLevel: { sequence: 'asc' } },
        { name: 'asc' },
      ],
    });

    return sections.map((section) => this.formatSectionResponse(section));
  }

  async delete(id: string, companyId: number) {
    // Handle null companyId
    if (!companyId) {
      throw new BadRequestException('Company context not found');
    }
    
    const section = await this.prisma.schoolSection.findFirst({
      where: { id, companyId, isDeleted: false },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    // TODO: Check for enrolled students once Student model is properly linked

    await this.prisma.schoolSection.update({
      where: { id },
      data: { isDeleted: true },
    });

    return { message: 'Section deleted successfully' };
  }

  async table(body: TableBodyDTO, query: TableQueryDTO, companyId: number) {
    this.tableHandler.initialize(query, body, 'section');
    const tableQuery = this.tableHandler.constructTableQuery();

    tableQuery['include'] = {
      gradeLevel: true,
      // _count: {
      //   select: { students: true },
      // },
    };

    const searchConditions: any = {
      companyId,
      isDeleted: false,
    };

    // Add search filters from body
    if (body.searchKeyword) {
      searchConditions.OR = [
        { name: { contains: body.searchKeyword, mode: 'insensitive' } },
        { adviserName: { contains: body.searchKeyword, mode: 'insensitive' } },
        { schoolYear: { contains: body.searchKeyword, mode: 'insensitive' } },
        {
          gradeLevel: {
            name: { contains: body.searchKeyword, mode: 'insensitive' },
          },
        },
      ];
    }

    // Cast body to any to access custom properties
    const customBody = body as any;
    
    if (customBody.gradeLevelId) {
      searchConditions.gradeLevelId = customBody.gradeLevelId;
    }

    if (customBody.schoolYear) {
      searchConditions.schoolYear = customBody.schoolYear;
    }

    if (customBody.isActive !== undefined) {
      searchConditions.isActive = customBody.isActive;
    }

    tableQuery['where'] = {
      ...searchConditions,
      ...tableQuery.where,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandler.getTableData(
      this.prisma.schoolSection,
      query,
      tableQuery,
    );

    const list = baseList.map((section) => this.formatSectionResponse(section));

    return { list, pagination, currentPage };
  }

  private formatSectionResponse(section: any) {
    return {
      id: section.id,
      name: section.name,
      gradeLevelId: section.gradeLevelId,
      gradeLevel: section.gradeLevel
        ? {
            id: section.gradeLevel.id,
            code: section.gradeLevel.code,
            name: section.gradeLevel.name,
            educationLevel: section.gradeLevel.educationLevel,
            sequence: section.gradeLevel.sequence,
          }
        : undefined,
      adviserName: section.adviserName,
      schoolYear: section.schoolYear,
      capacity: section.capacity,
      studentCount: section._count?.students || 0,
      students: [],
      isActive: section.isActive,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    };
  }
}
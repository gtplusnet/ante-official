import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GradeLevel, EducationLevel } from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { UtilityService } from '@common/utility.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import {
  GradeLevelCreateDTO,
  GradeLevelUpdateDTO,
} from './grade-level.interface';
import { GradeLevelResponse } from '@shared/response/grade-level.response';

@Injectable()
export class GradeLevelService {
  @Inject() private prisma: PrismaService;
  @Inject() private tableHandler: TableHandlerService;
  @Inject() private utility: UtilityService;

  async seedDefaultGradeLevels() {
    // Check if company already has grade levels
    const existingGradeLevels = await this.prisma.gradeLevel.findFirst({
      where: { companyId: this.utility.companyId },
    });

    if (existingGradeLevels) {
      throw new BadRequestException(
        'Grade levels already exist for this company. Please delete existing grade levels first.',
      );
    }

    // Copy all default grade levels (companyId: null) to the company
    const defaultGradeLevels = await this.prisma.gradeLevel.findMany({
      where: { companyId: null },
      orderBy: { sequence: 'asc' },
    });

    if (defaultGradeLevels.length === 0) {
      // Create default grade levels in the system if they don't exist
      await this.createSystemDefaultGradeLevels();

      // Fetch them again
      const newDefaultGradeLevels = await this.prisma.gradeLevel.findMany({
        where: { companyId: null },
        orderBy: { sequence: 'asc' },
      });

      // Copy to company
      for (const defaultGradeLevel of newDefaultGradeLevels) {
        const {
          id: _id,
          companyId: _companyId,
          ...gradeLevelData
        } = defaultGradeLevel;
        await this.prisma.gradeLevel.create({
          data: {
            ...gradeLevelData,
            companyId: this.utility.companyId,
          },
        });
      }
    } else {
      // Copy existing default grade levels to company
      for (const defaultGradeLevel of defaultGradeLevels) {
        const {
          id: _id,
          companyId: _companyId,
          ...gradeLevelData
        } = defaultGradeLevel;
        await this.prisma.gradeLevel.create({
          data: {
            ...gradeLevelData,
            companyId: this.utility.companyId,
          },
        });
      }
    }

    return { message: 'Default grade levels populated successfully' };
  }

  private async createSystemDefaultGradeLevels() {
    const defaultGradeLevels = [
      // Nursery
      {
        code: 'N1',
        name: 'Nursery 1',
        educationLevel: EducationLevel.NURSERY,
        sequence: 1,
        ageRangeMin: 3,
        ageRangeMax: 4,
      },
      {
        code: 'N2',
        name: 'Nursery 2',
        educationLevel: EducationLevel.NURSERY,
        sequence: 2,
        ageRangeMin: 4,
        ageRangeMax: 5,
      },

      // Kindergarten
      {
        code: 'K1',
        name: 'Kindergarten 1',
        educationLevel: EducationLevel.KINDERGARTEN,
        sequence: 3,
        ageRangeMin: 5,
        ageRangeMax: 6,
      },
      {
        code: 'K2',
        name: 'Kindergarten 2',
        educationLevel: EducationLevel.KINDERGARTEN,
        sequence: 4,
        ageRangeMin: 6,
        ageRangeMax: 7,
      },

      // Elementary
      {
        code: 'G1',
        name: 'Grade 1',
        educationLevel: EducationLevel.ELEMENTARY,
        sequence: 5,
        ageRangeMin: 7,
        ageRangeMax: 8,
      },
      {
        code: 'G2',
        name: 'Grade 2',
        educationLevel: EducationLevel.ELEMENTARY,
        sequence: 6,
        ageRangeMin: 8,
        ageRangeMax: 9,
      },
      {
        code: 'G3',
        name: 'Grade 3',
        educationLevel: EducationLevel.ELEMENTARY,
        sequence: 7,
        ageRangeMin: 9,
        ageRangeMax: 10,
      },
      {
        code: 'G4',
        name: 'Grade 4',
        educationLevel: EducationLevel.ELEMENTARY,
        sequence: 8,
        ageRangeMin: 10,
        ageRangeMax: 11,
      },
      {
        code: 'G5',
        name: 'Grade 5',
        educationLevel: EducationLevel.ELEMENTARY,
        sequence: 9,
        ageRangeMin: 11,
        ageRangeMax: 12,
      },
      {
        code: 'G6',
        name: 'Grade 6',
        educationLevel: EducationLevel.ELEMENTARY,
        sequence: 10,
        ageRangeMin: 12,
        ageRangeMax: 13,
      },

      // Junior High School
      {
        code: 'G7',
        name: 'Grade 7',
        educationLevel: EducationLevel.JUNIOR_HIGH,
        sequence: 11,
        ageRangeMin: 13,
        ageRangeMax: 14,
      },
      {
        code: 'G8',
        name: 'Grade 8',
        educationLevel: EducationLevel.JUNIOR_HIGH,
        sequence: 12,
        ageRangeMin: 14,
        ageRangeMax: 15,
      },
      {
        code: 'G9',
        name: 'Grade 9',
        educationLevel: EducationLevel.JUNIOR_HIGH,
        sequence: 13,
        ageRangeMin: 15,
        ageRangeMax: 16,
      },
      {
        code: 'G10',
        name: 'Grade 10',
        educationLevel: EducationLevel.JUNIOR_HIGH,
        sequence: 14,
        ageRangeMin: 16,
        ageRangeMax: 17,
      },

      // Senior High School
      {
        code: 'G11',
        name: 'Grade 11',
        educationLevel: EducationLevel.SENIOR_HIGH,
        sequence: 15,
        ageRangeMin: 17,
        ageRangeMax: 18,
      },
      {
        code: 'G12',
        name: 'Grade 12',
        educationLevel: EducationLevel.SENIOR_HIGH,
        sequence: 16,
        ageRangeMin: 18,
        ageRangeMax: 19,
      },

      // College
      {
        code: 'Y1',
        name: 'First Year College',
        educationLevel: EducationLevel.COLLEGE,
        sequence: 17,
        ageRangeMin: 18,
        ageRangeMax: 22,
      },
      {
        code: 'Y2',
        name: 'Second Year College',
        educationLevel: EducationLevel.COLLEGE,
        sequence: 18,
        ageRangeMin: 19,
        ageRangeMax: 23,
      },
      {
        code: 'Y3',
        name: 'Third Year College',
        educationLevel: EducationLevel.COLLEGE,
        sequence: 19,
        ageRangeMin: 20,
        ageRangeMax: 24,
      },
      {
        code: 'Y4',
        name: 'Fourth Year College',
        educationLevel: EducationLevel.COLLEGE,
        sequence: 20,
        ageRangeMin: 21,
        ageRangeMax: 25,
      },
      {
        code: 'Y5',
        name: 'Fifth Year College',
        educationLevel: EducationLevel.COLLEGE,
        sequence: 21,
        ageRangeMin: 22,
        ageRangeMax: 26,
      },
    ];

    await this.prisma.gradeLevel.createMany({
      data: defaultGradeLevels.map((level) => ({
        ...level,
        companyId: null, // System default
      })),
    });
  }

  async getInfo(id: number): Promise<GradeLevelResponse> {
    const gradeLevel = await this.prisma.gradeLevel.findFirst({
      where: {
        id,
        companyId: this.utility.companyId,
        isDeleted: false,
      },
    });

    if (!gradeLevel) {
      throw new NotFoundException('Grade level not found');
    }

    return this.formatData(gradeLevel);
  }

  async table(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandler.initialize(query, body, 'gradeLevel');
    const tableQuery = this.tableHandler.constructTableQuery();

    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: this.utility.companyId,
      isDeleted: false,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandler.getTableData<GradeLevel>(
      this.prisma.gradeLevel,
      query,
      tableQuery,
    );

    const list = baseList.map((gradeLevel) => this.formatData(gradeLevel));

    return { list, pagination, currentPage };
  }

  async create(dto: GradeLevelCreateDTO): Promise<GradeLevelResponse> {
    // Check if code already exists for this company
    const existingGradeLevel = await this.prisma.gradeLevel.findFirst({
      where: {
        code: dto.code,
        companyId: this.utility.companyId,
        isDeleted: false,
      },
    });

    if (existingGradeLevel) {
      throw new BadRequestException(
        `Grade level with code ${dto.code} already exists`,
      );
    }

    const gradeLevel = await this.prisma.gradeLevel.create({
      data: {
        ...dto,
        companyId: this.utility.companyId,
      },
    });

    return this.formatData(gradeLevel);
  }

  async update(dto: GradeLevelUpdateDTO): Promise<GradeLevelResponse> {
    const existingGradeLevel = await this.prisma.gradeLevel.findFirst({
      where: {
        id: dto.id,
        companyId: this.utility.companyId,
        isDeleted: false,
      },
    });

    if (!existingGradeLevel) {
      throw new NotFoundException('Grade level not found');
    }

    // Check if code is being changed and if new code already exists
    if (dto.code !== existingGradeLevel.code) {
      const duplicateCode = await this.prisma.gradeLevel.findFirst({
        where: {
          code: dto.code,
          companyId: this.utility.companyId,
          isDeleted: false,
          id: { not: dto.id },
        },
      });

      if (duplicateCode) {
        throw new BadRequestException(
          `Grade level with code ${dto.code} already exists`,
        );
      }
    }

    const { id: _id, ...updateData } = dto;
    const gradeLevel = await this.prisma.gradeLevel.update({
      where: { id: dto.id },
      data: updateData,
    });

    return this.formatData(gradeLevel);
  }

  async delete(id: number): Promise<{ message: string }> {
    const gradeLevel = await this.prisma.gradeLevel.findFirst({
      where: {
        id,
        companyId: this.utility.companyId,
        isDeleted: false,
      },
    });

    if (!gradeLevel) {
      throw new NotFoundException('Grade level not found');
    }

    await this.prisma.gradeLevel.update({
      where: { id },
      data: { isDeleted: true },
    });

    return { message: 'Grade level deleted successfully' };
  }

  async getList(): Promise<GradeLevelResponse[]> {
    const gradeLevels = await this.prisma.gradeLevel.findMany({
      where: {
        companyId: this.utility.companyId,
        isDeleted: false,
        isActive: true,
      },
      orderBy: { sequence: 'asc' },
    });

    return gradeLevels.map((gradeLevel) => this.formatData(gradeLevel));
  }

  private formatData(gradeLevel: GradeLevel): GradeLevelResponse {
    return {
      id: gradeLevel.id,
      code: gradeLevel.code,
      name: gradeLevel.name,
      educationLevel: gradeLevel.educationLevel,
      sequence: gradeLevel.sequence,
      ageRangeMin: gradeLevel.ageRangeMin,
      ageRangeMax: gradeLevel.ageRangeMax,
      description: gradeLevel.description,
      companyId: gradeLevel.companyId,
      isActive: gradeLevel.isActive,
      createdAt: this.utility.formatDate(gradeLevel.createdAt).dateTime,
      updatedAt: this.utility.formatDate(gradeLevel.updatedAt).dateTime,
    };
  }
}

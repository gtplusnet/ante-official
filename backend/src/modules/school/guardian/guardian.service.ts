import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { EncryptionService } from '@common/encryption.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import {
  GuardianCreateDTO,
  GuardianUpdateDTO,
  GuardianResetPasswordDTO,
  AssignStudentDTO,
  RemoveStudentDTO,
} from './guardian.interface';
import {
  GuardianResponse,
  GuardianListResponse,
  GuardianTableResponse,
  ConnectedStudentInfo,
} from '@shared/response';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GuardianService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilityService: UtilityService,
    private readonly encryption: EncryptionService,
    private readonly tableHandler: TableHandlerService,
  ) {}

  private formatGuardianName(guardian: any): string {
    const { firstName, lastName, middleName } = guardian;
    if (middleName) {
      return `${lastName}, ${firstName} ${middleName}`;
    }
    return `${lastName}, ${firstName}`;
  }

  private formatStudentName(student: any): string {
    const { firstName, lastName, middleName } = student;
    if (middleName) {
      return `${lastName}, ${firstName} ${middleName}`;
    }
    return `${lastName}, ${firstName}`;
  }

  private generateSearchKeyword(
    firstName: string,
    lastName: string,
    middleName: string | null,
    email: string,
  ): string {
    const parts = [firstName, lastName, middleName, email].filter(Boolean);
    return parts.join(' ').toLowerCase();
  }

  private formatGuardianResponse(guardian: any): GuardianResponse {
    return {
      id: guardian.id,
      name: this.formatGuardianName(guardian),
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      middleName: guardian.middleName,
      dateOfBirth: guardian.dateOfBirth
        ? this.utilityService.formatDate(guardian.dateOfBirth).dateTime
        : null,
      email: guardian.email,
      contactNumber: guardian.contactNumber,
      alternateNumber: guardian.alternateNumber,
      address: guardian.address,
      occupation: guardian.occupation,
      lastLogin: guardian.lastLogin
        ? this.utilityService.formatDate(guardian.lastLogin).dateTime
        : null,
      isActive: guardian.isActive,
      studentCount: guardian.students?.length || 0,
      students:
        guardian.students?.map((sg: any) => this.formatConnectedStudent(sg)) ||
        [],
      createdAt: this.utilityService.formatDate(guardian.createdAt).dateTime,
      updatedAt: this.utilityService.formatDate(guardian.updatedAt).dateTime,
    };
  }

  private formatConnectedStudent(studentGuardian: any): ConnectedStudentInfo {
    const student = studentGuardian.student;
    return {
      id: student.id,
      studentNumber: student.studentNumber,
      name: this.formatStudentName(student),
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName,
      relationship: studentGuardian.relationship,
      isPrimary: studentGuardian.isPrimary,
    };
  }

  async create(
    data: GuardianCreateDTO,
    companyId: number,
  ): Promise<GuardianResponse> {
    // Check if email already exists in the entire system
    const existingGuardian = await this.prisma.guardian.findFirst({
      where: {
        email: data.email,
        isDeleted: false,
      },
    });

    if (existingGuardian) {
      throw new BadRequestException('Email already exists in the system');
    }

    // Hash password using bcrypt (compatible with Guardian Public API)
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Generate encryption key (required by schema, though we're using bcrypt)
    // This maintains backward compatibility with the legacy encryption system
    const key = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');

    const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;

    // Create guardian
    const guardian = await this.prisma.guardian.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        dateOfBirth: dateOfBirth,
        email: data.email,
        password: hashedPassword,
        key: key,
        contactNumber: data.contactNumber,
        alternateNumber: data.alternateNumber,
        address: data.address,
        occupation: data.occupation,
        searchKeyword: this.generateSearchKeyword(
          data.firstName,
          data.lastName,
          data.middleName || null,
          data.email,
        ),
        companyId,
      },
      include: {
        students: {
          include: {
            student: true,
          },
        },
      },
    });

    return this.formatGuardianResponse(guardian);
  }

  async findAll(companyId: number): Promise<GuardianListResponse[]> {
    const guardians = await this.prisma.guardian.findMany({
      where: {
        companyId,
        isDeleted: false,
      },
      orderBy: {
        lastName: 'asc',
      },
    });

    return guardians.map((guardian) => ({
      id: guardian.id,
      name: this.formatGuardianName(guardian),
      email: guardian.email,
    }));
  }

  async findOne(id: string, companyId: number): Promise<GuardianResponse> {
    const guardian = await this.prisma.guardian.findFirst({
      where: {
        id,
        companyId,
        isDeleted: false,
      },
      include: {
        students: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    return this.formatGuardianResponse(guardian);
  }

  async update(
    id: string,
    data: GuardianUpdateDTO,
    companyId: number,
  ): Promise<GuardianResponse> {
    const guardian = await this.prisma.guardian.findFirst({
      where: {
        id,
        companyId,
        isDeleted: false,
      },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    // Check if email is changing and if new email already exists
    if (data.email !== guardian.email) {
      const emailExists = await this.prisma.guardian.findFirst({
        where: {
          email: data.email,
          isDeleted: false,
          NOT: { id },
        },
      });

      if (emailExists) {
        throw new BadRequestException('Email already exists in the system');
      }
    }

    const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;

    const updatedGuardian = await this.prisma.guardian.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        dateOfBirth: dateOfBirth,
        email: data.email,
        contactNumber: data.contactNumber,
        alternateNumber: data.alternateNumber,
        address: data.address,
        occupation: data.occupation,
        isActive: data.isActive,
        searchKeyword: this.generateSearchKeyword(
          data.firstName,
          data.lastName,
          data.middleName || null,
          data.email,
        ),
      },
      include: {
        students: {
          include: {
            student: true,
          },
        },
      },
    });

    return this.formatGuardianResponse(updatedGuardian);
  }

  async delete(id: string, companyId: number): Promise<void> {
    const guardian = await this.prisma.guardian.findFirst({
      where: {
        id,
        companyId,
        isDeleted: false,
      },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    await this.prisma.guardian.update({
      where: { id },
      data: {
        isDeleted: true,
        isActive: false,
      },
    });
  }

  async table(
    body: TableBodyDTO,
    query: TableQueryDTO,
    companyId: number,
  ): Promise<any> {
    this.tableHandler.initialize(query, body, 'guardian');
    const tableQuery = this.tableHandler.constructTableQuery();

    tableQuery['include'] = {
      students: true,
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
      this.prisma.guardian,
      query,
      tableQuery,
    );

    const list: GuardianTableResponse[] = baseList.map((guardian: any) => ({
      id: guardian.id,
      name: this.formatGuardianName(guardian),
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      middleName: guardian.middleName,
      email: guardian.email,
      contactNumber: guardian.contactNumber,
      studentCount: guardian.students?.length || 0,
      lastLogin: guardian.lastLogin
        ? this.utilityService.formatDate(guardian.lastLogin).dateTime
        : null,
      isActive: guardian.isActive,
      createdAt: this.utilityService.formatDate(guardian.createdAt).dateTime,
    }));

    return { list, pagination, currentPage };
  }

  async resetPassword(
    data: GuardianResetPasswordDTO,
    companyId: number,
  ): Promise<void> {
    const guardian = await this.prisma.guardian.findFirst({
      where: {
        id: data.guardianId,
        companyId,
        isDeleted: false,
      },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    // Hash password using bcrypt (compatible with Guardian Public API)
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    // Generate new encryption key (required by schema, though we're using bcrypt)
    const key = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');

    await this.prisma.guardian.update({
      where: { id: data.guardianId },
      data: {
        password: hashedPassword,
        key: key,
      },
    });
  }

  async assignStudent(
    data: AssignStudentDTO,
    companyId: number,
  ): Promise<void> {
    // Verify guardian exists
    const guardian = await this.prisma.guardian.findFirst({
      where: {
        id: data.guardianId,
        companyId,
        isDeleted: false,
      },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    // Verify student exists
    const student = await this.prisma.student.findFirst({
      where: {
        id: data.studentId,
        companyId,
        isDeleted: false,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check if relationship already exists
    const existingRelation = await this.prisma.studentGuardian.findUnique({
      where: {
        studentId_guardianId: {
          studentId: data.studentId,
          guardianId: data.guardianId,
        },
      },
    });

    if (existingRelation) {
      throw new BadRequestException(
        'Student is already assigned to this guardian',
      );
    }

    // If setting as primary, remove primary flag from other guardians
    if (data.isPrimary) {
      await this.prisma.studentGuardian.updateMany({
        where: {
          studentId: data.studentId,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // Create the relationship
    await this.prisma.studentGuardian.create({
      data: {
        studentId: data.studentId,
        guardianId: data.guardianId,
        relationship: data.relationship,
        isPrimary: data.isPrimary || false,
      },
    });
  }

  async removeStudent(
    data: RemoveStudentDTO,
    companyId: number,
  ): Promise<void> {
    // Verify guardian exists
    const guardian = await this.prisma.guardian.findFirst({
      where: {
        id: data.guardianId,
        companyId,
        isDeleted: false,
      },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    // Delete the relationship
    await this.prisma.studentGuardian.deleteMany({
      where: {
        studentId: data.studentId,
        guardianId: data.guardianId,
      },
    });
  }

  async getStudentGuardians(
    studentId: string,
    companyId: number,
  ): Promise<any[]> {
    const guardians = await this.prisma.studentGuardian.findMany({
      where: {
        studentId,
        guardian: {
          companyId,
          isDeleted: false,
        },
      },
      include: {
        guardian: true,
      },
    });

    return guardians.map((sg) => ({
      id: sg.guardian.id,
      name: this.formatGuardianName(sg.guardian),
      email: sg.guardian.email,
      contactNumber: sg.guardian.contactNumber,
      relationship: sg.relationship,
      isPrimary: sg.isPrimary,
    }));
  }
}

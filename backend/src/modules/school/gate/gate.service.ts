import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { CreateGateDto, UpdateGateDto, DeleteGateDto } from './gate.validator';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { UtilityService } from '@common/utility.service';
import { AttendanceService } from '../attendance/attendance.service';

@Injectable()
export class GateService {
  @Inject() private prisma: PrismaService;
  @Inject() private tableHandler: TableHandlerService;
  @Inject() private utility: UtilityService;
  @Inject(forwardRef(() => AttendanceService))
  private attendanceService: AttendanceService;

  async createGate(data: CreateGateDto, companyId: number) {
    const gate = await this.prisma.gate.create({
      data: {
        gateName: data.gateName,
        companyId,
      },
    });

    return gate;
  }

  async updateGate(data: UpdateGateDto, companyId: number) {
    const gate = await this.prisma.gate.update({
      where: {
        id: data.id,
        companyId,
        deletedAt: null,
      },
      data: {
        gateName: data.gateName,
      },
    });

    return gate;
  }

  async deleteGates(data: DeleteGateDto, companyId: number) {
    await this.prisma.gate.updateMany({
      where: {
        id: { in: data.ids },
        companyId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return { success: true, message: 'Gates deleted successfully' };
  }

  async table(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandler.initialize(query, body, 'gate');
    const tableQuery = this.tableHandler.constructTableQuery();

    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: this.utility.companyId,
      deletedAt: null,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandler.getTableData(
      this.prisma.gate,
      query,
      tableQuery,
    );

    const list = baseList.map((gate) => this.formatData(gate));

    return { list, pagination, currentPage };
  }

  async getGates(companyId: number) {
    const gates = await this.prisma.gate.findMany({
      where: {
        companyId,
        deletedAt: null,
      },
      orderBy: {
        gateName: 'asc',
      },
      select: {
        id: true,
        gateName: true,
      },
    });

    return gates;
  }

  private formatData(gate: any) {
    return {
      id: gate.id,
      gateName: gate.gateName,
      createdAt: gate.createdAt,
      updatedAt: gate.updatedAt,
    };
  }

  // Additional methods for public API
  async getGateStatus(gateId: string) {
    // Get today's attendance statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkInsToday = await this.prisma.schoolAttendance.count({
      where: {
        deviceId: gateId,
        action: 'check_in',
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const checkOutsToday = await this.prisma.schoolAttendance.count({
      where: {
        deviceId: gateId,
        action: 'check_out',
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get unique people who checked in but haven't checked out
    const checkedIn = await this.prisma.schoolAttendance.findMany({
      where: {
        deviceId: gateId,
        action: 'check_in',
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        personId: true,
      },
    });

    const checkedOut = await this.prisma.schoolAttendance.findMany({
      where: {
        deviceId: gateId,
        action: 'check_out',
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        personId: true,
      },
    });

    const checkedInIds = new Set(checkedIn.map(r => r.personId));
    const checkedOutIds = new Set(checkedOut.map(r => r.personId));
    const currentlyPresent = [...checkedInIds].filter(id => !checkedOutIds.has(id)).length;

    return {
      checkInsToday,
      checkOutsToday,
      currentlyPresent,
    };
  }

  async getStudentsForGate(params: {
    companyId: number;
    search?: string;
    gradeLevel?: string;
    section?: string;
    limit: number;
    offset: number;
  }) {
    const where: any = {
      companyId: params.companyId,
      isDeleted: false,
    };

    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { studentNumber: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.gradeLevel) {
      where.section = {
        gradeLevelId: params.gradeLevel,
      };
    }

    if (params.section) {
      where.sectionId = params.section;
    }

    const students = await this.prisma.student.findMany({
      where,
      take: params.limit,
      skip: params.offset,
      include: {
        section: {
          include: {
            gradeLevel: true,
          },
        },
        profilePhoto: true,
      },
    });

    return students.map(student => ({
      id: student.id, // UUID for QR code generation
      studentNumber: student.studentNumber, // Actual student number
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      lrn: student.lrn,
      isActive: student.isActive,
      section: student.section ? {
        id: student.section.id,
        name: student.section.name,
        gradeLevelId: student.section.gradeLevelId,
        gradeLevel: student.section.gradeLevel ? {
          id: student.section.gradeLevel.id,
          code: student.section.gradeLevel.code,
          name: student.section.gradeLevel.name,
          educationLevel: student.section.gradeLevel.educationLevel,
        } : null,
        adviserName: student.section.adviserName,
        schoolYear: student.section.schoolYear,
        capacity: student.section.capacity,
      } : null,
      profilePhotoUrl: student.profilePhoto?.url || null,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    }));
  }

  async getGuardiansForGate(params: {
    companyId: number;
    search?: string;
    limit: number;
    offset: number;
  }) {
    const where: any = {
      companyId: params.companyId,
      isDeleted: false,
    };

    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const guardians = await this.prisma.guardian.findMany({
      where,
      take: params.limit,
      skip: params.offset,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        contactNumber: true,
      },
    });

    return guardians.map(guardian => ({
      id: guardian.id,
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      email: guardian.email,
      contactNumber: guardian.contactNumber,
    }));
  }

  async getAttendanceByDate(params: {
    companyId: number;
    date: string;
    limit: number;
  }) {
    const dateFilter = new Date(params.date);
    const startOfDay = new Date(dateFilter);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateFilter);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await this.prisma.schoolAttendance.findMany({
      where: {
        companyId: params.companyId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      take: params.limit,
      orderBy: {
        timestamp: 'desc',
      },
    });

    return attendance.map(record => ({
      id: record.id,
      qrCode: record.qrCode,
      personId: record.personId,
      personName: record.personName,
      personType: record.personType,
      action: record.action,
      timestamp: record.timestamp.toISOString(),
      deviceId: record.deviceId,
      profilePhoto: record.profilePhoto,
    }));
  }

  async processScan(params: {
    qrCode: string;
    gateId: string;
    timestamp: string;
    photo?: string;
    temperature?: number;
    companyId: number;
  }) {
    // Parse QR code format: "student:uuid" or "guardian:uuid"
    const [type, personId] = params.qrCode.split(':');

    if (!type || !personId) {
      throw new Error('Invalid QR code format. Expected format: student:id or guardian:id');
    }

    // Find person by QR code type and ID
    let student = null;
    let guardian = null;

    if (type === 'student') {
      student = await this.prisma.student.findFirst({
        where: {
          id: personId,
          companyId: params.companyId,
          isDeleted: false,
        },
      });
    } else if (type === 'guardian') {
      guardian = await this.prisma.guardian.findFirst({
        where: {
          id: personId,
          companyId: params.companyId,
          isDeleted: false,
        },
      });
    } else {
      throw new Error(`Invalid QR code type: ${type}. Expected 'student' or 'guardian'`);
    }

    if (!student && !guardian) {
      throw new Error('Invalid QR code - person not found');
    }

    const person = student || guardian;
    const personType = student ? 'student' : 'guardian';

    // Check last action for this person today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastAction = await this.prisma.schoolAttendance.findFirst({
      where: {
        personId: person.id,
        companyId: params.companyId,
        timestamp: {
          gte: today,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Determine action (auto check-in/check-out)
    const action = (!lastAction || lastAction.action === 'check_out')
      ? 'check_in'
      : 'check_out';

    // For students, use AttendanceService (includes push notifications + WebSocket)
    if (student) {
      const result = action === 'check_in'
        ? await this.attendanceService.recordCheckIn({
            studentId: student.studentNumber,
            gateId: params.gateId,
            timestamp: params.timestamp,
            photo: params.photo,
            temperature: params.temperature,
            companyId: params.companyId,
          })
        : await this.attendanceService.recordCheckOut({
            studentId: student.studentNumber,
            gateId: params.gateId,
            timestamp: params.timestamp,
            photo: params.photo,
            companyId: params.companyId,
          });

      // Return in expected format
      return {
        id: result.attendanceId,
        qrCode: params.qrCode,
        personId: student.id,
        personName: result.studentName,
        personType: 'student' as const,
        action,
        timestamp: params.timestamp,
        deviceId: params.gateId,
        profilePhoto: params.photo,
      };
    }

    // For guardians, create attendance record directly (no notifications needed)
    const personName = `${person.firstName} ${person.lastName}`;
    const attendance = await this.prisma.schoolAttendance.create({
      data: {
        qrCode: params.qrCode,
        personId: person.id,
        personType,
        personName,
        action,
        timestamp: new Date(params.timestamp),
        deviceId: params.gateId,
        companyId: params.companyId,
        profilePhoto: params.photo,
      },
    });

    return {
      id: attendance.id,
      qrCode: attendance.qrCode,
      personId: attendance.personId,
      personName: attendance.personName,
      personType: attendance.personType,
      action: attendance.action,
      timestamp: attendance.timestamp.toISOString(),
      deviceId: attendance.deviceId,
      profilePhoto: attendance.profilePhoto,
    };
  }
}

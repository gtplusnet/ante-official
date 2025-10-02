import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { CreateGateDto, UpdateGateDto, DeleteGateDto } from './gate.validator';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { UtilityService } from '@common/utility.service';

@Injectable()
export class GateService {
  @Inject() private prisma: PrismaService;
  @Inject() private tableHandler: TableHandlerService;
  @Inject() private utility: UtilityService;

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
        { studentId: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.gradeLevel) {
      where.gradeLevel = params.gradeLevel;
    }

    if (params.section) {
      where.section = params.section;
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
      studentId: student.studentNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      gradeLevel: student.section?.gradeLevel?.name || '',
      section: student.section?.name || '',
      photo: student.profilePhoto?.url || null,
    }));
  }
}

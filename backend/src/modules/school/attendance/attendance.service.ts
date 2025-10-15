import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import {
  AttendanceTableDto,
  AttendanceExportDto,
} from './attendance.validator';
import { IAttendanceTableRow } from './attendance.interface';
import { format } from 'date-fns';
import { SocketGateway } from '@modules/communication/socket/socket/socket.gateway';

@Injectable()
export class AttendanceService {
  @Inject() private prisma: PrismaService;
  @Inject() private utilityService: UtilityService;
  @Inject() private tableHandler: TableHandlerService;
  @Inject(forwardRef(() => SocketGateway))
  private socketGateway: SocketGateway;

  async getAttendanceTable(query: any, body: AttendanceTableDto) {
    this.tableHandler.initialize(query, body, 'attendance');
    const tableQuery = this.tableHandler.constructTableQuery();

    // Apply date filter from query params (defaults to today if not provided)
    let dateFilter = new Date();
    if (query.date) {
      dateFilter = new Date(query.date);
    }

    // Set date range for the entire day
    const startOfDay = new Date(dateFilter);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateFilter);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      ...tableQuery['where'],
      companyId: this.utilityService.companyId,
      timestamp: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    // Apply other filters
    if (body.filters && body.filters.length > 0) {
      body.filters.forEach((filter: any) => {
        if (filter.personType) {
          where.personType = filter.personType;
        }
        if (filter.action) {
          where.action = filter.action;
        }
        if (filter.deviceId) {
          where.deviceId = filter.deviceId;
        }
      });
    }

    tableQuery['where'] = where;

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandler.getTableData(
      this.prisma.schoolAttendance,
      query,
      tableQuery,
    );

    // Format data for table display
    const list: IAttendanceTableRow[] = baseList.map((record: any) => ({
      id: record.id,
      personName: record.personName,
      personType: record.personType as 'student' | 'guardian',
      action: record.action as 'check_in' | 'check_out',
      timestamp: record.timestamp.toISOString(),
      deviceId: record.deviceId || undefined,
      location: record.location || undefined,
      formattedTime: format(record.timestamp, 'hh:mm a'),
      formattedDate: format(record.timestamp, 'MMM dd, yyyy'),
    }));

    return { list, pagination, currentPage };
  }

  async getDeviceList() {
    // Get unique devices that have recorded attendance
    const devices = await this.prisma.schoolAttendance.findMany({
      where: {
        companyId: this.utilityService.companyId,
        deviceId: {
          not: null,
        },
      },
      select: {
        deviceId: true,
      },
      distinct: ['deviceId'],
    });

    return devices
      .filter((d) => d.deviceId)
      .map((d) => ({
        id: d.deviceId,
        label: d.deviceId,
        value: d.deviceId,
      }));
  }

  async exportAttendance(dto: AttendanceExportDto) {
    const where: any = {
      companyId: this.utilityService.companyId,
    };

    // Apply date filter
    if (dto.date) {
      const dateFilter = new Date(dto.date);
      const startOfDay = new Date(dateFilter);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateFilter);
      endOfDay.setHours(23, 59, 59, 999);

      where.timestamp = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Apply other filters
    if (dto.personType) {
      where.personType = dto.personType;
    }
    if (dto.action) {
      where.action = dto.action;
    }
    if (dto.deviceId) {
      where.deviceId = dto.deviceId;
    }

    // Get all matching records
    const records = await this.prisma.schoolAttendance.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Format for export
    const exportData = records.map((record) => ({
      'Person Name': record.personName,
      'Person Type': record.personType,
      Action: record.action,
      Date: format(record.timestamp, 'yyyy-MM-dd'),
      Time: format(record.timestamp, 'HH:mm:ss'),
      Device: record.deviceId || 'N/A',
      Location: record.location || 'N/A',
      'Synced At': record.syncedAt
        ? format(record.syncedAt, 'yyyy-MM-dd HH:mm:ss')
        : 'N/A',
    }));

    return exportData;
  }

  async getAttendanceSummary(date?: string) {
    const dateFilter = date ? new Date(date) : new Date();
    const startOfDay = new Date(dateFilter);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateFilter);
    endOfDay.setHours(23, 59, 59, 999);

    const where = {
      companyId: this.utilityService.companyId,
      timestamp: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    const [totalCheckIns, totalCheckOuts, studentCheckIns, guardianCheckIns] =
      await Promise.all([
        this.prisma.schoolAttendance.count({
          where: { ...where, action: 'check_in' },
        }),
        this.prisma.schoolAttendance.count({
          where: { ...where, action: 'check_out' },
        }),
        this.prisma.schoolAttendance.count({
          where: { ...where, action: 'check_in', personType: 'student' },
        }),
        this.prisma.schoolAttendance.count({
          where: { ...where, action: 'check_in', personType: 'guardian' },
        }),
      ]);

    return {
      date: format(dateFilter, 'yyyy-MM-dd'),
      totalCheckIns,
      totalCheckOuts,
      studentCheckIns,
      guardianCheckIns,
      totalRecords: totalCheckIns + totalCheckOuts,
    };
  }

  async getPeopleWithoutCheckout(date?: string) {
    const dateFilter = date ? new Date(date) : new Date();
    const startOfDay = new Date(dateFilter);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateFilter);
    endOfDay.setHours(23, 59, 59, 999);

    // Get ALL attendance records for the date (both check-in and check-out)
    const allRecords = await this.prisma.schoolAttendance.findMany({
      where: {
        companyId: this.utilityService.companyId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        timestamp: 'desc', // Latest first
      },
    });

    // Group by personId and find the last action for each person
    const personLastActions = new Map();
    allRecords.forEach((record) => {
      if (!personLastActions.has(record.personId)) {
        // First occurrence is the latest due to desc order
        personLastActions.set(record.personId, record);
      }
    });

    // Filter to people whose last action was check_in
    const peopleWithoutCheckout = Array.from(personLastActions.values())
      .filter((record) => record.action === 'check_in')
      .map((record) => ({
        id: record.id,
        personId: record.personId,
        personName: record.personName,
        personType: record.personType,
        checkInTime: format(record.timestamp, 'hh:mm a'),
        checkInDateTime: record.timestamp.toISOString(),
        deviceId: record.deviceId || 'N/A',
        location: record.location || 'N/A',
      }));

    return {
      date: format(dateFilter, 'yyyy-MM-dd'),
      count: peopleWithoutCheckout.length,
      people: peopleWithoutCheckout,
    };
  }

  // Additional methods for public API
  async recordCheckIn(data: {
    studentId: string;
    gateId?: string;
    timestamp: string;
    photo?: string;
    temperature?: number;
    companyId: number;
  }) {
    const student = await this.prisma.student.findFirst({
      where: {
        studentNumber: data.studentId,
        companyId: data.companyId,
        isDeleted: false,
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Create attendance record in SchoolAttendance table
    const attendance = await this.prisma.schoolAttendance.create({
      data: {
        qrCode: data.studentId,
        personId: student.id,
        personType: 'student',
        personName: `${student.firstName} ${student.lastName}`,
        action: 'check_in',
        timestamp: new Date(data.timestamp),
        deviceId: data.gateId,
        companyId: data.companyId,
        profilePhoto: data.photo,
      },
    });

    // Emit WebSocket event for real-time updates
    if (this.socketGateway && this.socketGateway.server) {
      this.socketGateway.emitAttendanceRecorded(data.companyId, {
        id: attendance.id,
        qrCode: attendance.qrCode,
        personId: attendance.personId,
        personName: attendance.personName,
        personType: attendance.personType,
        action: attendance.action,
        timestamp: attendance.timestamp.toISOString(),
        deviceId: attendance.deviceId,
        profilePhoto: attendance.profilePhoto,
        companyId: attendance.companyId,
      });

      // Also emit updated stats
      const stats = await this.getAttendanceSummary();
      this.socketGateway.emitStatsUpdate(data.companyId, stats);
    }

    return {
      attendanceId: attendance.id,
      studentId: data.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      checkInTime: attendance.timestamp,
      gate: data.gateId,
    };
  }

  async recordCheckOut(data: {
    studentId: string;
    gateId?: string;
    timestamp: string;
    photo?: string;
    companyId: number;
  }) {
    const student = await this.prisma.student.findFirst({
      where: {
        studentNumber: data.studentId,
        companyId: data.companyId,
        isDeleted: false,
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Simply create a check-out record in SchoolAttendance
    const attendance = await this.prisma.schoolAttendance.create({
      data: {
        qrCode: data.studentId,
        personId: student.id,
        personType: 'student',
        personName: `${student.firstName} ${student.lastName}`,
        action: 'check_out',
        timestamp: new Date(data.timestamp),
        deviceId: data.gateId,
        companyId: data.companyId,
        profilePhoto: data.photo,
      },
    });

    // Calculate duration if there was a check-in earlier today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkIn = await this.prisma.schoolAttendance.findFirst({
      where: {
        personId: student.id,
        action: 'check_in',
        timestamp: {
          gte: today,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    let duration: string | undefined;
    if (checkIn) {
      duration = this.calculateDuration(
        checkIn.timestamp,
        attendance.timestamp,
      );
    }

    // Emit WebSocket event for real-time updates
    if (this.socketGateway && this.socketGateway.server) {
      this.socketGateway.emitAttendanceRecorded(data.companyId, {
        id: attendance.id,
        qrCode: attendance.qrCode,
        personId: attendance.personId,
        personName: attendance.personName,
        personType: attendance.personType,
        action: attendance.action,
        timestamp: attendance.timestamp.toISOString(),
        deviceId: attendance.deviceId,
        profilePhoto: attendance.profilePhoto,
        companyId: attendance.companyId,
        duration,
      });

      // Also emit updated stats
      const stats = await this.getAttendanceSummary();
      this.socketGateway.emitStatsUpdate(data.companyId, stats);
    }

    return {
      attendanceId: attendance.id,
      studentId: data.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      checkOutTime: attendance.timestamp,
      duration,
      gate: data.gateId,
    };
  }

  async syncBatchAttendance(data: {
    records: Array<{
      studentId: string;
      type: 'check-in' | 'check-out';
      timestamp: string;
      photo?: string;
      temperature?: number;
    }>;
    gateId?: string;
    companyId: number;
  }) {
    const results = {
      processed: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const record of data.records) {
      try {
        if (record.type === 'check-in') {
          await this.recordCheckIn({
            studentId: record.studentId,
            gateId: data.gateId,
            timestamp: record.timestamp,
            photo: record.photo,
            temperature: record.temperature,
            companyId: data.companyId,
          });
        } else {
          await this.recordCheckOut({
            studentId: record.studentId,
            gateId: data.gateId,
            timestamp: record.timestamp,
            photo: record.photo,
            companyId: data.companyId,
          });
        }
        results.processed++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          studentId: record.studentId,
          error: error.message,
        });
      }
    }

    return results;
  }

  private calculateDuration(checkIn: Date, checkOut: Date): string {
    const diff = checkOut.getTime() - checkIn.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }
}

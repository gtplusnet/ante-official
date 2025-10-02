import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

interface AttendanceLogsOptions {
  limit?: number;
  offset?: number;
  days?: number;
}

@Injectable()
export class GuardianAttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentsCurrentStatus(guardianId: string) {
    // Get guardian with their students
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: guardianId },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                studentNumber: true,
                firstName: true,
                lastName: true,
                middleName: true,
                companyId: true,
              },
            },
          },
        },
        company: true,
      },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    // Get today's date range
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // Get current status for each student
    const studentStatuses = await Promise.all(
      guardian.students.map(async (sg) => {
        const student = sg.student;

        // Get all attendance records for this student today
        const todayRecords = await this.prisma.schoolAttendance.findMany({
          where: {
            personId: student.id,
            personType: 'student',
            companyId: student.companyId,
            timestamp: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
          take: 1, // Only need the last action
        });

        const lastAction = todayRecords[0];

        // Determine current status
        let currentStatus: 'in_school' | 'out_of_school' | 'no_attendance';
        if (!lastAction) {
          currentStatus = 'no_attendance';
        } else {
          currentStatus =
            lastAction.action === 'check_in' ? 'in_school' : 'out_of_school';
        }

        return {
          studentId: student.id,
          studentName: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`,
          studentNumber: student.studentNumber,
          currentStatus,
          lastAction: lastAction
            ? {
                type: lastAction.action as 'check_in' | 'check_out',
                timestamp: lastAction.timestamp.toISOString(),
                location: lastAction.location || undefined,
              }
            : undefined,
        };
      }),
    );

    return studentStatuses;
  }

  async getRecentAttendanceLogs(
    guardianId: string,
    options: AttendanceLogsOptions = {},
  ) {
    const { limit = 20, offset = 0, days = 7 } = options;

    // Get guardian with their students
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: guardianId },
      include: {
        students: {
          select: {
            student: {
              select: {
                id: true,
                companyId: true,
              },
            },
          },
        },
      },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    // Get student IDs
    const studentIds = guardian.students.map((sg) => sg.student.id);

    if (studentIds.length === 0) {
      return {
        logs: [],
        total: 0,
        hasMore: false,
      };
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = startOfDay(subDays(endDate, days));

    // Get attendance logs
    const [logs, total] = await Promise.all([
      this.prisma.schoolAttendance.findMany({
        where: {
          personId: { in: studentIds },
          personType: 'student',
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.schoolAttendance.count({
        where: {
          personId: { in: studentIds },
          personType: 'student',
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    // Format logs for response
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      studentId: log.personId,
      studentName: log.personName,
      action: log.action as 'check_in' | 'check_out',
      timestamp: log.timestamp.toISOString(),
      formattedDate: format(log.timestamp, 'EEEE, MMMM d, yyyy'),
      formattedTime: format(log.timestamp, 'hh:mm a'),
      location: log.location || undefined,
      deviceId: log.deviceId || undefined,
    }));

    return {
      logs: formattedLogs,
      total,
      hasMore: offset + limit < total,
    };
  }

  async getAttendanceLogsByDate(
    guardianId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Get guardian with their students
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: guardianId },
      include: {
        students: {
          select: {
            student: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    const studentIds = guardian.students.map((sg) => sg.student.id);

    if (studentIds.length === 0) {
      return [];
    }

    const logs = await this.prisma.schoolAttendance.findMany({
      where: {
        personId: { in: studentIds },
        personType: 'student',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return logs.map((log) => ({
      id: log.id,
      studentId: log.personId,
      studentName: log.personName,
      action: log.action as 'check_in' | 'check_out',
      timestamp: log.timestamp.toISOString(),
      location: log.location || undefined,
      deviceId: log.deviceId || undefined,
    }));
  }
}

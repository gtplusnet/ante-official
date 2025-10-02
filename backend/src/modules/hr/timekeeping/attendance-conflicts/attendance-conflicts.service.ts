import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  AttendanceConflictType,
  Prisma,
  AttendanceConflict,
  EmployeeTimekeeping,
  ShiftType,
  AttendanceConflictAction,
} from '@prisma/client';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { DateFormat } from '@shared/response';
import * as moment from 'moment';

@Injectable()
export class AttendanceConflictsService {
  constructor(
    @Inject() private readonly prisma: PrismaService,
    @Inject() private readonly utilityService: UtilityService,
    @Inject() private readonly tableHandlerService: TableHandlerService,
  ) {}

  async detectConflicts(
    accountId: string,
    date: DateFormat,
    timekeepingRecord?: EmployeeTimekeeping,
  ): Promise<AttendanceConflict[]> {
    const dateString = moment(date.raw).format('YYYY-MM-DD');
    const conflicts: AttendanceConflict[] = [];

    try {
      // Get employee data and active shift
      const employeeData = await this.prisma.employeeData.findUnique({
        where: { accountId },
        include: {
          schedule: {
            include: {
              mondayShift: true,
              tuesdayShift: true,
              wednesdayShift: true,
              thursdayShift: true,
              fridayShift: true,
              saturdayShift: true,
              sundayShift: true,
            },
          },
        },
      });

      if (!employeeData || !employeeData.isActive) {
        return conflicts;
      }

      // Get shift for the date
      const dayOfWeek = moment(date.raw).day();
      let shift = null;

      // Get the appropriate shift based on day of week (0 = Sunday, 1 = Monday, etc.)
      switch (dayOfWeek) {
        case 0: // Sunday
          shift = employeeData.schedule?.sundayShift;
          break;
        case 1: // Monday
          shift = employeeData.schedule?.mondayShift;
          break;
        case 2: // Tuesday
          shift = employeeData.schedule?.tuesdayShift;
          break;
        case 3: // Wednesday
          shift = employeeData.schedule?.wednesdayShift;
          break;
        case 4: // Thursday
          shift = employeeData.schedule?.thursdayShift;
          break;
        case 5: // Friday
          shift = employeeData.schedule?.fridayShift;
          break;
        case 6: // Saturday
          shift = employeeData.schedule?.saturdayShift;
          break;
      }

      if (!shift) {
        return conflicts; // No shift, no conflict
      }

      // Skip if REST_DAY or EXTRA_DAY
      if (
        shift.type === ShiftType.REST_DAY ||
        shift.type === ShiftType.EXTRA_DAY
      ) {
        return conflicts;
      }

      // Create shift info for storing in conflicts
      const shiftInfo = {
        shiftId: shift.id,
        shiftName: shift.shiftCode || shift.name,
        shiftType: shift.type || shift.shiftType,
        startTime: shift.startTime,
        endTime: shift.endTime,
      };

      // Check for MISSING_LOG conflict
      if (!timekeepingRecord) {
        const missingLogConflict = await this.createConflict({
          accountId,
          conflictType: AttendanceConflictType.MISSING_LOG,
          conflictDate: date.raw,
          dateString,
          description: `No timekeeping record found for scheduled shift: ${shift.shiftCode || shift.name || 'Unknown Shift'}`,
          shiftInfo,
        });

        if (missingLogConflict) {
          conflicts.push(missingLogConflict);
        }
      } else {
        // Check for NO_ATTENDANCE and MISSING_TIME_OUT conflicts
        const timekeepingLogs =
          await this.prisma.employeeTimekeepingLogs.findMany({
            where: {
              timekeepingId: timekeepingRecord.id,
              isRaw: true,
            },
            orderBy: {
              timeIn: 'asc',
            },
          });

        // Check for NO_ATTENDANCE conflict (no logs at all)
        if (timekeepingLogs.length === 0) {
          const noAttendanceConflict = await this.createConflict({
            accountId,
            employeeTimekeepingId: timekeepingRecord.id,
            conflictType: AttendanceConflictType.NO_ATTENDANCE,
            conflictDate: date.raw,
            dateString,
            description: `Employee did not clock in or out for scheduled shift: ${shift.shiftCode || shift.name || 'Unknown Shift'}`,
            shiftInfo,
          });

          if (noAttendanceConflict) {
            conflicts.push(noAttendanceConflict);
          }
        } else {
          // Check each log for missing time-out
          for (const log of timekeepingLogs) {
            if (
              log.timeIn &&
              (!log.timeOut ||
                log.timeOut === '00:00' ||
                log.timeOut === '00:00:00')
            ) {
              const missingTimeOutConflict = await this.createConflict({
                accountId,
                employeeTimekeepingId: timekeepingRecord.id,
                conflictType: AttendanceConflictType.MISSING_TIME_OUT,
                conflictDate: date.raw,
                dateString,
                description: `Employee clocked in at ${log.timeIn} but did not clock out`,
                shiftInfo,
              });

              if (missingTimeOutConflict) {
                conflicts.push(missingTimeOutConflict);
                break; // Only create one missing time-out conflict per day
              }
            }
          }
        }
      }

      return conflicts;
    } catch (error) {
      this.utilityService.error(
        `Error detecting conflicts for ${accountId} on ${dateString}: ${error.message}`,
      );
      return conflicts;
    }
  }

  async createConflict(data: {
    accountId: string;
    employeeTimekeepingId?: number;
    conflictType: AttendanceConflictType;
    conflictDate: Date;
    dateString: string;
    description: string;
    shiftInfo?: any;
  }): Promise<AttendanceConflict | null> {
    try {
      // Check if conflict already exists
      const existingConflict = await this.prisma.attendanceConflict.findUnique({
        where: {
          accountId_dateString_conflictType: {
            accountId: data.accountId,
            dateString: data.dateString,
            conflictType: data.conflictType,
          },
        },
      });

      if (existingConflict) {
        // Update description if changed
        if (
          existingConflict.description !== data.description ||
          JSON.stringify(existingConflict.shiftInfo) !==
            JSON.stringify(data.shiftInfo)
        ) {
          return await this.prisma.attendanceConflict.update({
            where: { id: existingConflict.id },
            data: {
              description: data.description,
              shiftInfo: data.shiftInfo,
              employeeTimekeepingId: data.employeeTimekeepingId,
            },
          });
        }
        return existingConflict;
      }

      // Create new conflict
      return await this.prisma.attendanceConflict.create({
        data: {
          accountId: data.accountId,
          employeeTimekeepingId: data.employeeTimekeepingId,
          conflictType: data.conflictType,
          conflictDate: data.conflictDate,
          dateString: data.dateString,
          description: data.description,
          shiftInfo: data.shiftInfo,
          isResolved: false,
        },
      });
    } catch (error) {
      this.utilityService.error(`Error creating conflict: ${error.message}`);
      return null;
    }
  }

  async resolveConflictsForDate(
    accountId: string,
    dateString: string,
    resolvedBy?: string,
  ): Promise<void> {
    try {
      await this.prisma.attendanceConflict.updateMany({
        where: {
          accountId,
          dateString,
          isResolved: false,
        },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy: resolvedBy || 'SYSTEM',
        },
      });
    } catch (error) {
      this.utilityService.error(
        `Error resolving conflicts for ${accountId} on ${dateString}: ${error.message}`,
      );
    }
  }

  async resolveSpecificConflictTypes(
    accountId: string,
    dateString: string,
    conflictTypes: AttendanceConflictType[],
    resolvedBy?: string,
  ): Promise<void> {
    try {
      await this.prisma.attendanceConflict.updateMany({
        where: {
          accountId,
          dateString,
          conflictType: {
            in: conflictTypes,
          },
          isResolved: false,
        },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy: resolvedBy || 'SYSTEM',
        },
      });
    } catch (error) {
      this.utilityService.error(
        `Error resolving specific conflict types for ${accountId} on ${dateString}: ${error.message}`,
      );
    }
  }

  async batchDetectConflicts(
    employees: Array<{ accountId: string }>,
    dates: DateFormat[],
  ): Promise<Map<string, AttendanceConflict[]>> {
    const conflictsMap = new Map<string, AttendanceConflict[]>();

    for (const employee of employees) {
      const employeeConflicts: AttendanceConflict[] = [];

      for (const date of dates) {
        const dateString = moment(date.raw).format('YYYY-MM-DD');

        // Get timekeeping record for this date
        const timekeepingRecord =
          await this.prisma.employeeTimekeeping.findFirst({
            where: {
              dateString,
              employeeTimekeepingCutoff: {
                accountId: employee.accountId,
              },
            },
          });

        // Detect conflicts for this employee and date
        const conflicts = await this.detectConflicts(
          employee.accountId,
          date,
          timekeepingRecord,
        );

        employeeConflicts.push(...conflicts);
      }

      if (employeeConflicts.length > 0) {
        conflictsMap.set(employee.accountId, employeeConflicts);
      }
    }

    return conflictsMap;
  }

  async getConflicts(
    filters: {
      accountId?: string;
      dateFrom?: string;
      dateTo?: string;
      conflictType?: AttendanceConflictType;
      isResolved?: boolean;
      page?: number;
      limit?: number;
    },
    currentAccountId?: string,
  ): Promise<{
    data: AttendanceConflict[];
    total: number;
    page: number;
    lastPage: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Build the base where clause
    const where: Prisma.AttendanceConflictWhereInput = {};

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.dateString = {};
      if (filters.dateFrom) {
        where.dateString.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.dateString.lte = filters.dateTo;
      }
    }

    if (filters.conflictType) {
      where.conflictType = filters.conflictType;
    }

    if (filters.isResolved !== undefined) {
      where.isResolved = filters.isResolved;
    }

    // If currentAccountId is provided, exclude conflicts that are ignored/resolved by this user
    if (currentAccountId) {
      where.ignoredBy = {
        none: {
          ignoredByAccountId: currentAccountId,
        },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.attendanceConflict.findMany({
        where,
        include: {
          account: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              EmployeeData: {
                select: {
                  employeeCode: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: [{ dateString: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.attendanceConflict.count({ where }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      lastPage,
    };
  }

  async resolveConflict(
    conflictId: number,
    resolvedBy: string,
  ): Promise<AttendanceConflict> {
    return await this.prisma.attendanceConflict.update({
      where: { id: conflictId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy,
      },
    });
  }

  async ignoreOrResolveConflict(
    conflictId: number,
    accountId: string,
    action: AttendanceConflictAction,
  ): Promise<void> {
    try {
      // Check if the conflict exists
      const conflict = await this.prisma.attendanceConflict.findUnique({
        where: { id: conflictId },
      });

      if (!conflict) {
        throw new Error(`Conflict with ID ${conflictId} not found`);
      }

      // Create or update the ignore/resolve record
      await this.prisma.attendanceConflictIgnore.upsert({
        where: {
          conflictId_ignoredByAccountId: {
            conflictId,
            ignoredByAccountId: accountId,
          },
        },
        create: {
          conflictId,
          ignoredByAccountId: accountId,
          action,
        },
        update: {
          action,
          ignoredAt: new Date(),
        },
      });
    } catch (error) {
      this.utilityService.error(
        `Error ignoring/resolving conflict: ${error.message}`,
      );
      throw error;
    }
  }

  async getConflictStats(filters: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{
    total: number;
    resolved: number;
    unresolved: number;
    byType: Record<AttendanceConflictType, number>;
  }> {
    const where: Prisma.AttendanceConflictWhereInput = {};

    if (filters.dateFrom || filters.dateTo) {
      where.dateString = {};
      if (filters.dateFrom) {
        where.dateString.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.dateString.lte = filters.dateTo;
      }
    }

    const [total, resolved, byType] = await Promise.all([
      this.prisma.attendanceConflict.count({ where }),
      this.prisma.attendanceConflict.count({
        where: { ...where, isResolved: true },
      }),
      this.prisma.attendanceConflict.groupBy({
        by: ['conflictType'],
        where,
        _count: true,
      }),
    ]);

    const byTypeMap: Record<string, number> = {};
    byType.forEach((item) => {
      byTypeMap[item.conflictType] = item._count;
    });

    return {
      total,
      resolved,
      unresolved: total - resolved,
      byType: byTypeMap as Record<AttendanceConflictType, number>,
    };
  }

  async getEmployeeConflictsTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'attendanceConflict');
    const tableQuery = this.tableHandlerService.constructTableQuery();

    if (!query.employeeAccountId || !query.cutoffDateRangeId) {
      throw new BadRequestException(
        'Employee Account ID and Cutoff Date Range ID are required.',
      );
    }

    // Get cutoff date range for filtering
    const cutoffDateRange = await this.prisma.cutoffDateRange.findUnique({
      where: { id: query.cutoffDateRangeId },
    });

    if (!cutoffDateRange) {
      throw new BadRequestException('Cutoff date range not found.');
    }

    // Build where clause
    tableQuery['where'] = {
      accountId: query.employeeAccountId,
      dateString: {
        gte: moment(cutoffDateRange.startDate).format('YYYY-MM-DD'),
        lte: moment(cutoffDateRange.endDate).format('YYYY-MM-DD'),
      },
    };

    tableQuery['orderBy'] = {
      dateString: 'desc',
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.attendanceConflict,
      query,
      tableQuery,
    );

    // Format the data for the table
    const formattedList = baseList.map((conflict: AttendanceConflict) => ({
      id: conflict.id,
      dateString: conflict.dateString,
      conflictType: conflict.conflictType,
      description: conflict.description,
      isResolved: conflict.isResolved,
      resolvedAt: conflict.resolvedAt
        ? this.utilityService.formatDate(conflict.resolvedAt).dateFull
        : null,
      resolvedBy: conflict.resolvedBy,
      createdAt: this.utilityService.formatDate(conflict.createdAt).dateFull,
    }));

    const tableSettings = {
      columns: [
        { key: 'dateString', label: 'Date', class: 'text-left' },
        { key: 'conflictType', label: 'Type', slot: 'badge' },
        { key: 'description', label: 'Description', class: 'text-left' },
        { key: 'isResolved', label: 'Status', slot: 'status' },
        { key: 'resolvedAt', label: 'Resolved Date', class: 'text-center' },
      ],
      search: [{ key: 'description', label: 'Description' }],
      filters: [],
    };

    return {
      list: formattedList,
      pagination,
      currentPage,
      tableSettings,
    };
  }
}

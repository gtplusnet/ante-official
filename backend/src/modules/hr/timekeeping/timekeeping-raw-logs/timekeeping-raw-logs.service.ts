import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  TimekeepingRawLogQueryDTO,
  TimekeepingRawLogResponse,
  TimekeepingRawLogListResponse,
} from './timekeeping-raw-logs.interface';
import { Prisma, EmployeeTimekeepingRaw } from '@prisma/client';
import * as moment from 'moment';

@Injectable()
export class TimekeepingRawLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilityService: UtilityService,
  ) {}

  async getTimekeepingRawLogs(
    query: TimekeepingRawLogQueryDTO,
  ): Promise<TimekeepingRawLogListResponse> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.EmployeeTimekeepingRawWhereInput = {};

    // Date range filter - default to current month if not provided
    if (query.startDate || query.endDate) {
      where.timeIn = {};
      if (query.startDate) {
        where.timeIn.gte = moment(query.startDate).startOf('day').toDate();
      }
      if (query.endDate) {
        where.timeIn.lte = moment(query.endDate).endOf('day').toDate();
      }
    } else {
      // Default to current month
      where.timeIn = {
        gte: moment().startOf('month').toDate(),
        lte: moment().endOf('month').toDate(),
      };
    }

    // Employee filter
    if (query.accountId) {
      where.accountId = query.accountId;
    }

    // Source filter
    if (query.source) {
      where.source = query.source;
    }

    // Import batch filter
    if (query.importBatchId) {
      where.importBatchId = query.importBatchId;
    }

    // Search filter (by employee name)
    if (query.search) {
      where.account = {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { username: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    // Get total count
    const total = await this.prisma.employeeTimekeepingRaw.count({ where });

    // Get data with pagination
    const rawLogs = await this.prisma.employeeTimekeepingRaw.findMany({
      where,
      skip,
      take: limit,
      orderBy: { timeIn: 'desc' },
      include: {
        account: true,
        importBatch: {
          select: {
            id: true,
            fileName: true,
          },
        },
      },
    });

    // Format the response
    const list = rawLogs.map((log) => this.formatRawLogResponse(log));

    return {
      list,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private formatRawLogResponse(
    log: EmployeeTimekeepingRaw & {
      account: any;
      importBatch: { id: string; fileName: string } | null;
    },
  ): TimekeepingRawLogResponse {
    return {
      id: log.id,
      employeeCode: log.account.username || '-',
      employeeName: `${log.account.firstName} ${log.account.lastName}`,
      timeIn: log.timeIn.toISOString(),
      timeOut: log.timeOut.toISOString(),
      timeSpan: this.utilityService.formatHours(log.timeSpan / 60).formatted,
      source: {
        key: log.source,
        label: log.source,
      },
      // TIME-IN GEOLOCATION
      timeInLocation: log.timeInLocation,
      timeInIpAddress: log.timeInIpAddress,
      // TIME-OUT GEOLOCATION
      timeOutLocation: log.timeOutLocation,
      timeOutIpAddress: log.timeOutIpAddress,
      importBatchId: log.importBatchId,
      importBatch: log.importBatch,
      createdAt: log.createdAt.toISOString(),
    };
  }

  async exportToExcel(query: TimekeepingRawLogQueryDTO): Promise<Buffer> {
    // Remove pagination for export
    const exportQuery = { ...query, page: undefined, limit: undefined };
    await this.getTimekeepingRawLogs(exportQuery);

    // TODO: Implement Excel export using existing utility
    throw new Error('Excel export not yet implemented');
  }
}

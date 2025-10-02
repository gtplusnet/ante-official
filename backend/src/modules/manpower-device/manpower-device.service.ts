import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { ManpowerDevice, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { ManpowerQueueService } from './services/manpower-queue.service';
import * as moment from 'moment';

@Injectable()
export class ManpowerDeviceService {
  @Inject() private readonly prismaService: PrismaService;
  @Inject() private readonly queueService: ManpowerQueueService;

  /**
   * Generate a unique device ID
   */
  private generateDeviceId(): string {
    return `DEV-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  }

  /**
   * Generate a secure API key
   */
  private generateApiKey(): string {
    return `ante_device_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Get all devices for a company
   */
  async getAllDevices(companyId: number, includeInactive = false): Promise<ManpowerDevice[]> {
    const where: Prisma.ManpowerDeviceWhereInput = {
      companyId,
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prismaService.manpowerDevice.findMany({
      where,
      include: {
        project: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a single device by ID
   */
  async getDeviceById(id: string, companyId: number): Promise<ManpowerDevice> {
    const device = await this.prismaService.manpowerDevice.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        project: true,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return device;
  }

  /**
   * Create a new device
   */
  async createDevice(data: {
    name: string;
    location?: string;
    companyId: number;
    projectId?: number;
  }): Promise<ManpowerDevice> {
    const deviceId = this.generateDeviceId();
    const apiKey = this.generateApiKey();

    return this.prismaService.manpowerDevice.create({
      data: {
        deviceId,
        name: data.name,
        location: data.location || '',
        companyId: data.companyId,
        projectId: data.projectId,
        apiKey,
        isActive: true,
      },
      include: {
        project: true,
      },
    });
  }

  /**
   * Update device details
   */
  async updateDevice(
    id: string,
    companyId: number,
    data: {
      name?: string;
      location?: string;
      projectId?: number | null;
      isActive?: boolean;
    },
  ): Promise<ManpowerDevice> {
    // Verify device belongs to company
    await this.getDeviceById(id, companyId);

    return this.prismaService.manpowerDevice.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.projectId !== undefined && { projectId: data.projectId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        project: true,
      },
    });
  }

  /**
   * Regenerate API key for a device
   */
  async regenerateApiKey(id: string, companyId: number): Promise<{ device: ManpowerDevice; newApiKey: string }> {
    // Verify device belongs to company
    await this.getDeviceById(id, companyId);

    const newApiKey = this.generateApiKey();

    const device = await this.prismaService.manpowerDevice.update({
      where: { id },
      data: {
        apiKey: newApiKey,
      },
      include: {
        project: true,
      },
    });

    return { device, newApiKey };
  }

  /**
   * Delete (soft delete) a device
   */
  async deleteDevice(id: string, companyId: number): Promise<ManpowerDevice> {
    // Verify device belongs to company
    await this.getDeviceById(id, companyId);

    return this.prismaService.manpowerDevice.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Validate device by API key (for public endpoints)
   */
  async validateDevice(apiKey: string): Promise<ManpowerDevice | null> {
    const device = await this.prismaService.manpowerDevice.findUnique({
      where: { apiKey },
      include: {
        company: true,
        project: true,
      },
    });

    if (!device || !device.isActive) {
      return null;
    }

    // Update last activity
    await this.prismaService.manpowerDevice.update({
      where: { id: device.id },
      data: {
        lastActivityAt: new Date(),
      },
    });

    return device;
  }

  /**
   * Record time-in (public endpoint)
   */
  async recordTimeIn(apiKey: string, employeeId: string): Promise<any> {
    const device = await this.validateDevice(apiKey);
    if (!device) {
      throw new BadRequestException('Invalid or inactive device');
    }

    // Find employee by ID in the same company
    const employee = await this.prismaService.account.findFirst({
      where: {
        id: employeeId,
        companyId: device.companyId,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // REMOVED: Check for existing time-in - now allowing multiple time-ins per day

    const now = new Date();

    // Create time-in record without time-out (null until clock out)
    const timeRecord = await this.prismaService.employeeTimekeepingRaw.create({
      data: {
        accountId: employee.id,
        timeIn: now,
        timeOut: null, // No time-out yet - will be set when employee clocks out
        timeSpan: 0,
        source: 'DEVICE',
        deviceId: device.id,
        remarks: `Recorded via device: ${device.name}`,
      },
    });

    return {
      timeRecordId: timeRecord.id,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      timeIn: timeRecord.timeIn,
      device: device.name,
      message: 'Time-in recorded successfully',
    };
  }

  /**
   * Record time-out (public endpoint)
   */
  async recordTimeOut(apiKey: string, timeRecordId: number): Promise<any> {
    const device = await this.validateDevice(apiKey);
    if (!device) {
      throw new BadRequestException('Invalid or inactive device');
    }

    const timeRecord = await this.prismaService.employeeTimekeepingRaw.findFirst({
      where: {
        id: timeRecordId,
        deviceId: device.id,
      },
      include: {
        account: {
          include: {
            EmployeeData: {
              include: {
                payrollGroup: true,
              },
            },
          },
        },
      },
    });

    if (!timeRecord) {
      throw new NotFoundException('Time record not found or not associated with this device');
    }

    const now = new Date();

    // Validation: time-out must be after time-in
    if (now <= timeRecord.timeIn) {
      throw new BadRequestException('Time-out must be after time-in');
    }

    // Validation: minimum session duration (1 minute)
    const timeSpanMinutes = (now.getTime() - timeRecord.timeIn.getTime()) / (1000 * 60);
    if (timeSpanMinutes < 1) {
      throw new BadRequestException('Minimum session duration is 1 minute');
    }

    // Validation: maximum session duration (24 hours)
    if (timeSpanMinutes > 1440) { // 24 hours = 1440 minutes
      throw new BadRequestException('Maximum session duration is 24 hours');
    }

    const timeSpanHours = timeSpanMinutes / 60; // Hours

    // Calculate different time components
    const regularHours = Math.min(timeSpanHours, 8); // Regular hours (max 8)
    const overtimeHours = Math.max(0, timeSpanHours - 8); // Overtime after 8 hours

    // Calculate night differential (10pm - 6am)
    const nightDiffMinutes = this.calculateNightDifferential(timeRecord.timeIn, now);

    // Apply grace periods from payroll group if available
    const payrollGroup = (timeRecord as any)?.account?.EmployeeData?.payrollGroup;
    const overtimeGraceMinutes = payrollGroup?.overtimeGraceTimeMinutes || 0;

    // Apply overtime grace period
    const adjustedOvertimeMinutes = Math.max(0, (overtimeHours * 60) - overtimeGraceMinutes);
    const adjustedOvertimeHours = adjustedOvertimeMinutes / 60;

    const updatedRecord = await this.prismaService.employeeTimekeepingRaw.update({
      where: { id: timeRecordId },
      data: {
        timeOut: now,
        timeSpan: timeSpanHours,
      },
    });

    // Add job to queue for background computation
    const dateString = moment(timeRecord.timeIn).format('YYYY-MM-DD');
    const queueJob = await this.queueService.addJob({
      employeeId: (timeRecord as any).account.id,
      employeeName: `${(timeRecord as any).account.firstName} ${(timeRecord as any).account.lastName}`,
      deviceId: device.id,
      deviceName: device.name,
      date: dateString,
    });

    // Get all time records for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyRecords = await this.prismaService.employeeTimekeepingRaw.findMany({
      where: {
        accountId: (timeRecord as any).account.id,
        timeIn: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: {
        timeIn: 'asc',
      },
    });

    // Calculate total hours for the day
    const totalHoursToday = dailyRecords.reduce((total, record) => {
      return total + (record.timeSpan || 0);
    }, 0);

    // Get queue position
    const queuePosition = await this.queueService.getQueuePosition(queueJob.id);

    return {
      message: 'Time-out recorded successfully. Computation queued.',
      currentSession: {
        timeRecordId: updatedRecord.id,
        employeeId: (timeRecord as any).account.id,
        employeeName: `${(timeRecord as any).account.firstName} ${(timeRecord as any).account.lastName}`,
        timeIn: updatedRecord.timeIn,
        timeOut: updatedRecord.timeOut,
        duration: `${timeSpanHours.toFixed(2)} hours`,
      },
      dailyRecords: dailyRecords.map(record => ({
        id: record.id,
        timeIn: moment(record.timeIn).format('hh:mm A'),
        timeOut: record.timeOut ? moment(record.timeOut).format('hh:mm A') : 'Active',
        timeSpan: record.timeSpan || 0,
      })),
      totalHoursToday: totalHoursToday.toFixed(2),
      computationStatus: 'queued',
      queuePosition,
      queueJobId: queueJob.id,
    };
  }

  /**
   * Get daily logs (public endpoint)
   */
  async getDailyLogs(apiKey: string, date: string): Promise<any[]> {
    const device = await this.validateDevice(apiKey);
    if (!device) {
      throw new BadRequestException('Invalid or inactive device');
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const records = await this.prismaService.employeeTimekeepingRaw.findMany({
      where: {
        deviceId: device.id,
        timeIn: {
          gte: targetDate,
          lt: nextDay,
        },
      },
      include: {
        account: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        timeIn: 'asc',
      },
    });

    return records.map(record => ({
      timeRecordId: record.id,
      employeeId: record.accountId,
      employeeCode: record.account.username,
      employeeName: `${record.account.firstName} ${record.account.lastName}`,
      timeIn: record.timeIn,
      timeOut: record.timeOut,
      hoursWorked: record.timeSpan,
    }));
  }

  /**
   * Get employee status (public endpoint)
   */
  async getEmployeeStatus(apiKey: string, employeeId: string): Promise<any> {
    const device = await this.validateDevice(apiKey);
    if (!device) {
      throw new BadRequestException('Invalid or inactive device');
    }

    // Find employee by ID in the same company
    const employee = await this.prismaService.account.findFirst({
      where: {
        id: employeeId,
        companyId: device.companyId,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Get the most recent time record for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const latestRecord = await this.prismaService.employeeTimekeepingRaw.findFirst({
      where: {
        accountId: employee.id,
        timeIn: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: {
        timeIn: 'desc',
      },
    });

    // Determine status
    let status = 'clocked_out';
    let since = null;
    let timeRecordId = null;

    if (latestRecord) {
      if (latestRecord.timeOut === null) {
        status = 'clocked_in';
        since = latestRecord.timeIn;
        timeRecordId = latestRecord.id;
      } else {
        since = latestRecord.timeOut;
      }
    }

    return {
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      status,
      since,
      timeRecordId,
    };
  }

  /**
   * Calculate night differential minutes between two times
   * Night differential is from 10pm to 6am
   */
  private calculateNightDifferential(timeIn: Date, timeOut: Date): number {
    let nightDiffMinutes = 0;
    const nightStartHour = 22; // 10pm
    const nightEndHour = 6; // 6am

    // Create date objects for comparison
    const start = new Date(timeIn);
    const end = new Date(timeOut);

    // Iterate through each hour and check if it falls within night diff hours
    const current = new Date(start);
    while (current < end) {
      const hour = current.getHours();
      const nextHour = new Date(current.getTime() + 60 * 60 * 1000);

      // Check if this hour falls within night differential period
      if (hour >= nightStartHour || hour < nightEndHour) {
        // Calculate minutes in this hour that overlap with work time
        const segmentEnd = nextHour > end ? end : nextHour;
        const segmentMinutes = (segmentEnd.getTime() - current.getTime()) / (1000 * 60);
        nightDiffMinutes += segmentMinutes;
      }

      current.setTime(nextHour.getTime());
    }

    return Math.floor(nightDiffMinutes);
  }

  /**
   * Get all employees for the device's company (public endpoint)
   */
  async getEmployees(apiKey: string, page = 1, limit = 50, withPhotos = false): Promise<any> {
    const device = await this.validateDevice(apiKey);
    if (!device) {
      throw new BadRequestException('Invalid or inactive device');
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      companyId: device.companyId,
    };

    // Filter for employees with real photos if requested (exclude default placeholder)
    if (withPhotos) {
      whereClause.AND = [
        {
          image: {
            not: null,
          },
        },
        {
          image: {
            not: '/images/person01.webp', // Exclude default placeholder
          },
        },
      ];
    }

    // Get total count
    const total = await this.prismaService.account.count({
      where: whereClause,
    });

    // Get employees with their data
    const employees = await this.prismaService.account.findMany({
      where: whereClause,
      include: {
        EmployeeData: {
          include: {
            branch: true,
            payrollGroup: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    // Get base URL for constructing full image URLs
    const baseUrl = process.env.API_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:8080';
    const defaultImage = '/images/person01.webp';

    // Format the response
    const formattedEmployees = employees.map((emp: any) => {
      // Check if employee has a real profile photo (not the default placeholder)
      const hasRealPhoto = emp.image && emp.image !== defaultImage;

      // Construct full URL for profile photo if it exists
      let profilePhotoURL = null;
      if (emp.image) {
        // If it's already a full URL (starts with http), use as-is
        if (emp.image.startsWith('http')) {
          profilePhotoURL = emp.image;
        } else {
          // Otherwise, prepend the base URL for frontend assets
          profilePhotoURL = `${baseUrl}${emp.image}`;
        }
      }

      return {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        fullName: `${emp.firstName} ${emp.lastName}`,
        employeeCode: emp.username,
        department: emp.EmployeeData?.branch?.name || 'Main Branch',
        position: emp.EmployeeData?.payrollGroup?.name || 'Employee',
        profilePhotoURL,
        hasProfilePhoto: hasRealPhoto,
        isActive: emp.EmployeeData?.isActive ?? true,
      };
    });

    return {
      employees: formattedEmployees,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
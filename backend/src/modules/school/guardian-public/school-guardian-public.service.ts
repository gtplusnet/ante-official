import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import {
  GuardianLoginDto,
  UpdateProfileDto,
  GetAttendanceLogsDto,
  GuardianLoginResponseDto,
  StudentAttendanceStatusDto,
  AttendanceLogDto,
  NotificationDto,
  GuardianProfileDto,
  AttendanceStatus,
  NotificationType,
  NotificationPriority,
  RelationshipType,
} from './dto/guardian-public.dto';

@Injectable()
export class SchoolGuardianPublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utility: UtilityService,
  ) {}

  /**
   * Guardian login - generates permanent token
   */
  async login(dto: GuardianLoginDto): Promise<GuardianLoginResponseDto> {
    // Find guardian by email
    const guardian = await this.prisma.guardian.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        isActive: true,
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
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      guardian.password || '',
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate permanent token
    const token = this.generateToken();
    const refreshToken = this.generateToken();

    // Store token in database (tokens don't expire for this API)
    await this.prisma.guardianToken.create({
      data: {
        id: uuidv4(),
        guardianId: guardian.id,
        token,
        refreshToken,
        deviceId: dto.deviceId,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        createdAt: new Date(),
      },
    });

    // Update last login and device token if provided
    const updateData: any = { lastLogin: new Date() };

    // Add or update device token for push notifications
    if (dto.deviceToken) {
      const currentTokens = guardian.deviceTokens || [];
      // Remove old token for this device if exists (based on deviceId)
      const filteredTokens = dto.deviceId
        ? currentTokens.filter((token: string) => token !== dto.deviceToken)
        : currentTokens;
      // Add new token (avoiding duplicates)
      if (!filteredTokens.includes(dto.deviceToken)) {
        updateData.deviceTokens = [...filteredTokens, dto.deviceToken];
      }
    }

    await this.prisma.guardian.update({
      where: { id: guardian.id },
      data: updateData,
    });

    // Format response
    return {
      token,
      guardian: {
        id: guardian.id,
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        email: guardian.email,
        phoneNumber: guardian.contactNumber,
      },
      students: guardian.students.map((gs) => ({
        id: gs.student.id,
        firstName: gs.student.firstName,
        lastName: gs.student.lastName,
        studentCode: gs.student.studentNumber,
      })),
      permissions: [], // Can be expanded based on requirements
    };
  }

  /**
   * Guardian logout - invalidate token
   */
  async logout(guardianId: string, authHeader?: string): Promise<void> {
    if (!authHeader) {
      throw new BadRequestException('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');

    // Delete the token from database
    const deleted = await this.prisma.guardianToken.deleteMany({
      where: {
        guardianId,
        token,
      },
    });

    if (deleted.count === 0) {
      throw new BadRequestException('Token not found or already invalidated');
    }
  }

  /**
   * Get guardian's students
   */
  async getGuardianStudents(guardianId: string): Promise<any[]> {
    const guardianStudents = await this.prisma.studentGuardian.findMany({
      where: {
        guardianId,
      },
      include: {
        student: {
          include: {
            section: true,
          },
        },
      },
    });

    return guardianStudents.map((gs) => ({
      id: gs.student.id,
      firstName: gs.student.firstName,
      lastName: gs.student.lastName,
      studentCode: gs.student.studentNumber,
      section: gs.student.section?.name,
      relationship: gs.relationship,
      addedAt: gs.createdAt,
    }));
  }

  /**
   * Add student to guardian account
   */
  async addStudentToGuardian(guardianId: string, studentIdentifier: string): Promise<any> {
    // Find guardian
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: guardianId },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    // Find student by ID or code
    const student = await this.prisma.student.findFirst({
      where: {
        AND: [
          { companyId: guardian.companyId },
          {
            OR: [
              { id: studentIdentifier },
              { studentNumber: studentIdentifier },
            ],
          },
        ],
      },
      include: {
        section: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found or does not belong to your school');
    }

    // Check if already linked
    const existing = await this.prisma.studentGuardian.findFirst({
      where: {
        guardianId,
        studentId: student.id,
      },
    });

    if (existing) {
      throw new ConflictException('Student is already linked to your account');
    }

    // Create link
    const guardianStudent = await this.prisma.studentGuardian.create({
      data: {
        id: uuidv4(),
        guardianId,
        studentId: student.id,
        relationship: 'Guardian', // Default, can be updated
        isPrimary: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentCode: student.studentNumber,
      section: student.section?.name,
      linkedAt: guardianStudent.createdAt,
    };
  }

  /**
   * Remove student from guardian account
   */
  async removeStudentFromGuardian(guardianId: string, studentId: string): Promise<void> {
    const deleted = await this.prisma.studentGuardian.deleteMany({
      where: {
        guardianId,
        studentId,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Student not found in your account');
    }
  }

  /**
   * Get students' current attendance status
   */
  async getStudentsCurrentStatus(guardianId: string): Promise<StudentAttendanceStatusDto[]> {
    const students = await this.getGuardianStudents(guardianId);
    const statuses: StudentAttendanceStatusDto[] = [];

    for (const student of students) {
      // Get today's attendance
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendance = await this.prisma.schoolAttendance.findMany({
        where: {
          personId: student.id,
          timestamp: {
            gte: today,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      const checkIns = attendance.filter((a) => a.action === 'IN');
      const checkOuts = attendance.filter((a) => a.action === 'OUT');
      const lastCheckIn = checkIns[0];
      const lastCheckOut = checkOuts[0];

      let status: AttendanceStatus = AttendanceStatus.UNKNOWN;
      if (lastCheckIn && (!lastCheckOut || lastCheckIn.timestamp > lastCheckOut.timestamp)) {
        status = AttendanceStatus.IN_SCHOOL;
      } else if (lastCheckOut) {
        status = AttendanceStatus.OUT_OF_SCHOOL;
      }

      statuses.push({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        studentCode: student.studentCode,
        status,
        lastCheckIn: lastCheckIn
          ? {
              timestamp: lastCheckIn.timestamp.toISOString(),
              gate: lastCheckIn.location || 'Unknown Gate',
            }
          : undefined,
        lastCheckOut: lastCheckOut
          ? {
              timestamp: lastCheckOut.timestamp.toISOString(),
              gate: lastCheckOut.location || 'Unknown Gate',
            }
          : undefined,
        todayAttendance: {
          checkIns: checkIns.length,
          checkOuts: checkOuts.length,
          totalTime: this.calculateTotalTime(attendance),
        },
      });
    }

    return statuses;
  }

  /**
   * Get recent attendance logs
   */
  async getRecentAttendanceLogs(
    guardianId: string,
    query: GetAttendanceLogsDto,
  ): Promise<{ logs: AttendanceLogDto[]; total: number }> {
    const students = await this.getGuardianStudents(guardianId);
    const studentIds = students.map((s) => s.id);

    if (query.studentId && !studentIds.includes(query.studentId)) {
      throw new BadRequestException('Student not found in your account');
    }

    const where: any = {
      personId: query.studentId ? query.studentId : { in: studentIds },
    };

    // Date filters
    if (query.startDate || query.endDate || query.days) {
      where.timestamp = {};
      if (query.startDate) {
        where.timestamp.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.timestamp.lte = new Date(query.endDate);
      }
      if (query.days && !query.startDate) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - query.days);
        where.timestamp.gte = daysAgo;
      }
    }

    // Type filter
    if (query.type && query.type !== 'all') {
      where.action = query.type === 'check-in' ? 'IN' : 'OUT';
    }

    const [logs, total] = await Promise.all([
      this.prisma.schoolAttendance.findMany({
        where,
        orderBy: {
          timestamp: 'desc',
        },
        take: query.limit || 50,
        skip: query.offset || 0,
      }),
      this.prisma.schoolAttendance.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        studentId: log.personId,
        studentName: log.personName,
        type: log.action === 'IN' ? 'check-in' : 'check-out',
        timestamp: log.timestamp.toISOString(),
        gate: {
          id: log.deviceId || '',
          name: log.location || 'Unknown Gate',
        },
        photo: log.profilePhoto,
      })),
      total,
    };
  }

  /**
   * Get notifications
   */
  async getNotifications(
    guardianId: string,
    limit: number,
    offset: number,
  ): Promise<{ notifications: NotificationDto[]; total: number; unreadCount: number }> {
    const where = {
      guardianId,
    };

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.guardianNotification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      this.prisma.guardianNotification.count({ where }),
      this.prisma.guardianNotification.count({
        where: {
          ...where,
          readAt: null,
        },
      }),
    ]);

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        type: (n.type || NotificationType.ALL) as NotificationType,
        title: n.title,
        message: n.message,
        timestamp: n.createdAt.toISOString(),
        isRead: n.readAt !== null,
        priority: (n.priority || NotificationPriority.MEDIUM) as NotificationPriority,
        data: n.data as Record<string, any>,
      })),
      total,
      unreadCount,
    };
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsAsRead(
    guardianId: string,
    notificationIds: string[],
  ): Promise<void> {
    await this.prisma.guardianNotification.updateMany({
      where: {
        guardianId,
        id: {
          in: notificationIds,
        },
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  /**
   * Get guardian profile
   */
  async getGuardianProfile(guardianId: string): Promise<GuardianProfileDto> {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: guardianId },
      include: {
        students: {
          include: {
            student: {
              include: {
                section: true,
              },
            },
          },
        },
      },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    return {
      id: guardian.id,
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      email: guardian.email,
      phoneNumber: guardian.contactNumber,
      address: guardian.address,
      isActive: guardian.isActive,
      createdAt: guardian.createdAt.toISOString(),
      lastLogin: guardian.lastLogin?.toISOString(),
      students: guardian.students.map((gs) => ({
        id: gs.student.id,
        firstName: gs.student.firstName,
        lastName: gs.student.lastName,
        studentCode: gs.student.studentNumber,
        section: gs.student.section?.name,
        relationship: gs.relationship as RelationshipType,
      })),
    };
  }

  /**
   * Update guardian profile
   */
  async updateGuardianProfile(
    guardianId: string,
    dto: UpdateProfileDto,
  ): Promise<GuardianProfileDto> {
    const updateData: any = {};

    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.email) updateData.email = dto.email.toLowerCase();
    if (dto.phoneNumber) updateData.contactNumber = dto.phoneNumber;
    if (dto.address) updateData.address = dto.address;

    await this.prisma.guardian.update({
      where: { id: guardianId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return this.getGuardianProfile(guardianId);
  }

  /**
   * Validate token and get guardian
   */
  async validateToken(token: string): Promise<any> {
    const guardianToken = await this.prisma.guardianToken.findFirst({
      where: {
        token,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        guardian: true,
      },
    });

    if (!guardianToken || !guardianToken.guardian.isActive) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Update last used (use updatedAt field)
    await this.prisma.guardianToken.update({
      where: { id: guardianToken.id },
      data: { updatedAt: new Date() },
    });

    return guardianToken.guardian;
  }

  /**
   * Helper: Generate unique token
   */
  private generateToken(): string {
    return uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
  }

  /**
   * Helper: Calculate total time in school
   */
  private calculateTotalTime(attendance: any[]): string {
    let totalMinutes = 0;
    const checkIns = attendance.filter((a) => a.action === 'IN');
    const checkOuts = attendance.filter((a) => a.action === 'OUT');

    checkIns.forEach((checkIn) => {
      const correspondingCheckOut = checkOuts.find(
        (checkOut) => checkOut.timestamp > checkIn.timestamp,
      );
      if (correspondingCheckOut) {
        const diff =
          correspondingCheckOut.timestamp.getTime() - checkIn.timestamp.getTime();
        totalMinutes += Math.floor(diff / 60000);
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }
}
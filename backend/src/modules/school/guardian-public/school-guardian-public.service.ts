import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { UploadPhotoService } from '@infrastructure/file-upload/upload-photo/upload-photo.service';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { MulterFile } from '../../../types/multer';
import {
  GuardianLoginDto,
  GuardianRegisterDto,
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
    private readonly uploadPhotoService: UploadPhotoService,
  ) { }

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
        company: true, // Include company data
        students: {
          include: {
            student: {
              include: {
                section: {
                  include: {
                    gradeLevel: true,
                  },
                },
                profilePhoto: true,
                guardians: {
                  include: {
                    guardian: true,
                  },
                  where: {
                    isPrimary: true,
                  },
                  take: 1,
                },
              },
            },
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

    // Format response with full student data
    return {
      token,
      guardian: {
        id: guardian.id,
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        email: guardian.email,
        phoneNumber: guardian.contactNumber,
      },
      students: guardian.students.map((gs) => {
        const primaryGuardian = gs.student.guardians?.[0];
        return {
          id: gs.student.id,
          studentNumber: gs.student.studentNumber,
          firstName: gs.student.firstName,
          lastName: gs.student.lastName,
          middleName: gs.student.middleName,
          dateOfBirth: gs.student.dateOfBirth?.toISOString() || '',
          gender: gs.student.gender || '',
          section: gs.student.section ? {
            id: gs.student.section.id,
            name: gs.student.section.name,
            gradeLevelId: gs.student.section.gradeLevelId,
            gradeLevel: gs.student.section.gradeLevel ? {
              id: gs.student.section.gradeLevel.id,
              code: gs.student.section.gradeLevel.code,
              name: gs.student.section.gradeLevel.name,
              educationLevel: gs.student.section.gradeLevel.educationLevel,
            } : null,
            adviserName: gs.student.section.adviserName || '',
            schoolYear: gs.student.section.schoolYear || '',
            capacity: gs.student.section.capacity,
          } : undefined,
          lrn: gs.student.lrn,
          profilePhoto: gs.student.profilePhoto ? {
            id: gs.student.profilePhoto.id.toString(),
            url: gs.student.profilePhoto.url,
            name: gs.student.profilePhoto.name,
            size: gs.student.profilePhoto.size || undefined,
            type: gs.student.profilePhoto.type || undefined,
          } : undefined,
          dateRegistered: gs.student.dateRegistered?.toISOString() || new Date().toISOString(),
          isActive: gs.student.isActive,
          guardian: primaryGuardian ? {
            id: primaryGuardian.guardian.id,
            name: `${primaryGuardian.guardian.firstName} ${primaryGuardian.guardian.lastName}`,
            email: primaryGuardian.guardian.email,
            contactNumber: primaryGuardian.guardian.contactNumber || '',
            relationship: primaryGuardian.relationship || '',
          } : undefined,
          temporaryGuardianName: gs.student.temporaryGuardianName,
          temporaryGuardianAddress: gs.student.temporaryGuardianAddress,
          temporaryGuardianContactNumber: gs.student.temporaryGuardianContactNumber,
          createdAt: gs.student.createdAt.toISOString(),
          updatedAt: gs.student.updatedAt.toISOString(),
          relationship: gs.relationship as RelationshipType,
          isPrimary: gs.isPrimary,
        };
      }),
      permissions: [], // Can be expanded based on requirements
      company: {
        id: guardian.company.id,
        name: guardian.company.companyName,
        logoUrl: guardian.company.logoUrl || undefined,
      },
    };
  }

  /**
   * Guardian registration
   */
  async register(dto: GuardianRegisterDto): Promise<GuardianLoginResponseDto> {
    // Check if email already exists
    const existingGuardian = await this.prisma.guardian.findFirst({
      where: {
        email: dto.email.toLowerCase(),
      },
    });

    if (existingGuardian) {
      throw new ConflictException('Email address is already registered');
    }

    // Get company ID from environment variable
    const companyId = parseInt(process.env.NEXT_PUBLIC_COMPANY_ID || '1');

    // Verify company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new BadRequestException('Invalid company configuration');
    }

    // Validate age (must be 18+)
    const birthDate = new Date(dto.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    // Adjust age if birthday hasn't occurred this year
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (actualAge < 18) {
      throw new BadRequestException('You must be at least 18 years old to register');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Generate encryption key (required by schema, though we're using bcrypt)
    // This maintains backward compatibility with the legacy encryption system
    const key = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');

    // Create search keyword for easy searching
    const searchKeyword = [
      dto.firstName,
      dto.lastName,
      dto.middleName,
      dto.email,
      dto.contactNumber,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // Create guardian
    const guardian = await this.prisma.guardian.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        middleName: dto.middleName || undefined,
        dateOfBirth: new Date(dto.dateOfBirth),
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        key: key,
        contactNumber: dto.contactNumber,
        alternateNumber: dto.alternateNumber || undefined,
        address: dto.address || undefined,
        occupation: dto.occupation || undefined,
        companyId,
        searchKeyword,
        isActive: true,
        lastLogin: new Date(),
      },
    });

    // Generate permanent token
    const token = this.generateToken();
    const refreshToken = this.generateToken();

    // Store token in database
    await this.prisma.guardianToken.create({
      data: {
        id: uuidv4(),
        guardianId: guardian.id,
        token,
        refreshToken,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        createdAt: new Date(),
      },
    });

    // Format response (same as login)
    return {
      token,
      guardian: {
        id: guardian.id,
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        email: guardian.email,
        phoneNumber: guardian.contactNumber,
      },
      students: [], // New registration has no students yet
      permissions: [],
      company: {
        id: company.id,
        name: company.companyName,
        logoUrl: company.logoUrl || undefined,
      },
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
            profilePhoto: true,
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
      photoUrl: gs.student.profilePhoto?.url,
    }));
  }

  /**
   * Preview student information before adding
   * Allows guardian to verify they're adding the correct student
   */
  async previewStudent(guardianId: string, studentId: string): Promise<any> {
    // Find guardian
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: guardianId },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    // Find student by ID (no company filter for preview - allows dynamic assignment)
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        isDeleted: false,
      },
      include: {
        section: {
          include: {
            gradeLevel: true,
          },
        },
        profilePhoto: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
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

    // Return student preview information
    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName,
      studentNumber: student.studentNumber,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth?.toISOString(),
      section: student.section?.name,
      gradeLevel: student.section?.gradeLevel?.name,
      profilePhoto: student.profilePhoto ? {
        id: student.profilePhoto.id,
        url: student.profilePhoto.url,
        name: student.profilePhoto.name,
      } : null,
    };
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

    // Find student by ID or code (no company filter - dynamic assignment)
    const student = await this.prisma.student.findFirst({
      where: {
        OR: [
          { id: studentIdentifier },
          { studentNumber: studentIdentifier },
        ],
        isDeleted: false,
      },
      include: {
        section: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
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

    // Check if this is guardian's first student
    const guardianStudentCount = await this.prisma.studentGuardian.count({
      where: { guardianId },
    });

    if (guardianStudentCount === 0) {
      // First student - update guardian's company to match student's company
      await this.prisma.guardian.update({
        where: { id: guardianId },
        data: {
          companyId: student.companyId,
          updatedAt: new Date(),
        },
      });
    } else {
      // Not first student - validate same company
      if (guardian.companyId !== student.companyId) {
        throw new ConflictException(
          'Student belongs to a different school. You can only add students from the same school.',
        );
      }
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

      const checkIns = attendance.filter((a) => a.action === 'check_in' || a.action === 'IN');
      const checkOuts = attendance.filter((a) => a.action === 'check_out' || a.action === 'OUT');
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
        photoUrl: student.photoUrl,
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

    // Type filter (support both old 'IN'/'OUT' and new 'check_in'/'check_out' formats)
    if (query.type && query.type !== 'all') {
      where.action = { in: query.type === 'check-in' ? ['check_in', 'IN'] : ['check_out', 'OUT'] };
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
        type: (log.action === 'check_in' || log.action === 'IN') ? 'check-in' : 'check-out',
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
        profilePhoto: true,
        students: {
          include: {
            student: {
              include: {
                section: {
                  include: {
                    gradeLevel: true,
                  },
                },
                profilePhoto: true,
                guardians: {
                  include: {
                    guardian: true,
                  },
                  where: {
                    isPrimary: true,
                  },
                  take: 1,
                },
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
      profilePhoto: guardian.profilePhoto
        ? {
          id: guardian.profilePhoto.id.toString(),
          url: guardian.profilePhoto.url,
          name: guardian.profilePhoto.name,
          size: guardian.profilePhoto.size,
          type: guardian.profilePhoto.mimetype,
        }
        : undefined,
      students: guardian.students.map((gs) => {
        const primaryGuardian = gs.student.guardians?.[0];
        return {
          id: gs.student.id,
          studentNumber: gs.student.studentNumber,
          firstName: gs.student.firstName,
          lastName: gs.student.lastName,
          middleName: gs.student.middleName,
          dateOfBirth: gs.student.dateOfBirth?.toISOString() || '',
          gender: gs.student.gender || '',
          section: gs.student.section ? {
            id: gs.student.section.id,
            name: gs.student.section.name,
            gradeLevelId: gs.student.section.gradeLevelId,
            gradeLevel: gs.student.section.gradeLevel ? {
              id: gs.student.section.gradeLevel.id,
              code: gs.student.section.gradeLevel.code,
              name: gs.student.section.gradeLevel.name,
              educationLevel: gs.student.section.gradeLevel.educationLevel,
            } : null,
            adviserName: gs.student.section.adviserName || '',
            schoolYear: gs.student.section.schoolYear || '',
            capacity: gs.student.section.capacity,
          } : undefined,
          lrn: gs.student.lrn,
          profilePhoto: gs.student.profilePhoto ? {
            id: gs.student.profilePhoto.id.toString(),
            url: gs.student.profilePhoto.url,
            name: gs.student.profilePhoto.name,
            size: gs.student.profilePhoto.size || undefined,
            type: gs.student.profilePhoto.type || undefined,
          } : undefined,
          dateRegistered: gs.student.dateRegistered?.toISOString() || new Date().toISOString(),
          isActive: gs.student.isActive,
          guardian: primaryGuardian ? {
            id: primaryGuardian.guardian.id,
            name: `${primaryGuardian.guardian.firstName} ${primaryGuardian.guardian.lastName}`,
            email: primaryGuardian.guardian.email,
            contactNumber: primaryGuardian.guardian.contactNumber || '',
            relationship: primaryGuardian.relationship || '',
          } : undefined,
          temporaryGuardianName: gs.student.temporaryGuardianName,
          temporaryGuardianAddress: gs.student.temporaryGuardianAddress,
          temporaryGuardianContactNumber: gs.student.temporaryGuardianContactNumber,
          createdAt: gs.student.createdAt.toISOString(),
          updatedAt: gs.student.updatedAt.toISOString(),
          relationship: gs.relationship as RelationshipType,
          isPrimary: gs.isPrimary,
        };
      }),
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
    const checkIns = attendance.filter((a) => a.action === 'check_in' || a.action === 'IN');
    const checkOuts = attendance.filter((a) => a.action === 'check_out' || a.action === 'OUT');

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

  /**
   * Upload profile photo
   */
  async uploadProfilePhoto(
    guardianId: string,
    file: MulterFile,
  ): Promise<GuardianProfileDto> {
    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    // Find guardian
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: guardianId },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    // Upload to DigitalOcean Spaces
    const photoUrl = await this.uploadPhotoService.uploadPhoto(file);

    // Save file record to database
    const fileRecord = await this.prisma.files.create({
      data: {
        name: `guardian-${guardianId}-profile-photo`,
        originalName: file.originalname,
        url: photoUrl,
        size: file.size,
        mimetype: file.mimetype,
        type: 'IMAGE',
        encoding: file.encoding || 'utf-8',
        fieldName: file.fieldname,
        companyId: guardian.companyId,
        module: 'CMS',
      },
    });

    // Delete old profile photo if exists
    if (guardian.profilePhotoId) {
      await this.prisma.files.delete({
        where: { id: guardian.profilePhotoId },
      }).catch(() => {
        // Ignore error if file doesn't exist
      });
    }

    // Update guardian's profilePhotoId
    await this.prisma.guardian.update({
      where: { id: guardianId },
      data: {
        profilePhotoId: fileRecord.id,
      },
    });

    // Return updated profile
    return this.getGuardianProfile(guardianId);
  }
}
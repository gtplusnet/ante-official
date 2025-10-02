import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { DeviceLicenseService } from '../device-license/device-license.service';
import { StudentService } from '../student/student.service';
import { GuardianService } from '../guardian/guardian.service';
import { GuardianAttendanceGateway } from '../guardian-mobile/attendance/guardian-attendance.gateway';
import { GuardianPushNotificationService } from '../guardian-mobile/services/guardian-push-notification.service';
import {
  SyncPullDto,
  SyncResponseDto,
  SyncStatusResponseDto,
} from './sync.dto';
import { DeviceConnection, SyncHistory } from '@prisma/client';
import {
  SchoolAttendanceBatchDto,
  SchoolAttendanceSyncResponseDto,
  SchoolAttendancePendingDto,
} from './school-attendance.dto';
import {
  AttendancePullRequestDto,
  AttendancePullResponseDto,
} from './attendance-pull.dto';

@Injectable()
export class SyncService {
  constructor(
    private prisma: PrismaService,
    private deviceLicenseService: DeviceLicenseService,
    private studentService: StudentService,
    private guardianService: GuardianService,
    private guardianAttendanceGateway: GuardianAttendanceGateway,
    private pushNotificationService: GuardianPushNotificationService,
  ) {}

  async pullSync(
    deviceConnection: DeviceConnection,
    companyId: number,
    dto: SyncPullDto,
  ): Promise<SyncResponseDto> {
    const syncHistory = await this.startSyncHistory(
      deviceConnection.id,
      'incremental',
      dto.entityTypes.join(','),
    );

    try {
      const result: SyncResponseDto = {
        students: [],
        guardians: [],
        hasMore: false,
        syncMetadata: {
          serverTime: new Date().toISOString(),
          syncId: syncHistory.id.toString(),
          studentCount: 0,
          guardianCount: 0,
        },
      };

      const lastSyncTime = dto.lastSyncTime
        ? new Date(dto.lastSyncTime)
        : new Date('2000-01-01');
      const limit = dto.limit || 1000;

      // Sync students
      if (dto.entityTypes.includes('student')) {
        const students = await this.getUpdatedStudents(
          companyId,
          lastSyncTime,
          limit,
        );
        result.students = students.map((student) => ({
          ...student,
          qrCode: `student:${student.id}`,
        }));
        result.syncMetadata.studentCount = result.students.length;

        // Update last sync time
        if (result.students.length > 0) {
          await this.prisma.deviceConnection.update({
            where: { id: deviceConnection.id },
            data: { lastStudentSyncAt: new Date() },
          });
        }
      }

      // Sync guardians
      if (dto.entityTypes.includes('guardian')) {
        const guardians = await this.getUpdatedGuardians(
          companyId,
          lastSyncTime,
          limit,
        );
        result.guardians = guardians.map((guardian) => ({
          ...guardian,
          qrCode: `guardian:${guardian.id}`,
        }));
        result.syncMetadata.guardianCount = result.guardians.length;

        // Update last sync time
        if (result.guardians.length > 0) {
          await this.prisma.deviceConnection.update({
            where: { id: deviceConnection.id },
            data: { lastGuardianSyncAt: new Date() },
          });
        }
      }

      // Complete sync history
      await this.completeSyncHistory(
        syncHistory.id,
        'success',
        result.syncMetadata.studentCount + result.syncMetadata.guardianCount,
      );

      return result;
    } catch (error) {
      await this.completeSyncHistory(
        syncHistory.id,
        'failed',
        0,
        error.message,
      );
      throw error;
    }
  }

  async getSyncStatus(
    deviceConnection: DeviceConnection,
    companyId: number,
  ): Promise<SyncStatusResponseDto> {
    const [studentCount, guardianCount] = await Promise.all([
      this.prisma.student.count({
        where: { companyId, isDeleted: false },
      }),
      this.prisma.guardian.count({
        where: { companyId, isDeleted: false },
      }),
    ]);

    return {
      lastStudentSync:
        deviceConnection.lastStudentSyncAt?.toISOString() || null,
      lastGuardianSync:
        deviceConnection.lastGuardianSyncAt?.toISOString() || null,
      totalStudents: studentCount,
      totalGuardians: guardianCount,
      deviceName: deviceConnection.deviceName,
      isConnected: deviceConnection.isConnected,
    };
  }

  async validateLicense(licenseKey: string): Promise<boolean> {
    const license = await this.prisma.deviceLicense.findFirst({
      where: {
        licenseKey,
        isActive: true,
        isDeleted: false,
      },
    });

    return !!license;
  }

  private async getUpdatedStudents(
    companyId: number,
    lastSyncTime: Date,
    limit: number,
  ) {
    return this.prisma.student.findMany({
      where: {
        companyId,
        OR: [
          { createdAt: { gt: lastSyncTime } },
          { updatedAt: { gt: lastSyncTime } },
        ],
      },
      take: limit,
      orderBy: { updatedAt: 'asc' },
      select: {
        id: true,
        studentNumber: true,
        firstName: true,
        lastName: true,
        middleName: true,
        gender: true,
        isActive: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private async getUpdatedGuardians(
    companyId: number,
    lastSyncTime: Date,
    limit: number,
  ) {
    return this.prisma.guardian.findMany({
      where: {
        companyId,
        OR: [
          { createdAt: { gt: lastSyncTime } },
          { updatedAt: { gt: lastSyncTime } },
        ],
      },
      take: limit,
      orderBy: { updatedAt: 'asc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        contactNumber: true,
        isActive: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private async startSyncHistory(
    deviceConnectionId: number,
    syncType: string,
    entityType: string,
  ): Promise<SyncHistory> {
    return this.prisma.syncHistory.create({
      data: {
        deviceConnectionId,
        syncType,
        entityType,
        recordsFetched: 0,
        syncStartTime: new Date(),
        syncEndTime: new Date(),
        status: 'in_progress',
      },
    });
  }

  private async completeSyncHistory(
    id: number,
    status: string,
    recordsFetched: number,
    error?: string,
  ): Promise<void> {
    await this.prisma.syncHistory.update({
      where: { id },
      data: {
        status,
        recordsFetched,
        syncEndTime: new Date(),
        error,
      },
    });
  }

  async submitSchoolAttendance(
    deviceConnection: DeviceConnection,
    companyId: number,
    dto: SchoolAttendanceBatchDto,
  ): Promise<SchoolAttendanceSyncResponseDto> {
    const response: SchoolAttendanceSyncResponseDto = {
      received: dto.records.length,
      processed: 0,
      failed: 0,
      failedRecordIds: [],
      processedRecordIds: [],
      serverTime: new Date().toISOString(),
    };

    // Process each attendance record
    for (const record of dto.records) {
      try {
        // Check for duplicate within time window (5 minutes)
        const fiveMinutesAgo = new Date(
          new Date(record.timestamp).getTime() - 5 * 60 * 1000,
        );
        const existingRecord = await this.prisma.schoolAttendance.findFirst({
          where: {
            personId: record.personId,
            action: record.action,
            timestamp: {
              gte: fiveMinutesAgo,
              lte: new Date(record.timestamp),
            },
            companyId,
          },
        });

        if (existingRecord) {
          // Skip duplicate
          response.failedRecordIds.push(record.id);
          response.failed++;
          continue;
        }

        // Create attendance record
        const attendanceRecord = await this.prisma.schoolAttendance.create({
          data: {
            qrCode: record.qrCode,
            personId: record.personId,
            personType: record.personType,
            personName: record.personName,
            action: record.action,
            timestamp: new Date(record.timestamp),
            deviceId: record.deviceId || deviceConnection.deviceName,
            location: record.location,
            syncedAt: new Date(),
            companyId,
          },
        });

        // Emit real-time event if it's a student attendance
        if (record.personType === 'student') {
          console.log(
            `Processing attendance for student: ${record.personName} (${record.personId})`,
          );

          // Find guardians for this student
          const studentGuardians = await this.prisma.studentGuardian.findMany({
            where: {
              studentId: record.personId,
            },
            select: {
              guardianId: true,
            },
          });

          const guardianIds = studentGuardians.map((sg) => sg.guardianId);
          console.log(
            `Found ${guardianIds.length} guardians for student:`,
            guardianIds,
          );

          if (guardianIds.length > 0) {
            // Emit attendance status update
            console.log('Emitting attendance:status_update event to guardians');
            await this.guardianAttendanceGateway.emitAttendanceStatusUpdate(
              guardianIds,
              {
                studentId: record.personId,
                studentName: record.personName,
                status:
                  record.action === 'check_in' ? 'in_school' : 'out_of_school',
                timestamp: attendanceRecord.timestamp.toISOString(),
                gate: record.location,
              },
            );

            // Emit new attendance log
            console.log('Emitting attendance:new_log event to guardians');
            await this.guardianAttendanceGateway.emitNewAttendanceLog(
              guardianIds,
              {
                id: attendanceRecord.id,
                studentId: record.personId,
                studentName: record.personName,
                action: record.action,
                timestamp: attendanceRecord.timestamp.toISOString(),
                formattedDate: new Date(
                  attendanceRecord.timestamp,
                ).toLocaleDateString(),
                formattedTime: new Date(
                  attendanceRecord.timestamp,
                ).toLocaleTimeString(),
                location: record.location,
                deviceId: attendanceRecord.deviceId,
              },
            );
            console.log('Socket events emitted successfully');

            // Send push notifications to guardians
            try {
              console.log('Sending push notifications to guardians');
              await this.pushNotificationService.sendAttendanceNotification(
                guardianIds,
                record.personName,
                record.action as 'check_in' | 'check_out',
                attendanceRecord.timestamp,
              );
              console.log('Push notifications sent successfully');
            } catch (pushError) {
              console.error('Failed to send push notifications:', pushError);
              // Don't fail the whole operation if push fails
            }
          } else {
            console.log('No guardians found for this student');
          }
        }

        response.processedRecordIds.push(record.id);
        response.processed++;
      } catch (error) {
        response.failedRecordIds.push(record.id);
        response.failed++;
        console.error(
          `Failed to process attendance record ${record.id}:`,
          error,
        );
      }
    }

    // Update device last seen
    await this.prisma.deviceConnection.update({
      where: { id: deviceConnection.id },
      data: { lastSeen: new Date() },
    });

    return response;
  }

  async getPendingAttendanceCount(
    deviceConnection: DeviceConnection,
    companyId: number,
  ): Promise<SchoolAttendancePendingDto> {
    // Get count of unsynced records (those without syncedAt)
    const pendingCount = await this.prisma.schoolAttendance.count({
      where: {
        companyId,
        syncedAt: null,
      },
    });

    // Get oldest pending record
    const oldestPending = await this.prisma.schoolAttendance.findFirst({
      where: {
        companyId,
        syncedAt: null,
      },
      orderBy: {
        timestamp: 'asc',
      },
      select: {
        timestamp: true,
      },
    });

    return {
      pendingCount,
      oldestPendingTime: oldestPending?.timestamp.toISOString() || null,
    };
  }

  async pullAttendanceFromDevices(
    deviceConnection: DeviceConnection,
    companyId: number,
    dto: AttendancePullRequestDto,
  ): Promise<AttendancePullResponseDto> {
    const limit = dto.limit || 100;

    const whereClause: any = {
      companyId,
      syncedAt: { not: null }, // Only synced records
    };

    if (dto.lastSyncTime) {
      whereClause.createdAt = { gt: new Date(dto.lastSyncTime) };
    }

    const records = await this.prisma.schoolAttendance.findMany({
      where: whereClause,
      take: limit,
      orderBy: { createdAt: 'asc' }, // Chronological order for proper sync
    });

    return {
      records: records.map((r) => ({
        id: r.id,
        qrCode: r.qrCode,
        personId: r.personId,
        personType: r.personType,
        personName: r.personName,
        action: r.action,
        timestamp: r.timestamp.toISOString(),
        deviceId: r.deviceId,
        location: r.location,
        profilePhoto: r.profilePhoto,
        createdAt: r.createdAt.toISOString(),
      })),
      hasMore: records.length === limit,
      serverTime: new Date().toISOString(),
    };
  }
}

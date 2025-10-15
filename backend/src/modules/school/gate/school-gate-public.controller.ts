import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  HttpStatus,
  HttpCode,
  BadRequestException,
  UnauthorizedException,
  Render,
} from '@nestjs/common';
import { GateService } from './gate.service';
import { DeviceLicenseService } from '../device-license/device-license.service';
import { AttendanceService } from '../attendance/attendance.service';
import { Public } from '@common/decorators/public.decorator';

@Controller('api/public/school-gate')
@Public() // Mark all endpoints as public (no auth required)
export class SchoolGatePublicController {
  constructor(
    private readonly gateService: GateService,
    private readonly deviceLicenseService: DeviceLicenseService,
    private readonly attendanceService: AttendanceService,
  ) {}

  /**
   * API Documentation page
   * GET /api/public/school-gate
   */
  @Get()
  @Render('school-gate/api-documentation')
  async getDocumentation() {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const wsUrl = process.env.WS_URL || 'ws://localhost:4000';
    const lastUpdated = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      layout: 'api-documentation',
      title: 'School Gate API',
      description: 'REST API for school gate devices and student/guardian attendance tracking',
      baseUrl: `${baseUrl}/api/public/school-gate`,
      version: 'v1.0',
      wsUrl,
      lastUpdated,
      companyName: 'ANTE GEER',
      theme: {
        primaryColor: '#1976d2',
        secondaryColor: '#f50057',
        headerGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        headerGradientDark: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
      },
      hasQuickStart: true,
      hasWebSocket: true,
    };
  }

  /**
   * Validate device license
   * POST /api/public/school-gate/validate
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateLicense(
    @Headers('x-license-key') licenseKey: string,
    @Body() body: { deviceInfo?: any },
  ) {
    if (!licenseKey) {
      throw new BadRequestException('License key is required');
    }

    try {
      const license = await this.deviceLicenseService.validateLicense(licenseKey);

      if (!license) {
        throw new UnauthorizedException('Invalid license key');
      }

      // Update last used date
      await this.deviceLicenseService.updateLastUsed(license.id);

      return {
        success: true,
        data: {
          licenseId: license.id,
          gateId: license.gateId,
          gateName: license.gate?.gateName,
          companyId: license.companyId,
          isActive: license.isActive,
        },
        message: 'License validated successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Failed to validate license');
    }
  }

  /**
   * Record student check-in
   * POST /api/public/school-gate/check-in
   */
  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  async recordCheckIn(
    @Headers('x-license-key') licenseKey: string,
    @Body() body: {
      studentId: string;
      timestamp?: string;
      photo?: string;
      temperature?: number;
      gateId?: string;
    },
  ) {
    if (!licenseKey) {
      throw new BadRequestException('License key is required');
    }

    const license = await this.deviceLicenseService.validateLicense(licenseKey);
    if (!license) {
      throw new UnauthorizedException('Invalid license key');
    }

    if (!body.studentId) {
      throw new BadRequestException('Student ID is required');
    }

    try {
      const attendance = await this.attendanceService.recordCheckIn({
        studentId: body.studentId,
        gateId: body.gateId || license.gateId,
        timestamp: body.timestamp || new Date().toISOString(),
        photo: body.photo,
        temperature: body.temperature,
        companyId: license.companyId,
      });

      return {
        success: true,
        data: attendance,
        message: 'Check-in recorded successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Failed to record check-in');
    }
  }

  /**
   * Record student check-out
   * POST /api/public/school-gate/check-out
   */
  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  async recordCheckOut(
    @Headers('x-license-key') licenseKey: string,
    @Body() body: {
      studentId: string;
      timestamp?: string;
      photo?: string;
      gateId?: string;
    },
  ) {
    if (!licenseKey) {
      throw new BadRequestException('License key is required');
    }

    const license = await this.deviceLicenseService.validateLicense(licenseKey);
    if (!license) {
      throw new UnauthorizedException('Invalid license key');
    }

    if (!body.studentId) {
      throw new BadRequestException('Student ID is required');
    }

    try {
      const attendance = await this.attendanceService.recordCheckOut({
        studentId: body.studentId,
        gateId: body.gateId || license.gateId,
        timestamp: body.timestamp || new Date().toISOString(),
        photo: body.photo,
        companyId: license.companyId,
      });

      return {
        success: true,
        data: attendance,
        message: 'Check-out recorded successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Failed to record check-out');
    }
  }

  /**
   * Get gate/device status
   * GET /api/public/school-gate/status
   */
  @Post('status')
  @HttpCode(HttpStatus.OK)
  async getStatus(
    @Headers('x-license-key') licenseKey: string,
  ) {
    if (!licenseKey) {
      throw new BadRequestException('License key is required');
    }

    const license = await this.deviceLicenseService.validateLicense(licenseKey);
    if (!license) {
      throw new UnauthorizedException('Invalid license key');
    }

    try {
      const gateStatus = await this.gateService.getGateStatus(license.gateId);

      return {
        success: true,
        data: {
          gate: {
            id: license.gateId,
            name: license.gate?.gateName,
            isActive: true,
          },
          device: {
            licenseId: license.id,
            isActive: license.isActive,
            lastSeen: new Date().toISOString(),
          },
          statistics: gateStatus,
        },
        message: 'Status retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Failed to get status');
    }
  }

  /**
   * Sync attendance data
   * POST /api/public/school-gate/sync
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncAttendance(
    @Headers('x-license-key') licenseKey: string,
    @Body() body: {
      attendanceRecords: Array<{
        studentId: string;
        type: 'check-in' | 'check-out';
        timestamp: string;
        photo?: string;
        temperature?: number;
      }>;
      deviceInfo?: any;
    },
  ) {
    if (!licenseKey) {
      throw new BadRequestException('License key is required');
    }

    const license = await this.deviceLicenseService.validateLicense(licenseKey);
    if (!license) {
      throw new UnauthorizedException('Invalid license key');
    }

    if (!body.attendanceRecords || !Array.isArray(body.attendanceRecords)) {
      throw new BadRequestException('Attendance records are required');
    }

    try {
      const results = await this.attendanceService.syncBatchAttendance({
        records: body.attendanceRecords,
        gateId: license.gateId,
        companyId: license.companyId,
      });

      return {
        success: true,
        data: {
          processed: results.processed,
          failed: results.failed,
          errors: results.errors,
        },
        message: 'Sync completed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Failed to sync attendance data');
    }
  }

  /**
   * Get student list for the gate
   * POST /api/public/school-gate/students
   */
  @Post('students')
  @HttpCode(HttpStatus.OK)
  async getStudents(
    @Headers('x-license-key') licenseKey: string,
    @Body() body: {
      search?: string;
      gradeLevel?: string;
      section?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    if (!licenseKey) {
      throw new BadRequestException('License key is required');
    }

    const license = await this.deviceLicenseService.validateLicense(licenseKey);
    if (!license) {
      throw new UnauthorizedException('Invalid license key');
    }

    try {
      const students = await this.gateService.getStudentsForGate({
        companyId: license.companyId,
        search: body.search,
        gradeLevel: body.gradeLevel,
        section: body.section,
        limit: body.limit || 100,
        offset: body.offset || 0,
      });

      return {
        success: true,
        data: students,
        message: 'Students retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Failed to get students');
    }
  }

  /**
   * Device heartbeat/keep-alive
   * POST /api/public/school-gate/heartbeat
   */
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  async heartbeat(
    @Headers('x-license-key') licenseKey: string,
    @Body() body: {
      deviceInfo?: {
        deviceName?: string;
        macAddress?: string;
        ipAddress?: string;
        version?: string;
      };
      statistics?: {
        checkInsToday?: number;
        checkOutsToday?: number;
        pendingSync?: number;
      };
    },
  ) {
    if (!licenseKey) {
      throw new BadRequestException('License key is required');
    }

    const license = await this.deviceLicenseService.validateLicense(licenseKey);
    if (!license) {
      throw new UnauthorizedException('Invalid license key');
    }

    try {
      // Update device last seen
      await this.deviceLicenseService.updateHeartbeat(
        license.id,
        body.deviceInfo,
        body.statistics,
      );

      return {
        success: true,
        data: {
          licenseId: license.id,
          serverTime: new Date().toISOString(),
          nextHeartbeat: 60, // seconds until next heartbeat
        },
        message: 'Heartbeat received',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Failed to process heartbeat');
    }
  }

  /**
   * Smart QR code scan - Auto determines check-in or check-out
   * POST /api/public/school-gate/scan
   */
  @Post('scan')
  @HttpCode(HttpStatus.OK)
  async scanQRCode(
    @Headers('x-license-key') licenseKey: string,
    @Body() body: {
      qrCode: string;
      timestamp?: string;
      photo?: string;
      temperature?: number;
    },
  ) {
    if (!licenseKey) {
      throw new BadRequestException('License key is required');
    }

    const license = await this.deviceLicenseService.validateLicense(licenseKey);
    if (!license) {
      throw new UnauthorizedException('Invalid license key');
    }

    if (!body.qrCode) {
      throw new BadRequestException('QR code is required');
    }

    try {
      const result = await this.gateService.processScan({
        qrCode: body.qrCode,
        gateId: license.gateId,
        timestamp: body.timestamp || new Date().toISOString(),
        photo: body.photo,
        temperature: body.temperature,
        companyId: license.companyId,
      });

      return {
        success: true,
        data: result,
        message: `${result.action === 'check_in' ? 'Check-in' : 'Check-out'} recorded successfully`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to process scan');
    }
  }

  /**
   * Get today's attendance records
   * GET /api/public/school-gate/attendance/today
   */
  @Get('attendance/today')
  @HttpCode(HttpStatus.OK)
  async getTodayAttendance(
    @Headers('x-license-key') licenseKey: string,
  ) {
    if (!licenseKey) {
      throw new BadRequestException('License key is required');
    }

    const license = await this.deviceLicenseService.validateLicense(licenseKey);
    if (!license) {
      throw new UnauthorizedException('Invalid license key');
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const attendance = await this.gateService.getAttendanceByDate({
        companyId: license.companyId,
        date: today,
        limit: 100,
      });

      return {
        success: true,
        data: attendance,
        message: 'Today\'s attendance retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Failed to get attendance');
    }
  }

  /**
   * Get currently checked-in people
   * GET /api/public/school-gate/attendance/checked-in
   */
  @Get('attendance/checked-in')
  @HttpCode(HttpStatus.OK)
  async getCurrentlyCheckedIn(
    @Headers('x-license-key') licenseKey: string,
  ) {
    if (!licenseKey) {
      throw new BadRequestException('License key is required');
    }

    const license = await this.deviceLicenseService.validateLicense(licenseKey);
    if (!license) {
      throw new UnauthorizedException('Invalid license key');
    }

    try {
      const checkedIn = await this.attendanceService.getPeopleWithoutCheckout();

      return {
        success: true,
        data: checkedIn,
        message: 'Currently checked-in people retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Failed to get checked-in people');
    }
  }

  /**
   * Get attendance statistics for today
   * GET /api/public/school-gate/attendance/stats
   */
  @Get('attendance/stats')
  @HttpCode(HttpStatus.OK)
  async getAttendanceStats(
    @Headers('x-license-key') licenseKey: string,
  ) {
    if (!licenseKey) {
      throw new BadRequestException('License key is required');
    }

    const license = await this.deviceLicenseService.validateLicense(licenseKey);
    if (!license) {
      throw new UnauthorizedException('Invalid license key');
    }

    try {
      const stats = await this.attendanceService.getAttendanceSummary();

      return {
        success: true,
        data: stats,
        message: 'Attendance statistics retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Failed to get attendance statistics');
    }
  }

  /**
   * Get guardian list for the gate
   * POST /api/public/school-gate/guardians
   */
  @Post('guardians')
  @HttpCode(HttpStatus.OK)
  async getGuardians(
    @Headers('x-license-key') licenseKey: string,
    @Body() body: {
      search?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    if (!licenseKey) {
      throw new BadRequestException('License key is required');
    }

    const license = await this.deviceLicenseService.validateLicense(licenseKey);
    if (!license) {
      throw new UnauthorizedException('Invalid license key');
    }

    try {
      const guardians = await this.gateService.getGuardiansForGate({
        companyId: license.companyId,
        search: body.search,
        limit: body.limit || 100,
        offset: body.offset || 0,
      });

      return {
        success: true,
        data: guardians,
        message: 'Guardians retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Failed to get guardians');
    }
  }
}
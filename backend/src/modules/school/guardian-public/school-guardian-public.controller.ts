import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Render,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { SchoolGuardianPublicService } from './school-guardian-public.service';
import { GuardianPublicAuthGuard } from './guards/guardian-public-auth.guard';
import { Public } from '@common/decorators/public.decorator';
import {
  GuardianLoginDto,
  GuardianLogoutDto,
  AddStudentDto,
  UpdateProfileDto,
  MarkNotificationsReadDto,
  GetAttendanceLogsDto,
  GetNotificationsDto,
  RemoveStudentDto,
  ChangePasswordDto,
  UpdateDeviceTokenDto,
  UpdateNotificationPreferencesDto,
} from './dto/guardian-public.dto';

@ApiTags('School Guardian Public API')
@Controller('api/public/school-guardian')
export class SchoolGuardianPublicController {
  constructor(
    private readonly guardianService: SchoolGuardianPublicService,
  ) {}

  /**
   * API Documentation page
   * GET /api/public/school-guardian
   */
  @Get()
  @Public()
  @Render('school-guardian/api-documentation')
  async getDocumentation() {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const wsUrl = process.env.WS_URL || 'ws://localhost:4000';
    const lastUpdated = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      layout: 'api-documentation',
      title: 'School Guardian API',
      description: 'REST API for school guardian mobile applications and attendance tracking',
      baseUrl: `${baseUrl}/api/public/school-guardian`,
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
   * Guardian login
   * POST /api/public/school-guardian/auth/login
   */
  @Post('auth/login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Guardian login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({ type: GuardianLoginDto })
  async login(@Body(ValidationPipe) dto: GuardianLoginDto) {
    try {
      const result = await this.guardianService.login(dto);
      return {
        success: true,
        data: result,
        message: 'Login successful',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Login failed');
    }
  }

  /**
   * Guardian logout
   * POST /api/public/school-guardian/auth/logout
   */
  @Post('auth/logout')
  @UseGuards(GuardianPublicAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any, @Body() dto?: GuardianLogoutDto) {
    try {
      await this.guardianService.logout(req.user.id, req.headers.authorization);
      return {
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Logout failed');
    }
  }

  /**
   * Get guardian's students
   * GET /api/public/school-guardian/students
   */
  @Get('students')
  @UseGuards(GuardianPublicAuthGuard)
  async getStudents(@Request() req: any) {
    try {
      const students = await this.guardianService.getGuardianStudents(req.user.id);
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
   * Add student to guardian account
   * POST /api/public/school-guardian/students/add
   */
  @Post('students/add')
  @UseGuards(GuardianPublicAuthGuard)
  @HttpCode(HttpStatus.OK)
  async addStudent(@Request() req: any, @Body() dto: AddStudentDto) {
    try {
      const result = await this.guardianService.addStudentToGuardian(
        req.user.id,
        dto.studentId || dto.studentCode,
      );
      return {
        success: true,
        data: result,
        message: 'Student added successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to add student');
    }
  }

  /**
   * Remove student from guardian account
   * DELETE /api/public/school-guardian/students/:studentId
   */
  @Delete('students/:studentId')
  @UseGuards(GuardianPublicAuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeStudent(@Request() req: any, @Param('studentId') studentId: string) {
    try {
      await this.guardianService.removeStudentFromGuardian(req.user.id, studentId);
      return {
        success: true,
        message: 'Student removed successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to remove student');
    }
  }

  /**
   * Get current attendance status
   * GET /api/public/school-guardian/attendance/status
   */
  @Get('attendance/status')
  @UseGuards(GuardianPublicAuthGuard)
  async getAttendanceStatus(@Request() req: any) {
    try {
      const status = await this.guardianService.getStudentsCurrentStatus(req.user.id);
      return {
        success: true,
        data: status,
        message: 'Attendance status retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Failed to get attendance status');
    }
  }

  /**
   * Get attendance logs
   * GET /api/public/school-guardian/attendance/logs
   */
  @Get('attendance/logs')
  @UseGuards(GuardianPublicAuthGuard)
  async getAttendanceLogs(
    @Request() req: any,
    @Query() query: GetAttendanceLogsDto,
  ) {
    try {
      const logs = await this.guardianService.getRecentAttendanceLogs(
        req.user.id,
        query,
      );
      return {
        success: true,
        data: logs,
        message: 'Attendance logs retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Failed to get attendance logs');
    }
  }

  /**
   * Get notifications
   * GET /api/public/school-guardian/notifications
   */
  @Get('notifications')
  @UseGuards(GuardianPublicAuthGuard)
  async getNotifications(
    @Request() req: any,
    @Query() query: GetNotificationsDto,
  ) {
    try {
      const notifications = await this.guardianService.getNotifications(
        req.user.id,
        query.limit || 50,
        query.offset || 0,
      );
      return {
        success: true,
        data: notifications,
        message: 'Notifications retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Failed to get notifications');
    }
  }

  /**
   * Mark notifications as read
   * POST /api/public/school-guardian/notifications/read
   */
  @Post('notifications/read')
  @UseGuards(GuardianPublicAuthGuard)
  @HttpCode(HttpStatus.OK)
  async markNotificationsRead(
    @Request() req: any,
    @Body() dto: MarkNotificationsReadDto,
  ) {
    try {
      await this.guardianService.markNotificationsAsRead(
        req.user.id,
        dto.notificationIds,
      );
      return {
        success: true,
        message: 'Notifications marked as read',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Failed to mark notifications as read');
    }
  }

  /**
   * Get guardian profile
   * GET /api/public/school-guardian/profile
   */
  @Get('profile')
  @UseGuards(GuardianPublicAuthGuard)
  async getProfile(@Request() req: any) {
    try {
      const profile = await this.guardianService.getGuardianProfile(req.user.id);
      return {
        success: true,
        data: profile,
        message: 'Profile retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Failed to get profile');
    }
  }

  /**
   * Update guardian profile
   * PUT /api/public/school-guardian/profile
   */
  @Put('profile')
  @UseGuards(GuardianPublicAuthGuard)
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    try {
      const updatedProfile = await this.guardianService.updateGuardianProfile(
        req.user.id,
        dto,
      );
      return {
        success: true,
        data: updatedProfile,
        message: 'Profile updated successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException('Failed to update profile');
    }
  }
}
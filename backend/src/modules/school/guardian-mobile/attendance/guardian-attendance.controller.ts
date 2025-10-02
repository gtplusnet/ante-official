import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { GuardianAttendanceService } from './guardian-attendance.service';
import { GetAttendanceLogsDto } from './guardian-attendance.dto';
import { GuardianAuthGuard } from '../auth/guardian-mobile-auth.guard';

@Controller('api/guardian/attendance')
@UseGuards(GuardianAuthGuard)
export class GuardianAttendanceController {
  constructor(private readonly attendanceService: GuardianAttendanceService) {}

  @Get('status')
  async getStudentsCurrentStatus(@Req() req: any) {
    try {
      const statuses = await this.attendanceService.getStudentsCurrentStatus(
        req.user.id,
      );
      return {
        success: true,
        data: {
          statuses,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('logs')
  async getRecentAttendanceLogs(
    @Req() req: any,
    @Query() query: GetAttendanceLogsDto,
  ) {
    try {
      const result = await this.attendanceService.getRecentAttendanceLogs(
        req.user.id,
        {
          limit: query.limit,
          offset: query.offset,
          days: query.days,
        },
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw error;
    }
  }
}

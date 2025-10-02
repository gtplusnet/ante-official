import { Controller, Get, Put, Post, Body, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AttendanceService } from './attendance.service';
import { UtilityService } from '@common/utility.service';
import {
  AttendanceTableDto,
  AttendanceExportDto,
} from './attendance.validator';

@Controller('school/attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly utilityService: UtilityService,
  ) {}

  @Put('table')
  async getAttendanceTable(
    @Query() query: any,
    @Body() body: AttendanceTableDto,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.attendanceService.getAttendanceTable(query, body),
      res,
    );
  }

  @Get('device/list')
  async getDeviceList(@Res() res: Response) {
    return this.utilityService.responseHandler(
      this.attendanceService.getDeviceList(),
      res,
    );
  }

  @Post('export')
  async exportAttendance(
    @Body() dto: AttendanceExportDto,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.attendanceService.exportAttendance(dto),
      res,
    );
  }

  @Get('summary')
  async getAttendanceSummary(
    @Query('date') date: string,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.attendanceService.getAttendanceSummary(date),
      res,
    );
  }

  @Get('people-without-checkout')
  async getPeopleWithoutCheckout(
    @Query('date') date: string,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.attendanceService.getPeopleWithoutCheckout(date),
      res,
    );
  }
}

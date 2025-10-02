import {
  Controller,
  Get,
  Put,
  Post,
  Query,
  Param,
  Body,
  Res,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { AttendanceConflictsService } from './attendance-conflicts.service';
import {
  GetAttendanceConflictsDTO,
  ResolveConflictDTO,
  GetConflictStatsDTO,
  IgnoreConflictDTO,
} from './attendance-conflicts.interface';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';

@Controller('hr/timekeeping/attendance-conflicts')
export class AttendanceConflictsController {
  constructor(
    @Inject() private readonly utilityService: UtilityService,
    @Inject()
    private readonly attendanceConflictsService: AttendanceConflictsService,
  ) {}

  @Get()
  async getConflicts(
    @Query() query: GetAttendanceConflictsDTO,
    @Res() response: Response,
  ) {
    const currentAccountId = this.utilityService.accountInformation?.id;
    return this.utilityService.responseHandler(
      this.attendanceConflictsService.getConflicts(query, currentAccountId),
      response,
    );
  }

  @Get('stats')
  async getConflictStats(
    @Query() query: GetConflictStatsDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.attendanceConflictsService.getConflictStats(query),
      response,
    );
  }

  @Put(':id/resolve')
  async resolveConflict(
    @Param('id') id: string,
    @Body() body: ResolveConflictDTO,
    @Res() response: Response,
  ) {
    const conflictId = parseInt(id, 10);

    return this.utilityService.responseHandler(
      this.attendanceConflictsService.resolveConflict(
        conflictId,
        body.resolvedBy ||
          this.utilityService.accountInformation?.email ||
          'MANUAL',
      ),
      response,
    );
  }

  @Post(':id/ignore')
  async ignoreConflict(
    @Param('id') id: string,
    @Body() body: IgnoreConflictDTO,
    @Res() response: Response,
  ) {
    const conflictId = parseInt(id, 10);
    const currentAccountId = this.utilityService.accountInformation?.id;

    if (!currentAccountId) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('User not authenticated')),
        response,
      );
    }

    return this.utilityService.responseHandler(
      this.attendanceConflictsService.ignoreOrResolveConflict(
        conflictId,
        currentAccountId,
        body.action,
      ),
      response,
    );
  }

  @Put('employee-table')
  async getEmployeeConflictsTable(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.attendanceConflictsService.getEmployeeConflictsTable(query, body),
      response,
    );
  }
}

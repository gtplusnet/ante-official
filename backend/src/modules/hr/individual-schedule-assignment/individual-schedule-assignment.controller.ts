import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Inject,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IndividualScheduleAssignmentService } from './individual-schedule-assignment.service';
import { UtilityService } from '@common/utility.service';
import {
  BulkScheduleAssignmentDTO,
  GetScheduleAssignmentsDTO,
} from './individual-schedule-assignment.interface';

@ApiTags('Individual Schedule Assignment')
@Controller('hris/employee/individual-schedule-assignments')
export class IndividualScheduleAssignmentController {
  @Inject() private utilityService: UtilityService;

  constructor(
    private readonly individualScheduleAssignmentService: IndividualScheduleAssignmentService,
  ) {}

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk save individual schedule assignments' })
  async bulkSaveAssignments(
    @Body() data: BulkScheduleAssignmentDTO,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.individualScheduleAssignmentService.bulkSaveAssignments(
        data,
        this.utilityService.accountInformation?.id,
      ),
      res,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get individual schedule assignments for date range',
  })
  async getAssignments(
    @Query() query: GetScheduleAssignmentsDTO,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.individualScheduleAssignmentService.getAssignments(query),
      res,
    );
  }

  @Get('team-schedules')
  @ApiOperation({ summary: 'Get team schedules for employees with teams' })
  async getTeamSchedules(
    @Query() query: GetScheduleAssignmentsDTO,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.individualScheduleAssignmentService.getTeamSchedulesForEmployees(
        query,
      ),
      res,
    );
  }
}

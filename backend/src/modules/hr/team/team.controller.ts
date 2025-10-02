import {
  Body,
  Controller,
  Post,
  Put,
  Delete,
  Param,
  Res,
  Get,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { TeamService } from './team.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateTeamRequest,
  UpdateTeamRequest,
  AddTeamMemberRequest,
  BulkTeamScheduleAssignmentRequest,
} from './team.interface';
import { TableRequest } from '@shared/request';

@Controller('hr/team')
export class TeamController {
  constructor(
    private readonly teamService: TeamService,
    private readonly utilityService: UtilityService,
  ) {}

  @Put('table')
  async table(@Body() body: TableRequest, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.teamService.table(body, this.utilityService.companyId),
      res,
    );
  }

  @Get('all')
  async getAll(@Res() res: Response) {
    return this.utilityService.responseHandler(
      this.teamService.getAll(this.utilityService.companyId),
      res,
    );
  }

  @Get('employee/available-for-teams')
  async getAvailableEmployees(@Res() res: Response) {
    return this.utilityService.responseHandler(
      this.teamService.getAvailableEmployees(this.utilityService.companyId),
      res,
    );
  }

  @Post('create')
  async create(@Body() body: CreateTeamRequest, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.teamService.create(body, this.utilityService.companyId),
      res,
    );
  }

  @Put('update')
  async update(@Body() body: UpdateTeamRequest, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.teamService.update(body, this.utilityService.companyId),
      res,
    );
  }

  @Delete('delete/:id')
  async delete(@Param('id') id: string, @Res() res: Response) {
    const teamId = parseInt(id, 10);
    if (isNaN(teamId)) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('Invalid team ID')),
        res,
      );
    }

    return this.utilityService.responseHandler(
      this.teamService.delete(teamId, this.utilityService.companyId),
      res,
    );
  }

  @Get('schedule-assignments')
  async getScheduleAssignments(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('teamIds') teamIds: string,
    @Res() res: Response,
  ) {
    const teamIdArray = teamIds
      ? teamIds
          .split(',')
          .map((id) => parseInt(id, 10))
          .filter((id) => !isNaN(id))
      : [];

    return this.utilityService.responseHandler(
      this.teamService.getTeamScheduleAssignments(
        startDate,
        endDate,
        teamIdArray,
        this.utilityService.companyId,
      ),
      res,
    );
  }

  @Post('schedule-assignments/bulk')
  async saveScheduleAssignments(
    @Body() body: BulkTeamScheduleAssignmentRequest,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.teamService.saveTeamScheduleAssignments(
        body.assignments,
        this.utilityService.accountInformation.id,
        this.utilityService.companyId,
      ),
      res,
    );
  }

  @Get(':id')
  async getTeamWithMembers(@Param('id') id: string, @Res() res: Response) {
    const teamId = parseInt(id, 10);
    if (isNaN(teamId)) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('Invalid team ID')),
        res,
      );
    }

    return this.utilityService.responseHandler(
      this.teamService.getTeamWithMembers(
        teamId,
        this.utilityService.companyId,
      ),
      res,
    );
  }

  @Post('members/add')
  async addMembers(@Body() body: AddTeamMemberRequest, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.teamService.addMembers(body, this.utilityService.companyId),
      res,
    );
  }

  @Delete('members/:teamId/:accountId')
  async removeMember(
    @Param('teamId') teamId: string,
    @Param('accountId') accountId: string,
    @Res() res: Response,
  ) {
    const parsedTeamId = parseInt(teamId, 10);
    if (isNaN(parsedTeamId)) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('Invalid team ID')),
        res,
      );
    }

    return this.utilityService.responseHandler(
      this.teamService.removeMember(
        parsedTeamId,
        accountId,
        this.utilityService.companyId,
      ),
      res,
    );
  }
}

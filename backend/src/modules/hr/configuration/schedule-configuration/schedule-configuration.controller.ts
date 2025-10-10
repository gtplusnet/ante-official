import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Query,
  Body,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ScheduleConfigurationService } from './schedule-configuration.service';
import { UtilityService } from '@common/utility.service';
import {
  GetScheduleDTO,
  ScheduleCreateDTO,
  ScheduleUpdateDTO,
} from './schedule-configuration.interface';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';

@Controller('hr-configuration/schedule')
export class ScheduleConfigurationController {
  constructor(
    private readonly scheduleConfigurationService: ScheduleConfigurationService,
    private readonly utilityService: UtilityService,
  ) {}

  @Get('list')
  async getScheduleList(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.scheduleConfigurationService.getScheduleList(),
      response,
    );
  }

  @Get('info')
  async getScheduleInfo(
    @Query() query: GetScheduleDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.scheduleConfigurationService.getScheduleInfo(query),
      response,
    );
  }

  @Put('table')
  async getScheduleTable(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.scheduleConfigurationService.table(query, body),
      response,
    );
  }

  @Post('create')
  async createSchedule(
    @Body() body: ScheduleCreateDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.scheduleConfigurationService.create(body),
      response,
    );
  }

  @Delete('delete')
  async deleteSchedule(@Query('id') id: number, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.scheduleConfigurationService.deleteSchedule(id),
      response,
    );
  }

  @Patch('update')
  async updateSchedule(
    @Body() body: ScheduleUpdateDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.scheduleConfigurationService.create(body),
      response,
    );
  }
}

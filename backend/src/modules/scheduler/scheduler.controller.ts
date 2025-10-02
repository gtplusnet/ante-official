import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Response as NestResponse,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { SchedulerService } from './scheduler.service';
import { CreateSchedulerDTO, UpdateSchedulerDTO } from './scheduler.interface';

@Controller('scheduler')
export class SchedulerController {
  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly utilityService: UtilityService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateSchedulerDTO,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.schedulerService.create(dto),
      response,
    );
  }

  @Get()
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.schedulerService.findAll(parseInt(page) || 1, parseInt(limit) || 10),
      response,
    );
  }

  @Get('available-tasks')
  async getAvailableTasks(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.schedulerService.getAvailableTasks(),
      response,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.schedulerService.findOne(id),
      response,
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSchedulerDTO,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.schedulerService.update(id, dto),
      response,
    );
  }

  @Post(':id/toggle')
  async toggle(@Param('id') id: string, @NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.schedulerService.toggle(id),
      response,
    );
  }

  @Post(':id/run')
  async runNow(@Param('id') id: string, @NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.schedulerService.runNow(id),
      response,
    );
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.schedulerService.delete(id),
      response,
    );
  }

  @Get(':id/history')
  async getExecutionHistory(
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.schedulerService.getExecutionHistory(
        id,
        parseInt(page) || 1,
        parseInt(limit) || 10,
      ),
      response,
    );
  }

  @Get(':id/stats')
  async getStats(
    @Param('id') id: string,
    @Query('days') days: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.schedulerService.getStats(id, parseInt(days) || 30),
      response,
    );
  }
}

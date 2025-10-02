import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Query, 
  Inject,
  HttpStatus,
  BadRequestException,
  Response as NestResponse
} from '@nestjs/common';
import { Response } from 'express';
import { TimeTrackingService } from './time-tracking.service';
import { StartTimerDto } from './dto/start-timer.dto';
import { StopTimerDto } from './dto/stop-timer.dto';
import { GetHistoryDto } from './dto/get-history.dto';
import { CreateTaskAndStartDto } from './dto/create-task-and-start.dto';
import { UtilityService } from '@common/utility.service';

@Controller('time-tracking')
export class TimeTrackingController {
  @Inject() private readonly timeTrackingService: TimeTrackingService;
  @Inject() private readonly utilityService: UtilityService;

  @Post('start')
  async startTimer(
    @Body() dto: StartTimerDto,
    @NestResponse() res: Response,
  ) {
    const accountId = this.utilityService.accountInformation?.id;
    if (!accountId) {
      throw new BadRequestException('User not authenticated');
    }
    const result = await this.timeTrackingService.startTimer(accountId, dto);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  @Post('stop')
  async stopTimer(
    @Body() dto: StopTimerDto,
    @NestResponse() res: Response,
  ) {
    const accountId = this.utilityService.accountInformation?.id;
    if (!accountId) {
      throw new BadRequestException('User not authenticated');
    }
    const result = await this.timeTrackingService.stopTimer(accountId, dto);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  @Get('current')
  async getCurrentTimer(
    @NestResponse() res: Response,
  ) {
    const accountId = this.utilityService.accountInformation?.id;
    if (!accountId) {
      throw new BadRequestException('User not authenticated');
    }
    const result = await this.timeTrackingService.getCurrentTimer(accountId);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  @Get('history')
  async getHistory(
    @Query() dto: GetHistoryDto,
    @NestResponse() res: Response,
  ) {
    const accountId = this.utilityService.accountInformation?.id;
    if (!accountId) {
      throw new BadRequestException('User not authenticated');
    }
    const result = await this.timeTrackingService.getHistory(accountId, dto);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  @Get('daily-summary')
  async getDailySummary(
    @Query('date') date: string,
    @NestResponse() res: Response,
  ) {
    const accountId = this.utilityService.accountInformation?.id;
    if (!accountId) {
      throw new BadRequestException('User not authenticated');
    }
    const result = await this.timeTrackingService.getDailySummary(accountId, date);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  @Get('timer-tasks')
  async getTimerTasks(
    @NestResponse() res: Response,
  ) {
    const accountId = this.utilityService.accountInformation?.id;
    if (!accountId) {
      throw new BadRequestException('User not authenticated');
    }
    const result = await this.timeTrackingService.getTimerTasks(accountId);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  @Post('create-and-start')
  async createTaskAndStart(
    @Body() dto: CreateTaskAndStartDto,
    @NestResponse() res: Response,
  ) {
    const accountId = this.utilityService.accountInformation?.id;
    if (!accountId) {
      throw new BadRequestException('User not authenticated');
    }
    const result = await this.timeTrackingService.createTaskAndStart(accountId, dto);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }
}
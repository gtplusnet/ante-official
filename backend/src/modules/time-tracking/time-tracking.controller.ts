import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Inject,
  HttpStatus,
  BadRequestException,
  Response as NestResponse,
  Req
} from '@nestjs/common';
import { Request, Response } from 'express';
import { TimeTrackingService } from './time-tracking.service';
import { StartTimerDto } from './dto/start-timer.dto';
import { StopTimerDto } from './dto/stop-timer.dto';
import { GetHistoryDto } from './dto/get-history.dto';
import { CreateTaskAndStartDto } from './dto/create-task-and-start.dto';
import { TagTimerDto } from './dto/tag-timer.dto';
import { UtilityService } from '@common/utility.service';

@Controller('time-tracking')
export class TimeTrackingController {
  @Inject() private readonly timeTrackingService: TimeTrackingService;
  @Inject() private readonly utilityService: UtilityService;

  /**
   * Extract client IP address from request
   */
  private getClientIp(req: Request): string | undefined {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress;
  }

  @Post('start')
  async startTimer(
    @Body() dto: StartTimerDto,
    @Req() req: Request,
    @NestResponse() res: Response,
  ) {
    const accountId = this.utilityService.accountInformation?.id;
    if (!accountId) {
      throw new BadRequestException('User not authenticated');
    }

    // Extract TIME-IN IP address
    const timeInIpAddress = this.getClientIp(req);

    const result = await this.timeTrackingService.startTimer(accountId, dto, timeInIpAddress);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  @Post('stop')
  async stopTimer(
    @Body() dto: StopTimerDto,
    @Req() req: Request,
    @NestResponse() res: Response,
  ) {
    const accountId = this.utilityService.accountInformation?.id;
    if (!accountId) {
      throw new BadRequestException('User not authenticated');
    }

    // Extract TIME-OUT IP address
    const timeOutIpAddress = this.getClientIp(req);

    const result = await this.timeTrackingService.stopTimer(accountId, dto, timeOutIpAddress);
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
    @Req() req: Request,
    @NestResponse() res: Response,
  ) {
    const accountId = this.utilityService.accountInformation?.id;
    if (!accountId) {
      throw new BadRequestException('User not authenticated');
    }

    // Extract TIME-IN IP address
    const timeInIpAddress = this.getClientIp(req);

    const result = await this.timeTrackingService.createTaskAndStart(accountId, dto, timeInIpAddress);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  @Post('tag')
  async tagTimer(
    @Body() dto: TagTimerDto,
    @NestResponse() res: Response,
  ) {
    const accountId = this.utilityService.accountInformation?.id;
    if (!accountId) {
      throw new BadRequestException('User not authenticated');
    }
    const result = await this.timeTrackingService.tagTimerWithTask(accountId, dto);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  @Get('task-summary/:taskId')
  async getTaskSummary(
    @Query('taskId') taskId: string,
    @Query('date') date: string,
    @NestResponse() res: Response,
  ) {
    const accountId = this.utilityService.accountInformation?.id;
    if (!accountId) {
      throw new BadRequestException('User not authenticated');
    }
    const result = await this.timeTrackingService.getTaskSummary(
      accountId,
      parseInt(taskId),
      date
    );
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }
}
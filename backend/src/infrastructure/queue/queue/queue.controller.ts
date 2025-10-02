import {
  Body,
  Response as NestResponse,
  Inject,
  Query,
  Controller,
  Post,
  Get,
} from '@nestjs/common';

import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { QueueService } from './queue.service';
import { ReinitializeQueueDTO } from './queue.interface';

@Controller('queue')
export class QueueController {
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly queueService: QueueService;

  /* queue api */
  @Post('reinitialize')
  async reinitializeQueue(
    @Body() body: ReinitializeQueueDTO,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.queueService.reinitializeQueue(body),
      response,
    );
  }

  @Get('info')
  async getQueueInfo(
    @Query('id') id: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.queueService.getQueueInfo(id, true),
      response,
    );
  }

  @Get('table')
  async getQueueTable(@Query() query, @NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.queueService.getQueueTable(query),
      response,
    );
  }
}

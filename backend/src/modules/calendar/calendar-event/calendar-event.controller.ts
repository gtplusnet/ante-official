import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  Response as NestResponse,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { CalendarEventService } from './calendar-event.service';
import {
  CreateEventDto,
  UpdateEventDto,
  QuickUpdateEventDto,
  GetEventsQueryDto,
} from './calendar-event.dto';

@Controller('calendar/event')
export class CalendarEventController {
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly calendarEventService: CalendarEventService;

  @Get()
  async getEvents(
    @Query() query: GetEventsQueryDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.calendarEventService.getEvents(query),
      response,
    );
  }

  @Get(':id')
  async getEventById(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.calendarEventService.getEventById(id),
      response,
    );
  }

  @Post()
  async createEvent(
    @Body() data: CreateEventDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.calendarEventService.createEvent(data),
      response,
    );
  }

  @Put(':id')
  async updateEvent(
    @Param('id') id: string,
    @Body() data: UpdateEventDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.calendarEventService.updateEvent(id, data),
      response,
    );
  }

  @Put(':id/quick-update')
  async quickUpdateEvent(
    @Param('id') id: string,
    @Body() data: QuickUpdateEventDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.calendarEventService.quickUpdateEvent(id, data),
      response,
    );
  }

  @Delete(':id')
  async deleteEvent(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.calendarEventService.deleteEvent(id),
      response,
    );
  }
}

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
  Header,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { CalendarEventService } from './calendar-event.service';
import { CalendarIntegrationService } from './calendar-integration.service';
import { IcsExportService } from './ics-export.service';
import { IcsImportService } from './ics-import.service';
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
  @Inject() private readonly calendarIntegrationService: CalendarIntegrationService;
  @Inject() private readonly icsExportService: IcsExportService;
  @Inject() private readonly icsImportService: IcsImportService;

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

  @Get('expanded/all')
  async getExpandedEvents(
    @Query() query: GetEventsQueryDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.calendarEventService.getExpandedEvents(query),
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

  // Integration endpoints
  @Get('integration/personal')
  async getPersonalCalendarEvents(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.calendarIntegrationService.getPersonalCalendarEvents(startDate, endDate),
      response,
    );
  }

  @Get('integration/company')
  async getCompanyCalendarEvents(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.calendarIntegrationService.getCompanyCalendarEvents(startDate, endDate),
      response,
    );
  }

  // ICS Export endpoints
  @Get('export/:id')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="calendar-event.ics"')
  async exportEvent(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    try {
      const icsContent = await this.icsExportService.exportEvent(id);
      response.send(icsContent);
    } catch (error) {
      response.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to export event',
      });
    }
  }

  @Post('export/multiple')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="calendar-events.ics"')
  async exportMultipleEvents(
    @Body() data: { eventIds: string[] },
    @NestResponse() response: Response,
  ) {
    try {
      const icsContent = await this.icsExportService.exportEvents(data.eventIds);
      response.send(icsContent);
    } catch (error) {
      response.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to export events',
      });
    }
  }

  @Get('export/range')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="calendar-export.ics"')
  async exportDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('categoryIds') categoryIds: string,
    @NestResponse() response: Response,
  ) {
    try {
      const categoryIdsArray = categoryIds ? categoryIds.split(',').map(Number) : undefined;
      const icsContent = await this.icsExportService.exportDateRange(
        new Date(startDate),
        new Date(endDate),
        categoryIdsArray,
      );
      response.send(icsContent);
    } catch (error) {
      response.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to export date range',
      });
    }
  }

  // ICS Import endpoints
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importIcsFile(
    @UploadedFile() file: any,
    @Body('skipDuplicates') skipDuplicates: string,
    @Body('categoryId') categoryId: string,
    @Body('defaultVisibility') defaultVisibility: string,
    @NestResponse() response: Response,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    if (!file.originalname.endsWith('.ics')) {
      throw new BadRequestException('Invalid file type. Only .ics files are allowed');
    }

    try {
      const fileContent = file.buffer.toString('utf-8');

      const options = {
        skipDuplicates: skipDuplicates === 'true',
        categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
        defaultVisibility: defaultVisibility || 'private',
      };

      const result = await this.icsImportService.importEvents(fileContent, options);

      return this.utilityService.responseHandler(Promise.resolve(result), response);
    } catch (error) {
      response.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to import calendar file',
      });
    }
  }

  @Post('import/validate')
  @UseInterceptors(FileInterceptor('file'))
  async validateIcsFile(
    @UploadedFile() file: any,
    @NestResponse() response: Response,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    if (!file.originalname.endsWith('.ics')) {
      throw new BadRequestException('Invalid file type. Only .ics files are allowed');
    }

    try {
      const fileContent = file.buffer.toString('utf-8');
      const validation = this.icsImportService.validateIcsFile(fileContent);

      // Also parse to show preview
      let events = [];
      if (validation.valid) {
        try {
          events = this.icsImportService.parseIcsFile(fileContent);
        } catch (err) {
          console.error('Error parsing file for preview:', err);
        }
      }

      return this.utilityService.responseHandler(
        Promise.resolve({
          ...validation,
          eventCount: events.length,
          preview: events.slice(0, 10), // Show first 10 events
        }),
        response,
      );
    } catch (error) {
      response.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to validate calendar file',
      });
    }
  }
}

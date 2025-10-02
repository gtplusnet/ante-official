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
  Inject,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { AnnouncementService } from './announcement.service';
import {
  CreateAnnouncementValidator,
  UpdateAnnouncementValidator,
  AnnouncementListValidator,
} from './announcement.validator';

@Controller('announcement')
export class AnnouncementController {
  @Inject() public utilityService: UtilityService;
  @Inject() public announcementService: AnnouncementService;

  @Post()
  async create(
    @Body() createAnnouncementDto: CreateAnnouncementValidator,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.announcementService.create(createAnnouncementDto),
      response,
    );
  }

  @Get()
  async findAll(
    @Query() query: AnnouncementListValidator,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.announcementService.findAll(query),
      response,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.announcementService.findOne(id),
      response,
    );
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnnouncementDto: UpdateAnnouncementValidator,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.announcementService.update(id, updateAnnouncementDto),
      response,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.announcementService.remove(id),
      response,
    );
  }

  @Post(':id/view')
  async trackView(
    @Param('id', ParseIntPipe) id: number,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.announcementService.trackView(id),
      response,
    );
  }

  @Post(':id/acknowledge')
  async trackAcknowledgment(
    @Param('id', ParseIntPipe) id: number,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.announcementService.trackAcknowledgment(id),
      response,
    );
  }

  @Get(':id/stats')
  async getStats(
    @Param('id', ParseIntPipe) id: number,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.announcementService.getStats(id),
      response,
    );
  }
}

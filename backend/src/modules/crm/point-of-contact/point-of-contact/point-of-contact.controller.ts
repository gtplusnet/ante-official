import {
  Controller,
  Body,
  Inject,
  Post,
  Response as NestResponse,
  Query,
  Get,
  Patch,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { Response } from 'express';
import { PointOfContactService } from './point-of-contact.service';
import { UtilityService } from '@common/utility.service';
import {
  CreatePointOfContactDto,
  UpdatePointOfContactDto,
  FilterPointOfContactDto,
  BulkCreatePointOfContactDto,
} from './point-of-contact.validator.dto';

@Controller('point-of-contact')
export class PointOfContactController {
  @Inject() private service: PointOfContactService;
  @Inject() private utilityService: UtilityService;

  // Create single point of contact
  @Post()
  async create(
    @Body() dto: CreatePointOfContactDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.service.create(dto),
      response,
    );
  }

  // Get list of point of contacts with filtering
  @Get('list')
  async getList(
    @Query() query: FilterPointOfContactDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.service.getPointOfContactsList(query),
      response,
    );
  }

  // Get single point of contact
  @Get(':id')
  async findOne(@Param('id') id: string, @NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.service.findOne(parseInt(id)),
      response,
    );
  }

  // Update point of contact
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePointOfContactDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.service.update(parseInt(id), dto),
      response,
    );
  }

  // Archive point of contact (soft delete)
  @Patch(':id/archive')
  async archive(@Param('id') id: string, @NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.service.archive(parseInt(id)),
      response,
    );
  }

  // Delete point of contact (hard delete)
  @Delete(':id')
  async delete(@Param('id') id: string, @NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.service.delete(parseInt(id)),
      response,
    );
  }

  // Create multiple point of contacts
  @Post('bulk')
  async createBulk(
    @Body() dto: BulkCreatePointOfContactDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.service.createBulk(dto),
      response,
    );
  }
}

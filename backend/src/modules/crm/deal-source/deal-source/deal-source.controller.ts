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
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { DealSourceService } from './deal-source.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateDealSourceDto,
  UpdateDealSourceDto,
  DealSourceQueryDto,
} from './deal-source.validator.dto';

@Controller('deal-source')
export class DealSourceController {
  @Inject() private service: DealSourceService;
  @Inject() private utilityService: UtilityService;

  // Create new deal source
  @Post()
  async create(
    @Body() dto: CreateDealSourceDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.service.createDealSource(dto),
      response,
    );
  }

  // Get list of deal sources
  @Get('list')
  async getList(
    @Query() query: DealSourceQueryDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.service.getDealSourcesList(query),
      response,
    );
  }

  // Get single deal source by id
  @Get(':id')
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.service.getDealSourceById(id),
      response,
    );
  }

  // Update deal source
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDealSourceDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.service.updateDealSource(id, dto),
      response,
    );
  }

  // Archive deal source
  @Patch(':id/archive')
  async archive(
    @Param('id', ParseIntPipe) id: number,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.service.archiveDealSource(id),
      response,
    );
  }
}

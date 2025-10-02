import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { DealTypeService } from './deal-type.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateDealTypeDto,
  UpdateDealTypeDto,
  DealTypeQueryDto,
} from './deal-type.validator.dto';

@Controller('deal-type')
export class DealTypeController {
  @Inject() private readonly dealTypeService: DealTypeService;
  @Inject() private readonly utilityService: UtilityService;

  @Post()
  async createDealType(
    @Body() createDealTypeDto: CreateDealTypeDto,
    @Res() response: Response,
  ) {
    try {
      const dealType =
        await this.dealTypeService.createDealType(createDealTypeDto);
      return response.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'Deal type created successfully',
        data: dealType,
      });
    } catch (error) {
      return this.utilityService.errorResponse(
        response,
        error,
        'Failed to create deal type',
      );
    }
  }

  @Get()
  async getDealTypesList(
    @Query() query: DealTypeQueryDto,
    @Res() response: Response,
  ) {
    try {
      const dealTypes = await this.dealTypeService.getDealTypesList(query);
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Deal types retrieved successfully',
        data: dealTypes,
      });
    } catch (error) {
      return this.utilityService.errorResponse(
        response,
        error,
        'Failed to retrieve deal types',
      );
    }
  }

  @Get(':id')
  async getDealTypeById(@Param('id') id: string, @Res() response: Response) {
    try {
      const dealType = await this.dealTypeService.getDealTypeById(Number(id));
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Deal type retrieved successfully',
        data: dealType,
      });
    } catch (error) {
      return this.utilityService.errorResponse(
        response,
        error,
        'Failed to retrieve deal type',
      );
    }
  }

  @Put(':id')
  async updateDealType(
    @Param('id') id: string,
    @Body() updateDealTypeDto: UpdateDealTypeDto,
    @Res() response: Response,
  ) {
    try {
      const dealType = await this.dealTypeService.updateDealType(
        Number(id),
        updateDealTypeDto,
      );
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Deal type updated successfully',
        data: dealType,
      });
    } catch (error) {
      return this.utilityService.errorResponse(
        response,
        error,
        'Failed to update deal type',
      );
    }
  }

  @Delete(':id')
  async archiveDealType(@Param('id') id: string, @Res() response: Response) {
    try {
      const dealType = await this.dealTypeService.archiveDealType(Number(id));
      return response.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Deal type archived successfully',
        data: dealType,
      });
    } catch (error) {
      return this.utilityService.errorResponse(
        response,
        error,
        'Failed to archive deal type',
      );
    }
  }
}

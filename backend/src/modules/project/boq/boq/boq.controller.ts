import { Response } from 'express';
import {
  Controller,
  Get,
  Delete,
  HttpStatus,
  Response as NestResponse,
  Query,
  Body,
  Inject,
  Post,
  Put,
} from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import { BoqService } from './boq.service';
import { BoqQtoService } from './boq-qto.services';
import { BoqVersionService } from './boq-version.services';
import { CreateVersionDTO, InsertQuantityTakeOffItemDTO } from './boq.dto';

@Controller('boq')
export class BoqController {
  @Inject() public utility: UtilityService;
  @Inject() public boqService: BoqService;
  @Inject() public boqQtoService: BoqQtoService;
  @Inject() public boqVersionService: BoqVersionService;

  @Get('version')
  async versionList(
    @NestResponse() response: Response,
    @Query('projectId') projectId: number,
  ) {
    try {
      const data = await this.boqVersionService.list(projectId);
      response
        .status(HttpStatus.OK)
        .json({ message: 'Version List Successfully', data });
    } catch (error) {
      return this.utility.errorResponse(response, error, error.message);
    }
  }

  @Post('version')
  async versionCreate(
    @NestResponse() response: Response,
    @Body() params: CreateVersionDTO,
  ) {
    try {
      const data = await this.boqVersionService.createVersion(params);
      response.status(HttpStatus.OK).json({ message: 'Version Created', data });
    } catch (error) {
      return this.utility.errorResponse(response, error, error.message);
    }
  }

  @Get('quantity-take-off')
  async quantityTakeOffItemOptionList(
    @NestResponse() response: Response,
    @Query('key') key: number,
    @Query('search') search: string,
  ) {
    try {
      const list = await this.boqQtoService.optionList(key, search);
      response
        .status(HttpStatus.OK)
        .json({ message: 'Selection List Successfully Fetched', list });
    } catch (error) {
      return this.utility.errorResponse(response, error, error.message);
    }
  }
  @Get('quantity-take-off/selection')
  async quantityTakeOffItemSelectionAddedList(
    @NestResponse() response: Response,
    @Query('id') id: number,
  ) {
    try {
      const list = await this.boqQtoService.selectionList(id);
      response
        .status(HttpStatus.OK)
        .json({ message: 'Added List Successfully Fetched', list });
    } catch (error) {
      return this.utility.errorResponse(response, error, error.message);
    }
  }
  @Post('quantity-take-off')
  async quantityTakeOffItemInsertItem(
    @NestResponse() response: Response,
    @Body() params: InsertQuantityTakeOffItemDTO,
  ) {
    try {
      const data = await this.boqQtoService.insertItem(params);
      response.status(HttpStatus.OK).json({
        message: data.mode == 'insert' ? 'QTO Item Added' : 'QTO Item Updated',
        data: data.response,
      });
    } catch (error) {
      return this.utility.errorResponse(response, error, error.message);
    }
  }
  @Delete('quantity-take-off')
  async quantityTakeOffItemSelectionRemoved(
    @NestResponse() response: Response,
    @Query('id') id: number,
  ) {
    try {
      const data = await this.boqQtoService.removeSelection(id);
      response
        .status(HttpStatus.OK)
        .json({ message: 'List Successfully Fetched', data });
    } catch (error) {
      return this.utility.errorResponse(response, error, error.message);
    }
  }
  @Put('quantity-take-off/submit')
  async quantityTakeOffItemSubmit(
    @NestResponse() response: Response,
    @Body('key') key: number,
  ) {
    try {
      const data = await this.boqQtoService.submit(key);
      response
        .status(HttpStatus.OK)
        .json({ message: 'Quantity Selection Approved', data });
    } catch (error) {
      return this.utility.errorResponse(response, error, error.message);
    }
  }
}

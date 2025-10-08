import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Inject,
  Response as NestResponse,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { CalendarCategoryService } from './calendar-category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './calendar-category.dto';

@Controller('calendar/category')
export class CalendarCategoryController {
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly calendarCategoryService: CalendarCategoryService;

  @Get()
  async getCategories(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.calendarCategoryService.getCategories(),
      response,
    );
  }

  @Get(':id')
  async getCategoryById(
    @Param('id', ParseIntPipe) id: number,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.calendarCategoryService.getCategoryById(id),
      response,
    );
  }

  @Post()
  async createCategory(
    @Body() data: CreateCategoryDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.calendarCategoryService.createCategory(data),
      response,
    );
  }

  @Put(':id')
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCategoryDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.calendarCategoryService.updateCategory(id, data),
      response,
    );
  }

  @Delete(':id')
  async deleteCategory(
    @Param('id', ParseIntPipe) id: number,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.calendarCategoryService.deleteCategory(id),
      response,
    );
  }
}

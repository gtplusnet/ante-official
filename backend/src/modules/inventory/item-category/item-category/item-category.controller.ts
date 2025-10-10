import {
  Inject,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Res,
  Query,
  Param,
} from '@nestjs/common';
import { ItemCategoryService } from './item-category.service';
import { UtilityService } from '@common/utility.service';
import { CreateItemCategoryDto } from '../dto/create-item-category.dto';
import { UpdateItemCategoryDto } from '../dto/update-item-category.dto';
import { QueryItemCategoryDto } from '../dto/query-item-category.dto';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { Response } from 'express';

@Controller('item-category')
export class ItemCategoryController {
  @Inject() public itemCategoryService: ItemCategoryService;
  @Inject() public utility: UtilityService;

  /**
   * Get categories for select box dropdown
   * @param response Express response object
   * @returns List of categories with id, name, code, and parentId
   */
  @Get('select-box')
  async getSelectBox(@Res() response: Response) {
    return this.utility.responseHandler(
      this.itemCategoryService.getSelectBox(),
      response,
    );
  }

  /**
   * Get parent options for category creation/editing
   * @param response Express response object
   * @param excludeId Optional category ID to exclude (along with its descendants)
   * @returns List of valid parent categories
   */
  @Get('parent-options')
  async getParentOptions(
    @Res() response: Response,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.utility.responseHandler(
      this.itemCategoryService.getParentOptions(
        excludeId ? parseInt(excludeId, 10) : undefined,
      ),
      response,
    );
  }

  /**
   * Get category tree structure
   * @param response Express response object
   * @returns Hierarchical tree of categories
   */
  @Get('tree')
  async getTree(@Res() response: Response) {
    return this.utility.responseHandler(
      this.itemCategoryService.getTree(),
      response,
    );
  }

  /**
   * Get all categories or a single category by ID
   * @param response Express response object
   * @param query Query parameters validated by QueryItemCategoryDto
   * @returns Category(ies) data
   */
  @Get()
  async get(@Res() response: Response, @Query() query: QueryItemCategoryDto) {
    if (query.id) {
      return this.utility.responseHandler(
        this.itemCategoryService.findOne(query.id),
        response,
      );
    }
    return this.utility.responseHandler(
      this.itemCategoryService.findAll(query),
      response,
    );
  }

  /**
   * Get a single category by ID
   * @param response Express response object
   * @param id Category ID
   * @returns Category data
   */
  @Get(':id')
  async getById(@Res() response: Response, @Param('id') id: string) {
    return this.utility.responseHandler(
      this.itemCategoryService.findOne(parseInt(id, 10)),
      response,
    );
  }

  /**
   * Table endpoint for paginated category data
   * @param response Express response object
   * @param query Table query DTO
   * @param body Table body DTO
   * @returns Paginated table data
   */
  @Put()
  async table(
    @Res() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    return this.utility.responseHandler(
      this.itemCategoryService.table(query, body),
      response,
    );
  }

  /**
   * Create a new category
   * @param response Express response object
   * @param dto Body parameters validated by CreateItemCategoryDto
   * @returns Created category data
   */
  @Post()
  async create(@Res() response: Response, @Body() dto: CreateItemCategoryDto) {
    return this.utility.responseHandler(
      this.itemCategoryService.create(dto),
      response,
    );
  }

  /**
   * Update an existing category
   * @param response Express response object
   * @param id Category ID
   * @param dto Body parameters validated by UpdateItemCategoryDto
   * @returns Updated category data
   */
  @Put(':id')
  async update(
    @Res() response: Response,
    @Param('id') id: string,
    @Body() dto: UpdateItemCategoryDto,
  ) {
    return this.utility.responseHandler(
      this.itemCategoryService.update(parseInt(id, 10), dto),
      response,
    );
  }

  /**
   * Soft delete a category
   * @param response Express response object
   * @param id Category ID
   * @returns Deleted category data
   */
  @Delete(':id')
  async delete(@Res() response: Response, @Param('id') id: string) {
    return this.utility.responseHandler(
      this.itemCategoryService.delete(parseInt(id, 10)),
      response,
    );
  }
}

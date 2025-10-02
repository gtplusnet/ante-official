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
import { BrandService } from './brand.service';
import { UtilityService } from '@common/utility.service';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { QueryBrandDto } from '../dto/query-brand.dto';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { Response } from 'express';

@Controller('brand')
export class BrandController {
  @Inject() public brandService: BrandService;
  @Inject() public utility: UtilityService;

  /**
   * Get brands for select box dropdown
   * @param response Express response object
   * @returns List of brands with id and name only
   */
  @Get('select-box')
  async getSelectBox(@Res() response: Response) {
    return this.utility.responseHandler(
      this.brandService.getSelectBox(),
      response,
    );
  }

  /**
   * Get all brands or a single brand by ID
   * @param response Express response object
   * @param query Query parameters validated by QueryBrandDto
   * @returns Brand(s) data
   */
  @Get()
  async get(@Res() response: Response, @Query() query: QueryBrandDto) {
    if (query.id) {
      return this.utility.responseHandler(
        this.brandService.findOne(query.id),
        response,
      );
    }
    return this.utility.responseHandler(
      this.brandService.findAll(query),
      response,
    );
  }

  /**
   * Get a single brand by ID
   * @param response Express response object
   * @param id Brand ID
   * @returns Brand data
   */
  @Get(':id')
  async getById(@Res() response: Response, @Param('id') id: string) {
    return this.utility.responseHandler(
      this.brandService.findOne(parseInt(id, 10)),
      response,
    );
  }

  /**
   * Table endpoint for paginated brand data
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
      this.brandService.table(query, body),
      response,
    );
  }

  /**
   * Create a new brand
   * @param response Express response object
   * @param dto Body parameters validated by CreateBrandDto
   * @returns Created brand data
   */
  @Post()
  async create(@Res() response: Response, @Body() dto: CreateBrandDto) {
    return this.utility.responseHandler(
      this.brandService.create(dto),
      response,
    );
  }

  /**
   * Update an existing brand
   * @param response Express response object
   * @param id Brand ID
   * @param dto Body parameters validated by UpdateBrandDto
   * @returns Updated brand data
   */
  @Put(':id')
  async update(
    @Res() response: Response,
    @Param('id') id: string,
    @Body() dto: UpdateBrandDto,
  ) {
    return this.utility.responseHandler(
      this.brandService.update(parseInt(id, 10), dto),
      response,
    );
  }

  /**
   * Soft delete a brand
   * @param response Express response object
   * @param id Brand ID
   * @returns Deleted brand data
   */
  @Delete(':id')
  async delete(@Res() response: Response, @Param('id') id: string) {
    return this.utility.responseHandler(
      this.brandService.delete(parseInt(id, 10)),
      response,
    );
  }
}

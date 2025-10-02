import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Response as NestResponse,
  Inject,
  Query,
  UsePipes,
  ValidationPipe,
  Param,
  Put,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { SupplierService } from './supplier.service';
import { CreateSupplierDTO } from '../../../../dto/supplier.validator.dto';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('supplier')
export class SupplierController {
  @Inject() public utilityService: UtilityService;
  @Inject() public supplierService: SupplierService;

  @Put('price-update-table')
  async getSupplierPriceUpdateHistory(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.supplierService.getSupplierPriceUpdateTable(query, body),
      response,
    );
  }

  @Post()
  async createSupplier(
    @Body() createSupplierDto: CreateSupplierDTO,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.supplierService.createSupplier(createSupplierDto),
      response,
    );
  }

  @Post('update-price')
  async updateSupplierPrice(
    @Body('itemId') itemId: string,
    @Body('supplierId') supplierId: number,
    @Body('price') price: number,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.supplierService.updateSupplierPrice(itemId, supplierId, price),
      response,
    );
  }

  @Patch(':id')
  async updateSupplier(
    @Param('id', ParseIntPipe) id: number,
    @Body() createSupplierDto: CreateSupplierDTO,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.supplierService.updateSupplier(id, createSupplierDto),
      response,
    );
  }

  @Put()
  async table(
    @NestResponse() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    this.utilityService.responseHandler(
      this.supplierService.getSupplierTable(query, body),
      response,
    );
  }

  @Put('items-table')
  async getSupplierItemsTable(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.supplierService.getSupplierItemsTable(query, body),
      response,
    );
  }

  @Get(':id')
  async getSupplier(
    @Param('id', ParseIntPipe) id: number,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.supplierService.getSupplierById(id),
      response,
    );
  }

  @Delete(':id')
  async softDeleteSupplier(
    @Param('id', ParseIntPipe) id: number,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.supplierService.softDeleteSupplier(id),
      response,
    );
  }
}

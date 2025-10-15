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
} from '@nestjs/common';
import { Response } from 'express';
import { CashierService } from './cashier.service';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import {
  CashierCreateRequest,
  CashierUpdateRequest,
  CashierDeleteRequest,
  CashierListRequest,
} from '@shared/request/cashier.request';

@Controller('cashier')
export class CashierController {
  @Inject() private readonly cashierService: CashierService;
  @Inject() private readonly utilityService: UtilityService;

  /**
   * Get cashiers for table view (with pagination and filters)
   */
  @Put('table')
  async getCashierTable(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @NestResponse() res: Response,
  ) {
    const result = await this.cashierService.getCashierTable(query, body);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  /**
   * Get all cashiers for the company
   */
  @Get()
  async getAllCashiers(
    @Query('includeInactive') includeInactive: string,
    @NestResponse() res: Response,
  ) {
    const request: CashierListRequest = {
      includeInactive: includeInactive === 'true',
    };

    const result = await this.cashierService.getAllCashiers(request);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  /**
   * Get a single cashier by accountId
   */
  @Get(':accountId')
  async getCashier(
    @Param('accountId') accountId: string,
    @NestResponse() res: Response,
  ) {
    const result = await this.cashierService.getCashierByAccountId(accountId);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  /**
   * Create a new cashier
   */
  @Post()
  async createCashier(
    @Body() body: CashierCreateRequest,
    @NestResponse() res: Response,
  ) {
    const result = await this.cashierService.createCashier(body);
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  /**
   * Update cashier details
   */
  @Put(':accountId')
  async updateCashier(
    @Param('accountId') accountId: string,
    @Body() body: Omit<CashierUpdateRequest, 'accountId'>,
    @NestResponse() res: Response,
  ) {
    const result = await this.cashierService.updateCashier({
      ...body,
      accountId,
    });
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }

  /**
   * Delete (soft delete) a cashier
   */
  @Delete(':accountId')
  async deleteCashier(
    @Param('accountId') accountId: string,
    @NestResponse() res: Response,
  ) {
    const result = await this.cashierService.deleteCashier({ accountId });
    return this.utilityService.responseHandler(Promise.resolve(result), res);
  }
}

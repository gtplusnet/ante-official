import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Res,
  Inject,
  Put,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { UtilityService } from '@common/utility.service';
import {
  RefillInventoryDto,
  WriteOffInventoryDto,
  TransferInventoryDto,
} from '../../../../dto/inventory.validator';
import { Response } from 'express';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';

@Controller('inventory')
export class InventoryController {
  @Inject() public utility: UtilityService;
  @Inject() public inventoryService: InventoryService;

  @Put()
  async getInventory(
    @Res() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    try {
      const inventoryHistory = await this.inventoryService.getInventory(
        query,
        body,
      );
      return response.status(HttpStatus.OK).json({
        message: 'Inventory history successfully fetched.',
        table: inventoryHistory,
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Inventory history cannot be fetched.',
      );
    }
  }

  @Put('transactions')
  async getTransaction(
    @Res() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    try {
      const transactions = await this.inventoryService.getTransactionsTable(
        query,
        body,
      );
      return response.status(HttpStatus.OK).json({
        message: 'Transactions successfully fetched.',
        table: transactions,
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Transactions cannot be fetched.',
      );
    }
  }

  @Post('transfer')
  async transferInventory(
    @Res() response: Response,
    @Body() body: TransferInventoryDto,
  ) {
    try {
      await this.inventoryService.transferInventory(body);
      return response.status(HttpStatus.OK).json({
        message: 'Inventory transfer success.',
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Inventory transfer failed.',
      );
    }
  }

  @Post('refill')
  async refillInventory(
    @Res() response: Response,
    @Body() refillInventoryDto: RefillInventoryDto,
  ) {
    try {
      const result =
        await this.inventoryService.refillInventory(refillInventoryDto);

      return response.status(HttpStatus.OK).json({
        message: 'Inventory refilled successfully',
        data: result,
      });
    } catch (error) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        message: error.message,
        error: error.message,
      });
    }
  }

  @Post('writeoff')
  async writeOffInventory(
    @Res() response: Response,
    @Body() writeOffInventoryDto: WriteOffInventoryDto,
  ) {
    try {
      const result =
        await this.inventoryService.writeOffInventory(writeOffInventoryDto);

      return response.status(HttpStatus.OK).json({
        message: 'Inventory write-off success.',
        data: result,
      });
    } catch (error) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        message: error.message,
        error: error.message,
      });
    }
  }
}

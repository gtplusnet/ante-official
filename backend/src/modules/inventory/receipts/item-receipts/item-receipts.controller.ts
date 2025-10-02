import { Response } from 'express';
import {
  Controller,
  Get,
  Put,
  Response as NestResponse,
  Query,
  Body,
  Inject,
  Res,
} from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import { ItemReceiptsService } from './item-receipts.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';

@Controller('item-receipts')
export class ItemReceiptsController {
  @Inject() public utility: UtilityService;
  @Inject() public itemReceiptsService: ItemReceiptsService;

  @Get()
  async getItemReceiptInfo(
    @NestResponse() response: Response,
    @Query('id') id: number,
  ) {
    return this.utility.responseHandler(
      this.itemReceiptsService.getItemReceiptInfo(id),
      response,
    );
  }

  @Put()
  async table(
    @Res() response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    return this.utility.responseHandler(
      this.itemReceiptsService.getItemReceiptTable(query, body),
      response,
    );
  }
}

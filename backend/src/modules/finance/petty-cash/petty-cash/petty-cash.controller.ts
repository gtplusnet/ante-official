import {
  Body,
  Response as NestResponse,
  Inject,
  Query,
  Put,
  Controller,
  Post,
  Get,
  Patch,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { PettyCashService } from './petty-cash.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import {
  LiquidateApproveDTO,
  LiquidatePettyCashDTO,
  LiquidateRejectDTO,
  AssignPettyCashDTO,
  RefillPettyCashDTO,
  DeductPettyCashDTO,
  ReturnPettyCashDTO,
  TransferPettyCashDTO,
  ExtractReceiptDataDTO,
} from './petty-cash.interface';

@Controller('petty-cash')
export class PettyCashController {
  @Inject() public utilityService: UtilityService;
  @Inject() public pettyCashService: PettyCashService;

  @Get()
  async getPettyCashDetail(
    @NestResponse() response: Response,
    @Query('accountId') accountId: string,
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.getPettyCash(accountId),
      response,
    );
  }

  @Put('table')
  async table(
    @NestResponse() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.table(query, body),
      response,
    );
  }

  @Put('liquidation/table')
  async liquidationTable(
    @NestResponse() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.liquidationTable(query, body),
      response,
    );
  }

  @Get('liquidation/export')
  async exportLiquidations(
    @NestResponse() response: Response,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const buffer = await this.pettyCashService.exportLiquidations(
      startDate,
      endDate,
    );

    response.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="PettyCash_Liquidations_${startDate}_to_${endDate}.xlsx"`,
      'Content-Length': buffer.length,
    });

    response.send(buffer);
  }

  @Get('liquidation/my')
  async getMyLiquidations(
    @NestResponse() response: Response,
    @Query('holderId') holderId?: string,
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.getMyLiquidations(
        holderId ? parseInt(holderId) : undefined,
      ),
      response,
    );
  }

  @Post('liquidation')
  async liquidatePettyCash(
    @NestResponse() response: Response,
    @Body() body: LiquidatePettyCashDTO,
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.liquidatePettyCash(body),
      response,
    );
  }

  @Patch('liquidation/approve')
  async approveLiquidation(
    @NestResponse() response: Response,
    @Body() params: LiquidateApproveDTO,
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.approveLiquidation(params),
      response,
    );
  }

  @Patch('liquidation/reject')
  async rejectLiquidation(
    @NestResponse() response: Response,
    @Body() params: LiquidateRejectDTO,
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.rejectLiquidation(params),
      response,
    );
  }

  @Post('liquidation/:id/record-to-petty-cash')
  async recordLiquidationToPettyCash(
    @NestResponse() response: Response,
    @Param('id') liquidationId: string,
    @Body() body?: { remarks?: string },
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.recordLiquidationToPettyCash(
        parseInt(liquidationId),
        body?.remarks,
      ),
      response,
    );
  }

  @Post('liquidation/:id/approve-workflow')
  async approveWorkflowLiquidation(
    @NestResponse() response: Response,
    @Param('id') liquidationId: string,
    @Body() body?: { remarks?: string; action?: string },
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.approveWorkflowLiquidation(
        parseInt(liquidationId),
        body?.remarks,
        body?.action,
      ),
      response,
    );
  }

  // New endpoints for petty cash holder management

  @Post('holder/assign')
  async assignPettyCashHolder(
    @NestResponse() response: Response,
    @Body() params: AssignPettyCashDTO,
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.assignPettyCashHolder(params),
      response,
    );
  }

  @Post('holder/refill')
  async refillPettyCash(
    @NestResponse() response: Response,
    @Body() params: RefillPettyCashDTO,
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.refillPettyCash(params),
      response,
    );
  }

  @Post('holder/deduct')
  async deductPettyCash(
    @NestResponse() response: Response,
    @Body() params: DeductPettyCashDTO,
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.deductPettyCash(params),
      response,
    );
  }

  @Get('holder/list')
  async getPettyCashHolders(@NestResponse() response: Response) {
    this.utilityService.responseHandler(
      this.pettyCashService.getPettyCashHolders(),
      response,
    );
  }

  @Get('holder/current')
  async getCurrentUserHolder(@NestResponse() response: Response) {
    this.utilityService.responseHandler(
      this.pettyCashService.getCurrentUserHolder(),
      response,
    );
  }

  @Get('holder/:id/history')
  async getPettyCashHolderHistory(
    @NestResponse() response: Response,
    @Param('id') id: string,
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.getPettyCashHolderHistory(parseInt(id)),
      response,
    );
  }

  @Put('holder/table')
  async pettyCashHolderTable(
    @NestResponse() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.pettyCashHolderTable(query, body),
      response,
    );
  }

  @Patch('holder/:id/deactivate')
  async deactivatePettyCashHolder(
    @NestResponse() response: Response,
    @Param('id') id: string,
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.deactivatePettyCashHolder(parseInt(id)),
      response,
    );
  }

  @Post('holder/return')
  async returnPettyCash(
    @NestResponse() response: Response,
    @Body() params: ReturnPettyCashDTO,
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.returnPettyCash(params),
      response,
    );
  }

  @Post('holder/transfer')
  async transferPettyCash(
    @NestResponse() response: Response,
    @Body() params: TransferPettyCashDTO,
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.transferPettyCash(params),
      response,
    );
  }

  @Post('extract-receipt-data')
  async extractReceiptData(
    @NestResponse() response: Response,
    @Body() params: ExtractReceiptDataDTO,
  ) {
    this.utilityService.responseHandler(
      this.pettyCashService.extractReceiptData(params),
      response,
    );
  }
}

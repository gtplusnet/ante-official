import { Response } from 'express';
import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Response as NestResponse,
  Query,
  Body,
  Inject,
} from '@nestjs/common';
import { UtilityService } from '@common/utility.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { FundAccountService } from './fund-account.service';
import {
  FundAccountDto,
  createFundTransactionDto,
  createFundTranferDto,
} from './fund-account.interface';

@Controller('fund-account')
export class FundAccountController {
  @Inject() public utility: UtilityService;
  @Inject() public fundAccountService: FundAccountService;

  @Get()
  async getFundAcccountInfo(
    @NestResponse() response: Response,
    @Query('id') id: number,
  ) {
    this.utility.responseHandler(
      this.fundAccountService.getFundAccountInfo(Number(id)),
      response,
    );
  }

  @Put()
  async getFundAccountTable(
    @NestResponse() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    this.utility.responseHandler(
      this.fundAccountService.getFundAccountTable(query, body),
      response,
    );
  }

  @Post()
  async createFundAccount(
    @NestResponse() response: Response,
    @Body() body: FundAccountDto,
  ) {
    this.utility.responseHandler(
      this.fundAccountService.createFundAccount(body),
      response,
    );
  }

  @Patch()
  async updateFundAccount(
    @NestResponse() response: Response,
    @Body() body: FundAccountDto,
  ) {
    this.utility.responseHandler(
      this.fundAccountService.updateFundAccount(body),
      response,
    );
  }

  @Delete()
  async deleteFundAccount(
    @NestResponse() response: Response,
    @Query('id') id: number,
  ) {
    this.utility.responseHandler(
      this.fundAccountService.deleteFundAccount(id),
      response,
    );
  }

  @Get('transaction')
  async getFundAccountTransactionInformation(
    @NestResponse() response: Response,
    @Query('id') id: number,
  ) {
    this.utility.responseHandler(
      this.fundAccountService.getFundAccountTransactionsInformation(id),
      response,
    );
  }

  @Put('transaction')
  async getFundAccountTransactionsTable(
    @NestResponse() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    this.utility.responseHandler(
      this.fundAccountService.getFundAccountTransactionsTable(query, body),
      response,
    );
  }

  @Post('transaction')
  async createFundAccountTransaction(
    @NestResponse() response: Response,
    @Body() body: createFundTransactionDto,
  ) {
    this.utility.responseHandler(
      this.fundAccountService.createFundAccountTransaction(body),
      response,
    );
  }

  @Post('transaction/transfer')
  async transferFundAccountTransaction(
    @NestResponse() response: Response,
    @Body() body: createFundTranferDto,
  ) {
    this.utility.responseHandler(
      this.fundAccountService.transferFundAccount(body),
      response,
    );
  }
}

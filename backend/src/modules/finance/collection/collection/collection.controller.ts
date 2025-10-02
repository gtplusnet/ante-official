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
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { CollectionService } from './collection.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import {
  CreateUpdateCollectionDTO,
  ReceivePaymentDTO,
  StartCollectionDTO,
} from './collection.interface';

@Controller('collection')
export class CollectionController {
  @Inject() public utilityService: UtilityService;
  @Inject() public collectionService: CollectionService;

  @Get()
  async getCollectionDetail(
    @NestResponse() response: Response,
    @Query('id') id: string,
  ) {
    this.utilityService.responseHandler(
      this.collectionService.getCollection(id),
      response,
    );
  }

  @Get('accomplishment-summary')
  async getAccomplishmentSummary(
    @NestResponse() response: Response,
    @Query('id') id: string,
  ) {
    this.utilityService.responseHandler(
      this.collectionService.getCollectionAccomplishmentSummary(id),
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
      this.collectionService.table(query, body),
      response,
    );
  }

  @Post()
  async createUpdateCollection(
    @NestResponse() response: Response,
    @Body() params: CreateUpdateCollectionDTO,
  ) {
    this.utilityService.responseHandler(
      this.collectionService.createUpdateCollection(params),
      response,
    );
  }

  @Patch()
  async updateCollection(
    @NestResponse() response: Response,
    @Body() params: CreateUpdateCollectionDTO,
  ) {
    this.utilityService.responseHandler(
      this.collectionService.createUpdateCollection(params),
      response,
    );
  }

  @Post('start-collection')
  async startCollection(
    @NestResponse() response: Response,
    @Body() params: StartCollectionDTO,
  ) {
    this.utilityService.responseHandler(
      this.collectionService.startCollection(params),
      response,
    );
  }

  @Patch('receive-payment')
  async startReceivePayment(
    @NestResponse() response: Response,
    @Body() params: ReceivePaymentDTO,
  ) {
    this.utilityService.responseHandler(
      this.collectionService.receivePayment(params),
      response,
    );
  }
}

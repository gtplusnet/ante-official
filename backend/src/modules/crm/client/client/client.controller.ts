import {
  Controller,
  Post,
  Body,
  Response as NestResponse,
  Inject,
  Query,
  UsePipes,
  ValidationPipe,
  Put,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { ClientService } from './client.service';
import { CreateClientDTO } from '../../../../dto/client.validator.dto';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('client')
export class ClientController {
  @Inject() public utilityService: UtilityService;
  @Inject() public clientService: ClientService;

  @Post()
  async createClient(
    @Body() createSupplierDto: CreateClientDTO,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.clientService.createClient(createSupplierDto),
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
      this.clientService.table(query, body),
      response,
    );
  }

  @Get(':id')
  async getClientById(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.clientService.getClientById(parseInt(id)),
      response,
    );
  }

  @Patch(':id')
  async updateClient(
    @Param('id') id: string,
    @Body() updateClientDto: Partial<CreateClientDTO>,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.clientService.updateClient(parseInt(id), updateClientDto),
      response,
    );
  }

  @Delete(':id')
  async deleteClient(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.clientService.deleteClient(parseInt(id)),
      response,
    );
  }

  @Post(':id/share-link')
  async generateShareLink(
    @Param('id') id: string,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.clientService.generateShareLink(parseInt(id)),
      response,
    );
  }
}

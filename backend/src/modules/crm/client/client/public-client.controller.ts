import {
  Controller,
  Get,
  Query,
  Response as NestResponse,
  Inject,
  UsePipes,
  ValidationPipe,
  Body,
  Post,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { ClientService } from './client.service';
import { IsString } from 'class-validator';

class PublicClientTokenDTO {
  @IsString()
  token: string;
}

class CreatePublicOrderDTO {
  @IsString()
  token: string;

  items: Array<{
    itemId: number;
    quantity: number;
    price: number;
  }>;

  notes?: string;
}

@UsePipes(new ValidationPipe({ transform: true }))
@Controller('public/client')
export class PublicClientController {
  @Inject() public utilityService: UtilityService;
  @Inject() public clientService: ClientService;

  @Get()
  async getPublicClientInfo(
    @Query() query: PublicClientTokenDTO,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.clientService.getPublicClientInfo(query.token),
      response,
    );
  }

  @Post('order')
  async createPublicOrder(
    @Body() body: CreatePublicOrderDTO,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.clientService.createPublicOrder(body.token, body),
      response,
    );
  }
}

import {
  Body,
  Response as NestResponse,
  Inject,
  HttpStatus,
  Query,
  Put,
  Controller,
  Post,
  Get,
  Patch,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { RfpService } from './rfp.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { RFPCreateDTO, RFPApproveDTO, RFPRejectDTO } from './rfp.interface';

@Controller('rfp')
export class RfpController {
  @Inject() public utilityService: UtilityService;
  @Inject() public rfpService: RfpService;

  @Get()
  async index(@NestResponse() response: Response, @Query('id') id: number) {
    try {
      const rfp = await this.rfpService.getRfp(id);

      return response.status(HttpStatus.OK).json({
        message: 'Request for Payment successfully retrieved.',
        data: rfp,
      });
    } catch (error) {
      return this.utilityService.errorResponse(response, error, error.message);
    }
  }

  @Post('create')
  async createRfp(
    @NestResponse() response: Response,
    @Body() body: RFPCreateDTO,
  ) {
    try {
      const rfp = await this.rfpService.createRfp(body);

      return response.status(HttpStatus.OK).json({
        message: 'Request for Payment Successfully Created.',
        data: rfp,
      });
    } catch (error) {
      return this.utilityService.errorResponse(response, error, error.message);
    }
  }

  @Put('table')
  async table(
    @NestResponse() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    try {
      const tableData = await this.rfpService.table(query, body);

      return response.status(HttpStatus.OK).json({
        message: 'Table data successfully retrieved.',
        table: tableData,
      });
    } catch (error) {
      return this.utilityService.errorResponse(response, error, error.message);
    }
  }

  @Patch('approve')
  async approveRfp(
    @NestResponse() response: Response,
    @Body() body: RFPApproveDTO,
  ) {
    try {
      const rfp = await this.rfpService.approve(body);

      return response.status(HttpStatus.OK).json({
        message: 'Request for Payment Successfully Approved.',
        data: rfp,
      });
    } catch (error) {
      return this.utilityService.errorResponse(response, error, error.message);
    }
  }

  @Patch('reject')
  async rejectRfp(
    @NestResponse() response: Response,
    @Body() body: RFPRejectDTO,
  ) {
    try {
      const rfp = await this.rfpService.reject(body);

      return response.status(HttpStatus.OK).json({
        message: 'Request for Payment Successfully Rejected.',
        data: rfp,
      });
    } catch (error) {
      return this.utilityService.errorResponse(response, error, error.message);
    }
  }
}

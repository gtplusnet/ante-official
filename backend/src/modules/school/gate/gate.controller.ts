import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { GateService } from './gate.service';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { CreateGateDto, UpdateGateDto, DeleteGateDto } from './gate.validator';

@Controller('school/gate')
export class GateController {
  constructor(
    private readonly gateService: GateService,
    private readonly utilityService: UtilityService,
  ) {}

  @Post('create')
  async createGate(@Body() data: CreateGateDto, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.gateService.createGate(data, this.utilityService.companyId),
      res,
    );
  }

  @Put('update')
  async updateGate(@Body() data: UpdateGateDto, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.gateService.updateGate(data, this.utilityService.companyId),
      res,
    );
  }

  @Delete('delete')
  async deleteGates(@Body() data: DeleteGateDto, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.gateService.deleteGates(data, this.utilityService.companyId),
      res,
    );
  }

  @Put('table')
  async table(
    @Body() body: TableBodyDTO,
    @Query() query: TableQueryDTO,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.gateService.table(query, body),
      res,
    );
  }

  @Get('list')
  async getGates(@Res() res: Response) {
    return this.utilityService.responseHandler(
      this.gateService.getGates(this.utilityService.companyId),
      res,
    );
  }
}

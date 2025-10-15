import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Query,
  Body,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ShiftConfigurationService } from './shift-configuration.service';
import { UtilityService } from '@common/utility.service';
import {
  ShiftCreateDTO,
  ShiftUpdateDTO,
} from './shift-configuration.interface';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';

@Controller('hr-configuration/shift')
export class ShiftConfigurationController {
  constructor(
    private readonly shiftConfigurationService: ShiftConfigurationService,
    private readonly utilityService: UtilityService,
  ) {}

  @Get('list')
  async getShiftList(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.shiftConfigurationService.getShiftList(),
      response,
    );
  }

  @Get('info')
  async getShiftInfo(@Query('id') id: number, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.shiftConfigurationService.getShiftInfo(id),
      response,
    );
  }

  @Get('type')
  async getShiftType(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.shiftConfigurationService.getShiftType(),
      response,
    );
  }

  @Put('table')
  async getShiftTable(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.shiftConfigurationService.table(query, body),
      response,
    );
  }

  @Post('create')
  async createShift(@Body() body: ShiftCreateDTO, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.shiftConfigurationService.create(body),
      response,
    );
  }

  @Patch('update')
  async updateShift(@Body() body: ShiftUpdateDTO, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.shiftConfigurationService.create(body),
      response,
    );
  }

  @Delete()
  async deleteShift(@Query('id') id: number, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.shiftConfigurationService.deleteShift(id),
      response,
    );
  }
}

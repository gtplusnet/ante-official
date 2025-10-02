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
import { CutoffConfigurationService } from './cutoff-configuration.service';
import { UtilityService } from '@common/utility.service';
import {
  CutoffCreateDTO,
  CutoffUpdateDTO,
  GetConfigSelectCutOffDTO,
  GetCutOffDateRangeDTO,
  GetCutOffDTO,
} from './cutoff-configuration.interface';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';

@Controller('hr-configuration/cutoff')
export class CutoffConfigurationController {
  constructor(
    private readonly cutoffConfigurationService: CutoffConfigurationService,
    private readonly utilityService: UtilityService,
  ) {}

  @Get('info')
  async getCutOffInfo(@Query() query: GetCutOffDTO, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.cutoffConfigurationService.info(query.id),
      response,
    );
  }

  @Get('date-range-information')
  async getCutOffDateRangeInformation(
    @Query() query: GetCutOffDateRangeDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.cutoffConfigurationService.dateRangeInformation(query.id),
      response,
    );
  }

  @Get('date-range')
  async getCutOffDateRange(
    @Query() query: GetCutOffDateRangeDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.cutoffConfigurationService.dateRangeById(query.id),
      response,
    );
  }

  @Delete('delete')
  async deleteCutOff(@Query('id') id: number, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.cutoffConfigurationService.deleteCutOff(id),
      response,
    );
  }

  @Get('cutoff-date')
  async getCutOffDate(@Query() query: GetCutOffDTO, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.cutoffConfigurationService.infoWithDateRange(query.id),
      response,
    );
  }

  @Get('config-select')
  async getCutOffConfigSelect(
    @Query() query: GetConfigSelectCutOffDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.cutoffConfigurationService.getCutOffConfigSelect(query),
      response,
    );
  }

  @Get('type')
  async getCutOffType(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.cutoffConfigurationService.getCutoffType(),
      response,
    );
  }

  @Put('table')
  async getCutoffTable(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.cutoffConfigurationService.table(query, body),
      response,
    );
  }

  @Post('create')
  async createCutOff(@Body() body: CutoffCreateDTO, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.cutoffConfigurationService.createCutOff(body),
      response,
    );
  }

  @Patch('update')
  async updateCutOff(@Body() body: CutoffUpdateDTO, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.cutoffConfigurationService.createCutOff(body),
      response,
    );
  }
}

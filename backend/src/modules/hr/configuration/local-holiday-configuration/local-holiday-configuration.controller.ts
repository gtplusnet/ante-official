import {
  Controller,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { LocalHolidayConfigurationService } from './local-holiday-configuration.service';
import { UtilityService } from '@common/utility.service';
import {
  LocalHolidayCreateDTO,
  LocalHolidayEditDTO,
  LocalHolidayDeleteDTO,
} from './local-holiday-configuration.interface';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';

@Controller('hr-configuration/holiday/local-holiday')
export class LocalHolidayConfigurationController {
  constructor(
    private readonly localHolidayConfigurationService: LocalHolidayConfigurationService,
    private readonly utilityService: UtilityService,
  ) {}

  @Post('create')
  async create(@Body() body: LocalHolidayCreateDTO, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.localHolidayConfigurationService.create(body),
      response,
    );
  }

  @Put('table')
  async table(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.localHolidayConfigurationService.table(query, body),
      response,
    );
  }

  @Patch('edit')
  async edit(@Body() body: LocalHolidayEditDTO, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.localHolidayConfigurationService.edit(body),
      response,
    );
  }

  @Delete('delete')
  async delete(
    @Query() query: LocalHolidayDeleteDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.localHolidayConfigurationService.delete(query),
      response,
    );
  }
}

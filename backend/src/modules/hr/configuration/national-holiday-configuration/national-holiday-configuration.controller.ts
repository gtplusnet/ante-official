import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { NationalHolidayConfigurationService } from './national-holiday-configuration.service';
import { UtilityService } from '@common/utility.service';
import { NationHolidayListDTO } from './national-holiday-configuration.interface';

@Controller('hr-configuration/holiday/national-holiday')
export class NationalHolidayConfigurationController {
  constructor(
    private readonly nationalHolidayConfigurationService: NationalHolidayConfigurationService,
    private readonly utilityService: UtilityService,
  ) {}

  @Get('select-date')
  async selectDate(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.nationalHolidayConfigurationService.selectDate(),
      response,
    );
  }

  @Get('list')
  async formattedList(
    @Query() query: NationHolidayListDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.nationalHolidayConfigurationService.formattedList(query),
      response,
    );
  }
}

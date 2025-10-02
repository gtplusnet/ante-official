import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { PhilhealtConfigurationService } from './philhealth-configuration.service';
import { UtilityService } from '@common/utility.service';
import { GetPhilhealthBracketDTO } from './philhealth-configuration.interface';

@Controller('hr-configuration/philhealth')
export class PhilhealthConfigurationController {
  constructor(
    private readonly philhealthConfigurationService: PhilhealtConfigurationService,
    private readonly utilityService: UtilityService,
  ) {}

  @Get()
  async getPhilhealthTable(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.philhealthConfigurationService.getPhilhealthTable(),
      response,
    );
  }

  @Get('bracket')
  async getPhilhealthBracket(
    @Query() query: GetPhilhealthBracketDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.philhealthConfigurationService.getPhilhealthBracket(query),
      response,
    );
  }
}

import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { SssConfigurationService } from './sss-configuration.service';
import { UtilityService } from '@common/utility.service';
import {
  GetSSSTableDTO,
  GetSSSBracketDTO,
} from './sss-configuration.interface';

@Controller('hr-configuration/sss')
export class SssConfigurationController {
  constructor(
    private readonly sssConfigurationService: SssConfigurationService,
    private readonly utilityService: UtilityService,
  ) {}

  @Get()
  async getSSS(@Query() query: GetSSSTableDTO, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.sssConfigurationService.getSSSConfigurationByDate(query.date),
      response,
    );
  }

  @Get('select-date')
  async getSSSSelectDate(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.sssConfigurationService.getSSSConfigurationSelectDate(),
      response,
    );
  }

  @Get('bracket')
  async getSSSBracket(
    @Query() query: GetSSSBracketDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.sssConfigurationService.getSSSConfigurationByDateAndSalary(query),
      response,
    );
  }
}

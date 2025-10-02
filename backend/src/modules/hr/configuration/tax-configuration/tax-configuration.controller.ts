import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { TaxConfigurationService } from './tax-configuration.service';
import { UtilityService } from '@common/utility.service';
import {
  TaxSelectDateDTO,
  TaxTableDTO,
  GetTaxBracketDTO,
} from './tax-configuration.interface';

@Controller('hr-configuration/tax')
export class TaxConfigurationController {
  constructor(
    private readonly taxConfigurationService: TaxConfigurationService,
    private readonly utilityService: UtilityService,
  ) {}

  @Get('select-date')
  async selectDate(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.taxConfigurationService.selectDate(),
      response,
    );
  }

  @Get('consolidated/table')
  async consolidatedTable(
    @Query() query: TaxSelectDateDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.taxConfigurationService.consolidatedTable(query),
      response,
    );
  }

  @Get('table')
  async taxTable(@Query() query: TaxTableDTO, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.taxConfigurationService.taxTable(query),
      response,
    );
  }

  @Get('bracket')
  async taxBracket(
    @Query() query: GetTaxBracketDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.taxConfigurationService.taxBracket(query),
      response,
    );
  }
}

import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { PagibigConfigurationService } from './pagibig-configuration.service';
import { UtilityService } from '@common/utility.service';
import { GetPagibigBracketDTO } from './pagibig-configuration.interface';

@Controller('hr-configuration/pagibig')
export class PagibigConfigurationController {
  constructor(
    private readonly pagibigConfigurationService: PagibigConfigurationService,
    private readonly utilityService: UtilityService,
  ) {}

  @Get()
  async getPagibigTable(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.pagibigConfigurationService.getPagibigTable(),
      response,
    );
  }

  @Get('bracket')
  async getPagibigBracket(
    @Query() query: GetPagibigBracketDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.pagibigConfigurationService.getPagibigBracket(query),
      response,
    );
  }
}

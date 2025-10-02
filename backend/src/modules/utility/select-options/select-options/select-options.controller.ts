import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BUSINESS_TYPE_OPTIONS } from '../../../../reference/business-type.reference';
import { INDUSTRY_OPTIONS } from '../../../../reference/industry.reference';

@ApiTags('Select Options')
@Controller('select-options')
export class SelectOptionsController {
  @Get('business-types')
  getBusinessTypes() {
    return BUSINESS_TYPE_OPTIONS;
  }

  @Get('industries')
  getIndustries() {
    return INDUSTRY_OPTIONS;
  }
}

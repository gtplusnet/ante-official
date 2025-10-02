import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  Response as NestResponse,
} from '@nestjs/common';
import { Response } from 'express';
import { LeadCompanyService } from './lead-company.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateLeadCompanyDto,
  UpdateLeadCompanyDto,
  LeadCompanyQueryDto,
} from './lead-company.dto';
import { Public } from '@common/decorators/public.decorator';

@Controller('lead-company')
@Public()
export class LeadCompanyController {
  @Inject() private leadCompanyService: LeadCompanyService;
  @Inject() private utilityService: UtilityService;

  // Create a new lead company
  @Post()
  async create(
    @Body() createLeadCompanyDto: CreateLeadCompanyDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.leadCompanyService.create(createLeadCompanyDto),
      response,
    );
  }

  // Get all lead companies with search and sorting
  @Get('list')
  async findAll(
    @Query() query: LeadCompanyQueryDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.leadCompanyService.findAll(query),
      response,
    );
  }

  // Get single lead company by ID
  @Get(':id')
  async findOne(@Param('id') id: string, @NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.leadCompanyService.findOne(parseInt(id)),
      response,
    );
  }

  // Update lead company
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLeadCompanyDto: UpdateLeadCompanyDto,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.leadCompanyService.update(parseInt(id), updateLeadCompanyDto),
      response,
    );
  }

  // Soft delete lead company
  @Delete(':id')
  async remove(@Param('id') id: string, @NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.leadCompanyService.remove(parseInt(id)),
      response,
    );
  }
}

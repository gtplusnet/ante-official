import {
  Controller,
  Body,
  Inject,
  Post,
  Response as NestResponse,
  Query,
  Put,
  Get,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { ProjectBoardDto } from '@modules/project/project/project/project.validator.dto';
import {
  LeadCreateDto,
  LeadUpdateDto,
  LeadMoveDto,
} from './lead.validator.dto';
import { LeadService } from './lead.service';
import { ClientService } from '@modules/crm/client/client/client.service';
import { UtilityService } from '@common/utility.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import {
  ProjectIdDto,
  ProjectDeleteAllDto,
} from '@modules/project/project/project/project.validator.dto';
import { ProjectDataResponse } from '../../../../shared/response';

@Controller('lead')
export class LeadController {
  @Inject() public leadService: LeadService;
  @Inject() public clientService: ClientService;
  @Inject() public utilityService: UtilityService;

  @Post()
  async create(
    @Body() createLeadDto: LeadCreateDto,
    @NestResponse() response: Response<ProjectDataResponse>,
  ) {
    return this.utilityService.responseHandler(
      this.leadService.createLead(createLeadDto),
      response,
    );
  }

  @Patch()
  async updateLeadInformation(
    @Body() updateLeadDto: LeadUpdateDto,
    @NestResponse() response: Response<ProjectDataResponse>,
  ) {
    return this.utilityService.responseHandler(
      this.leadService.updateLeadInformation(updateLeadDto),
      response,
    );
  }

  @Put()
  async table(
    @NestResponse() response: Response,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
  ) {
    return this.utilityService.responseHandler(
      this.leadService.leadTable(query, body),
      response,
    );
  }

  @Get()
  async getLeadInformation(
    @NestResponse() response: Response,
    @Query() parameters: ProjectIdDto,
  ) {
    return this.utilityService.responseHandler(
      this.leadService.getLeadInformationByID(parameters),
      response,
    );
  }

  @Delete(':id')
  async deleteLead(
    @NestResponse() response: Response,
    @Param('id') leadId: string,
  ) {
    const id = parseInt(leadId, 10);
    return this.utilityService.responseHandler(
      this.leadService.deleteLead(id),
      response,
    );
  }

  @Delete('all')
  async deleteAll(
    @NestResponse() response: Response,
    @Body() parameters: ProjectDeleteAllDto,
  ) {
    return this.utilityService.responseHandler(
      this.leadService.deleteAllLeads(parameters),
      response,
    );
  }

  @Get('employee/select-list')
  async getEmployeeSelectList(
    @NestResponse() response: Response,
    @Query() query: any,
  ) {
    return this.utilityService.responseHandler(
      this.leadService.getEmployeeSelectList(query),
      response,
    );
  }

  @Put('board')
  async board(
    @NestResponse() response: Response,
    @Query() _query: ProjectBoardDto,
  ) {
    return this.utilityService.responseHandler(
      this.leadService.leadBoard(),
      response,
    );
  }

  @Patch('move')
  async move(@NestResponse() response: Response, @Body() params: LeadMoveDto) {
    return this.utilityService.responseHandler(
      this.leadService.moveLead(params),
      response,
    );
  }

  @Post(':id/convert')
  async convertToProject(
    @NestResponse() response: Response,
    @Param('id') leadId: string,
  ) {
    const id = parseInt(leadId, 10);
    return this.utilityService.responseHandler(
      this.leadService.convertLeadToProject(id),
      response,
    );
  }

  @Get('dashboard-counters')
  async getDashboardCounters(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.leadService.getLeadDashboardCounters(),
      response,
    );
  }

  @Get('deal-types-summary')
  async getDealTypesSummary(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.leadService.getDealTypesSummary(),
      response,
    );
  }

  @Get('closing-dates-summary')
  async getClosingDatesSummary(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.leadService.getClosingDatesSummary(),
      response,
    );
  }

  @Get('sales-probability-summary')
  async getSalesProbabilitySummary(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.leadService.getSalesProbabilitySummary(),
      response,
    );
  }
}

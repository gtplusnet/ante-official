import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Query,
  Body,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AllowancePlanService } from './allowance-plan.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateAllowancePlanDTO,
  UpdateAllowancePlanDTO,
  AddAllowancePlanBalanceDTO,
  PayAllowancePlanBalanceDTO,
} from './allowance-plan.interface';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { EmployeeSelectionFilterDto } from '@modules/hr/employee/employee-selection/employee-selection.dto';

@Controller('hr-configuration/allowance/plan')
export class AllowancePlanController {
  constructor(
    private readonly allowancePlanService: AllowancePlanService,
    private readonly utilityService: UtilityService,
  ) {}

  @Get()
  async getAllowancePlanById(
    @Query('id') id: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.allowancePlanService.getById(id),
      response,
    );
  }

  @Post()
  async createAllowancePlan(
    @Body() body: CreateAllowancePlanDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.allowancePlanService.create(body),
      response,
    );
  }

  @Patch()
  async updateAllowancePlan(
    @Body() body: UpdateAllowancePlanDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.allowancePlanService.update(body),
      response,
    );
  }

  @Get('history')
  async getAllowancePlanHistory(
    @Query('id') id: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.allowancePlanService.getHistory(id),
      response,
    );
  }

  @Post('add-balance')
  async addAllowancePlanBalance(
    @Body() body: AddAllowancePlanBalanceDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.allowancePlanService.addBalance(body),
      response,
    );
  }

  @Post('pay-balance')
  async payAllowancePlanBalance(
    @Body() body: PayAllowancePlanBalanceDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.allowancePlanService.payBalance(body),
      response,
    );
  }

  @Put('table')
  async getAllowancePlanTable(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.allowancePlanService.table(query, body),
      response,
    );
  }

  @Get('employee-select')
  async getAllowancePlanEmployeeSelect(
    @Query('allowanceConfigurationId') allowanceConfigurationId: number,
    @Query() filters: EmployeeSelectionFilterDto,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.allowancePlanService.getEmployeeSelect(
        allowanceConfigurationId,
        filters,
      ),
      response,
    );
  }

  @Get('cutoff-period-type')
  async getAllowancePlanCutoffPeriodType(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.allowancePlanService.cutoffPeriodType(),
      response,
    );
  }

  @Post('deactivate')
  async deactivateAllowancePlan(
    @Body('id') id: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.allowancePlanService.deactivate(id),
      response,
    );
  }

  @Post('activate')
  async activateAllowancePlan(
    @Body('id') id: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.allowancePlanService.activate(id),
      response,
    );
  }
}

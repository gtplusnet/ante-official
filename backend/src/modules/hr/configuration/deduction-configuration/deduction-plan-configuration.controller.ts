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
import { DeductionPlanConfigurationService } from './deduction-plan-configuration/deduction-plan-configuration.service';
import { UtilityService } from '@common/utility.service';
import {
  AddDeductionPlanBalanceDTO,
  CreateDeductionPlanDTO,
  PayDeductionPlanBalanceDTO,
  UpdateDeductionPlanDTO,
} from './deduction-plan-configuration/deduction-plan-configuration.interface';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { EmployeeSelectionFilterDto } from '@modules/hr/employee/employee-selection/employee-selection.dto';

@Controller('hr-configuration/deduction/plan')
export class DeductionPlanConfigurationController {
  constructor(
    private readonly deductionPlanConfigurationService: DeductionPlanConfigurationService,
    private readonly utilityService: UtilityService,
  ) {}

  @Get()
  async getDeductionPlanById(
    @Query('id') id: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionPlanConfigurationService.getById(id),
      response,
    );
  }

  @Get('employee-select')
  async getDeductionPlanEmployeeSelect(
    @Query('deductionConfigurationId') deductionConfigurationId: number,
    @Query() filters: EmployeeSelectionFilterDto,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionPlanConfigurationService.getEmployeeSelect(
        deductionConfigurationId,
        filters,
      ),
      response,
    );
  }

  @Get('history')
  async getDeductionPlanHistory(
    @Query('id') id: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionPlanConfigurationService.getHistory(id),
      response,
    );
  }

  @Get('cutoff-period-type')
  async getDeductionPlanCutoffPeriodType(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.deductionPlanConfigurationService.cutoffPeriodType(),
      response,
    );
  }

  @Put()
  async getDeductionPlanTable(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionPlanConfigurationService.table(query, body),
      response,
    );
  }

  @Post()
  async createDeductionPlan(
    @Body() body: CreateDeductionPlanDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionPlanConfigurationService.create(body),
      response,
    );
  }

  @Patch()
  async updateDeductionPlan(
    @Body() body: UpdateDeductionPlanDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionPlanConfigurationService.update(body),
      response,
    );
  }

  @Post('deactivate')
  async deactivateDeductionPlan(
    @Body('id') id: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionPlanConfigurationService.deactivate(id),
      response,
    );
  }

  @Post('activate')
  async activateDeductionPlan(
    @Body('id') id: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionPlanConfigurationService.activate(id),
      response,
    );
  }

  @Post('add-balance')
  async addDeductionPlanBalance(
    @Body() body: AddDeductionPlanBalanceDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionPlanConfigurationService.addBalance(body),
      response,
    );
  }

  @Post('pay-balance')
  async subtractDeductionPlanBalance(
    @Body() body: PayDeductionPlanBalanceDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.deductionPlanConfigurationService.payBalance(body),
      response,
    );
  }
}

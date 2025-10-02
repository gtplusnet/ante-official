import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Query,
  Body,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PayrollGroupConfigurationService } from './payroll-group-configuration.service';
import { UtilityService } from '@common/utility.service';
import {
  PayrollConfigurationCreateDTO,
  PayrollConfigurationUpdateDTO,
} from './payroll-group-configuration.interface';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';

@Controller('hr-configuration/payroll-group')
export class PayrollGroupConfigurationController {
  constructor(
    private readonly payrollGroupConfigurationService: PayrollGroupConfigurationService,
    private readonly utilityService: UtilityService,
  ) {}

  @Get('info')
  async getPayrollGroupInfo(
    @Query('id') id: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.payrollGroupConfigurationService.getInfo(id),
      response,
    );
  }

  @Get('overtime-default')
  async getOvertimeDefault(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.payrollGroupConfigurationService.getOvertimeDefaultRateFactors(),
      response,
    );
  }

  @Put('table')
  async getPayrollGroupTable(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.payrollGroupConfigurationService.table(query, body),
      response,
    );
  }

  @Post('create')
  async createPayrollGroup(
    @Body() body: PayrollConfigurationCreateDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.payrollGroupConfigurationService.create(body),
      response,
    );
  }

  @Delete('delete')
  async deletePayrollGroup(@Query('id') id: number, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.payrollGroupConfigurationService.deletePayrollGroup(id),
      response,
    );
  }

  @Patch('update')
  async updatePayrollGroup(
    @Body() body: PayrollConfigurationUpdateDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.payrollGroupConfigurationService.create(body),
      response,
    );
  }
}

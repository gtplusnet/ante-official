import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Body,
  Param,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { EmployeeSalaryAdjustmentService } from './employee-salary-adjustment.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateEmployeeSalaryAdjustmentDTO,
  UpdateEmployeeSalaryAdjustmentDTO,
  GetEmployeeSalaryAdjustmentsDTO,
} from './employee-salary-adjustment.interface';

@Controller('hr-processing/employee-salary-adjustments')
export class EmployeeSalaryAdjustmentController {
  constructor(
    private readonly employeeSalaryAdjustmentService: EmployeeSalaryAdjustmentService,
    private readonly utilityService: UtilityService,
  ) {}

  @Post()
  async create(
    @Body() body: CreateEmployeeSalaryAdjustmentDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeSalaryAdjustmentService.create(body),
      response,
    );
  }

  @Get()
  async findMany(
    @Query() query: GetEmployeeSalaryAdjustmentsDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeSalaryAdjustmentService.findMany(query),
      response,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.employeeSalaryAdjustmentService.findById(Number(id)),
      response,
    );
  }

  @Get('employee/:accountId/cutoff/:cutoffDateRangeId')
  async getByEmployeeAndCutoff(
    @Param('accountId') accountId: string,
    @Param('cutoffDateRangeId') cutoffDateRangeId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeSalaryAdjustmentService.getByEmployeeAndCutoff(
        accountId,
        cutoffDateRangeId,
      ),
      response,
    );
  }

  @Patch()
  async update(
    @Body() body: UpdateEmployeeSalaryAdjustmentDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeSalaryAdjustmentService.update(body),
      response,
    );
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.employeeSalaryAdjustmentService.delete(Number(id)),
      response,
    );
  }
}

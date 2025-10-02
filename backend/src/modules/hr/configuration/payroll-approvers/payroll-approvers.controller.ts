import {
  Body,
  Controller,
  Post,
  Delete,
  Put,
  Get,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { PayrollApproversService } from './payroll-approvers.service';
import { UtilityService } from '@common/utility.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import {
  AddPayrollApproverDto,
  BulkAddPayrollApproverDto,
  PayrollApproverTableDto,
} from './payroll-approvers.dto';
import { EmployeeSelectionFilterDto } from '@modules/hr/employee/employee-selection/employee-selection.dto';

@Controller('hr-configuration/payroll-approvers')
export class PayrollApproversController {
  constructor(
    private readonly payrollApproversService: PayrollApproversService,
    private readonly utilityService: UtilityService,
    private readonly tableHandlerService: TableHandlerService,
  ) {}

  @Put('table')
  async table(@Body() body: PayrollApproverTableDto, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.payrollApproversService.table(body, this.utilityService.companyId),
      res,
    );
  }

  @Post('add')
  async add(@Body() body: AddPayrollApproverDto, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.payrollApproversService.add(body, this.utilityService.companyId),
      res,
    );
  }

  @Post('bulk-add')
  async bulkAdd(@Body() body: BulkAddPayrollApproverDto, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.payrollApproversService.bulkAdd(body, this.utilityService.companyId),
      res,
    );
  }

  @Delete('delete')
  async delete(@Body() body: { accountId: string }, @Res() res: Response) {
    return this.utilityService.responseHandler(
      this.payrollApproversService.delete(
        body.accountId,
        this.utilityService.companyId,
      ),
      res,
    );
  }

  @Get('employee-select')
  async getEmployeeSelect(
    @Query() filters: EmployeeSelectionFilterDto,
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.payrollApproversService.getEmployeeSelect(filters),
      res,
    );
  }

  @Put('toggle-status')
  async toggleStatus(
    @Body() body: { accountId: string },
    @Res() res: Response,
  ) {
    return this.utilityService.responseHandler(
      this.payrollApproversService.toggleStatus(
        body.accountId,
        this.utilityService.companyId,
      ),
      res,
    );
  }
}

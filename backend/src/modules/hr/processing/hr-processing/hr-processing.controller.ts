import {
  Body,
  Response as NestResponse,
  Inject,
  Controller,
  Post,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { HrProcessingService } from './hr-processing.service';
import {
  GetCutoffListDTO,
  ProcessSingleEmployeeDTO,
} from './hr-processing.interface';
import { CutoffDateRangeStatus, GovernmentPaymentType } from '@prisma/client';

@Controller('hr-processing')
export class HrProcessingController {
  @Inject() private readonly hrProcessingService: HrProcessingService;
  @Inject() private readonly utilityService: UtilityService;

  @Post('individual-employee')
  async localHolidayCreate(
    @Body() body: ProcessSingleEmployeeDTO,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.processSingleEmployee(body),
      response,
    );
  }

  @Get('get-employee-salary-computation')
  async getEmployeeSalaryComputation(
    @Query('timekeepingCutoffId') timekeepingCutoffId: number,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.getEmployeeSalaryComputation(
        timekeepingCutoffId,
      ),
      response,
    );
  }

  @Post('recompute-salary')
  async recomputeSalary(
    @Body('cutoffDateRangeId') cutoffDateRangeId: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.recomputeSalary(cutoffDateRangeId),
      response,
    );
  }

  @Get('get-cutoff-list')
  async getCutoffList(
    @Query() params: GetCutoffListDTO,
    @NestResponse() response: Response,
  ) {
    const status = params.status;
    return this.utilityService.responseHandler(
      this.hrProcessingService.getCutoffList({ status }),
      response,
    );
  }

  @Get('count-cutoff-list-by-status')
  async countCutoffListByStatus(@NestResponse() response: Response) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.countCutoffListByStatus(),
      response,
    );
  }

  @Get('get-employee-list-by-cutoff')
  async getEmployeeListByCutoff(
    @Query('cutoffDateRangeId') cutoffDateRangeId: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.getEmployeeListByCutoff(cutoffDateRangeId),
      response,
    );
  }

  @Get('get-employee-list-by-cutoff-paginated')
  async getEmployeeListByCutoffPaginated(
    @Query('cutoffDateRangeId') cutoffDateRangeId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('search') search = '',
    @Query('sortBy') sortBy = 'fullName',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.getEmployeeListByCutoffPaginated(
        cutoffDateRangeId,
        parseInt(page, 10),
        parseInt(limit, 10),
        search,
        sortBy,
        sortOrder,
      ),
      response,
    );
  }

  @Get('get-payroll-summary-totals')
  async getPayrollSummaryTotals(
    @Query('cutoffDateRangeId') cutoffDateRangeId: string,
    @Query('search') search = '',
    @Query('branchId') branchId?: string,
    @Query('employmentStatusId') employmentStatusId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('roleId') roleId?: string,
    @NestResponse() response?: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.getPayrollSummaryTotals(
        cutoffDateRangeId,
        search,
        branchId ? parseInt(branchId, 10) : undefined,
        employmentStatusId, // Employment status is a string enum, not a number
        departmentId,
        roleId,
      ),
      response,
    );
  }

  @Get('get-payroll-summary-optimized')
  async getPayrollSummaryOptimized(
    @Query('cutoffDateRangeId') cutoffDateRangeId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('search') search = '',
    @Query('sortBy') sortBy = 'fullName',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
    @Query('branchId') branchId?: string,
    @Query('branchIds') branchIds?: string,
    @Query('employmentStatusId') employmentStatusId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('roleId') roleId?: string,
    @NestResponse() response?: Response,
  ) {
    // Handle both single branchId (legacy) and multiple branchIds (new)
    let branchIdNumbers: number[] | undefined;
    if (branchIds) {
      // Parse comma-separated branchIds
      branchIdNumbers = branchIds
        .split(',')
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
    } else if (branchId) {
      // Legacy single branchId support
      const branchIdNumber = parseInt(branchId);
      if (!isNaN(branchIdNumber)) {
        branchIdNumbers = [branchIdNumber];
      }
    }

    return this.utilityService.responseHandler(
      this.hrProcessingService.getPayrollSummaryOptimized(
        cutoffDateRangeId,
        parseInt(page, 10),
        parseInt(limit, 10),
        search,
        sortBy,
        sortOrder,
        branchIdNumbers,
        employmentStatusId, // Employment status is a string enum, not a number
        departmentId,
        roleId,
      ),
      response,
    );
  }

  @Get('get-employee-salary-detail')
  async getEmployeeSalaryDetail(
    @Query('timekeepingCutoffId') timekeepingCutoffId: string,
    @Query('needRecompute') needRecompute = 'false',
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.getEmployeeSalaryComputation(
        parseInt(timekeepingCutoffId, 10),
        needRecompute === 'true',
      ),
      response,
    );
  }

  @Post('return-to-timekeeping')
  async returnToTimekeeping(
    @Body('cutoffDateRangeId') cutoffDateRangeId: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.returnToTimekeeping(cutoffDateRangeId),
      response,
    );
  }

  @Post('resubmit-for-approval')
  async resubmitForApproval(
    @Body('cutoffDateRangeId') cutoffDateRangeId: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.resubmitForApproval(cutoffDateRangeId),
      response,
    );
  }

  @Post('update-cutoff-date-range-status')
  async updateCutoffDateRangeStatus(
    @Body('cutoffDateRangeId') cutoffDateRangeId: string,
    @Body('status') status: CutoffDateRangeStatus,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.updateCutoffDateRangeStatus(
        cutoffDateRangeId,
        status,
      ),
      response,
    );
  }

  @Post('submit-next-status')
  async submitNextStatus(
    @Body('cutoffDateRangeId') cutoffDateRangeId: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.submitNextStatus(cutoffDateRangeId),
      response,
    );
  }

  @Post('repost-cutoff')
  async repostCutoff(
    @Body('cutoffDateRangeId') cutoffDateRangeId: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.repostCutoff(cutoffDateRangeId),
      response,
    );
  }

  @Get('get-employee-salary-computation-deductions')
  async getEmployeeSalaryComputationDeductions(
    @Query('employeeTimekeepingCutoffId') employeeTimekeepingCutoffId: number,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.getEmployeeSalaryComputationDeductions(
        employeeTimekeepingCutoffId,
      ),
      response,
    );
  }

  @Get('get-employee-salary-computation-allowances')
  async getEmployeeSalaryComputationAllowances(
    @Query('employeeTimekeepingCutoffId') employeeTimekeepingCutoffId: number,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.getEmployeeSalaryComputationAllowances(
        employeeTimekeepingCutoffId,
      ),
      response,
    );
  }

  @Get('get-government-payment-history')
  async getGovernmentPaymentHistory(
    @Query('cutoffDateRangeId') cutoffDateRangeId: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.getGovernmentPaymentHistory(cutoffDateRangeId),
      response,
    );
  }

  @Get('government-payment-history/sss')
  async getGovernmentPaymentHistorySSS(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('accountId') accountId?: string,
    @Query('cutoffDateRangeId') cutoffDateRangeId?: string,
    @NestResponse() response?: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.getGovernmentPaymentHistoryByType({
        type: GovernmentPaymentType.SSS,
        startDate,
        endDate,
        accountId,
        cutoffDateRangeId,
      }),
      response,
    );
  }

  @Get('government-payment-history/philhealth')
  async getGovernmentPaymentHistoryPhilhealth(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('accountId') accountId?: string,
    @Query('cutoffDateRangeId') cutoffDateRangeId?: string,
    @NestResponse() response?: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.getGovernmentPaymentHistoryByType({
        type: GovernmentPaymentType.PHILHEALTH,
        startDate,
        endDate,
        accountId,
        cutoffDateRangeId,
      }),
      response,
    );
  }

  @Get('government-payment-history/pagibig')
  async getGovernmentPaymentHistoryPagibig(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('accountId') accountId?: string,
    @Query('cutoffDateRangeId') cutoffDateRangeId?: string,
    @NestResponse() response?: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.getGovernmentPaymentHistoryByType({
        type: GovernmentPaymentType.PAGIBIG,
        startDate,
        endDate,
        accountId,
        cutoffDateRangeId,
      }),
      response,
    );
  }

  @Get('government-payment-history/tax')
  async getGovernmentPaymentHistoryTax(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('accountId') accountId?: string,
    @Query('cutoffDateRangeId') cutoffDateRangeId?: string,
    @NestResponse() response?: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.getGovernmentPaymentHistoryByType({
        type: GovernmentPaymentType.WITHHOLDING_TAX,
        startDate,
        endDate,
        accountId,
        cutoffDateRangeId,
      }),
      response,
    );
  }

  @Get('employee-computation/:accountId/:cutoffDateRangeId')
  async getEmployeeComputation(
    @Param('accountId') accountId: string,
    @Param('cutoffDateRangeId') cutoffDateRangeId: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.getEmployeeComputation(
        accountId,
        cutoffDateRangeId,
      ),
      response,
    );
  }

  @Get('cutoff-totals/:cutoffDateRangeId')
  async getCutoffTotals(
    @Param('cutoffDateRangeId') cutoffDateRangeId: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.getCutoffTotals(cutoffDateRangeId),
      response,
    );
  }

  @Get('payslip-info')
  async getPayslipInfo(
    @Query('employeeTimekeepingCutoffId') employeeTimekeepingCutoffId: number,
    @Query('cutoffDateRangeId') cutoffDateRangeId: string,
    @NestResponse() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.hrProcessingService.getPayslipInfo(
        employeeTimekeepingCutoffId,
        cutoffDateRangeId,
      ),
      response,
    );
  }

  @Get('export-payroll-summary')
  async exportPayrollSummary(
    @Query('cutoffDateRangeId') cutoffDateRangeId: string,
    @Query('search') search = '',
    @Query('sortBy') sortBy = 'fullName',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'asc',
    @Query('format') format: 'csv' | 'excel' = 'csv',
    @Query('branchId') branchId?: string,
    @Query('employmentStatusId') employmentStatusId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('roleId') roleId?: string,
    @NestResponse() response?: Response,
  ) {
    const result = await this.hrProcessingService.exportPayrollSummary(
      cutoffDateRangeId,
      search,
      sortBy,
      sortOrder,
      branchId ? parseInt(branchId, 10) : undefined,
      employmentStatusId,
      departmentId,
      roleId,
      format,
    );

    if (format === 'excel') {
      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=payroll-summary.xlsx',
      );
      response.send(result);
    } else {
      return this.utilityService.responseHandler(result, response);
    }
  }
}

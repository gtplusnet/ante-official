import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  Res,
  Put,
  Delete,
  Param,
} from '@nestjs/common';
import { Response } from 'express';
import { EmployeeTimekeepingService } from './employee-timekeeping.service';
import { UtilityService } from '@common/utility.service';
import {
  EmployeeTimekeepingDTO,
  EmployeeTimekeepingByDateDTO,
  ComputeTimekeepingDTO,
  RecomputeTimekeepingDTO,
  TimekeepingOverrideDTO,
  TimekeepingOverrideClearDTO,
  RecomputeCutoffTimekeepingDTO,
  SubmitForPayrollProcessingDTO,
  RecomputeAllTimekeepingDTO,
} from './employee-timekeeping.interface';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';

@Controller('hris/timekeeping')
export class EmployeeTimekeepingController {
  constructor(
    private readonly employeeTimekeepingService: EmployeeTimekeepingService,
    private readonly utilityService: UtilityService,
  ) {}

  @Post('simulate')
  async employeeTimekeeping(
    @Body() body: ComputeTimekeepingDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.compute(body),
      response,
    );
  }

  @Post('override')
  async employeeTimekeepingOverride(
    @Body() body: TimekeepingOverrideDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.overrideTimekeeping(body),
      response,
    );
  }

  @Post('approve-day')
  async employeeTimekeepingApproveDay(
    @Body('timekeepingId') timekeepingId: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.approveDay(timekeepingId),
      response,
    );
  }

  @Post('approve-overtime')
  async approveOvertime(
    @Body() body: { timekeepingId: number; date: string },
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.approveOvertime(
        body.timekeepingId,
        body.date,
      ),
      response,
    );
  }

  @Post('toggle-holiday-eligibility')
  async toggleHolidayEligibility(
    @Body('timekeepingId') timekeepingId: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.toggleHolidayEligibility(timekeepingId),
      response,
    );
  }

  @Post('override/clear')
  async employeeTimekeepingOverrideClear(
    @Body() body: TimekeepingOverrideClearDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.overrideTimekeepingClear(
        body.timekeepingId,
      ),
      response,
    );
  }

  @Post('recompute')
  async timekeepingRecompute(
    @Body() body: RecomputeTimekeepingDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.recompute(body),
      response,
    );
  }

  @Post('recompute-cutoff')
  async timekeepingRecomputeCutoff(
    @Body() body: RecomputeCutoffTimekeepingDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.recomputeCutoff(body),
      response,
    );
  }

  @Get()
  async getTimekeepingEmployeeList(
    @Query('cutoffDateRange') cutoffDateRange: string,
    @Res() response: Response,
    @Query('branchId') branchId?: string,
    @Query('branchIds') branchIds?: string,
    @Query('search') search?: string,
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
      this.employeeTimekeepingService.getTimekeepingEmployeeList(
        cutoffDateRange,
        branchIdNumbers,
        search,
      ),
      response,
    );
  }

  @Get('cutoff-date-range')
  async employeeTimekeepingCutoffDateRange(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.getEmployeeTimekeepingCutoffDateRange(),
      response,
    );
  }

  @Get('employee')
  async employeeTimekeepingInfo(
    @Query() params: EmployeeTimekeepingDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.getEmployeeTimekeeping(params),
      response,
    );
  }

  @Get('employee/total')
  async employeeTimekeepingTotal(
    @Query() params: EmployeeTimekeepingDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.getEmployeeTimekeepingTotal(params),
      response,
    );
  }

  @Get('employee/by-date')
  async employeeTimekeepingByDate(
    @Query() params: EmployeeTimekeepingByDateDTO,
    @Res() response: Response,
  ) {
    try {
      // Validate date input
      const inputDate = new Date(params.date);
      if (isNaN(inputDate.getTime())) {
        return this.utilityService.responseHandler(
          Promise.reject(new Error('Invalid date format')),
          response,
        );
      }

      // Prevent querying future dates beyond today
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (inputDate > today) {
        return this.utilityService.responseHandler(
          Promise.reject(new Error('Cannot query future dates')),
          response,
        );
      }

      const dateFormatted = this.utilityService.formatDate(inputDate);
      return this.utilityService.responseHandler(
        this.employeeTimekeepingService.getEmployeeTimekeepingByDate({
          employeeAccountId: params.employeeAccountId,
          date: dateFormatted,
        }),
        response,
      );
    } catch (error) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('Failed to fetch timekeeping data')),
        response,
      );
    }
  }

  @Post('submit-for-payroll-processing')
  async submitForPayrollProcessing(
    @Body() body: SubmitForPayrollProcessingDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.submitForPayrollProcessing(body),
      response,
    );
  }

  @Post('recompute-all-timekeeping')
  async recomputeAllTimekeeping(
    @Body() body: RecomputeAllTimekeepingDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.recomputeAllTimekeeping(body),
      response,
    );
  }

  @Put('raw-logs/table')
  async employeeTimekeepingRawLogs(
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.employeeTimekeepingRawLogs(query, body),
      response,
    );
  }

  @Delete('raw-logs/delete')
  async deleteEmployeeTimekeepingRawLogs(
    @Query('id') id: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.deleteEmployeeTimekeepingRawLog(id),
      response,
    );
  }

  @Get('branch-status/:cutoffDateRangeId')
  async getBranchTimekeepingStatus(
    @Param('cutoffDateRangeId') cutoffDateRangeId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.getBranchTimekeepingStatus(
        cutoffDateRangeId,
      ),
      response,
    );
  }

  @Post('mark-branch-ready')
  async markBranchTimekeepingReady(
    @Body('cutoffDateRangeId') cutoffDateRangeId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.markBranchTimekeepingReady(
        cutoffDateRangeId,
      ),
      response,
    );
  }

  @Get('branches')
  async getTimekeepingBranches(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.getTimekeepingBranches(),
      response,
    );
  }

  @Get('paginated')
  async getTimekeepingEmployeeListPaginated(
    @Query('cutoffDateRange') cutoffDateRange: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Res() response: Response,
    @Query('branchId') branchId?: string,
    @Query('branchIds') branchIds?: string,
    @Query('search') search?: string,
    @Query('employmentStatusId') employmentStatusId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('roleId') roleId?: string,
  ) {
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 50;

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
      this.employeeTimekeepingService.getTimekeepingEmployeeListPaginated(
        cutoffDateRange,
        pageNumber,
        limitNumber,
        branchIdNumbers,
        search,
        employmentStatusId,
        departmentId,
        roleId,
      ),
      response,
    );
  }

  @Get('totals')
  async getTimekeepingTotals(
    @Query('cutoffDateRange') cutoffDateRange: string,
    @Res() response: Response,
    @Query('branchId') branchId?: string,
    @Query('branchIds') branchIds?: string,
    @Query('search') search?: string,
    @Query('employmentStatusId') employmentStatusId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('roleId') roleId?: string,
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
      this.employeeTimekeepingService.getTimekeepingTotals(
        cutoffDateRange,
        branchIdNumbers,
        search,
        employmentStatusId,
        departmentId,
        roleId,
      ),
      response,
    );
  }

  @Get('daily-attendance')
  async getDailyAttendance(
    @Query('date') date: string,
    @Res() response: Response,
    @Query('branchId') branchId?: string,
  ) {
    const branchIdNumber = branchId ? parseInt(branchId) : undefined;
    return this.utilityService.responseHandler(
      this.employeeTimekeepingService.getDailyAttendanceSummary(
        date,
        branchIdNumber,
      ),
      response,
    );
  }
}

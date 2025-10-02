import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  Response as NestResponse,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  GetEmployeePayslipsDto,
  GetDashboardMetricsDto,
  GetEmployeeAttendanceDto,
  GetEmployeeAttendanceConflictsDto,
} from './dto/dashboard.dto';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';

@Controller('dashboard')
export class DashboardController {
  @Inject() private readonly dashboardService: DashboardService;
  @Inject() private readonly utilityService: UtilityService;

  /**
   * Get employee payslips for the current user
   * Only returns POSTED cutoffs
   */
  @Get('employee-payslips')
  async getMyPayslips(
    @Query() query: GetEmployeePayslipsDto,
    @NestResponse() response: Response,
  ) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const accountId = this.utilityService.accountInformation?.id;

    this.utilityService.responseHandler(
      this.dashboardService.getEmployeePayslips(
        accountId,
        page,
        limit,
        query.startDate,
        query.endDate,
      ),
      response,
    );
  }

  /**
   * Get employee payslips for a specific employee (admin/HR use)
   * Only returns POSTED cutoffs
   */
  @Get('employee-payslips/:accountId')
  async getEmployeePayslips(
    @Param('accountId') accountId: string,
    @Query() query: GetEmployeePayslipsDto,
    @NestResponse() response: Response,
  ) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);

    this.utilityService.responseHandler(
      this.dashboardService.getEmployeePayslips(
        accountId,
        page,
        limit,
        query.startDate,
        query.endDate,
      ),
      response,
    );
  }

  /**
   * Get dashboard overview statistics
   */
  @Get('overview')
  async getDashboardOverview(@NestResponse() response: Response) {
    this.utilityService.responseHandler(
      this.dashboardService.getDashboardOverview(),
      response,
    );
  }

  /**
   * Get HR metrics
   */
  @Get('hr-metrics')
  async getHRMetrics(
    @Query() query: GetDashboardMetricsDto,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.dashboardService.getHRMetrics(),
      response,
    );
  }

  /**
   * Get project metrics
   */
  @Get('project-metrics')
  async getProjectMetrics(
    @Query() query: GetDashboardMetricsDto,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.dashboardService.getProjectMetrics(),
      response,
    );
  }

  /**
   * Get finance metrics
   */
  @Get('finance-metrics')
  async getFinanceMetrics(
    @Query() query: GetDashboardMetricsDto,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.dashboardService.getFinanceMetrics(),
      response,
    );
  }

  /**
   * Get inventory metrics
   */
  @Get('inventory-metrics')
  async getInventoryMetrics(
    @Query() query: GetDashboardMetricsDto,
    @NestResponse() response: Response,
  ) {
    this.utilityService.responseHandler(
      this.dashboardService.getInventoryMetrics(),
      response,
    );
  }

  /**
   * Get employee dashboard counters for the current user
   */
  @Get('employee-counters')
  async getEmployeeCounters(@NestResponse() response: Response) {
    const accountId = this.utilityService.accountInformation?.id;

    if (!accountId) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('User account not found')),
        response,
      );
    }

    this.utilityService.responseHandler(
      this.dashboardService.getEmployeeDashboardCounters(accountId),
      response,
    );
  }

  /**
   * Get employee cutoff date ranges for the current user
   */
  @Get('employee-cutoff-ranges')
  async getEmployeeCutoffDateRanges(@NestResponse() response: Response) {
    const accountId = this.utilityService.accountInformation?.id;

    if (!accountId) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('User account not found')),
        response,
      );
    }

    this.utilityService.responseHandler(
      this.dashboardService.getEmployeeCutoffDateRanges(accountId),
      response,
    );
  }

  /**
   * Get employee attendance data for the current user
   */
  @Get('employee-attendance')
  async getEmployeeAttendance(
    @Query() query: GetEmployeeAttendanceDto,
    @NestResponse() response: Response,
  ) {
    const accountId = this.utilityService.accountInformation?.id;

    if (!accountId) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('User account not found')),
        response,
      );
    }

    this.utilityService.responseHandler(
      this.dashboardService.getEmployeeAttendance(
        accountId,
        query.startDate,
        query.endDate,
      ),
      response,
    );
  }

  /**
   * Get employee attendance conflicts for the current user
   */
  @Get('employee-attendance-conflicts')
  async getEmployeeAttendanceConflicts(
    @Query() query: GetEmployeeAttendanceConflictsDto,
    @NestResponse() response: Response,
  ) {
    const accountId = this.utilityService.accountInformation?.id;

    if (!accountId) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('User account not found')),
        response,
      );
    }

    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);

    this.utilityService.responseHandler(
      this.dashboardService.getEmployeeAttendanceConflicts(
        accountId,
        query.startDate,
        query.endDate,
        page,
        limit,
      ),
      response,
    );
  }

  /**
   * Get employee attendance calendar data for the current user
   * Returns attendance details for each day in the date range
   */
  @Get('employee-attendance-calendar')
  async getEmployeeAttendanceCalendar(
    @Query()
    query: GetEmployeeAttendanceDto & {
      cutoffStartDate?: string;
      cutoffEndDate?: string;
    },
    @NestResponse() response: Response,
  ) {
    const accountId = this.utilityService.accountInformation?.id;

    if (!accountId) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('User account not found')),
        response,
      );
    }

    this.utilityService.responseHandler(
      this.dashboardService.getEmployeeAttendanceCalendar(
        accountId,
        query.startDate,
        query.endDate,
        query.cutoffStartDate,
        query.cutoffEndDate,
      ),
      response,
    );
  }
}

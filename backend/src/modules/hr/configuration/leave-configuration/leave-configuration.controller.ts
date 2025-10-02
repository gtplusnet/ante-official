import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  ParseIntPipe,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { LeaveTypeConfigurationService } from './leave-type-configuration.service';
import { LeavePlanService } from './leave-plan.service';
import { EmployeeLeavePlanService } from './employee-leave-plan.service';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import {
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
  CreateLeavePlanDto,
  UpdateLeavePlanDto,
  AssignEmployeesToPlanDto,
  UpdateEmployeeCreditsDto,
  AdjustEmployeeCreditsDto,
  UpdateEmployeeLeaveSettingsDto,
  BulkCreditAdjustmentDto,
  HistoryExportDto,
  HistorySummaryDto,
  EmployeeAllHistoryDto,
} from './dto';
import { EmployeeSelectionFilterDto } from '@modules/hr/employee/employee-selection/employee-selection.dto';

@Controller('hr-configuration/leave')
export class LeaveConfigurationController {
  @Inject() public leaveTypeService: LeaveTypeConfigurationService;
  @Inject() public leavePlanService: LeavePlanService;
  @Inject() public employeeLeavePlanService: EmployeeLeavePlanService;
  @Inject() public utilityService: UtilityService;

  // Leave Type Endpoints
  /**
   * Get hierarchical tree structure of leave types.
   * @param response Express response object
   * @returns Tree structure of leave type configurations
   */
  @Get('tree')
  async getLeaveTypeTree(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.leaveTypeService.getLeaveTypeTree(),
      response,
    );
  }

  /**
   * Create a new leave type configuration.
   * @param data Leave type creation data
   * @param response Express response object
   * @returns Created leave type configuration
   */
  @Post('type')
  async createLeaveType(
    @Body() data: CreateLeaveTypeDto,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.leaveTypeService.createLeaveType(data),
      response,
    );
  }

  /**
   * Update an existing leave type configuration.
   * @param id Leave type ID
   * @param data Leave type update data
   * @param response Express response object
   * @returns Updated leave type configuration
   */
  @Patch('type/:id')
  async updateLeaveType(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateLeaveTypeDto,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.leaveTypeService.updateLeaveType(id, data),
      response,
    );
  }

  /**
   * Archive a leave type configuration.
   * @param id Leave type ID
   * @param response Express response object
   * @returns Archive operation result
   */
  @Delete('type/:id')
  async archiveLeaveType(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.leaveTypeService.archiveLeaveType(id),
      response,
    );
  }

  /**
   * Get a specific leave type configuration by ID.
   * @param id Leave type ID
   * @param response Express response object
   * @returns Leave type configuration details
   */
  @Get('type/:id')
  async getLeaveTypeById(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.leaveTypeService.getLeaveTypeById(id),
      response,
    );
  }

  // Leave Plan Endpoints
  /**
   * Create a new leave plan with configuration settings.
   * @param data Leave plan creation data
   * @param response Express response object
   * @returns Created leave plan with all settings
   */
  @Post('plan')
  async createLeavePlan(
    @Body() data: CreateLeavePlanDto,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.leavePlanService.createLeavePlan(data),
      response,
    );
  }

  /**
   * Get employees eligible for a specific leave plan.
   * @param leavePlanId Leave plan ID
   * @param filters Employee selection filters
   * @param response Express response object
   * @returns List of eligible employees
   */
  @Get('plan/employee-select')
  async getEligibleEmployees(
    @Query('leavePlanId') leavePlanId: string,
    @Query() filters: EmployeeSelectionFilterDto,
    @Res() response: Response,
  ) {
    const planId = parseInt(leavePlanId);

    if (!leavePlanId || isNaN(planId)) {
      return this.utilityService.responseHandler(
        Promise.reject(new Error('Valid leavePlanId is required')),
        response,
      );
    }

    return this.utilityService.responseHandler(
      this.employeeLeavePlanService.getEligibleEmployeesForPlan(
        planId,
        filters,
      ),
      response,
    );
  }

  /**
   * Get a specific leave plan by ID.
   * @param id Leave plan ID
   * @param response Express response object
   * @returns Leave plan details
   */
  @Get('plan/:id')
  async getLeavePlanById(@Param('id') id: string, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.leavePlanService.getLeavePlanById(parseInt(id)),
      response,
    );
  }

  /**
   * Update an existing leave plan.
   * @param id Leave plan ID
   * @param data Leave plan update data
   * @param response Express response object
   * @returns Updated leave plan
   */
  @Patch('plan/:id')
  async updateLeavePlan(
    @Param('id') id: string,
    @Body() data: UpdateLeavePlanDto,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.leavePlanService.updateLeavePlan(parseInt(id), data),
      response,
    );
  }

  /**
   * Archive a leave plan.
   * @param id Leave plan ID
   * @param response Express response object
   * @returns Archive operation result
   */
  @Delete('plan/:id')
  async archiveLeavePlan(@Param('id') id: string, @Res() response: Response) {
    return this.utilityService.responseHandler(
      this.leavePlanService.archiveLeavePlan(parseInt(id)),
      response,
    );
  }

  /**
   * Get all active leave plans for a specific leave type.
   * @param leaveTypeId Leave type ID
   * @param response Express response object
   * @returns List of active leave plans
   */
  @Get('plans/active/:leaveTypeId')
  async getActiveLeavePlans(
    @Param('leaveTypeId') leaveTypeId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.leavePlanService.getActiveLeavePlans(parseInt(leaveTypeId)),
      response,
    );
  }

  /**
   * Get all inactive leave plans for a specific leave type.
   * @param leaveTypeId Leave type ID
   * @param response Express response object
   * @returns List of inactive leave plans
   */
  @Get('plans/inactive/:leaveTypeId')
  async getInactiveLeavePlans(
    @Param('leaveTypeId') leaveTypeId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.leavePlanService.getInactiveLeavePlans(parseInt(leaveTypeId)),
      response,
    );
  }

  /**
   * Get paginated table of employees assigned to a specific leave plan.
   * @param id Leave plan ID
   * @param query Table query parameters (page, perPage)
   * @param body Table body parameters (filters, settings)
   * @param response Express response object
   * @returns Paginated list of employees with leave plan details
   */
  @Put('plan/:id/employees/table')
  async getEmployeesByLeavePlanTable(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeLeavePlanService.getEmployeesByLeavePlanTable(
        id,
        query,
        body,
      ),
      response,
    );
  }

  // Employee Leave Plan Endpoints
  /**
   * Assign employees to a leave plan.
   * Note: effectiveDate is automatically set to current date.
   * @param data Employee assignment data including leave plan ID and employee details
   * @param response Express response object
   * @returns Assignment operation results
   */
  @Post('plan/assign')
  async assignEmployeesToPlan(
    @Body() data: AssignEmployeesToPlanDto,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeLeavePlanService.assignEmployeesToPlan(
        data,
        this.utilityService.accountInformation.id,
      ),
      response,
    );
  }

  /**
   * Update employee leave plan credits.
   * @param id Employee leave plan ID
   * @param credits Credit update data
   * @param response Express response object
   * @returns Updated employee leave plan
   */
  @Patch('employee-plan/:id')
  async updateEmployeeCredits(
    @Param('id') id: string,
    @Body() credits: UpdateEmployeeCreditsDto,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeLeavePlanService.updateEmployeeCredits(
        parseInt(id),
        credits,
      ),
      response,
    );
  }

  /**
   * Deactivate an employee's leave plan.
   * @param id Employee leave plan ID
   * @param response Express response object
   * @returns Deactivation operation result
   */
  @Delete('employee-plan/:id')
  async deactivateEmployeePlan(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeLeavePlanService.deactivateEmployeePlan(parseInt(id)),
      response,
    );
  }

  /**
   * Activate a previously deactivated employee's leave plan.
   * @param id Employee leave plan ID
   * @param response Express response object
   * @returns Activation operation result
   */
  @Patch('employee-plan/:id/activate')
  async activateEmployeePlan(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeLeavePlanService.activateEmployeePlan(parseInt(id)),
      response,
    );
  }

  /**
   * Get all leave plans for a specific employee.
   * @param accountId Employee account ID
   * @param response Express response object
   * @returns List of employee's leave plans
   */
  @Get('employee/:accountId/plans')
  async getEmployeeLeavePlans(
    @Param('accountId') accountId: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeLeavePlanService.getEmployeeLeavePlans(accountId),
      response,
    );
  }

  /**
   * Get credit history for an employee's leave plan.
   * @param id Employee leave plan ID
   * @param response Express response object
   * @returns Credit transaction history
   */
  @Get('employee-plan/:id/history')
  async getEmployeeCreditHistory(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeLeavePlanService.getCreditHistory(parseInt(id)),
      response,
    );
  }

  /**
   * Adjust credits for an employee's leave plan.
   * @param id Employee leave plan ID
   * @param data Credit adjustment data
   * @param response Express response object
   * @returns Adjustment operation result
   */
  @Post('employee-plan/:id/adjust-credits')
  async adjustEmployeeCredits(
    @Param('id') id: string,
    @Body() data: AdjustEmployeeCreditsDto,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeLeavePlanService.adjustCredits(
        parseInt(id),
        data,
        this.utilityService.accountInformation.id,
      ),
      response,
    );
  }

  /**
   * Update leave settings for an employee's leave plan.
   * @param id Employee leave plan ID
   * @param data Leave settings update data
   * @param response Express response object
   * @returns Updated leave settings
   */
  @Patch('employee-plan/:id/settings')
  async updateEmployeeLeaveSettings(
    @Param('id') id: string,
    @Body() data: UpdateEmployeeLeaveSettingsDto,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeLeavePlanService.updateLeaveSettings(parseInt(id), data),
      response,
    );
  }

  /**
   * Get paginated table of credit history for an employee's leave plan.
   * @param id Employee leave plan ID
   * @param query Table query parameters (page, perPage)
   * @param body Table body parameters (filters, settings)
   * @param response Express response object
   * @returns Paginated credit history
   */
  @Put('employee-plan/:id/history/table')
  async getEmployeeCreditHistoryTable(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: TableQueryDTO,
    @Body() body: TableBodyDTO,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeLeavePlanService.getCreditHistoryTable(id, query, body),
      response,
    );
  }

  /**
   * Get all leave credit history for an employee across all leave plans.
   * @param accountId Employee account ID
   * @param query History filter parameters
   * @param response Express response object
   * @returns Employee's complete leave history
   */
  @Get('employee/:accountId/all-history')
  async getEmployeeAllHistory(
    @Param('accountId') accountId: string,
    @Query() query: EmployeeAllHistoryDto,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeLeavePlanService.getEmployeeAllHistory(accountId, query),
      response,
    );
  }

  /**
   * Get summary statistics for an employee's leave plan history.
   * @param id Employee leave plan ID
   * @param query Summary filter parameters
   * @param response Express response object
   * @returns History summary with statistics
   */
  @Get('employee-plan/:id/history/summary')
  async getEmployeeCreditHistorySummary(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistorySummaryDto,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeLeavePlanService.getCreditHistorySummary(id, query),
      response,
    );
  }

  /**
   * Export credit history to Excel file.
   * @param id Employee leave plan ID
   * @param query Export parameters
   * @param response Express response object
   * @returns Excel file download
   */
  @Get('employee-plan/:id/history/export')
  async exportEmployeeCreditHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistoryExportDto,
    @Res() response: Response,
  ) {
    const buffer = await this.employeeLeavePlanService.exportCreditHistory(
      id,
      query,
    );
    response.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="leave_credit_history.xlsx"',
      'Content-Length': buffer.length,
    });
    response.end(buffer);
  }

  /**
   * Bulk adjust credits for multiple employees in a leave plan.
   * @param leavePlanId Leave plan ID
   * @param data Bulk adjustment data
   * @param response Express response object
   * @returns Bulk adjustment results
   */
  @Post('plan/:leavePlanId/bulk-adjust-credits')
  async bulkAdjustCredits(
    @Param('leavePlanId', ParseIntPipe) leavePlanId: number,
    @Body() data: BulkCreditAdjustmentDto,
    @Res() response: Response,
  ) {
    return this.utilityService.responseHandler(
      this.employeeLeavePlanService.bulkAdjustCredits(
        leavePlanId,
        data,
        this.utilityService.accountInformation.id,
      ),
      response,
    );
  }

  // Initialize default leave types
  /**
   * Check if default leave types have been initialized for the company.
   * @param response Express response object
   * @returns Initialization status
   */
  @Get('initialization-status')
  async getInitializationStatus(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.leaveTypeService.getInitializationStatus(),
      response,
    );
  }

  /**
   * Initialize default leave types in the system.
   * @param response Express response object
   * @returns Initialization result with created leave types
   */
  @Post('initialize-defaults')
  async initializeDefaults(@Res() response: Response) {
    return this.utilityService.responseHandler(
      this.leaveTypeService.createDefaultLeaveTypes().then((result) => ({
        message: result.alreadyInitialized
          ? 'Default leave types have already been initialized for this company'
          : result.initialized
            ? `Successfully created ${result.createdTypes.total} default leave types`
            : 'All default leave types already exist',
        success: true,
        initialized: result.initialized,
        alreadyInitialized: result.alreadyInitialized,
        summary: {
          totalCreated: result.createdTypes.total,
          totalExisting: result.existingTypes.total,
          totalLeaveTypes: result.allTypes.total,
        },
        createdTypes: result.createdTypes.leaveTypes,
        existingTypes: result.existingTypes.leaveTypes,
        allTypes: result.allTypes.leaveTypes,
      })),
      response,
    );
  }
}

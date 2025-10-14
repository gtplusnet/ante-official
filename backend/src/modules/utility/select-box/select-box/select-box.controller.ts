import {
  Controller,
  Get,
  Res,
  HttpStatus,
  Inject,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { UtilityService } from '@common/utility.service';
import { SelectBoxService } from './select-box.service';
import {
  getSystemModuleReference,
  getScopeReferenceOptions,
  getScopeReferenceTree,
} from './select-box.service';

@Controller('select-box')
export class SelectBoxController {
  @Inject() public utilityService: UtilityService;
  @Inject() public selectBoxService: SelectBoxService;

  @Get('employee-list')
  async getSelectEmployeeList(@Res() response: Response) {
    this.utilityService.responseHandler(
      this.selectBoxService.getSelectEmployeeList(),
      response,
    );
  }

  @Get('holiday-type')
  async getHolidayTypeList(@Res() response: Response) {
    this.utilityService.responseHandler(
      this.selectBoxService.getHolidayTypeList(),
      response,
    );
  }

  @Get('petty-cash-liquidation-status')
  async getPettyCashLiquidationStatusList(@Res() response: Response) {
    try {
      const list =
        await this.selectBoxService.getPettyCashLiquidationStatusList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Petty cash liquidation status list fetched failed',
      );
    }
  }

  @Get('collection-type')
  async getCollectionTypeList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getCollectionTypeList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Collection type list fetched failed',
      );
    }
  }

  @Get('repair-stage')
  async getRepairStageList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getRepairStageList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Repair stage list fetched failed',
      );
    }
  }

  @Get('payee-type')
  async getPayeeTypeList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getPayeeTypeList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Payee type list fetched failed',
      );
    }
  }

  @Get('equipment-type')
  async getEquipmentType(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getEquipmentTypeList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Equipment type list fetched failed',
      );
    }
  }

  @Get('request-for-payment-status')
  async getRequestForPaymentStatusList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getRequestForPaymentStatusList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Request for payment status list fetched failed',
      );
    }
  }

  @Get('unit-of-measurement-list')
  async getUnitOfMeasurementList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getUnitOfMeasurementList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Unit of measurement list fetched failed',
      );
    }
  }

  @Get('brand-list')
  async getBrandList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getBrandList();
      return response.status(HttpStatus.OK).json({ list });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Brand list fetched failed',
      );
    }
  }

  @Get('equipment-type-list')
  async getEquipmentTypeList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getEquipmentTypeList();
      return response.status(HttpStatus.OK).json({ list });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Unit of measurement list fetched failed',
      );
    }
  }
  @Get('task-priority-list')
  async getTaskPriorityList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getTaskPriorityList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Task priority list fetched failed',
      );
    }
  }

  @Get('task-difficulty-list')
  async getTaskDifficultyList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getTaskDifficultyList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Task difficulty list fetched failed',
      );
    }
  }

  @Get('assign-mode-list')
  async getAssignModeList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getAssignModeList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Assign mode list fetched failed',
      );
    }
  }

  @Get('role-group-list')
  async getRoleGroupList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getRoleGroupList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Role group list fetched failed',
      );
    }
  }

  @Get('fund-account-list')
  async getFundAccountList(
    @Res() response: Response,
    @Query('exceptId') exceptId: number,
  ) {
    try {
      if (!exceptId) {
        exceptId = 0;
      } else {
        exceptId = Number(exceptId);
      }

      const list = await this.selectBoxService.getFundAccountList(exceptId);
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }
  @Get('fund-account-type-list')
  async getFundAccountTypeList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getFundAccountTypeList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }

  @Get('purchase-request-status-list')
  async getPurchaseRequestStatusList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getPurchaseRequestStatusList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }

  @Get('truck-load-stage-list')
  async getTruckLoadStageList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getTruckLoadStageList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }

  @Get('delivery-terms-list')
  async getDeliveryTermsList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getDeliveryTermsList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }

  @Get('delivery-status-list')
  async getDeliveryStatusList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getDeliveryStatusList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }

  @Get('tax-list')
  async getTaxList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getTaxList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }

  @Get('payment-terms-list')
  async getPaymentTermsList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getPaymentTermsList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }

  @Get('supplier-list')
  async getSupplierList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getSupplierList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }

  @Get('client-list')
  async getClientList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getClientList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }

  @Get('item-list')
  async getItemList(
    @Res() response: Response,
    @Query('warehouseId') warehouseId: string,
  ) {
    try {
      const list = await this.selectBoxService.getItemList(warehouseId);
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }

  @Get('warehouse-list')
  async getWarehouseList(
    @Res() response: Response,
    @Query('inTransitWarehouseOnly') inTransitWarehouseOnly: string,
  ) {
    try {
      const list = await this.selectBoxService.getWarehouseList(
        inTransitWarehouseOnly,
      );
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }

  @Get('project-status')
  async getProjectStatus(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getProjectStatus();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }
  @Get('project-list')
  async getProjectList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getProjectList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }
  @Get('user-list')
  async getUserList(@Res() response: Response, @Query() query: string) {
    try {
      const list = await this.selectBoxService.getUserList(query);
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }

  @Get('account-list')
  async getAccountList(
    @Res() response: Response,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('department') department?: string,
    @Query('excludeAccountIds') excludeAccountIds?: string,
  ) {
    try {
      const list = await this.selectBoxService.getAccountList({
        search,
        role,
        department,
        excludeAccountIds,
      });
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Account list fetched failed',
      );
    }
  }

  @Get('assignee-list')
  async getAssigneeList(
    @Res() response: Response,
    @Query('mode') mode: string,
  ) {
    try {
      const list = await this.selectBoxService.getAssigneeList(mode);
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }

  @Get('branch-list')
  async getBranchList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getBranchList();
      return response.status(HttpStatus.OK).json({ list });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Branch list fetched failed',
      );
    }
  }

  @Get('branch-tree')
  async getBranchTreeList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getBranchTreeList();
      return response.status(HttpStatus.OK).json({ list });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Branch tree list fetched failed',
      );
    }
  }

  @Get('category-tree')
  async getCategoryTreeList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getCategoryTreeList();
      return response.status(HttpStatus.OK).json({ list });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Category tree list fetched failed',
      );
    }
  }

  @Get('role-list-simple')
  async getRoleListSimple(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getRoleListSimple();
      return response.status(HttpStatus.OK).json({ list });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Role list fetched failed',
      );
    }
  }

  @Get('employment-status-list')
  async getEmploymentStatusList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getEmploymentStatusList();
      return response.status(HttpStatus.OK).json({ list });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Employment status list fetched failed',
      );
    }
  }

  @Get('payroll-group-list')
  async getPayrollGroupList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getPayrollGroupList();
      return response.status(HttpStatus.OK).json({ list });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Payroll group list fetched failed',
      );
    }
  }
  /**
   * GET /select-box/role-list?roleGroupId=...&developer=true
   * If developer=true, returns default (system) roles (companyId: null)
   * Otherwise, returns company-specific roles
   */
  @Get('role-list')
  async getRoleList(
    @Res() response: Response,
    @Query('roleGroupId') roleGroupId: string,
    @Query('developer') developer: string,
  ) {
    try {
      const isDeveloper = developer === 'true';
      const list = await this.selectBoxService.getRoleList(
        roleGroupId,
        isDeveloper,
      );
      return response.status(HttpStatus.OK).json({ list });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }
  @Get('parent-user-list')
  async getParentUserList(@Res() response: Response, @Query('id') id: string) {
    try {
      const list = await this.selectBoxService.getParentUserList(id);
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }
  @Get('location-list')
  async getLocationList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getLocationList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }
  @Get('location-region-list')
  async getLocationRegionList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getLocationRegionList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }
  @Get('location-province-list')
  async getLocationProvinceList(
    @Res() response: Response,
    @Query('regionId') regionId: number,
  ) {
    try {
      const list =
        await this.selectBoxService.getLocationProvinceList(regionId);
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }
  @Get('location-municipality-list')
  async getLocationMunicipalityList(
    @Res() response: Response,
    @Query('provinceId') provinceId: number,
  ) {
    try {
      const list =
        await this.selectBoxService.getLocationMunicipalityList(provinceId);
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }
  @Get('location-barangay-list')
  async getLocationBarangayList(
    @Res() response: Response,
    @Query('municipalityId') municipalityId: number,
  ) {
    try {
      const list =
        await this.selectBoxService.getLocationBarangayList(municipalityId);
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }

  @Get('departmentList')
  async getDepartment(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getDepartment();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }

  @Get('branch')
  async getBranch(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getBranch();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'List fetched failed',
      );
    }
  }

  @Get('system-module-list')
  async getSystemModuleList() {
    return getSystemModuleReference();
  }

  @Get('scope-list')
  async getScopeList(@Query('module') module?: string) {
    return getScopeReferenceOptions(module);
  }

  @Get('scope-tree')
  async getScopeTreeList(@Query('module') module?: string) {
    return getScopeReferenceTree(module);
  }

  @Get('win-probability-list')
  async getWinProbabilityList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getWinProbabilityList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Win probability list fetched failed',
      );
    }
  }

  @Get('relationship-owner-list')
  async getRelationshipOwnerList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getRelationshipOwnerList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Relationship owner list fetched failed',
      );
    }
  }

  @Get('deal-source-list')
  async getDealSourceList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getDealSourceList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Deal source list fetched failed',
      );
    }
  }

  @Get('scheduling-project-list')
  async getSchedulingProjectList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getSchedulingProjectList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Scheduling project list fetch failed',
      );
    }
  }

  @Get('bank-list')
  async getBankList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getBankList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Bank list fetched failed',
      );
    }
  }

  @Get('deal-type-list')
  async getDealTypeList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getDealTypeList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Deal type list fetched failed',
      );
    }
  }

  @Get('lead-source-list')
  async getLeadSourceList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getLeadSourceList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Lead source list fetched failed',
      );
    }
  }

  @Get('company-list')
  async getCompanyList(@Res() response: Response) {
    try {
      const list = await this.selectBoxService.getCompanyList();
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Company list fetched failed',
      );
    }
  }

  @Get('point-of-contact-list')
  async getPointOfContactList(
    @Res() response: Response,
    @Query('search') search?: string,
    @Query('companyId') companyId?: string,
  ) {
    try {
      const list = await this.selectBoxService.getPointOfContactList({
        search,
        companyId: companyId ? parseInt(companyId) : undefined,
      });
      return response.status(HttpStatus.OK).json({
        list,
      });
    } catch (err) {
      return this.utilityService.errorResponse(
        response,
        err,
        'Point of contact list fetched failed',
      );
    }
  }
}

import { Injectable, Inject } from '@nestjs/common';
import ProjectStatusReference from '../../../../reference/project-status.reference';
import PaymentTermsReference from '../../../../reference/payment-terms.reference';
import TaxTypeReference from '../../../../reference/tax-type.reference';
import DeliveryStatus from '../../../../reference/delivery-status.reference';
import { PrismaService } from '@common/prisma.service';
import {
  EmployeeData,
  Prisma,
  WarehouseType,
  EmploymentStatus,
  Client,
  Supplier,
  Project,
} from '@prisma/client';
import { UserOrgService } from '@modules/user/user-org/user-org.service';
import { UtilityService } from '@common/utility.service';
import DeliveryTermsReference from '../../../../reference/delivery-terms.reference';
import TruckLoadSTageReference from '../../../../reference/truck-load-stage.reference';
import PurchaseRequestStatusReference from '../../../../reference/purchase-request-status.reference';
import WaresehouseTypeReference from '../../../../reference/warehouse-type.reference';
import FundAccountTypeReference from '../../../../reference/fund-account-type.reference';
import WalletCodeReference from '../../../../reference/wallet-code.reference';
import AssignModeReference from '../../../../reference/assign-mode.reference';
import TaskDifficultyReference from '../../../../reference/task-difficulty.reference';
import BoardLaneReference from '../../../../reference/board-lane.reference';
import TaskPriorityReference from '../../../../reference/task-priority.reference';
import WatcherTypeReference from '../../../../reference/watcher-type.reference';
import UnitOfMeasurementReference from '../../../../reference/uom-list.reference';
import EquipmentTypeReference from '../../../../reference/equipment-type.reference';
import RepairStageReference from '../../../../reference/repair-stage.reference';
import PayeeTypeReference from '../../../../reference/payee-type.reference';
import RequestForPaymentStatusReference from '../../../../reference/request-for-payment-status.reference';
import CollectionTypeReference from '../../../../reference/collection-type.reference';
import PettyCashLiquidationStatusReference from '../../../../reference/petty-cash-liquidation-status.reference';
import HolidayTypeReference from '../../../../reference/holiday-type.reference';
import { SystemModule } from '../../../../shared/enums/user-level.enums';
import ScopeReference from '../../../../reference/scope.reference';
import WinProbabilityReference from '../../../../reference/win-probability.reference';
import LeadSourceReference from '../../../../reference/lead-source.reference';

@Injectable()
export class SelectBoxService {
  @Inject() public prisma: PrismaService;
  @Inject() public userOrgService: UserOrgService;
  @Inject() public utilityService: UtilityService;

  async getSelectEmployeeList() {
    const list: EmployeeData[] = await this.prisma.employeeData.findMany();

    const employeeList = await Promise.all(
      list.map(async (employee: EmployeeData) => {
        const account = await this.prisma.account.findFirst({
          where: { id: employee.accountId },
          include: { role: true },
        });

        const firstName = account?.firstName
          ? account.firstName.charAt(0).toUpperCase() +
            account.firstName.slice(1)
          : '';
        const lastName = account?.lastName
          ? account.lastName.charAt(0).toUpperCase() + account.lastName.slice(1)
          : '';
        const accountRole = account?.role?.name || '';

        return {
          key: employee.accountId,
          label: `${firstName} ${lastName} (${accountRole})`,
        };
      }),
    );

    return employeeList;
  }

  async getHolidayTypeList() {
    return HolidayTypeReference;
  }

  async getPettyCashLiquidationStatusList() {
    return PettyCashLiquidationStatusReference;
  }
  async getCollectionTypeList() {
    return CollectionTypeReference;
  }
  async getRequestForPaymentStatusList() {
    return RequestForPaymentStatusReference;
  }
  async getPayeeTypeList() {
    return PayeeTypeReference;
  }
  async getRepairStageList() {
    return RepairStageReference;
  }
  async getBrandList() {
    const list = await this.prisma.equipmentBrand.findMany({
      where: { isDeleted: false },
    });

    return list.map((brand: Prisma.EquipmentBrandUncheckedCreateInput) => {
      return {
        key: brand.id,
        label: brand.name,
      };
    });
  }
  async getEquipmentTypeList() {
    return EquipmentTypeReference;
  }
  async getWatcherTypeList() {
    return WatcherTypeReference;
  }
  async getTaskPriorityList() {
    return TaskPriorityReference;
  }
  async getBoardLaneList() {
    return BoardLaneReference;
  }
  async getUnitOfMeasurementList() {
    return UnitOfMeasurementReference;
  }
  async getUserList(query: any) {
    const where: any = {
      isDeleted: false,
      companyId: this.utilityService.companyId,
    };

    // Only exclude current user if not explicitly requested to include
    if (!query?.includeCurrentUser || query.includeCurrentUser !== 'true') {
      where.id = { not: this.utilityService.accountInformation.id };
    }

    const list = await this.prisma.account.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return list.map((user) => {
      return {
        key: user.id,
        label: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        roleId: user.role.id,
        roleName: user.role.name,
      };
    });
  }

  async getAccountList(filters?: {
    search?: string;
    role?: string;
    department?: string;
    excludeAccountIds?: string;
  }) {
    const where: any = {
      isDeleted: false,
      companyId: this.utilityService.companyId,
    };

    // Add search filter
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Add role filter
    if (filters?.role && filters.role !== 'all') {
      where.role = {
        name: filters.role,
      };
    }

    // Add department filter
    if (filters?.department && filters.department !== 'all') {
      where.role = {
        ...where.role,
        roleGroup: {
          name: filters.department,
        },
      };
    }

    // Add exclude account IDs filter
    if (filters?.excludeAccountIds) {
      const excludedIds = filters.excludeAccountIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      if (excludedIds.length > 0) {
        where.id = {
          notIn: excludedIds,
        };
      }
    }

    const list = await this.prisma.account.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        username: true,
        email: true,
        role: {
          select: {
            id: true,
            name: true,
            roleGroup: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    return list.map((account) => {
      // Build full name with middle name if available
      const nameParts = [account.firstName];
      if (account.middleName) {
        nameParts.push(account.middleName);
      }
      nameParts.push(account.lastName);
      const fullName = nameParts.filter(Boolean).join(' ');

      // Include role name in the label for better identification
      const label = account.role?.name
        ? `${fullName} (${account.role.name})`
        : fullName;

      return {
        key: account.id,
        label: label,
        firstName: account.firstName,
        lastName: account.lastName,
        middleName: account.middleName,
        username: account.username,
        email: account.email,
        roleId: account.role?.id || null,
        roleName: account.role?.name || '',
        departmentId: account.role?.roleGroup?.id || null,
        departmentName: account.role?.roleGroup?.name || '',
      };
    });
  }

  async getTaskDifficultyList() {
    return TaskDifficultyReference;
  }

  async getAssignModeList() {
    return AssignModeReference;
  }
  async getRoleGroupList() {
    const list = await this.prisma.roleGroup.findMany({
      where: { isDeleted: false },
    });

    return list.map((roleGroup: Prisma.RoleGroupUncheckedCreateInput) => {
      return {
        key: roleGroup.id,
        label: roleGroup.name,
      };
    });
  }
  async getFundAccountList($exceptId: number) {
    const list = await this.prisma.fundAccount.findMany({
      where: {
        isDeleted: false,
        companyId: this.utilityService.companyId,
        NOT: {
          id: $exceptId,
        },
      },
    });

    return list.map((fundAccount: Prisma.FundAccountUncheckedCreateInput) => {
      return {
        key: fundAccount.id,
        label:
          fundAccount.name +
          ' (' +
          this.utilityService.formatCurrency(fundAccount.balance)
            .formatCurrency +
          ')',
        balance: fundAccount.balance,
      };
    });
  }
  async getWalletCodeList() {
    return WalletCodeReference;
  }
  async getFundAccountTypeList() {
    return FundAccountTypeReference;
  }
  async getWarehouseTypeList() {
    return WaresehouseTypeReference;
  }
  async getPurchaseRequestStatusList() {
    return PurchaseRequestStatusReference;
  }

  async getTruckLoadStageList() {
    return TruckLoadSTageReference;
  }
  async getDeliveryTermsList() {
    return DeliveryTermsReference;
  }
  async getProjectStatus() {
    return ProjectStatusReference;
  }

  async getTaxList() {
    return TaxTypeReference;
  }

  async getPaymentTermsList() {
    return PaymentTermsReference;
  }

  async getDeliveryStatusList() {
    return DeliveryStatus;
  }
  async getClientList() {
    const list = await this.prisma.client.findMany({
      where: { isDeleted: false, companyId: this.utilityService.companyId },
      include: { location: true },
    });

    const processedList = this.formatClientResponseList(list as Client[]);

    return processedList.map((client: any) => {
      return {
        key: client.id,
        label: client.name,
        ...client,
      };
    });
  }

  async getSupplierList() {
    const list = await this.prisma.supplier.findMany({
      where: { isDeleted: false, companyId: this.utilityService.companyId },
      include: { location: true },
    });

    const processedList = this.formatSupplierResponseList(list as Supplier[]);

    return processedList.map((supplier: any) => {
      return {
        key: supplier.id,
        label: supplier.name,
        ...supplier,
      };
    });
  }
  async getItemList(warehouseId: string) {
    let list = await this.prisma.item.findMany({
      where: {
        isDeleted: false,
        estimatedBuyingPrice: { not: null },
        companyId: this.utilityService.companyId,
      },
    });

    if (warehouseId) {
      list = await Promise.all(
        list.map(async (item) => {
          const inventory = await this.prisma.inventoryItem.findFirst({
            where: {
              itemId: item.id,
              warehouseId,
            },
          });
          return { ...item, stockCount: inventory?.stockCount || 0 };
        }),
      );
    }

    return list.map((item: Prisma.ItemUncheckedCreateInput) => {
      return {
        ...item,
        key: item.id,
        label: `${item.name} (${item.sku})`,
      };
    });
  }
  async getProjectList() {
    const list = await this.prisma.project.findMany({
      where: {
        isDeleted: false,
        isLead: false,
        status: 'PROJECT',
        companyId: this.utilityService.companyId,
      },
      include: { location: true, client: true, personInCharge: true },
    });

    const processedList = this.formatProjectResponseList(list as Project[]);

    return processedList.map((project: any) => {
      return {
        key: project.id,
        label: project.name,
        ...project,
      };
    });
  }
  async getAssigneeList(mode: string) {
    const where: any = {
      isDeleted: false,
      companyId: this.utilityService.companyId,
    };

    if (mode === 'others') {
      where['id'] = { not: this.utilityService.accountInformation.id };
    }

    const list = await this.prisma.account.findMany({
      where,
    });

    return list.map((user: Prisma.AccountUncheckedCreateInput) => {
      return {
        key: user.id,
        label: user.firstName + ' ' + user.lastName,
      };
    });
  }
  async getWarehouseList(inTransitWarehouseOnly: string) {
    let where: Prisma.WarehouseScalarWhereWithAggregatesInput = {
      isDeleted: false,
      warehouseType: {
        in: [WarehouseType.COMPANY_WAREHOUSE, WarehouseType.PROJECT_WAREHOUSE],
      },
      companyId: this.utilityService.companyId,
    };

    if (inTransitWarehouseOnly) {
      where = {
        isDeleted: false,
        warehouseType: WarehouseType.IN_TRANSIT_WAREHOUSE,
      };
    }

    const list: Prisma.WarehouseUncheckedCreateInput[] =
      await this.prisma.warehouse.findMany({ where });

    return list.map((warehouse: Prisma.WarehouseUncheckedCreateInput) => {
      return {
        ...warehouse,
        key: warehouse.id,
        label: warehouse.name,
      };
    });
  }
  async getRoleList(roleGroupId: string, developer?: boolean) {
    const where: any = { isDeleted: false };
    if (roleGroupId && roleGroupId !== undefined) {
      where['roleGroupId'] = String(roleGroupId);
    }
    if (developer) {
      where['companyId'] = null;
    } else {
      where['companyId'] = this.utilityService.companyId;
    }

    const list = await this.prisma.role.findMany({ where });
    return list.map((role: any) => ({
      key: role.id,
      label: role.name,
    }));
  }
  async getParentUserList(id: string) {
    const list = await this.userOrgService.findParentUserDropdownList({ id });

    return list.map((user) => {
      return {
        key: user.id,
        label: `${user.firstName} ${user.lastName} (${user.roleName})`,
      };
    });
  }
  async getLocationList() {
    const list = await this.prisma.location.findMany({
      where: {
        isDeleted: false,
        companyId: this.utilityService.companyId,
      },
      include: {
        region: true,
        province: true,
        municipality: true,
        barangay: true,
      },
    });

    return list.map((location) => {
      return {
        value: location.id,
        label: `${location.name} (${location.region.name}, ${location.province.name})`,
      };
    });
  }

  async getLocationRegionList() {
    const list = await this.prisma.locationRegion.findMany();

    return list.map((region: Prisma.LocationRegionUncheckedCreateInput) => {
      return {
        key: region.id,
        label: `${region.name} (${region.description})`,
      };
    });
  }
  async getLocationProvinceList(regionId: number) {
    regionId = Number(regionId);
    const list = await this.prisma.locationProvince.findMany({
      where: { regionId },
    });

    return list.map((province: Prisma.LocationProvinceUncheckedCreateInput) => {
      return {
        key: province.id,
        label: `${province.name} (${province.description})`,
      };
    });
  }
  async getLocationMunicipalityList(provinceId: number) {
    provinceId = Number(provinceId);
    const list = await this.prisma.locationMunicipality.findMany({
      where: { provinceId },
    });
    return list.map(
      (municipality: Prisma.LocationMunicipalityUncheckedCreateInput) => {
        return {
          key: municipality.id,
          label: `${municipality.name} (${municipality.description})`,
        };
      },
    );
  }
  async getLocationBarangayList(municipalityId: number) {
    municipalityId = Number(municipalityId);
    const list = await this.prisma.locationBarangay.findMany({
      where: { municipalityId },
    });

    return list.map((barangay: Prisma.LocationBarangayUncheckedCreateInput) => {
      return {
        key: barangay.id,
        label: `${barangay.name} (${barangay.description})`,
      };
    });
  }

  async getDepartment() {
    const arrayData = [];
    const list = await this.prisma.roleGroup.findMany();

    list.forEach((pro) => {
      arrayData.push({ key: pro.id, label: pro.name });
    });
    return arrayData;
  }

  async getBranch() {
    const arrayData = [];
    const listOfBranch = await this.prisma.project.findMany({
      where: {
        isDeleted: false,
        status: 'BRANCH',
        companyId: this.utilityService.companyId,
      },
    });
    listOfBranch.forEach((data) => {
      arrayData.push({ key: data.id, label: data.name });
    });
    return arrayData;
  }

  async getBranchList() {
    const branches = await this.prisma.project.findMany({
      where: {
        companyId: this.utilityService.companyId,
        isDeleted: false,
        status: 'BRANCH',
      },
      orderBy: { name: 'asc' }, // Alphabetical sorting
    });

    return [
      { key: 'all', label: 'All Branches' },
      ...branches.map((branch) => ({
        key: branch.id,
        label: branch.name,
      })),
    ];
  }

  async getBranchTreeList() {
    // Fetch all branches in a single query
    const allBranches = await this.prisma.project.findMany({
      where: {
        companyId: this.utilityService.companyId,
        isDeleted: false,
        status: 'BRANCH',
      },
      orderBy: { name: 'asc' },
    });

    // Build a map for quick parent-child lookups
    const branchMap = new Map();
    const childrenMap = new Map();

    // Initialize maps
    allBranches.forEach((branch) => {
      branchMap.set(branch.id, branch);
      childrenMap.set(branch.id, []);
    });

    // Build parent-child relationships
    allBranches.forEach((branch) => {
      if (branch.parentId && childrenMap.has(branch.parentId)) {
        childrenMap.get(branch.parentId).push(branch);
      }
    });

    // Function to count all descendants recursively
    const countAllDescendants = (branchId: number): number => {
      const directChildren = childrenMap.get(branchId) || [];
      let count = directChildren.length;

      directChildren.forEach((child) => {
        count += countAllDescendants(child.id);
      });

      return count;
    };

    // Build flat list with tree information
    const flattenBranches = (branches: any[], depth = 0): any[] => {
      const result: any[] = [];
      for (const branch of branches) {
        const children = childrenMap.get(branch.id) || [];
        const totalDescendants = countAllDescendants(branch.id);

        result.push({
          key: branch.id,
          label: branch.name,
          depth,
          hasChildren: children.length > 0,
          childCount: totalDescendants, // Total count of all descendants
          parentId: branch.parentId,
        });

        if (children.length > 0) {
          // Sort children by name before flattening
          const sortedChildren = children.sort((a, b) =>
            a.name.localeCompare(b.name),
          );
          result.push(...flattenBranches(sortedChildren, depth + 1));
        }
      }
      return result;
    };

    // Filter to only root branches (no parent) and sort them
    const rootBranches = allBranches
      .filter((b) => !b.parentId)
      .sort((a, b) => a.name.localeCompare(b.name));

    const treeList = flattenBranches(rootBranches);

    return [
      {
        key: 'all',
        label: 'All Branches',
        depth: 0,
        hasChildren: false,
        childCount: 0,
      },
      ...treeList,
    ];
  }

  async getCategoryTreeList() {
    // Fetch all categories in a single query
    const allCategories = await this.prisma.itemCategory.findMany({
      where: {
        companyId: this.utilityService.companyId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    // Build a map for quick parent-child lookups
    const categoryMap = new Map();
    const childrenMap = new Map();

    // Initialize maps
    allCategories.forEach((category) => {
      categoryMap.set(category.id, category);
      childrenMap.set(category.id, []);
    });

    // Build parent-child relationships
    allCategories.forEach((category) => {
      if (category.parentId && childrenMap.has(category.parentId)) {
        childrenMap.get(category.parentId).push(category);
      }
    });

    // Function to count all descendants recursively
    const countAllDescendants = (categoryId: number): number => {
      const directChildren = childrenMap.get(categoryId) || [];
      let count = directChildren.length;

      directChildren.forEach((child) => {
        count += countAllDescendants(child.id);
      });

      return count;
    };

    // Build flat list with tree information
    const flattenCategories = (categories: any[], depth = 0): any[] => {
      const result: any[] = [];
      for (const category of categories) {
        const children = childrenMap.get(category.id) || [];
        const totalDescendants = countAllDescendants(category.id);

        result.push({
          key: category.id,
          label: category.name,
          depth,
          hasChildren: children.length > 0,
          childCount: totalDescendants, // Total count of all descendants
          parentId: category.parentId,
        });

        if (children.length > 0) {
          // Sort children by name before flattening
          const sortedChildren = children.sort((a, b) =>
            a.name.localeCompare(b.name),
          );
          result.push(...flattenCategories(sortedChildren, depth + 1));
        }
      }
      return result;
    };

    // Filter to only root categories (no parent) and sort them
    const rootCategories = allCategories
      .filter((c) => !c.parentId)
      .sort((a, b) => a.name.localeCompare(b.name));

    const treeList = flattenCategories(rootCategories);

    return treeList;
  }

  async getRoleListSimple() {
    const roles = await this.prisma.role.findMany({
      where: {
        companyId: this.utilityService.companyId,
        isDeleted: false,
      },
      orderBy: { name: 'asc' }, // Alphabetical sorting
    });

    return [
      { key: 'all', label: 'All Roles' },
      ...roles.map((role) => ({
        key: role.id,
        label: role.name,
      })),
    ];
  }

  async getEmploymentStatusList() {
    const statuses = Object.values(EmploymentStatus).map((status) => ({
      key: status,
      label: this.formatEmploymentStatus(status),
    }));

    return [{ key: 'all', label: 'All Status' }, ...statuses];
  }

  async getPayrollGroupList() {
    const payrollGroups = await this.prisma.payrollGroup.findMany({
      where: {
        companyId: this.utilityService.companyId,
        isDeleted: false,
      },
      orderBy: { payrollGroupCode: 'asc' }, // Alphabetical sorting
    });

    return [
      { key: 'all', label: 'All Payroll Groups' },
      ...payrollGroups.map((group) => ({
        key: group.id,
        label: group.payrollGroupCode,
      })),
    ];
  }

  private formatEmploymentStatus(status: EmploymentStatus): string {
    switch (status) {
      case EmploymentStatus.REGULAR:
        return 'Regular';
      case EmploymentStatus.CONTRACTTUAL:
        return 'Contractual';
      case EmploymentStatus.PROBATIONARY:
        return 'Probationary';
      case EmploymentStatus.TRAINEE:
        return 'Trainee';
      default:
        return status;
    }
  }

  async getWinProbabilityList() {
    return WinProbabilityReference.map((item) => ({
      label: item.label,
      value: item.key,
    }));
  }

  async getSchedulingProjectList() {
    const list = await this.prisma.project.findMany({
      where: {
        isDeleted: false,
        companyId: this.utilityService.companyId,
        // No status filter - includes PROJECT, LEAD, and BRANCH
        // No isLead filter - includes both leads and non-leads
      },
      include: {
        location: true,
        client: true,
        personInCharge: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // Group by type: BRANCH, LEAD, PROJECT
        { name: 'asc' }, // Then alphabetically
      ],
    });

    // Format with type indicators
    return list.map((project: any) => ({
      key: project.id,
      label: `${project.name}${this.getProjectTypeLabel(project)}`,
      value: project.id,
      name: project.name,
      type: this.getProjectType(project),
      status: project.status,
      isLead: project.isLead,
      // Include other relevant fields
      clientName: project.client?.name || null,
      locationName: project.location?.name || null,
      personInChargeName: project.personInCharge
        ? `${project.personInCharge.firstName} ${project.personInCharge.lastName}`
        : null,
    }));
  }

  private getProjectType(project: any): string {
    if (project.status === 'BRANCH') return 'branch';
    if (project.isLead || project.status === 'LEAD') return 'lead';
    return 'project';
  }

  private getProjectTypeLabel(project: any): string {
    const type = this.getProjectType(project);
    switch (type) {
      case 'branch':
        return ' (Branch)';
      case 'lead':
        return ' (Lead)';
      default:
        return '';
    }
  }

  async getBankList() {
    const philippineBanksReference = await import(
      '../../../../reference/philippine-banks.reference'
    );
    return philippineBanksReference.default.map((bank) => ({
      label: bank.label,
      value: bank.key,
    }));
  }

  async getDealTypeList() {
    const dealTypes = await this.prisma.dealType.findMany({
      where: {
        isActive: true,
        companyId: this.utilityService.companyId, // Filter by user's company
      },
      orderBy: { typeName: 'asc' },
    });

    return dealTypes.map((type) => ({
      label: type.typeName,
      value: type.id,
    }));
  }

  async getLeadSourceList() {
    return LeadSourceReference.map((item) => ({
      label: item.label,
      value: item.key,
    }));
  }

  async getCompanyList() {
    const companies = await this.prisma.leadCompany.findMany({
      where: {
        isActive: true,
        companyId: this.utilityService.companyId, // Filter by user's company
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return companies.map((company) => ({
      label: company.name,
      value: company.id,
    }));
  }

  async getPointOfContactList(params?: {
    search?: string;
    companyId?: number;
  }) {
    const where: any = {
      isActive: true,
      company: {
        companyId: this.utilityService.companyId, // Filter by user's company
      },
    };

    if (params?.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { jobTitle: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params?.companyId) {
      where.companyId = params.companyId;
    }

    const contacts = await this.prisma.pointOfContact.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    return contacts.map((contact) => ({
      label: `${contact.fullName} - ${contact.company.name}`,
      sublabel: contact.jobTitle || contact.email,
      value: contact.id,
      // Additional data for frontend
      email: contact.email,
      phone: contact.phone,
      jobTitle: contact.jobTitle,
      companyName: contact.company.name,
    }));
  }

  /**
   * Formats a list of client responses
   */
  private formatClientResponseList(clients: Client[]): any[] {
    if (!clients || clients.length === 0) return [];

    return clients.map((client) => this.formatClientResponse(client));
  }

  /**
   * Formats a single client response
   */
  private formatClientResponse(client: any): any {
    if (!client) return null;

    return {
      id: client.id,
      name: client.name,
      contactNumber: client.contactNumber,
      email: client.email,
      totalCollection: this.utilityService.formatCurrency(
        client.totalCollection,
      ),
      totalCollectionBalance: this.utilityService.formatCurrency(
        client.totalCollectionBalance,
      ),
      totalCollected: this.utilityService.formatCurrency(client.totalCollected),
      location: client.location,
      isDeleted: client.isDeleted,
      createdAt: this.utilityService.formatDate(client.createdAt),
    };
  }

  /**
   * Formats a list of supplier responses
   */
  private formatSupplierResponseList(suppliers: Supplier[]): any[] {
    if (!suppliers || suppliers.length === 0) return [];

    return suppliers.map((supplier) => this.formatSupplierResponse(supplier));
  }

  /**
   * Formats a single supplier response
   */
  private formatSupplierResponse(supplier: any): any {
    if (!supplier) return null;

    return {
      id: supplier.id,
      name: supplier.name,
      contactNumber: supplier.contactNumber,
      email: supplier.email,
      taxType: supplier.taxType,
      paymentTerms: supplier.paymentTerms,
      location: supplier.location,
      isDeleted: supplier.isDeleted,
      createdAt: this.utilityService.formatDate(supplier.createdAt),
      updatedAt: this.utilityService.formatDate(supplier.updatedAt),
    };
  }

  /**
   * Formats a list of project responses
   */
  private formatProjectResponseList(projects: Project[]): any[] {
    if (!projects || projects.length === 0) return [];

    return projects.map((project) => this.formatProjectResponse(project));
  }

  /**
   * Formats a single project response
   */
  private formatProjectResponse(project: any): any {
    if (!project) return null;

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      budget: this.utilityService.formatCurrency(project.budget),
      address: project.address,
      isDeleted: project.isDeleted,
      startDate: this.utilityService.formatDate(project.startDate),
      endDate: this.utilityService.formatDate(project.endDate),
      status: project.status,
      isLead: project.isLead,
      location: project.location,
      client: project.client,
      downpaymentAmount: this.utilityService.formatCurrency(
        project.downpaymentAmount,
      ),
      retentionAmount: this.utilityService.formatCurrency(
        project.retentionAmount,
      ),
      totalCollection: this.utilityService.formatCurrency(
        project.totalCollection,
      ),
      totalCollectionBalance: this.utilityService.formatCurrency(
        project.totalCollectionBalance,
      ),
      totalCollected: this.utilityService.formatCurrency(
        project.totalCollected,
      ),
      progressPercentage: project.progressPercentage,
      isProjectStarted: project.isProjectStarted,
      winProbability: project.winProbability,
      personInCharge: project.personInCharge,
    };
  }

  async getRelationshipOwnerList() {
    const list = await this.prisma.leadRelationshipOwner.findMany({
      where: {
        isActive: true,
        companyId: this.utilityService.companyId, // Filter by user's company
      },
      include: {
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return list.map((owner) => {
      return {
        value: owner.account.id,
        label: `${owner.account.firstName} ${owner.account.lastName}`,
        firstName: owner.account.firstName,
        lastName: owner.account.lastName,
        username: owner.account.username,
        email: owner.account.email,
        roleId: owner.account.role.id,
        roleName: owner.account.role.name,
      };
    });
  }

  async getDealSourceList() {
    const list = await this.prisma.dealSource.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sourceName: 'asc',
      },
    });

    return list.map((source) => {
      return {
        value: source.id,
        label: source.sourceName,
        sourceName: source.sourceName,
      };
    });
  }
}

export function getSystemModuleReference() {
  return Object.values(SystemModule).map((value) => ({ label: value, value }));
}

export function getScopeReferenceOptions(module?: string) {
  return ScopeReference.filter(
    (scope) => !module || scope.module === module,
  ).map((scope) => ({
    label: scope.name,
    value: scope.id,
    description: scope.description,
  }));
}

export function getScopeReferenceTree(module?: string) {
  const filteredScopes = ScopeReference.filter(
    (scope) => !module || scope.module === module,
  );

  // No need for special handling - all parent relationships are defined in scope.reference.ts

  // Build parent-child map
  const scopeMap = new Map();
  const childrenMap = new Map();

  filteredScopes.forEach((scope) => {
    scopeMap.set(scope.id, scope);
    childrenMap.set(scope.id, []);
  });

  // Build relationships
  filteredScopes.forEach((scope) => {
    if (scope.parentId && childrenMap.has(scope.parentId)) {
      childrenMap.get(scope.parentId).push(scope);
    }
  });

  // Build tree structure
  const buildNode = (scope: any, depth = 0) => ({
    key: scope.id,
    label: scope.name,
    value: scope.id,
    description: scope.description,
    type: scope.type,
    depth,
    hasChildren: childrenMap.get(scope.id).length > 0,
    childCount: childrenMap.get(scope.id).length,
    parentId: scope.parentId,
    icon:
      scope.type === 'PAGE'
        ? 'folder'
        : scope.type === 'SUBPAGE'
          ? 'description'
          : scope.type === 'BUTTON'
            ? 'smart_button'
            : scope.id === 'MANPOWER_CONFIGURATION'
              ? 'settings'
              : scope.id === 'MANPOWER_REPORTS'
                ? 'assessment'
                : scope.id === 'MANPOWER_PAYROLL'
                  ? 'calculate'
                  : scope.id === 'MANPOWER_TEAM'
                    ? 'groups'
                    : scope.id === 'MANPOWER_TIMEKEEPING_LOGS'
                      ? 'access_time'
                      : 'widgets',
    virtual: scope.virtual || false,
  });

  // Return flattened tree for compatibility
  const result: any[] = [];
  const addToResult = (scopeId: string, depth = 0) => {
    const scope = scopeMap.get(scopeId);
    if (!scope) return;

    result.push(buildNode(scope, depth));
    const children = childrenMap.get(scopeId) || [];
    children.forEach((child: any) => addToResult(child.id, depth + 1));
  };

  // Start with root nodes
  filteredScopes
    .filter((scope) => !scope.parentId)
    .forEach((scope) => addToResult(scope.id));

  return result;
}

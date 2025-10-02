import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import {
  AddPayrollApproverRequest,
  BulkAddPayrollApproverRequest,
  TableRequest,
} from '../../../../shared/request';
import { PayrollApproverDataResponse } from '../../../../shared/response';
import { PrismaService } from '@common/prisma.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { AccountService } from '@modules/account/account/account.service';
import { EmployeeListService } from '@modules/hr/employee/employee-list/employee-list.service';
import { UtilityService } from '@common/utility.service';
import { EmployeeSelectionService } from '@modules/hr/employee/employee-selection/employee-selection.service';
import { EmployeeSelectionFilterDto } from '@modules/hr/employee/employee-selection/employee-selection.dto';

@Injectable()
export class PayrollApproversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tableHandlerService: TableHandlerService,
    private readonly accountService: AccountService,
    @Inject() private readonly employeeListService: EmployeeListService,
    @Inject() private readonly utilityService: UtilityService,
    @Inject()
    private readonly employeeSelectionService: EmployeeSelectionService,
  ) {}

  async table(body: TableRequest, companyId: number) {
    const query: TableQueryDTO = {
      page: body.page,
      perPage: body.perPage,
      search: body.searchKeyword,
    };
    const tableSettings = {
      defaultOrderBy: 'createdAt',
      defaultOrderType: 'desc',
      sort: [],
      filter: [],
    };
    const tableBody: TableBodyDTO = {
      filters: body.filters || [],
      settings: tableSettings,
    };
    this.tableHandlerService.initialize(query, tableBody, 'payrollApprovers');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery.where = { ...tableQuery.where, companyId };
    const model = this.prisma.payrollApprovers;
    const result = await this.tableHandlerService.getTableData(model, query, {
      ...tableQuery,
      include: { account: true },
    });
    result.list = await Promise.all(
      result.list.map((item) => this.formatResponse(item)),
    );
    return result;
  }

  async add(
    body: AddPayrollApproverRequest & {
      approvalLevel?: number | { value: number; label: string };
    },
    companyId: number,
  ): Promise<PayrollApproverDataResponse> {
    let approvalLevel = 1;
    if (body.approvalLevel !== undefined && body.approvalLevel !== null) {
      if (typeof body.approvalLevel === 'object') {
        approvalLevel = (body.approvalLevel as { value: number; label: string })
          .value;
      } else if (typeof body.approvalLevel === 'number') {
        approvalLevel = body.approvalLevel;
      }
    }

    const exists = await this.prisma.payrollApprovers.findFirst({
      where: {
        accountId: body.accountId,
        companyId,
        approvalLevel,
      },
    });
    if (exists) {
      throw new BadRequestException(
        `This account is already an approver at level ${approvalLevel} for this company.`,
      );
    }
    const created = await this.prisma.payrollApprovers.create({
      data: {
        accountId: body.accountId,
        companyId,
        approvalLevel,
        isActive: true,
      },
      include: { account: true },
    });
    return this.formatResponse(created);
  }

  async bulkAdd(
    body: BulkAddPayrollApproverRequest & {
      approvalLevel?: number | { value: number; label: string };
    },
    companyId: number,
  ): Promise<PayrollApproverDataResponse[]> {
    let approvalLevel = 1;
    if (body.approvalLevel !== undefined && body.approvalLevel !== null) {
      if (typeof body.approvalLevel === 'object') {
        approvalLevel = (body.approvalLevel as { value: number; label: string })
          .value;
      } else if (typeof body.approvalLevel === 'number') {
        approvalLevel = body.approvalLevel;
      }
    }

    const existingApprovers = await this.prisma.payrollApprovers.findMany({
      where: {
        accountId: { in: body.accountIds },
        companyId,
        approvalLevel,
      },
    });
    const existingIds = new Set(existingApprovers.map((a) => a.accountId));
    const newAccountIds = body.accountIds.filter((id) => !existingIds.has(id));
    if (newAccountIds.length === 0) {
      throw new BadRequestException(
        `All provided accounts are already approvers at level ${approvalLevel} for this company.`,
      );
    }
    const results = await Promise.all(
      newAccountIds.map(async (accountId) => {
        const created = await this.prisma.payrollApprovers.create({
          data: {
            accountId,
            companyId,
            approvalLevel,
          },
          include: { account: true },
        });
        return this.formatResponse(created);
      }),
    );
    return results;
  }

  async delete(
    accountId: string,
    companyId: number,
  ): Promise<{ deleted: boolean }> {
    await this.prisma.payrollApprovers.deleteMany({
      where: {
        accountId,
        companyId,
      },
    });
    return { deleted: true };
  }

  async getEmployeeSelect(filters?: EmployeeSelectionFilterDto) {
    const companyId = this.utilityService.companyId;

    if (!companyId) {
      throw new BadRequestException('Company ID is required');
    }

    // Get existing approvers to exclude
    const approvers = await this.prisma.payrollApprovers.findMany({
      where: {
        companyId,
      },
      select: {
        accountId: true,
      },
    });

    const excludeAccountIds = approvers.map((approver) => approver.accountId);

    // Use the common employee selection service
    return await this.employeeSelectionService.getSelectableEmployees(
      {
        ...filters,
        excludeAccountIds,
      },
      companyId,
    );
  }

  async getApproversByLevel(
    level: number,
  ): Promise<PayrollApproverDataResponse[]> {
    const companyId = this.utilityService.companyId;

    const approvers = await this.prisma.payrollApprovers.findMany({
      where: {
        companyId,
        approvalLevel: level,
        isActive: true,
      },
      include: { account: true },
    });

    return Promise.all(
      approvers.map((approver) => this.formatResponse(approver)),
    );
  }

  async getApprovalChain(): Promise<Record<string, string[]>> {
    const companyId = this.utilityService.companyId;

    const approvers = await this.prisma.payrollApprovers.findMany({
      where: {
        companyId,
        isActive: true,
      },
      orderBy: {
        approvalLevel: 'asc',
      },
    });

    const chain: Record<string, string[]> = {};

    approvers.forEach((approver) => {
      const level = approver.approvalLevel.toString();
      if (!chain[level]) {
        chain[level] = [];
      }
      chain[level].push(approver.accountId);
    });

    return chain;
  }

  async toggleStatus(
    accountId: string,
    companyId: number,
  ): Promise<PayrollApproverDataResponse> {
    const approver = await this.prisma.payrollApprovers.findFirst({
      where: {
        accountId,
        companyId,
      },
    });

    if (!approver) {
      throw new BadRequestException('Approver not found');
    }

    const updated = await this.prisma.payrollApprovers.update({
      where: {
        id: approver.id,
      },
      data: {
        isActive: !approver.isActive,
      },
      include: { account: true },
    });

    return this.formatResponse(updated);
  }

  private async formatResponse(
    data: Record<string, any>,
  ): Promise<PayrollApproverDataResponse> {
    return {
      id: data.id,
      account: await this.accountService['formatData'](data.account),
      companyId: data.companyId,
      approvalLevel: data.approvalLevel,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}

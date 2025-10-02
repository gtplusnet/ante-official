import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { AccountService } from '@modules/account/account/account.service';
import { EmployeeListService } from '@modules/hr/employee/employee-list/employee-list.service';
import { AllowanceConfigurationService } from './allowance-configuration.service';
import {
  AllowancePlan,
  AllowancePlanHistory,
  FundTransactionCode,
  CutoffDateRange,
} from '@prisma/client';
import {
  CreateAllowancePlanRequest,
  UpdateAllowancePlanRequest,
  AddAllowancePlanBalanceRequest,
  PayAllowancePlanBalanceRequest,
} from '../../../../shared/request/allowance-plan.request';
import {
  AllowancePlanDataResponse,
  AllowancePlanHistoryDataResponse,
} from '../../../../shared/response/allowance-plan.response';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import {
  DeductionPeriodReferenceResponse,
  TableResponse,
} from '../../../../shared/response';
import DeductionPeriodReference from '../../../../reference/deduction-period.reference';
import { EmployeeSelectionService } from '@modules/hr/employee/employee-selection/employee-selection.service';
import { EmployeeSelectionFilterDto } from '@modules/hr/employee/employee-selection/employee-selection.dto';

@Injectable()
export class AllowancePlanService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;
  @Inject() public accountService: AccountService;
  @Inject() public employeeListService: EmployeeListService;
  @Inject() public allowanceConfigurationService: AllowanceConfigurationService;
  @Inject() public tableHandlerService: TableHandlerService;
  @Inject() public employeeSelectionService: EmployeeSelectionService;

  async getById(id: number): Promise<AllowancePlanDataResponse> {
    id = Number(id);
    const data = await this.prisma.allowancePlan.findUnique({
      where: { id },
    });
    if (!data) throw new NotFoundException('Allowance plan not found');
    return await this.formatResponse(data);
  }

  async create(
    request: CreateAllowancePlanRequest,
    updateId: number = null,
  ): Promise<AllowancePlanDataResponse> {
    const checkExist = await this.prisma.allowancePlan.findFirst({
      where: {
        allowanceConfigurationId: request.allowanceConfigurationId,
        accountId: request.employeeAccountId,
      },
    });
    if (checkExist && !updateId) {
      throw new BadRequestException('Allowance plan already exists');
    }
    if (updateId) {
      const checkUpdate = await this.prisma.allowancePlan.findUnique({
        where: { id: updateId },
      });
      if (!checkUpdate)
        throw new BadRequestException('Allowance plan not found');
    }
    const createParams: any = {
      name: request.employeeAccountId,
      amount: request.amount,
      effectivityDate: request.effectivityDate
        ? new Date(request.effectivityDate)
        : undefined,
      allowanceConfiguration: {
        connect: { id: request.allowanceConfigurationId },
      },
      account: { connect: { id: request.employeeAccountId } },
      deductionPeriod: request.deductionPeriod,
    };
    let data;
    if (updateId) {
      data = await this.prisma.allowancePlan.update({
        where: { id: updateId },
        data: createParams,
      });
    } else {
      data = await this.prisma.allowancePlan.create({ data: createParams });
      // Update balance
      await this.updateBalance(
        data.id,
        request.amount,
        FundTransactionCode.INITIAL_LOAN_BALANCE,
        'Initial allowance balance',
      );
      // Get updated data
      data = await this.prisma.allowancePlan.findUnique({
        where: { id: data.id },
      });
    }
    return await this.formatResponse(data);
  }

  async update(
    request: UpdateAllowancePlanRequest,
  ): Promise<AllowancePlanDataResponse> {
    return await this.create(request, request.id);
  }

  async addBalance(
    request: AddAllowancePlanBalanceRequest,
  ): Promise<AllowancePlanHistoryDataResponse> {
    request.amount = Number(request.amount);
    this.checkAmount(request.amount);
    return await this.updateBalance(
      request.allowancePlanId,
      request.amount,
      FundTransactionCode.ADD_LOAN_BALANCE,
      request.remarks,
    );
  }

  async payBalance(
    request: PayAllowancePlanBalanceRequest,
  ): Promise<AllowancePlanHistoryDataResponse> {
    request.amount = Number(request.amount);
    this.checkAmount(request.amount);
    return await this.updateBalance(
      request.allowancePlanId,
      request.amount * -1,
      FundTransactionCode.SUBTRACT_LOAN_BALANCE,
      request.remarks,
    );
  }

  async checkAmount(amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }
  }

  async updateBalance(
    allowancePlanId: number,
    amount: number,
    transactionCode: FundTransactionCode,
    remarks: string,
  ): Promise<AllowancePlanHistoryDataResponse> {
    const allowancePlan = await this.prisma.allowancePlan.findUnique({
      where: { id: allowancePlanId },
    });
    if (!allowancePlan) throw new NotFoundException('Allowance plan not found');
    // Get last transaction
    const getLastTransaction = await this.prisma.allowancePlanHistory.findFirst(
      {
        where: { allowancePlanId },
        orderBy: { createdAt: 'desc' },
      },
    );
    const balanceBefore = getLastTransaction
      ? getLastTransaction.afterBalance
      : 0;
    // Create new transaction
    const createTransaction = await this.prisma.allowancePlanHistory.create({
      data: {
        allowancePlanId,
        amount,
        transactionCode,
        remarks,
        beforeBalance: balanceBefore,
        afterBalance: balanceBefore + amount,
      },
    });
    // Update allowance plan balance
    // (remainingBalance is not in schema, so skip this update)
    return await this.formatResponseHistory(createTransaction);
  }

  async getHistory(
    allowancePlanId: number,
  ): Promise<AllowancePlanHistoryDataResponse[]> {
    allowancePlanId = Number(allowancePlanId);
    if (!allowancePlanId)
      throw new BadRequestException('Allowance plan id is required');
    const history = await this.prisma.allowancePlanHistory.findMany({
      where: { allowancePlanId },
      orderBy: { createdAt: 'desc' },
      include: {
        cutoffDateRange: true,
      },
    });
    return await Promise.all(
      history.map(async (data) => {
        return await this.formatResponseHistory(data);
      }),
    );
  }

  async formatResponseHistory(
    data: AllowancePlanHistory & { cutoffDateRange?: CutoffDateRange | null },
  ): Promise<AllowancePlanHistoryDataResponse> {
    return {
      id: data.id,
      amount: this.utilityService.formatCurrency(data.amount),
      transactionCode: data.transactionCode,
      remarks: data.remarks,
      beforeBalance: this.utilityService.formatCurrency(data.beforeBalance),
      afterBalance: this.utilityService.formatCurrency(data.afterBalance),
      createdAt: this.utilityService.formatDate(data.createdAt),
      cutoffDateRange: data.cutoffDateRange
        ? {
            id: data.cutoffDateRange.id,
            startDate: this.utilityService.formatDate(
              data.cutoffDateRange.startDate,
            ),
            endDate: this.utilityService.formatDate(
              data.cutoffDateRange.endDate,
            ),
            status: data.cutoffDateRange.status,
            processingDate: this.utilityService.formatDate(
              data.cutoffDateRange.processingDate,
            ),
          }
        : null,
    };
  }

  async formatResponse(
    data: AllowancePlan,
  ): Promise<AllowancePlanDataResponse> {
    const accountInformation = await this.accountService.getAccountInformation({
      id: data.accountId,
    });
    const employeeInformation = await this.prisma.employeeData.findUnique({
      where: { accountId: data.accountId },
    });
    const allowanceConfiguration =
      await this.allowanceConfigurationService.getById(
        data.allowanceConfigurationId,
      );
    const planCode = `ALW${data.id}`;
    const amount = this.utilityService.formatCurrency(data.amount);
    const remainingBalance = this.utilityService.formatCurrency(0); // Not in schema
    const deductionPeriod = DeductionPeriodReference.find(
      (item) => item.key === data.deductionPeriod,
    );

    return {
      id: data.id,
      planCode,
      employeeCode: employeeInformation?.employeeCode || '',
      accountInformation,
      allowanceConfiguration,
      amount,
      remainingBalance,
      isActive: data.isActive,
      effectivityDate: this.utilityService.formatDate(data.effectivityDate),
      createdAt: this.utilityService.formatDate(data.createdAt),
      updatedAt: this.utilityService.formatDate(data.updatedAt),
      deductionPeriod,
    };
  }

  async table(
    query: TableQueryDTO,
    body: TableBodyDTO,
  ): Promise<TableResponse<AllowancePlanDataResponse>> {
    this.tableHandlerService.initialize(query, body, 'allowancePlan');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['where'] = {
      ...tableQuery['where'],
      allowanceConfiguration: {
        companyId: this.utilityService.companyId,
      },
    };
    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.allowancePlan,
      query,
      tableQuery,
    );
    const formattedList: AllowancePlanDataResponse[] = await Promise.all(
      baseList.map(async (data: AllowancePlan) => {
        return await this.formatResponse(data);
      }),
    );
    return {
      list: formattedList,
      pagination,
      currentPage,
      totalCount: baseList.length,
    };
  }

  async getEmployeeSelect(
    allowanceConfigurationId: number,
    filters?: EmployeeSelectionFilterDto,
  ) {
    allowanceConfigurationId = Number(allowanceConfigurationId);
    if (!allowanceConfigurationId) {
      throw new BadRequestException('Allowance configuration id is required');
    }
    const allowanceConfiguration =
      await this.prisma.allowanceConfiguration.findUnique({
        where: { id: allowanceConfigurationId },
      });
    if (!allowanceConfiguration) {
      throw new NotFoundException('Allowance configuration not found');
    }

    // Get existing allowance plans to exclude
    const allowancePlans = await this.prisma.allowancePlan.findMany({
      where: { allowanceConfigurationId },
      select: { accountId: true },
    });
    const excludeAccountIds = allowancePlans.map((plan) => plan.accountId);

    // Use the common employee selection service
    return await this.employeeSelectionService.getSelectableEmployees(
      {
        ...filters,
        excludeAccountIds,
      },
      this.utilityService.companyId,
    );
  }

  async cutoffPeriodType(): Promise<DeductionPeriodReferenceResponse[]> {
    return DeductionPeriodReference;
  }

  async deactivate(id: number): Promise<AllowancePlanDataResponse> {
    id = Number(id);
    const plan = await this.prisma.allowancePlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Allowance plan not found');
    const data = await this.prisma.allowancePlan.update({
      where: { id },
      data: { isActive: false },
    });
    return await this.formatResponse(data);
  }

  async activate(id: number): Promise<AllowancePlanDataResponse> {
    id = Number(id);
    const plan = await this.prisma.allowancePlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Allowance plan not found');
    const data = await this.prisma.allowancePlan.update({
      where: { id },
      data: { isActive: true },
    });
    return await this.formatResponse(data);
  }
}

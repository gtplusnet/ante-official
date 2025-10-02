import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeductionPlan,
  DeductionPlanHistory,
  EmployeeData,
  Prisma,
  CutoffDateRange,
} from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  AddDeductionPlanBalanceRequest,
  CreateDeductionPlanConfigurationRequest,
  PayDeductionPlanBalanceRequest,
  UpdateDeductionPlanConfigurationRequest,
} from '@shared/request';
import {
  AccountDataResponse,
  DeductionPlanConfigurationDataResponse,
  DeductionPlanHistoryDataResponse,
  TableResponse,
} from '@shared/response';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { AccountService } from '@modules/account/account/account.service';
import { DeductionConfigurationService } from '../deduction-configuration.service';
import WalletCodeReference from 'reference/wallet-code.reference';
import { FundTransactionCode } from '@prisma/client';
import { EmployeeListService } from '@modules/hr/employee/employee-list/employee-list.service';
import DeductionPeriodReference from 'reference/deduction-period.reference';
import {
  DeductionConfigurationDataResponse,
  DeductionPeriodReferenceResponse,
} from '@shared/response';
import { EmployeeSelectionService } from '@modules/hr/employee/employee-selection/employee-selection.service';
import { EmployeeSelectionFilterDto } from '@modules/hr/employee/employee-selection/employee-selection.dto';

@Injectable()
export class DeductionPlanConfigurationService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;
  @Inject() public tableHandlerService: TableHandlerService;
  @Inject() public accountService: AccountService;
  @Inject() public deductionConfigurationService: DeductionConfigurationService;
  @Inject() public employeeListService: EmployeeListService;
  @Inject() public employeeSelectionService: EmployeeSelectionService;

  async getById(id: number): Promise<DeductionPlanConfigurationDataResponse> {
    id = Number(id);

    if (!id) {
      throw new BadRequestException('Deduction plan id is required');
    }

    const data: DeductionPlan = await this.prisma.deductionPlan.findUnique({
      where: {
        id,
      },
    });

    if (!data) {
      throw new NotFoundException('Deduction plan not found');
    }

    return await this.formatResponse(data);
  }

  async cutoffPeriodType(): Promise<DeductionPeriodReferenceResponse[]> {
    return DeductionPeriodReference;
  }

  async check(id: number): Promise<DeductionPlan> {
    if (!id) {
      throw new BadRequestException('Deduction plan id is required');
    }

    const check = await this.prisma.deductionPlan.findUnique({
      where: { id },
    });

    if (!check) {
      throw new NotFoundException('Deduction plan not found');
    }

    return check;
  }

  async deactivate(
    id: number,
  ): Promise<DeductionPlanConfigurationDataResponse> {
    id = Number(id);
    await this.check(id);

    const data = await this.prisma.deductionPlan.update({
      where: { id },
      data: { isActive: false },
    });

    return await this.formatResponse(data);
  }

  async activate(id: number): Promise<DeductionPlanConfigurationDataResponse> {
    id = Number(id);
    await this.check(id);

    const data = await this.prisma.deductionPlan.update({
      where: { id },
      data: { isActive: true },
    });

    return await this.formatResponse(data);
  }

  async table(
    query: TableQueryDTO,
    body: TableBodyDTO,
  ): Promise<TableResponse<DeductionPlanConfigurationDataResponse>> {
    this.tableHandlerService.initialize(query, body, 'deductionPlan');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['where'] = {
      ...tableQuery['where'],
      deductionConfiguration: {
        companyId: this.utilityService.companyId,
      },
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.deductionPlan,
      query,
      tableQuery,
    );
    const formattedList: DeductionPlanConfigurationDataResponse[] =
      await Promise.all(
        baseList.map(async (data: DeductionPlan) => {
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

  async create(
    request: CreateDeductionPlanConfigurationRequest,
    updateId: number = null,
  ): Promise<DeductionPlanConfigurationDataResponse> {
    const checkExist = await this.prisma.deductionPlan.findUnique({
      where: {
        deductionConfigurationId_accountId: {
          deductionConfigurationId: request.deductionConfigurationId,
          accountId: request.employeeAccountId,
        },
      },
    });

    if (checkExist && !updateId) {
      throw new BadRequestException('Deduction plan already exists');
    } else {
      if (updateId) {
        const checkUpdate = await this.prisma.deductionPlan.findUnique({
          where: {
            id: updateId,
          },
        });

        if (!checkUpdate) {
          throw new BadRequestException('Deduction plan not found');
        }
      }
    }

    const createParams: Prisma.DeductionPlanCreateInput = {
      name: request.employeeAccountId,
      monthlyAmortization: request.monthlyAmortization,
      effectivityDate: new Date(request.effectivityDate),
      deductionPeriod: request.deductionPeriod,
      deductionConfiguration: {
        connect: {
          id: request.deductionConfigurationId,
        },
      },
      account: {
        connect: {
          id: request.employeeAccountId,
        },
      },
    };

    let data;

    if (updateId) {
      data = await this.prisma.deductionPlan.update({
        where: { id: updateId },
        data: createParams,
      });
    } else {
      createParams.totalAmount = request.loanAmount;
      data = await this.prisma.deductionPlan.create({
        data: createParams,
      });

      // Update balance
      await this.updateBalance(
        data.id,
        request.loanAmount * -1,
        FundTransactionCode.INITIAL_LOAN_BALANCE,
        'Initial loan balance',
      );

      // Get updated data
      data = await this.prisma.deductionPlan.findUnique({
        where: { id: data.id },
      });
    }

    return await this.formatResponse(data);
  }

  async update(
    request: UpdateDeductionPlanConfigurationRequest,
  ): Promise<DeductionPlanConfigurationDataResponse> {
    return await this.create(request, request.id);
  }

  generatePlanCode(name: string, number: number): string {
    const words = name.split(' ');
    const firstLetters = words
      .map((word) => word.charAt(0).toUpperCase())
      .join('');
    return `${firstLetters}${number}`;
  }
  async getHistory(
    deductionPlanId: number,
  ): Promise<DeductionPlanHistoryDataResponse[]> {
    deductionPlanId = Number(deductionPlanId);

    if (!deductionPlanId) {
      throw new BadRequestException('Deduction plan id is required');
    }

    const history = await this.prisma.deductionPlanHistory.findMany({
      where: {
        deductionPlanId,
      },
      orderBy: {
        createdAt: 'desc',
      },
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

  async addBalance(
    request: AddDeductionPlanBalanceRequest,
  ): Promise<DeductionPlanHistoryDataResponse> {
    request.amount = Number(request.amount);
    this.checkAmount(request.amount);
    return await this.updateBalance(
      request.deductionPlanId,
      request.amount * -1,
      FundTransactionCode.ADD_LOAN_BALANCE,
      request.remarks,
    );
  }

  async payBalance(
    request: PayDeductionPlanBalanceRequest,
  ): Promise<DeductionPlanHistoryDataResponse> {
    request.amount = Number(request.amount);
    this.checkAmount(request.amount);
    return await this.updateBalance(
      request.deductionPlanId,
      request.amount,
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
    deductionPlanId: number,
    amount: number,
    transactionCode: FundTransactionCode,
    remarks: string,
  ): Promise<DeductionPlanHistoryDataResponse> {
    const deductionPlan = await this.prisma.deductionPlan.findUnique({
      where: { id: deductionPlanId },
    });

    if (!deductionPlan) {
      throw new NotFoundException('Deduction plan not found');
    }

    // Get last transaction
    const getLastTransaction = await this.prisma.deductionPlanHistory.findFirst(
      {
        where: {
          deductionPlanId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    );

    const balanceBefore = getLastTransaction
      ? getLastTransaction.afterBalance
      : 0;

    // Create new transaction
    const createTransaction = await this.prisma.deductionPlanHistory.create({
      data: {
        deductionPlanId,
        amount,
        transactionCode,
        remarks,
        beforeBalance: balanceBefore,
        afterBalance: balanceBefore + amount,
      },
    });

    // Add total amount of all negative transactions
    let totalAmount;

    if (amount < 0) {
      const negativeTransactions =
        await this.prisma.deductionPlanHistory.findMany({
          where: {
            deductionPlanId,
            amount: { lt: 0 },
          },
        });

      totalAmount =
        negativeTransactions.reduce((acc, curr) => acc + curr.amount, 0) * -1;
    }

    // Update deduction plan balance
    await this.prisma.deductionPlan.update({
      where: { id: deductionPlanId },
      data: {
        remainingBalance: balanceBefore + amount,
        totalAmount,
      },
    });

    return await this.formatResponseHistory(createTransaction);
  }

  async formatResponseHistory(
    data: DeductionPlanHistory & { cutoffDateRange?: CutoffDateRange | null },
  ): Promise<DeductionPlanHistoryDataResponse> {
    return {
      id: data.id,
      amount: this.utilityService.formatCurrency(data.amount),
      transactionCode: WalletCodeReference.find(
        (item) => item.key === data.transactionCode,
      ),
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

  async getEmployeeSelect(
    deductionConfigurationId: number,
    filters?: EmployeeSelectionFilterDto,
  ) {
    deductionConfigurationId = Number(deductionConfigurationId);

    if (!deductionConfigurationId) {
      throw new BadRequestException('Deduction configuration id is required');
    }

    const deductionConfiguration =
      await this.prisma.deductionConfiguration.findUnique({
        where: { id: deductionConfigurationId },
      });

    if (!deductionConfiguration) {
      throw new NotFoundException('Deduction configuration not found');
    }

    // Get existing deduction plans to exclude
    const deductionPlans = await this.prisma.deductionPlan.findMany({
      where: {
        deductionConfigurationId,
      },
      select: {
        accountId: true,
      },
    });

    const excludeAccountIds = deductionPlans.map((plan) => plan.accountId);

    // Use the common employee selection service
    return await this.employeeSelectionService.getSelectableEmployees(
      {
        ...filters,
        excludeAccountIds,
      },
      this.utilityService.companyId,
    );
  }

  async formatResponse(
    data: DeductionPlan,
  ): Promise<DeductionPlanConfigurationDataResponse> {
    const accountInformation: AccountDataResponse =
      await this.accountService.getAccountInformation({ id: data.accountId });

    const employeeInformation: EmployeeData =
      await this.prisma.employeeData.findUnique({
        where: {
          accountId: data.accountId,
        },
      });

    const deductionConfiguration: DeductionConfigurationDataResponse =
      await this.deductionConfigurationService.getById(
        data.deductionConfigurationId,
      );
    const planCode = this.generatePlanCode(
      deductionConfiguration.name,
      data.id,
    );
    const remainingBalance = this.utilityService.formatCurrency(
      data.remainingBalance,
    );
    const monthlyAmortization = this.utilityService.formatCurrency(
      data.monthlyAmortization,
    );
    const totalAmount = this.utilityService.formatCurrency(data.totalAmount);
    const totalPaidAmount = this.utilityService.formatCurrency(
      data.remainingBalance + data.totalAmount,
    );
    const displayBalance = deductionConfiguration.category.hasTotalAmount
      ? `${totalPaidAmount.formatCurrency} out of ${totalAmount.formatCurrency}`
      : totalPaidAmount.formatCurrency;

    return {
      id: data.id,
      employeeCode: employeeInformation.employeeCode,
      planCode: planCode,
      accountInformation,
      deductionConfiguration,
      monthlyAmortization,
      totalPaidAmount,
      totalAmount,
      remainingBalance,
      isOpen: data.isOpen,
      displayBalance,
      isActive: data.isActive,
      deductionPeriod: DeductionPeriodReference.find(
        (item) => item.key === data.deductionPeriod,
      ),
      effectivityDate: this.utilityService.formatDate(data.effectivityDate),
      createdAt: this.utilityService.formatDate(data.createdAt),
      updatedAt: this.utilityService.formatDate(data.updatedAt),
    };
  }
}

import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  FundAccountDto,
  createFundTransactionDto,
  createFundTranferDto,
  CreateTransactionDTO,
} from './fund-account.interface';
import {
  Prisma,
  FundTransactionCode,
  FundTransactionType,
} from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import fundAccountTypeReference from '../../../../reference/fund-account-type.reference';
import walletCodeReference from '../../../../reference/wallet-code.reference';

@Injectable()
export class FundAccountService {
  @Inject() private prisma: PrismaService;
  @Inject() private utility: UtilityService;
  @Inject() private tableHandlerService: TableHandlerService;

  async getFundAccountInfo(id: number): Promise<any> {
    // Check if ID is provided
    if (!id) {
      throw new BadRequestException('Fund account ID is required');
    }

    // Get fund account
    const response = await this.prisma.fundAccount.findUnique({
      where: { id },
    });

    // Check if fund account exists
    if (!response) {
      throw new NotFoundException('Fund account not found');
    }

    return this.formatFundAccountResponse(response);
  }
  async getFundAccountTable(query: any, body: any) {
    this.tableHandlerService.initialize(query, body, 'fundAccount');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: this.utility.companyId,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.fundAccount,
      query,
      tableQuery,
    );
    const list = baseList.map((fundAccount) =>
      this.formatFundAccountResponse(fundAccount),
    );

    return { list, pagination, currentPage };
  }
  async createFundAccount(body: FundAccountDto) {
    const createParams: Prisma.FundAccountCreateInput = {
      name: body.name,
      description: body.description,
      accountNumber: body.accountNumber,
      type: body.type,
      balance: 0,
      company: {
        connect: {
          id: this.utility.companyId,
        },
      },
    };

    // Create fund account
    const response = await this.prisma.fundAccount.create({
      data: createParams,
    });

    // Create initial balance transaction
    const params: CreateTransactionDTO = {
      fundAccountId: response.id,
      amount: body.initialBalance,
      type: FundTransactionType.ADD,
      code: FundTransactionCode.BEGINNING_BALANCE,
      memo: 'Initial balance',
    };

    const responseData = this._createTransaction(params);

    return responseData;
  }
  async updateFundAccount(body: FundAccountDto) {
    if (!body.id) {
      throw new BadRequestException('Fund account ID is required');
    }

    const updateParams: Prisma.FundAccountUpdateInput = {
      name: body.name,
      description: body.description,
      accountNumber: body.accountNumber,
      type: body.type,
    };

    // Update fund account
    const response = await this.prisma.fundAccount.update({
      where: { id: body.id },
      data: updateParams,
    });

    return this.formatFundAccountResponse(response);
  }
  async deleteFundAccount(id: number) {
    if (!id) {
      throw new BadRequestException('Fund account ID is required');
    }

    const fundAccount = await this.prisma.fundAccount.findUnique({
      where: { id },
    });

    if (fundAccount.balance > 0) {
      throw new BadRequestException(
        'You cannot delete a fund account with balance',
      );
    }

    // Delete fund account
    const response = await this.prisma.fundAccount.update({
      where: { id },
      data: { isDeleted: true },
    });

    return this.formatFundAccountResponse(response);
  }

  async getFundAccountTransactionsTable(query: any, body: any): Promise<any> {
    // Get transactions
    this.tableHandlerService.initialize(query, body, 'fundTransaction');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.fundTransaction,
      query,
      tableQuery,
    );
    const list = baseList.map((transaction) =>
      this.formatFundTransactionResponse(transaction),
    );

    return { list, pagination, currentPage };
  }
  async getFundAccountTransactionsInformation(id: number): Promise<any> {
    // Get transactions
    const transactions = await this.prisma.fundTransaction.findUnique({
      where: { id: Number(id) },
      include: { fundAccount: true },
    });
    const response = this.formatFundTransactionResponse(transactions);
    return response;
  }
  async createFundAccountTransaction(body: createFundTransactionDto) {
    // Check if required fields are provided
    const code =
      body.type == 'ADD'
        ? FundTransactionCode.MANUAL_ADD
        : FundTransactionCode.MANUAL_DEDUCT;

    // Create transaction
    const params = {
      fundAccountId: body.fundAccountId,
      amount: body.amount,
      type: body.type,
      code,
      memo: body.memo,
    };

    return await this._createTransaction(params);
  }
  async transferFundAccount(body: createFundTranferDto) {
    // Make sure amount is a number
    body.amount = Number(body.amount);
    body.fee = Number(body.fee);

    // Check if required fields are provided
    if (!body.fromFundAccountId || !body.fromFundAccountId || !body.amount) {
      throw new BadRequestException('Fund account ID and amount are required');
    }

    // Check if amount is valid
    if (body.fromFundAccountId === body.toFundAccountId) {
      throw new BadRequestException('Cannot transfer to same account');
    }

    // Check if there is enough wallet from the source account
    const totalAmount = body.amount + body.fee;

    // Get source account
    const sourceAccount = await this.prisma.fundAccount.findUnique({
      where: { id: body.fromFundAccountId },
    });
    const destinationAccount = await this.prisma.fundAccount.findUnique({
      where: { id: body.toFundAccountId },
    });

    // Check if source account exists
    if (!sourceAccount) {
      throw new BadRequestException('Source account not found');
    }

    // Check if destination account exists
    if (!destinationAccount) {
      throw new BadRequestException('Destination account not found');
    }

    // Check if balance is sufficient
    if (sourceAccount.balance < totalAmount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Deduct from source account
    let transactionFee = null;
    const additionalMemo =
      'Transfer to ' +
      destinationAccount.name +
      ' (' +
      destinationAccount.accountNumber +
      ')';
    const additionalMemoDestination =
      'Transfer from ' +
      sourceAccount.name +
      ' (' +
      sourceAccount.accountNumber +
      ')';

    if (body.fee > 0) {
      const params: CreateTransactionDTO = {
        fundAccountId: body.fromFundAccountId,
        amount: body.fee,
        type: FundTransactionType.SUBTRACT,
        code: FundTransactionCode.TRANSACTION_FEE,
        memo: additionalMemo + (body.memo ? ' - ' + body.memo : ''),
      };
      transactionFee = await this._createTransaction(params);
    }

    const fromParams: CreateTransactionDTO = {
      fundAccountId: body.fromFundAccountId,
      amount: body.amount,
      type: FundTransactionType.SUBTRACT,
      code: FundTransactionCode.FUND_TRANSFER_FROM,
      memo: additionalMemo + (body.memo ? ' - ' + body.memo : ''),
    };

    const fromAccount = await this._createTransaction(fromParams);

    const toParams: CreateTransactionDTO = {
      fundAccountId: body.toFundAccountId,
      amount: body.amount,
      type: FundTransactionType.ADD,
      code: FundTransactionCode.FUND_TRANSFER_TO,
      memo: additionalMemoDestination + (body.memo ? ' - ' + body.memo : ''),
    };
    const toAccount = await this._createTransaction(toParams);

    return { transactionFee, fromAccount, toAccount };
  }
  async _createTransaction(params: CreateTransactionDTO) {
    const { fundAccountId, amount, type, code, memo } = params;

    // Get fund account
    const fundAccount = await this.prisma.fundAccount.findUnique({
      where: { id: fundAccountId },
    });

    // Check if fund account exists
    if (!fundAccount) {
      throw new NotFoundException('Fund account not found');
    }

    // Check if amount is valid
    const processedAmount = Number(amount);

    // Get last transaction
    const lastTransaction = await this.prisma.fundTransaction.findFirst({
      where: { fundAccountId },
      orderBy: { createdAt: 'desc' },
    });
    const balanceBefore = lastTransaction
      ? lastTransaction.balanceAfter
      : fundAccount.balance;
    let balanceAfter =
      type === FundTransactionType.ADD
        ? balanceBefore + processedAmount
        : balanceBefore - processedAmount;
    balanceAfter = Math.round(balanceAfter * 100) / 100;

    // Check if balance is sufficient
    if (balanceAfter < 0) {
      throw new BadRequestException('Insufficient balance');
    }

    // Create transaction
    const createParams: Prisma.FundTransactionUncheckedCreateInput = {
      fundAccountId: fundAccountId,
      balanceBefore,
      balanceAfter,
      amount: processedAmount,
      type,
      code,
      memo,
    };

    // Update fund account balance
    const _account = await this.prisma.fundAccount.update({
      where: { id: fundAccountId },
      data: { balance: balanceAfter },
    });
    const _transaction = await this.prisma.fundTransaction.create({
      data: createParams,
    });

    const account = this.formatFundAccountResponse(_account);
    const transaction = this.formatFundTransactionResponse(_transaction);
    return { account, transaction };
  }

  /**
   * Formats a fund account response according to the standard format
   */
  private formatFundAccountResponse(fundAccount: any): any {
    if (!fundAccount) return null;

    return {
      id: fundAccount.id,
      name: fundAccount.name,
      description: fundAccount.description,
      accountNumber: fundAccount.accountNumber,
      type: fundAccountTypeReference.find(
        (ref) => ref.key === fundAccount.type,
      ) || { key: fundAccount.type, label: fundAccount.type },
      balance: this.utility.formatCurrency(fundAccount.balance),
      createdAt: this.utility.formatDate(fundAccount.createdAt),
      updatedAt: this.utility.formatDate(fundAccount.updatedAt),
    };
  }

  /**
   * Formats a fund transaction response according to the standard format
   */
  private formatFundTransactionResponse(transaction: any): any {
    if (!transaction) return null;

    return {
      id: transaction.id,
      amount: this.utility.formatCurrency(transaction.amount),
      balanceBefore: this.utility.formatCurrency(transaction.balanceBefore),
      balanceAfter: this.utility.formatCurrency(transaction.balanceAfter),
      type: transaction.type,
      memo: transaction.memo,
      code: walletCodeReference.find((ref) => ref.key === transaction.code) || {
        key: transaction.code,
        label: transaction.code,
      },
      fundAccount: transaction.fundAccount
        ? this.formatFundAccountResponse(transaction.fundAccount)
        : null,
      createdAt: this.utility.formatDate(transaction.createdAt),
      updatedAt: this.utility.formatDate(transaction.updatedAt),
    };
  }
}

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { RFPApproveDTO, RFPCreateDTO, RFPRejectDTO } from './rfp.interface';
import { PrismaService } from '@common/prisma.service';
import { Prisma, RequestForPayment } from '@prisma/client';
import { PayeeType } from '@prisma/client';
import { UtilityService } from '@common/utility.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { PettyCashService } from '@modules/finance/petty-cash/petty-cash/petty-cash.service';
import { IssuePettyCashDTO } from '@modules/finance/petty-cash/petty-cash/petty-cash.interface';
import { FundAccountService } from '@modules/finance/fund-account/fund-account/fund-account.service';
import { CreateTransactionDTO } from '@modules/finance/fund-account/fund-account/fund-account.interface';
import payeeTypeReference from '../../../../reference/payee-type.reference';
import requestForPaymentStatusReference from '../../../../reference/request-for-payment-status.reference';

@Injectable()
export class RfpService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;
  @Inject() public tableHandlerService: TableHandlerService;
  @Inject() public pettyCashService: PettyCashService;
  @Inject() public fundAccountService: FundAccountService;

  async getRfp(id: number) {
    id = Number(id);

    const rfp = await this.prisma.requestForPayment.findUnique({
      where: {
        id: id,
      },
    });

    if (!rfp) {
      throw new BadRequestException('Request for Payment not found.');
    }

    const formattedRfp = await this.formatRfpResponse(rfp);

    return formattedRfp;
  }

  async table(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'rfp');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: this.utilityService.companyId,
    };
    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.requestForPayment,
      query,
      tableQuery,
    );
    const formattedList = await this.formatRfpResponseList(
      baseList as RequestForPayment[],
    );

    return { list: formattedList, pagination, currentPage };
  }
  /**
   * Formats a single RFP response according to the standard format
   */
  private async formatRfpResponse(rfp: any): Promise<any> {
    if (!rfp) return null;

    const formatted: any = {
      id: rfp.id,
      payeeType: payeeTypeReference.find(
        (ref) => ref.key === rfp.payeeType,
      ) || { key: rfp.payeeType, label: rfp.payeeType },
      payeeId: rfp.payeeId,
      paymentType: rfp.paymentType,
      amount: this.utilityService.formatCurrency(rfp.amount),
      memo: rfp.memo,
      status: requestForPaymentStatusReference.find(
        (ref) => ref.key === rfp.status,
      ) || { key: rfp.status, label: rfp.status },
      companyId: rfp.companyId,
      projectId: rfp.projectId,
      project: rfp.project,
      purchaseOrderId: rfp.purchaseOrderId,
      purchaseOrder: rfp.purchaseOrder,
      fundTransaction: rfp.fundTransaction,
      createdAt: this.utilityService.formatDate(rfp.createdAt),
      updatedAt: this.utilityService.formatDate(rfp.updatedAt),
    };

    // Add payee information based on payeeType
    if (rfp.payeeType === PayeeType.SUPPLIER) {
      const supplier = await this.prisma.supplier.findUnique({
        where: {
          id: Number(rfp.payeeId),
        },
      });
      formatted.payee = supplier?.name || rfp.payeeId;
    } else if (rfp.payeeType === PayeeType.EMPLOYEE) {
      const employee = await this.prisma.account.findUnique({
        where: {
          id: rfp.payeeId,
        },
      });
      formatted.payee = employee
        ? `${employee.firstName} ${employee.lastName}`
        : rfp.payeeId;
    } else {
      formatted.payee = rfp.payeeId;
    }

    return formatted;
  }

  /**
   * Formats a list of RFP responses
   */
  private async formatRfpResponseList(
    rfpList: RequestForPayment[],
  ): Promise<any[]> {
    if (!rfpList || rfpList.length === 0) return [];

    return Promise.all(rfpList.map((rfp) => this.formatRfpResponse(rfp)));
  }

  async createRfp(body: RFPCreateDTO) {
    const createParams: Prisma.RequestForPaymentCreateInput = {
      payeeType: body.payeeType,
      payeeId: body.payeeId.toString(),
      paymentType: body.paymentType,
      amount: body.amount,
      memo: body.memo,
      company: {
        connect: {
          id: this.utilityService.companyId,
        },
      },
    };

    await this.validatePayeeType(body.payeeType);
    await this.connectProjectIfExists(body.projectId, createParams);
    await this.handlePayeeTypeSpecificLogic(body, createParams);

    const rfp = await this.prisma.requestForPayment.create({
      data: createParams,
    });

    this.utilityService.log(
      `Creating RFP with params: ID: ${rfp.id} (${rfp.payeeType})`,
    );

    return rfp;
  }
  private async validatePayeeType(payeeType: string) {
    if (!Object.values(PayeeType).includes(payeeType as PayeeType)) {
      throw new BadRequestException('Invalid payee type.');
    }
  }
  private async connectProjectIfExists(
    projectId: number | undefined,
    createParams: Prisma.RequestForPaymentCreateInput,
  ) {
    if (projectId) {
      const project = await this.prisma.project.findUnique({
        where: {
          id: projectId,
        },
      });

      if (!project) {
        throw new BadRequestException('Project not found.');
      }

      createParams.project = {
        connect: {
          id: projectId,
        },
      };
    }
  }

  private async handlePayeeTypeSpecificLogic(
    body: RFPCreateDTO,
    createParams: Prisma.RequestForPaymentCreateInput,
  ) {
    if (body.payeeType === PayeeType.SUPPLIER) {
      const supplierId = this.validateAsNumber(
        body.payeeId,
        'Payee ID must be a number.',
      );
      await this.checkSupplierExists(supplierId);
      await this.connectPurchaseOrderIfExists(
        body.purchaseOrderId,
        createParams,
      );
    } else if (body.payeeType === PayeeType.EMPLOYEE) {
      await this.checkEmployeeExists(body.payeeId);
      //await this.issuePettyCashOnEmployee(body.payeeId, body.amount, body.paymentType, body.memo);
    }
  }

  private async checkSupplierExists(supplierId: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: {
        id: supplierId,
      },
    });

    if (!supplier) {
      throw new BadRequestException('Supplier not found.');
    }
  }
  private async connectPurchaseOrderIfExists(
    purchaseOrderId: number | undefined,
    createParams: Prisma.RequestForPaymentCreateInput,
  ) {
    if (purchaseOrderId) {
      const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
        where: {
          id: purchaseOrderId,
        },
      });

      if (!purchaseOrder) {
        throw new BadRequestException('Purchase Order not found.');
      }

      createParams.purchaseOrder = {
        connect: {
          id: purchaseOrderId,
        },
      };
    }
  }

  private async checkEmployeeExists(payeeId: string) {
    const accountId = payeeId.toString();

    const employee = await this.prisma.account.findUnique({
      where: {
        id: accountId,
      },
    });

    if (!employee) {
      throw new BadRequestException('Employee not found.');
    }
  }
  private validateAsNumber(value: string, errorMessage: string) {
    if (isNaN(Number(value))) {
      throw new BadRequestException(errorMessage);
    }

    return Number(value);
  }

  async approve(body: RFPApproveDTO) {
    const rfpInformation = await this.getRfp(body.id);
    let fundAccountTransaction = null;

    if (!rfpInformation['status'].nextStage) {
      throw new BadRequestException('RFP is already in its final stage.');
    }

    // If the status is 'FOR_RELEASING', we need to check if the fund account is provided
    if (rfpInformation['status'].key === 'FOR_RELEASING') {
      if (!body.fundAccountId) {
        throw new BadRequestException(
          'Fund Account is required for this stage.',
        );
      }

      // Check if the fund account exists
      const fundAccount = await this.prisma.fundAccount.findUnique({
        where: { id: body.fundAccountId },
      });

      if (!fundAccount) {
        throw new BadRequestException('Fund Account not found.');
      }

      // Check if the fund account has enough balance
      if (fundAccount.balance < rfpInformation['amount'].raw) {
        throw new BadRequestException(
          'Fund Account does not have enough balance.',
        );
      }

      // Deduct money from the fund account
      const params: CreateTransactionDTO = {
        fundAccountId: body.fundAccountId,
        amount: rfpInformation['amount'].raw,
        memo: rfpInformation['memo'],
        type: 'ADD',
        code: 'RFP_RELEASED',
      };

      const transactionResponse =
        await this.fundAccountService._createTransaction(params);
      fundAccountTransaction = transactionResponse.transaction;
    }

    const rfpActionsParams: Prisma.RequestForPaymentActionsCreateInput = {
      action: rfpInformation['status'].approveButton,
      memo: body.memo,
      fromStatus: rfpInformation['status'].key,
      toStatus: rfpInformation['status'].nextStage,
      requestForPayment: { connect: { id: rfpInformation['id'] } },
      actionByAccount: {
        connect: { id: this.utilityService.accountInformation.id },
      },
    };

    await this.prisma.requestForPaymentActions.create({
      data: rfpActionsParams,
    });

    const updateRequestForPaymentParams: Prisma.RequestForPaymentUpdateInput = {
      status: rfpInformation['status'].nextStage,
    };

    if (fundAccountTransaction) {
      updateRequestForPaymentParams['fundTransaction'] = {
        connect: {
          id: fundAccountTransaction.id,
        },
      };
    }

    const updateReponse = await this.prisma.requestForPayment.update({
      where: {
        id: body.id,
      },
      data: updateRequestForPaymentParams,
    });

    // If the status is 'PAYMENT_RELEASED', we need to release the payment
    if (updateReponse.status === 'PAYMENT_RELEASED') {
      if (updateReponse.payeeType === PayeeType.EMPLOYEE) {
        const issuePettyCashParams: IssuePettyCashDTO = {
          accountId: updateReponse.payeeId,
          amount: updateReponse.amount,
          paymentType: updateReponse.paymentType,
          memo: updateReponse.memo,
        };

        await this.pettyCashService.issuePettyCashOnEmployee(
          issuePettyCashParams,
        );
      }
    }

    this.utilityService.log(
      `Approving RFP with params: ID: ${body.id} (${updateReponse.status})`,
    );

    return updateReponse;
  }
  async reject(body: RFPRejectDTO) {
    const rfpInformation = await this.getRfp(body.id);

    if (!rfpInformation['status'].rejectButton) {
      throw new BadRequestException(
        `You can't reject is status is  ${rfpInformation['status'].label}.`,
      );
    }

    const rfpActionsParams: Prisma.RequestForPaymentActionsCreateInput = {
      action: rfpInformation['status'].rejectButton,
      memo: body.memo,
      fromStatus: rfpInformation['status'].key,
      toStatus: 'REJECTED',
      requestForPayment: { connect: { id: rfpInformation['id'] } },
      actionByAccount: {
        connect: { id: this.utilityService.accountInformation.id },
      },
    };

    await this.prisma.requestForPaymentActions.create({
      data: rfpActionsParams,
    });

    const updateReponse = await this.prisma.requestForPayment.update({
      where: {
        id: body.id,
      },
      data: {
        status: 'REJECTED',
      },
    });

    this.utilityService.log(
      `Rejecting RFP with params: ID: ${body.id} (${updateReponse.status})`,
    );

    return updateReponse;
  }
}

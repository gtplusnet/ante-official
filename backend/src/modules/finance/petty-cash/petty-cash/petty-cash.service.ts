import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import {
  Prisma,
  FundTransactionType,
  PettyCashTransactionType,
  PettyCashLiquidationStatus,
} from '@prisma/client';
import { UtilityService } from '@common/utility.service';
import { ExcelExportService } from '@common/services/excel-export.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import {
  IssuePettyCashDTO,
  LiquidateApproveDTO,
  LiquidatePettyCashDTO,
  LiquidateRejectDTO,
  AssignPettyCashDTO,
  RefillPettyCashDTO,
  DeductPettyCashDTO,
  PettyCashHolderDTO,
  PettyCashTransactionDTO,
  ReturnPettyCashDTO,
  TransferPettyCashDTO,
  ExtractReceiptDataDTO,
  ExtractedReceiptDataDTO,
} from './petty-cash.interface';
import { FundTransactionCode } from '@prisma/client';
import pettyCashLiquidationStatusReference from '../../../../reference/petty-cash-liquidation-status.reference';
import { FundAccountService } from '../../fund-account/fund-account/fund-account.service';
import { CreateTransactionDTO } from '../../fund-account/fund-account/fund-account.interface';
import { OpenAIService } from '../../../../integrations/ai-chat/providers/openai/openai.service';
import { WorkflowEngineService } from '@modules/workflow/workflow-engine.service';
import { WorkflowInstanceService } from '@modules/workflow/workflow-instance.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PettyCashService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;
  @Inject() public tableHandlerService: TableHandlerService;
  @Inject(forwardRef(() => FundAccountService))
  public fundAccountService: FundAccountService;
  @Inject() public openAIService: OpenAIService;
  @Inject(forwardRef(() => WorkflowEngineService))
  public workflowEngineService: WorkflowEngineService;
  @Inject(forwardRef(() => WorkflowInstanceService))
  public workflowInstanceService: WorkflowInstanceService;
  @Inject() private eventEmitter: EventEmitter2;
  @Inject() private excelExportService: ExcelExportService;

  constructor() {
    // Set up event listener for workflow sync
    this.eventEmitter?.on(
      'workflow.sync.petty_cash_liquidation',
      async (data) => {
        await this.handleWorkflowSync(data);
      },
    );
  }

  /**
   * Handle workflow synchronization events for petty cash liquidations
   * @param data - Workflow sync event data
   */
  private async handleWorkflowSync(data: {
    instanceId: number;
    sourceId: string;
    status: string;
    currentStageKey?: string;
  }) {
    try {
      const liquidationId = parseInt(data.sourceId);
      if (isNaN(liquidationId)) {
        console.error(
          'Invalid liquidation ID in workflow sync:',
          data.sourceId,
        );
        return;
      }

      // Update liquidation status based on workflow stage
      let newStatus = 'PENDING';
      if (data.currentStageKey) {
        switch (data.currentStageKey) {
          case 'approved':
          case 'completed':
            newStatus = 'APPROVED';
            break;
          case 'rejected':
            newStatus = 'REJECTED';
            break;
          case 'pending':
          case 'in_review':
          default:
            newStatus = 'PENDING';
            break;
        }
      }

      await this.prisma.pettyCashLiquidation.update({
        where: { id: liquidationId },
        data: {
          status: newStatus as PettyCashLiquidationStatus,
          workflowInstanceId: data.instanceId,
        },
      });

      console.log(
        `Synced petty cash liquidation ${liquidationId} with workflow status: ${newStatus}`,
      );
    } catch (error) {
      console.error('Error handling workflow sync for petty cash:', error);
    }
  }

  async getPettyCash(accountId: string) {
    const accountInformation = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!accountInformation) {
      throw new BadRequestException('Account not found.');
    }

    const formatted = this.formatPettyCashResponse(accountInformation);

    return formatted;
  }
  async table(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'pettyCash');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['where'] = {
      pettyCashAmount: { not: 0 },
      companyId: this.utilityService.companyId,
    };
    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.account,
      query,
      tableQuery,
    );
    const formattedList = baseList.map((account) =>
      this.formatPettyCashResponse(account),
    );
    return { list: formattedList, pagination, currentPage };
  }

  async liquidationTable(query: TableQueryDTO, body: TableBodyDTO) {
    console.log('liquidationTable');
    this.tableHandlerService.initialize(query, body, 'pettyCashLiquidation');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['include'] = {
      attachmentProof: {
        select: {
          id: true,
          name: true,
          url: true,
          size: true,
          mimetype: true,
          originalName: true,
        },
      },
      requestedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
        },
      },
      workflowInstance: {
        select: {
          id: true,
          sourceModule: true,
          sourceId: true,
          status: true,
          currentStageId: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          currentStage: {
            select: {
              id: true,
              key: true,
              name: true,
              description: true,
              color: true,
              textColor: true,
              isInitial: true,
              isFinal: true,
              sequence: true,
            },
          },
          workflow: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
            },
          },
        },
      },
    };
    // Add date range filtering if provided
    const dateFilter: any = {};
    const queryWithDates = query as any;
    if (queryWithDates.startDate && queryWithDates.endDate) {
      const start = new Date(queryWithDates.startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(queryWithDates.endDate);
      end.setHours(23, 59, 59, 999);

      dateFilter.createdAt = {
        gte: start,
        lte: end,
      };
    }

    tableQuery['where'] = {
      ...tableQuery['where'],
      ...dateFilter,
      requestedBy: {
        companyId: this.utilityService.companyId,
      },
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.pettyCashLiquidation,
      query,
      tableQuery,
    );
    const formattedList = baseList.map((liquidation) =>
      this.formatPettyCashLiquidationResponse(liquidation),
    );
    return { list: formattedList, pagination, currentPage };
  }

  async issuePettyCashOnEmployee(params: IssuePettyCashDTO) {
    const accountInformation = await this.prisma.account.findUnique({
      where: { id: params.accountId },
    });
    const accountPettyCash = accountInformation.pettyCashAmount;

    // Check if the account has enough petty cash amount
    const pettyCashTransactionsParams: Prisma.PettyCashTransactionsCreateInput =
      {
        amount: params.amount,
        balanceBefore: accountPettyCash,
        balanceAfter: accountPettyCash + params.amount,
        type: params.amount > 0 ? 'ADD' : 'SUBTRACT',
        code: FundTransactionCode.RFP,
        memo: params.memo,
        userAccount: { connect: { id: params.accountId } },
      };

    await this.prisma.pettyCashTransactions.create({
      data: pettyCashTransactionsParams,
    });

    await this.prisma.account.update({
      where: { id: params.accountId },
      data: { pettyCashAmount: { increment: params.amount } },
    });
  }
  private validateTaxAmounts(params: LiquidatePettyCashDTO): void {
    // Validate VAT amount
    if (params.vatAmount !== undefined && params.vatAmount < 0) {
      throw new BadRequestException('VAT amount cannot be negative.');
    }

    // Validate withholding tax amount
    if (
      params.withholdingTaxAmount !== undefined &&
      params.withholdingTaxAmount < 0
    ) {
      throw new BadRequestException(
        'Withholding tax amount cannot be negative.',
      );
    }

    // Validate VAT amount doesn't exceed reasonable percentage (13% with margin)
    if (params.vatAmount && params.amount) {
      const maxVat = params.amount * 0.13;
      if (params.vatAmount > maxVat) {
        throw new BadRequestException(
          `VAT amount (${params.vatAmount}) exceeds maximum allowed (13% of total = ${maxVat.toFixed(2)}).`,
        );
      }
    }

    // Validate withholding tax doesn't exceed reasonable percentage (15%)
    if (params.withholdingTaxAmount && params.amount) {
      const maxWithholding = params.amount * 0.15;
      if (params.withholdingTaxAmount > maxWithholding) {
        throw new BadRequestException(
          `Withholding tax amount (${params.withholdingTaxAmount}) exceeds maximum allowed (15% of total = ${maxWithholding.toFixed(2)}).`,
        );
      }
    }

    // Validate combined tax amounts don't exceed total
    if (params.vatAmount && params.withholdingTaxAmount && params.amount) {
      const totalTax = params.vatAmount + params.withholdingTaxAmount;
      if (totalTax > params.amount) {
        throw new BadRequestException(
          `Combined tax amounts (${totalTax}) cannot exceed the total amount (${params.amount}).`,
        );
      }
    }

    // Validate confidence scores
    if (params.vatAmountConfidence !== undefined) {
      if (params.vatAmountConfidence < 0 || params.vatAmountConfidence > 100) {
        throw new BadRequestException(
          'VAT confidence score must be between 0 and 100.',
        );
      }
    }

    if (params.withholdingTaxConfidence !== undefined) {
      if (
        params.withholdingTaxConfidence < 0 ||
        params.withholdingTaxConfidence > 100
      ) {
        throw new BadRequestException(
          'Withholding tax confidence score must be between 0 and 100.',
        );
      }
    }
  }

  async liquidatePettyCash(params: LiquidatePettyCashDTO) {
    // Validate tax amounts
    this.validateTaxAmounts(params);

    // If pettyCashHolderId is provided, validate it belongs to the current user
    if (params.pettyCashHolderId) {
      const holder = await this.prisma.pettyCashHolder.findUnique({
        where: { id: params.pettyCashHolderId },
      });

      if (
        !holder ||
        holder.accountId !== this.utilityService.accountInformation.id
      ) {
        throw new BadRequestException('Invalid petty cash holder.');
      }

      if (!holder.isActive) {
        throw new BadRequestException('Petty cash holder is not active.');
      }

      if (holder.currentBalance < params.amount) {
        throw new BadRequestException('Insufficient petty cash balance.');
      }
    } else {
      // Legacy support: Check account's pettyCashAmount
      const accountInformation = await this.prisma.account.findUnique({
        where: { id: this.utilityService.accountInformation.id },
      });
      const accountPettyCash = accountInformation.pettyCashAmount;

      if (accountPettyCash < params.amount) {
        throw new BadRequestException('Insufficient petty cash amount.');
      }
    }

    // Create petty cash liquidation with new VAT and withholding tax fields
    const pettyCashLiquidationParams: Prisma.PettyCashLiquidationCreateInput = {
      description: params.description || '',
      amount: params.amount,
      receiptNumber: params.receiptNumber,
      receiptDate: params.receiptDate
        ? new Date(params.receiptDate)
        : undefined,
      vendorName: params.vendorName,
      vendorAddress: params.vendorAddress,
      vendorTin: params.vendorTin,
      expenseCategory: params.expenseCategory,
      businessPurpose: params.businessPurpose,
      isAiExtracted: params.isAiExtracted || false,
      vatAmount: params.vatAmount || 0,
      withholdingTaxAmount: params.withholdingTaxAmount || 0,
      vatAmountConfidence: params.vatAmountConfidence || 0,
      withholdingTaxConfidence: params.withholdingTaxConfidence || 0,
      totalAIConfidence: params.totalAIConfidence || 0,
      attachmentProof: { connect: { id: params.attachmentProof } },
      requestedBy: {
        connect: { id: this.utilityService.accountInformation.id },
      },
      ...(params.pettyCashHolderId && {
        pettyCashHolder: { connect: { id: params.pettyCashHolderId } },
      }),
    };

    // Create petty cash liquidation
    const liquidationData = await this.prisma.pettyCashLiquidation.create({
      data: pettyCashLiquidationParams,
    });

    // Start workflow for the liquidation
    let workflowInstance = null;
    try {
      if (!this.workflowEngineService) {
        console.warn(
          'Workflow engine service not available, skipping workflow creation',
        );
      } else {
        workflowInstance = await this.workflowEngineService.startWorkflow({
          workflowCode: 'petty_cash_liquidation',
          sourceModule: 'petty_cash_liquidation',
          sourceId: liquidationData.id.toString(),
          initiatorId: this.utilityService.accountInformation.id,
          companyId: this.utilityService.companyId,
          metadata: {
            amount: params.amount,
            description: params.description,
            vendorName: params.vendorName,
            vendorAddress: params.vendorAddress,
            vendorTin: params.vendorTin,
            expenseCategory: params.expenseCategory,
            businessPurpose: params.businessPurpose,
            receiptNumber: params.receiptNumber,
            receiptDate: params.receiptDate,
            vatAmount: params.vatAmount,
            withholdingTaxAmount: params.withholdingTaxAmount,
            vatAmountConfidence: params.vatAmountConfidence,
            withholdingTaxConfidence: params.withholdingTaxConfidence,
            totalAIConfidence: params.totalAIConfidence,
            isAiExtracted: params.isAiExtracted,
            attachmentProofId: params.attachmentProof,
            requestedById: this.utilityService.accountInformation.id,
            requestedByName: `${this.utilityService.accountInformation.firstName} ${this.utilityService.accountInformation.lastName}`,
            requestedByEmail: this.utilityService.accountInformation.email,
          },
        });

        // Update liquidation with workflow instance ID
        if (workflowInstance && workflowInstance.id) {
          await this.prisma.pettyCashLiquidation.update({
            where: { id: liquidationData.id },
            data: {
              workflowInstanceId: workflowInstance.id,
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to start workflow for liquidation:', {
        error: error.message || error,
        liquidationId: liquidationData.id,
        stack: error.stack,
      });
      // Continue without workflow if it fails - this is not a critical error
    }

    const pettyCashLiquidation =
      await this.prisma.pettyCashLiquidation.findUnique({
        where: { id: liquidationData.id },
        include: {
          attachmentProof: true,
          workflowInstance: {
            include: {
              currentStage: true,
              workflow: true,
            },
          },
        },
      });

    const liquidationResponseData =
      this.formatPettyCashLiquidationResponse(pettyCashLiquidation);
    return liquidationResponseData;
  }

  async approveLiquidation(params: LiquidateApproveDTO) {
    // Check if already approved
    const pettyCashLiquidation =
      await this.prisma.pettyCashLiquidation.findUnique({
        where: { id: params.id },
        include: { pettyCashHolder: true, workflowInstance: true },
      });

    if (!pettyCashLiquidation) {
      throw new BadRequestException('Liquidation not found.');
    }

    // Check if liquidation has already been processed (by looking at transaction history)
    if (pettyCashLiquidation.pettyCashHolderId) {
      const existingTransaction =
        await this.prisma.pettyCashTransaction.findFirst({
          where: {
            type: 'LIQUIDATION',
            pettyCashHolderId: pettyCashLiquidation.pettyCashHolderId,
            reason: {
              contains: `Liquidation #${pettyCashLiquidation.id}`,
            },
          },
        });

      if (existingTransaction) {
        throw new BadRequestException(
          'Liquidation has already been processed and recorded to petty cash.',
        );
      }
    } else if (pettyCashLiquidation.status === 'APPROVED') {
      // For legacy liquidations without petty cash holder, check status
      throw new BadRequestException('Liquidation already approved.');
    }

    // If workflow instance exists, use workflow engine for approval
    if (pettyCashLiquidation.workflowInstance) {
      try {
        await this.workflowEngineService.transitionWorkflow({
          instanceId: pettyCashLiquidation.workflowInstance.id,
          action: 'Approve Liquidation',
          performedById: this.utilityService.accountInformation.id,
          remarks: 'Approved via workflow',
          metadata: {
            approvedById: this.utilityService.accountInformation.id,
            approvedByName: `${this.utilityService.accountInformation.firstName} ${this.utilityService.accountInformation.lastName}`,
            approvedAt: new Date().toISOString(),
          },
        });

        // Get updated liquidation after workflow transition
        const updatedLiquidation =
          await this.prisma.pettyCashLiquidation.findUnique({
            where: { id: params.id },
            include: {
              attachmentProof: true,
              workflowInstance: {
                include: {
                  currentStage: true,
                  workflow: true,
                },
              },
            },
          });

        return this.formatPettyCashLiquidationResponse(updatedLiquidation);
      } catch (error) {
        console.error(
          'Workflow transition failed, falling back to direct approval:',
          error,
        );
        // Fall through to direct approval if workflow fails
      }
    }

    // Start transaction
    await this.prisma.$transaction(async (prisma) => {
      // Update petty cash liquidation status
      await prisma.pettyCashLiquidation.update({
        where: { id: params.id },
        data: {
          status: 'APPROVED',
          approvedById: this.utilityService.accountInformation.id,
        },
      });

      // If liquidation is linked to a petty cash holder, deduct from holder balance
      if (pettyCashLiquidation.pettyCashHolderId) {
        // Validate holder has sufficient balance
        const holder = pettyCashLiquidation.pettyCashHolder;
        if (holder.currentBalance < pettyCashLiquidation.amount) {
          throw new BadRequestException(
            'Insufficient petty cash holder balance.',
          );
        }

        // Update holder balance
        await prisma.pettyCashHolder.update({
          where: { id: pettyCashLiquidation.pettyCashHolderId },
          data: { currentBalance: { decrement: pettyCashLiquidation.amount } },
        });

        // Create petty cash transaction record
        await prisma.pettyCashTransaction.create({
          data: {
            pettyCashHolderId: pettyCashLiquidation.pettyCashHolderId,
            type: 'LIQUIDATION',
            amount: pettyCashLiquidation.amount,
            balanceBefore: holder.currentBalance,
            balanceAfter: holder.currentBalance - pettyCashLiquidation.amount,
            reason: `Liquidation #${pettyCashLiquidation.id}`,
            performedById: this.utilityService.accountInformation.id,
          },
        });
      } else {
        // Legacy: Update account's petty cash amount
        await prisma.account.update({
          where: { id: pettyCashLiquidation.requestedById },
          data: { pettyCashAmount: { decrement: pettyCashLiquidation.amount } },
        });
      }
    });
  }
  async rejectLiquidation(params: LiquidateRejectDTO) {
    // Check if already rejected
    const pettyCashLiquidation =
      await this.prisma.pettyCashLiquidation.findUnique({
        where: { id: params.id },
        include: { workflowInstance: true },
      });

    if (!pettyCashLiquidation) {
      throw new BadRequestException('Liquidation not found.');
    }

    if (pettyCashLiquidation.status === 'REJECTED') {
      throw new BadRequestException('Liquidation already rejected.');
    }

    // If workflow instance exists, use workflow engine for rejection
    if (pettyCashLiquidation.workflowInstance) {
      try {
        await this.workflowEngineService.transitionWorkflow({
          instanceId: pettyCashLiquidation.workflowInstance.id,
          action: 'Reject Liquidation',
          performedById: this.utilityService.accountInformation.id,
          remarks: params.reason,
          metadata: {
            rejectedById: this.utilityService.accountInformation.id,
            rejectedByName: `${this.utilityService.accountInformation.firstName} ${this.utilityService.accountInformation.lastName}`,
            rejectedAt: new Date().toISOString(),
            rejectionReason: params.reason,
          },
        });

        // Get updated liquidation after workflow transition
        const updatedLiquidation =
          await this.prisma.pettyCashLiquidation.findUnique({
            where: { id: params.id },
            include: {
              attachmentProof: true,
              workflowInstance: {
                include: {
                  currentStage: true,
                  workflow: true,
                },
              },
            },
          });

        return this.formatPettyCashLiquidationResponse(updatedLiquidation);
      } catch (error) {
        console.error(
          'Workflow transition failed, falling back to direct rejection:',
          error,
        );
        // Fall through to direct rejection if workflow fails
      }
    }

    // Update petty cash liquidation status
    await this.prisma.pettyCashLiquidation.update({
      where: { id: params.id },
      data: { status: 'REJECTED' },
    });
  }

  /**
   * Formats a petty cash response according to the standard format
   */
  private formatPettyCashResponse(account: any): any {
    if (!account) return null;

    return {
      id: account.id,
      username: account.username,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      contactNumber: account.contactNumber,
      pettyCashAmount: this.utilityService.formatCurrency(
        account.pettyCashAmount,
      ),
      createdAt: this.utilityService.formatDate(account.createdAt),
      updatedAt: this.utilityService.formatDate(account.updatedAt),
    };
  }

  /**
   * Formats a petty cash liquidation response according to the standard format
   */
  private formatPettyCashLiquidationResponse(liquidation: any): any {
    if (!liquidation) return null;

    return {
      id: liquidation.id,
      description: liquidation.description,
      amount: this.utilityService.formatCurrency(liquidation.amount),
      receiptNumber: liquidation.receiptNumber,
      receiptDate: liquidation.receiptDate
        ? this.utilityService.formatDate(liquidation.receiptDate)
        : null,
      vendorName: liquidation.vendorName,
      vendorAddress: liquidation.vendorAddress,
      vendorTin: liquidation.vendorTin,
      expenseCategory: liquidation.expenseCategory,
      businessPurpose: liquidation.businessPurpose,
      isAiExtracted: liquidation.isAiExtracted,
      // Add VAT and withholding tax fields
      vatAmount: liquidation.vatAmount || 0,
      withholdingTaxAmount: liquidation.withholdingTaxAmount || 0,
      vatAmountConfidence: liquidation.vatAmountConfidence || 0,
      withholdingTaxConfidence: liquidation.withholdingTaxConfidence || 0,
      totalAIConfidence: liquidation.totalAIConfidence || 0,
      attachmentProof: liquidation.attachmentProof
        ? this.formatFilesResponse(liquidation.attachmentProof)
        : null,
      requestedBy: liquidation.requestedBy
        ? this.formatAccountResponse(liquidation.requestedBy)
        : null,
      status: pettyCashLiquidationStatusReference.find(
        (ref) => ref.key === liquidation.status,
      ) || { key: liquidation.status, label: liquidation.status },
      // Add workflow information
      workflowInstanceId: liquidation.workflowInstanceId,
      workflowInstance: liquidation.workflowInstance || null,
      workflowStage: liquidation.workflowInstance?.currentStage
        ? {
            id: liquidation.workflowInstance.currentStage.id,
            key: liquidation.workflowInstance.currentStage.key,
            name: liquidation.workflowInstance.currentStage.name,
            color: liquidation.workflowInstance.currentStage.color,
            textColor: liquidation.workflowInstance.currentStage.textColor,
            icon: liquidation.workflowInstance.currentStage.icon,
            isFinal: liquidation.workflowInstance.currentStage.isFinal,
            isInitial: liquidation.workflowInstance.currentStage.isInitial,
          }
        : null,
      createdAt: this.utilityService.formatDate(liquidation.createdAt),
      updatedAt: this.utilityService.formatDate(liquidation.updatedAt),
    };
  }

  /**
   * Formats a files response
   */
  private formatFilesResponse(file: any): any {
    if (!file) return null;

    return {
      id: file.id,
      name: file.name,
      type: file.type,
      url: file.url,
      size: file.size,
      uploadedBy: file.uploadedBy,
      fieldName: file.fieldName,
      originalName: file.originalName,
      encoding: file.encoding,
      mimetype: file.mimetype,
      project: file.project,
      task: file.task,
      createdAt: this.utilityService.formatDate(file.createdAt),
    };
  }

  /**
   * Formats an account response
   */
  private formatAccountResponse(account: any): any {
    if (!account) return null;

    return {
      id: account.id,
      email: account.email,
      username: account.username,
      firstName: account.firstName,
      middleName: account.middleName,
      lastName: account.lastName,
      contactNumber: account.contactNumber,
      status: account.status,
      createdAt: this.utilityService.formatDate(account.createdAt),
      role: account.role,
      parentAccountId: account.parentAccountId,
      image: account.image,
      parent: account.parent,
    };
  }

  // New methods for petty cash holder management

  async assignPettyCashHolder(
    params: AssignPettyCashDTO,
  ): Promise<PettyCashHolderDTO> {
    // Check if account already has an active petty cash assignment
    const existingHolder = await this.prisma.pettyCashHolder.findFirst({
      where: {
        accountId: params.accountId,
        isActive: true,
        companyId: this.utilityService.companyId,
      },
    });

    if (existingHolder) {
      throw new BadRequestException(
        'This employee already has an active petty cash assignment.',
      );
    }

    // Get employee information for memo
    const employee = await this.prisma.account.findUnique({
      where: { id: params.accountId },
    });

    if (!employee) {
      throw new BadRequestException('Employee not found.');
    }

    const employeeName = `${employee.firstName} ${employee.lastName}`.trim();

    // Use database transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (prisma) => {
      // 1. Create fund account transaction (deduct from fund account)
      const fundTransactionParams: CreateTransactionDTO = {
        fundAccountId: params.fundAccountId,
        amount: params.initialAmount,
        type: FundTransactionType.SUBTRACT,
        code: FundTransactionCode.PETTY_CASH_ASSIGNMENT,
        memo: `Petty cash assignment to ${employeeName} - ${params.reason}`,
      };

      // This will validate fund balance and create the transaction
      const fundResult = await this.fundAccountService._createTransaction(
        fundTransactionParams,
      );

      // 2. Create petty cash holder with fund account reference
      const holder = await prisma.pettyCashHolder.create({
        data: {
          accountId: params.accountId,
          initialAmount: params.initialAmount,
          currentBalance: params.initialAmount,
          reason: params.reason,
          companyId: this.utilityService.companyId,
          fundAccountId: params.fundAccountId,
        },
        include: {
          account: true,
          fundAccount: true,
        },
      });

      // 3. Create petty cash transaction linked to fund transaction
      await prisma.pettyCashTransaction.create({
        data: {
          pettyCashHolderId: holder.id,
          type: 'INITIAL',
          amount: params.initialAmount,
          balanceBefore: 0,
          balanceAfter: params.initialAmount,
          reason: params.reason,
          performedById: this.utilityService.accountInformation.id,
          fundTransactionId: fundResult.transaction.id,
        },
      });

      return holder;
    });

    return this.formatPettyCashHolderResponse(result);
  }

  async refillPettyCash(
    params: RefillPettyCashDTO,
  ): Promise<PettyCashTransactionDTO> {
    const holder = await this.prisma.pettyCashHolder.findUnique({
      where: { id: params.pettyCashHolderId },
      include: { account: true },
    });

    if (!holder || !holder.isActive) {
      throw new BadRequestException('Petty cash holder not found or inactive.');
    }

    const employeeName =
      `${holder.account.firstName} ${holder.account.lastName}`.trim();
    const newBalance = holder.currentBalance + params.amount;

    // Use database transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (prisma) => {
      // 1. Create fund account transaction (deduct from fund account)
      const fundTransactionParams: CreateTransactionDTO = {
        fundAccountId: params.fundAccountId,
        amount: params.amount,
        type: FundTransactionType.SUBTRACT,
        code: FundTransactionCode.PETTY_CASH_REFILL,
        memo: `Petty cash refill for ${employeeName} - ${params.reason}`,
      };

      // This will validate fund balance and create the transaction
      const fundResult = await this.fundAccountService._createTransaction(
        fundTransactionParams,
      );

      // 2. Create petty cash transaction linked to fund transaction
      const transaction = await prisma.pettyCashTransaction.create({
        data: {
          pettyCashHolderId: holder.id,
          type: 'REFILL',
          amount: params.amount,
          balanceBefore: holder.currentBalance,
          balanceAfter: newBalance,
          reason: params.reason,
          performedById: this.utilityService.accountInformation.id,
          fundTransactionId: fundResult.transaction.id,
        },
        include: {
          performedBy: true,
        },
      });

      // 3. Update holder balance
      await prisma.pettyCashHolder.update({
        where: { id: holder.id },
        data: { currentBalance: newBalance },
      });

      return transaction;
    });

    return this.formatPettyCashTransactionResponse(result);
  }

  async deductPettyCash(
    params: DeductPettyCashDTO,
  ): Promise<PettyCashTransactionDTO> {
    const holder = await this.prisma.pettyCashHolder.findUnique({
      where: { id: params.pettyCashHolderId },
    });

    if (!holder || !holder.isActive) {
      throw new BadRequestException('Petty cash holder not found or inactive.');
    }

    if (holder.currentBalance < params.amount) {
      throw new BadRequestException('Insufficient petty cash balance.');
    }

    const newBalance = holder.currentBalance - params.amount;

    // Create transaction
    const transaction = await this.prisma.pettyCashTransaction.create({
      data: {
        pettyCashHolderId: holder.id,
        type: 'DEDUCTION',
        amount: params.amount,
        balanceBefore: holder.currentBalance,
        balanceAfter: newBalance,
        reason: params.reason,
        performedById: this.utilityService.accountInformation.id,
      },
      include: {
        performedBy: true,
      },
    });

    // Update holder balance
    await this.prisma.pettyCashHolder.update({
      where: { id: holder.id },
      data: { currentBalance: newBalance },
    });

    return this.formatPettyCashTransactionResponse(transaction);
  }

  async getPettyCashHolders() {
    const holders = await this.prisma.pettyCashHolder.findMany({
      where: {
        companyId: this.utilityService.companyId,
        isActive: true,
      },
      include: {
        account: true,
        fundAccount: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return holders.map((holder) => this.formatPettyCashHolderResponse(holder));
  }

  async getCurrentUserHolder() {
    const holder = await this.prisma.pettyCashHolder.findFirst({
      where: {
        accountId: this.utilityService.accountInformation.id,
        isActive: true,
        companyId: this.utilityService.companyId,
      },
      include: {
        account: true,
        fundAccount: true,
        liquidations: {
          where: {
            status: 'PENDING',
          },
          select: {
            amount: true,
          },
        },
      },
    });

    if (!holder) {
      return null;
    }

    // Calculate pending liquidation amount
    const pendingLiquidation = holder.liquidations.reduce(
      (sum, liquidation) => sum + liquidation.amount,
      0,
    );

    // Format response with pending liquidation
    const formattedResponse = this.formatPettyCashHolderResponse(holder);
    return {
      ...formattedResponse,
      actualBalance: formattedResponse.currentBalance,
      pendingLiquidation,
    };
  }

  async getPettyCashHolderHistory(holderId: number) {
    const transactions = await this.prisma.pettyCashTransaction.findMany({
      where: {
        pettyCashHolderId: holderId,
      },
      include: {
        performedBy: true,
        fundTransaction: true,
        transferFromHolder: {
          include: {
            account: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return transactions.map((transaction) =>
      this.formatPettyCashTransactionResponse(transaction),
    );
  }

  async pettyCashHolderTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'pettyCashHolder');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['include'] = { account: true, fundAccount: true };
    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: this.utilityService.companyId,
      isActive: true,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.pettyCashHolder,
      query,
      tableQuery,
    );
    const formattedList = baseList.map((holder) =>
      this.formatPettyCashHolderResponse(holder),
    );
    return { list: formattedList, pagination, currentPage };
  }

  // Update liquidation method to work with holders
  async liquidatePettyCashV2(
    params: LiquidatePettyCashDTO & { pettyCashHolderId: number },
  ) {
    // Validate tax amounts
    this.validateTaxAmounts(params);

    const holder = await this.prisma.pettyCashHolder.findUnique({
      where: { id: params.pettyCashHolderId },
    });

    if (!holder || !holder.isActive) {
      throw new BadRequestException('Petty cash holder not found or inactive.');
    }

    if (holder.currentBalance < params.amount) {
      throw new BadRequestException('Insufficient petty cash balance.');
    }

    // Create petty cash liquidation with new VAT and withholding tax fields
    const pettyCashLiquidationParams: Prisma.PettyCashLiquidationCreateInput = {
      description: params.description || '',
      amount: params.amount,
      receiptNumber: params.receiptNumber || undefined,
      receiptDate: params.receiptDate
        ? new Date(params.receiptDate)
        : undefined,
      vendorName: params.vendorName || undefined,
      vendorAddress: params.vendorAddress || undefined,
      vendorTin: params.vendorTin || undefined,
      expenseCategory: params.expenseCategory || undefined,
      businessPurpose: params.businessPurpose || undefined,
      isAiExtracted: params.isAiExtracted || false,
      vatAmount: params.vatAmount || 0,
      withholdingTaxAmount: params.withholdingTaxAmount || 0,
      vatAmountConfidence: params.vatAmountConfidence || 0,
      withholdingTaxConfidence: params.withholdingTaxConfidence || 0,
      totalAIConfidence: params.totalAIConfidence || 0,
      attachmentProof: params.attachmentProof
        ? { connect: { id: params.attachmentProof } }
        : undefined,
      requestedBy: {
        connect: { id: this.utilityService.accountInformation.id },
      },
      pettyCashHolder: { connect: { id: params.pettyCashHolderId } },
    };

    const liquidationData = await this.prisma.pettyCashLiquidation.create({
      data: pettyCashLiquidationParams,
    });

    // Start workflow for the liquidation
    let workflowInstance = null;
    try {
      if (!this.workflowEngineService) {
        console.warn(
          'Workflow engine service not available, skipping workflow creation',
        );
      } else {
        workflowInstance = await this.workflowEngineService.startWorkflow({
          workflowCode: 'petty_cash_liquidation',
          sourceModule: 'petty_cash_liquidation',
          sourceId: liquidationData.id.toString(),
          initiatorId: this.utilityService.accountInformation.id,
          companyId: this.utilityService.companyId,
          metadata: {
            amount: params.amount,
            description: params.description,
            vendorName: params.vendorName,
            vendorAddress: params.vendorAddress,
            vendorTin: params.vendorTin,
            expenseCategory: params.expenseCategory,
            businessPurpose: params.businessPurpose,
            receiptNumber: params.receiptNumber,
            receiptDate: params.receiptDate,
            vatAmount: params.vatAmount,
            withholdingTaxAmount: params.withholdingTaxAmount,
            vatAmountConfidence: params.vatAmountConfidence,
            withholdingTaxConfidence: params.withholdingTaxConfidence,
            totalAIConfidence: params.totalAIConfidence,
            isAiExtracted: params.isAiExtracted,
            attachmentProofId: params.attachmentProof,
            pettyCashHolderId: params.pettyCashHolderId,
            requestedById: this.utilityService.accountInformation.id,
            requestedByName: `${this.utilityService.accountInformation.firstName} ${this.utilityService.accountInformation.lastName}`,
            requestedByEmail: this.utilityService.accountInformation.email,
          },
        });

        // Update liquidation with workflow instance ID
        if (workflowInstance && workflowInstance.id) {
          await this.prisma.pettyCashLiquidation.update({
            where: { id: liquidationData.id },
            data: {
              workflowInstanceId: workflowInstance.id,
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to start workflow for liquidation:', {
        error: error.message || error,
        liquidationId: liquidationData.id,
        stack: error.stack,
      });
      // Continue without workflow if it fails - this is not a critical error
    }

    const pettyCashLiquidation =
      await this.prisma.pettyCashLiquidation.findUnique({
        where: { id: liquidationData.id },
        include: {
          attachmentProof: true,
          workflowInstance: {
            include: {
              currentStage: true,
              workflow: true,
            },
          },
        },
      });

    const liquidationResponseData =
      this.formatPettyCashLiquidationResponse(pettyCashLiquidation);
    return liquidationResponseData;
  }

  // Format helper methods
  private formatPettyCashHolderResponse(holder: any): PettyCashHolderDTO {
    return {
      id: holder.id,
      account: {
        id: holder.account.id,
        name: `${holder.account.firstName} ${holder.account.lastName}`,
        username: holder.account.username,
        email: holder.account.email,
      },
      initialAmount: holder.initialAmount,
      currentBalance: holder.currentBalance,
      reason: holder.reason,
      isActive: holder.isActive,
      fundAccountId: holder.fundAccountId,
      fundAccount: holder.fundAccount
        ? {
            id: holder.fundAccount.id,
            name: holder.fundAccount.name,
            accountNumber: holder.fundAccount.accountNumber,
            balance: holder.fundAccount.balance,
          }
        : undefined,
      createdAt: holder.createdAt,
      updatedAt: holder.updatedAt,
    };
  }

  private formatPettyCashTransactionResponse(
    transaction: any,
  ): PettyCashTransactionDTO {
    return {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      balanceBefore: transaction.balanceBefore,
      balanceAfter: transaction.balanceAfter,
      reason: transaction.reason,
      performedBy: {
        id: transaction.performedBy.id,
        name: `${transaction.performedBy.firstName} ${transaction.performedBy.lastName}`,
      },
      fundTransactionId: transaction.fundTransactionId,
      transferFromHolderId: transaction.transferFromHolderId,
      transferFromHolder: transaction.transferFromHolder
        ? {
            id: transaction.transferFromHolder.id,
            account: {
              id: transaction.transferFromHolder.account.id,
              name: `${transaction.transferFromHolder.account.firstName} ${transaction.transferFromHolder.account.lastName}`,
            },
          }
        : undefined,
      createdAt: transaction.createdAt,
    };
  }

  async returnPettyCash(
    params: ReturnPettyCashDTO,
  ): Promise<PettyCashTransactionDTO> {
    const result = await this.prisma.$transaction(async (prisma) => {
      // Get holder with account info
      const holder = await prisma.pettyCashHolder.findUnique({
        where: { id: params.pettyCashHolderId },
        include: { account: true },
      });

      if (!holder) {
        throw new BadRequestException('Petty cash holder not found.');
      }

      if (!holder.isActive) {
        throw new BadRequestException('Petty cash holder is not active.');
      }

      if (holder.currentBalance < params.amount) {
        throw new BadRequestException('Insufficient petty cash balance.');
      }

      // Get fund account
      const fundAccount = await prisma.fundAccount.findUnique({
        where: { id: params.fundAccountId },
      });

      if (!fundAccount) {
        throw new BadRequestException('Fund account not found.');
      }

      const performedById = this.utilityService.accountInformation.id;
      const employeeName = `${holder.account.firstName} ${holder.account.lastName}`;

      // 1. Create fund account transaction (add)
      const fundResult = await this.fundAccountService._createTransaction({
        fundAccountId: params.fundAccountId,
        amount: params.amount,
        type: FundTransactionType.ADD,
        code: FundTransactionCode.PETTY_CASH_RETURN,
        memo: `Petty cash return from ${employeeName} - ${params.reason}`,
      });

      // 2. Create petty cash transaction (deduct)
      const pettyCashTransaction = await prisma.pettyCashTransaction.create({
        data: {
          pettyCashHolderId: params.pettyCashHolderId,
          type: PettyCashTransactionType.RETURN,
          amount: params.amount,
          balanceBefore: holder.currentBalance,
          balanceAfter: holder.currentBalance - params.amount,
          reason: params.reason,
          performedById,
          fundTransactionId: fundResult.transaction.id,
        },
        include: {
          performedBy: true,
          fundTransaction: true,
        },
      });

      // 3. Update holder balance
      await prisma.pettyCashHolder.update({
        where: { id: params.pettyCashHolderId },
        data: { currentBalance: holder.currentBalance - params.amount },
      });

      return pettyCashTransaction;
    });

    return this.formatPettyCashTransactionResponse(result);
  }

  async transferPettyCash(params: TransferPettyCashDTO): Promise<{
    source: PettyCashTransactionDTO;
    destination: PettyCashTransactionDTO;
  }> {
    if (params.fromHolderId === params.toHolderId) {
      throw new BadRequestException('Cannot transfer to the same holder.');
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      // Get both holders
      const [fromHolder, toHolder] = await Promise.all([
        prisma.pettyCashHolder.findUnique({
          where: { id: params.fromHolderId },
          include: { account: true },
        }),
        prisma.pettyCashHolder.findUnique({
          where: { id: params.toHolderId },
          include: { account: true },
        }),
      ]);

      if (!fromHolder) {
        throw new BadRequestException('Source petty cash holder not found.');
      }

      if (!toHolder) {
        throw new BadRequestException(
          'Destination petty cash holder not found.',
        );
      }

      if (!fromHolder.isActive) {
        throw new BadRequestException(
          'Source petty cash holder is not active.',
        );
      }

      if (!toHolder.isActive) {
        throw new BadRequestException(
          'Destination petty cash holder is not active.',
        );
      }

      if (fromHolder.currentBalance < params.amount) {
        throw new BadRequestException(
          'Insufficient balance in source petty cash.',
        );
      }

      const performedById = this.utilityService.accountInformation.id;
      const fromName = `${fromHolder.account.firstName} ${fromHolder.account.lastName}`;
      const toName = `${toHolder.account.firstName} ${toHolder.account.lastName}`;

      // 1. Create source transaction (deduct)
      const sourceTransaction = await prisma.pettyCashTransaction.create({
        data: {
          pettyCashHolderId: params.fromHolderId,
          type: PettyCashTransactionType.TRANSFER,
          amount: params.amount,
          balanceBefore: fromHolder.currentBalance,
          balanceAfter: fromHolder.currentBalance - params.amount,
          reason: `Transfer to ${toName} - ${params.reason}`,
          performedById,
        },
        include: {
          performedBy: true,
        },
      });

      // 2. Create destination transaction (add)
      const destinationTransaction = await prisma.pettyCashTransaction.create({
        data: {
          pettyCashHolderId: params.toHolderId,
          type: PettyCashTransactionType.TRANSFER,
          amount: params.amount,
          balanceBefore: toHolder.currentBalance,
          balanceAfter: toHolder.currentBalance + params.amount,
          reason: `Transfer from ${fromName} - ${params.reason}`,
          performedById,
          transferFromHolderId: params.fromHolderId,
        },
        include: {
          performedBy: true,
          transferFromHolder: {
            include: {
              account: true,
            },
          },
        },
      });

      // 3. Update balances
      await Promise.all([
        prisma.pettyCashHolder.update({
          where: { id: params.fromHolderId },
          data: { currentBalance: fromHolder.currentBalance - params.amount },
        }),
        prisma.pettyCashHolder.update({
          where: { id: params.toHolderId },
          data: { currentBalance: toHolder.currentBalance + params.amount },
        }),
      ]);

      return { sourceTransaction, destinationTransaction };
    });

    return {
      source: this.formatPettyCashTransactionResponse(result.sourceTransaction),
      destination: this.formatPettyCashTransactionResponse(
        result.destinationTransaction,
      ),
    };
  }

  async deactivatePettyCashHolder(id: number) {
    const holder = await this.prisma.pettyCashHolder.findUnique({
      where: { id },
    });

    if (!holder) {
      throw new BadRequestException('Petty cash holder not found.');
    }

    if (holder.currentBalance > 0) {
      throw new BadRequestException(
        'Cannot deactivate holder with remaining balance. Please liquidate or transfer the balance first.',
      );
    }

    await this.prisma.pettyCashHolder.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Petty cash holder deactivated successfully.' };
  }

  async extractReceiptData(
    params: ExtractReceiptDataDTO,
  ): Promise<ExtractedReceiptDataDTO> {
    try {
      // Get the file from database
      const file = await this.prisma.files.findUnique({
        where: { id: params.fileId },
      });

      if (!file) {
        throw new BadRequestException('File not found.');
      }

      // Check if file is an image
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('File must be an image.');
      }

      // Fetch the image and convert to base64
      let base64Image: string;
      try {
        const response = await fetch(file.url);
        if (!response.ok) {
          throw new Error('Failed to fetch image');
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        base64Image = `data:${file.mimetype};base64,${buffer.toString('base64')}`;
      } catch (error) {
        console.error('Error fetching image:', error);
        throw new BadRequestException(
          'Failed to access receipt image. Please try uploading again.',
        );
      }

      // Prepare the enhanced prompt for OpenAI with comprehensive confidence scoring
      const prompt = `You are an expert receipt analyzer specializing in Philippine tax documents. 
Analyze this receipt image and extract the following information with confidence scores in JSON format:

BASIC INFORMATION (with confidence scores for EACH field):
- receiptNumber: The receipt, OR, or SI number
- receiptNumberConfidence: Your confidence (0-100) in the receipt number extraction
- receiptDate: The date on the receipt (format: YYYY-MM-DD)
- receiptDateConfidence: Your confidence (0-100) in the date extraction
- vendorName: The name of the vendor/establishment
- vendorNameConfidence: Your confidence (0-100) in the vendor name extraction
- vendorAddress: The complete address of the vendor
- vendorAddressConfidence: Your confidence (0-100) in the address extraction
- vendorTin: The TIN (Tax Identification Number) of the vendor
- vendorTinConfidence: Your confidence (0-100) in the TIN extraction
- amount: The TOTAL amount on the receipt (number only, no currency symbol)
- amountConfidence: Your confidence (0-100) in the total amount extraction
- expenseCategory: Categorize the expense (Meals, Transportation, Office Supplies, Utilities, Accommodation, Professional Services, etc.)
- expenseCategoryConfidence: Your confidence (0-100) in the category determination

TAX INFORMATION (with confidence scores):
- vatAmount: The VAT amount if shown separately (number only, default to 0 if not found)
- vatAmountConfidence: Your confidence (0-100) in the VAT amount extraction
- withholdingTaxAmount: The withholding tax/EWT amount if shown (number only, default to 0 if not found)
- withholdingTaxConfidence: Your confidence (0-100) in the withholding tax extraction

For VAT detection, look for:
• "VAT" or "V.A.T."
• "12% VAT" or "VAT 12%"
• "VATable Sales" followed by VAT amount
• "VAT Amount"
• "VAT Inclusive" (calculate: total / 1.12 * 0.12)
• Sometimes shown as a separate line item below subtotal

For Withholding Tax detection, look for:
• "EWT" (Expanded Withholding Tax)
• "Withholding Tax" or "W/Tax"
• "WT" or "W.T."
• "Less: EWT" or "Less: Withholding"
• "CWT" (Creditable Withholding Tax)
• Usually shown as a deduction or negative amount
• Common rates: 1%, 2%, 5%, 10%, 15%

CONFIDENCE SCORING GUIDELINES:
• 90-100: Text is clearly visible, unambiguous, and matches expected format
• 70-89: Text is visible but may have minor issues (slight blur, unusual format)
• 50-69: Text is partially obscured, requires interpretation, or format is non-standard
• 30-49: Text is difficult to read, heavily obscured, or very uncertain
• 10-29: Text is barely visible, mostly guessed based on context
• 0: Field not found or completely illegible

SPECIAL INSTRUCTIONS:
1. Provide a confidence score for EVERY field, even if the field value is null
2. If a field cannot be found, set its value to null and confidence to 0
3. If VAT is calculated (not explicitly shown), set vatAmountConfidence to 85
4. For VAT-Exempt or Zero-Rated receipts, VAT is 0 with confidence 100
5. Be conservative with confidence scores - only use 90+ when absolutely certain

RESPONSE FORMAT:
Respond ONLY with valid JSON. Do not include any explanation or additional text.

Example response:
{
  "receiptNumber": "OR-2024-001234",
  "receiptNumberConfidence": 95,
  "receiptDate": "2024-03-15",
  "receiptDateConfidence": 100,
  "vendorName": "ABC Restaurant",
  "vendorNameConfidence": 90,
  "vendorAddress": "123 Main St, Manila",
  "vendorAddressConfidence": 75,
  "vendorTin": "123-456-789-000",
  "vendorTinConfidence": 85,
  "amount": 1120.00,
  "amountConfidence": 100,
  "vatAmount": 120.00,
  "vatAmountConfidence": 95,
  "withholdingTaxAmount": 0,
  "withholdingTaxConfidence": 0,
  "expenseCategory": "Meals",
  "expenseCategoryConfidence": 90
}`;

      // Call OpenAI with the base64 image
      const messages = [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: prompt },
            { type: 'image_url' as const, image_url: { url: base64Image } },
          ],
        },
      ];

      const response = await this.openAIService.askOpenAI(messages, 'gpt-4o');

      // Parse the response
      let extractedData: ExtractedReceiptDataDTO;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);

          // Helper function to validate and clamp confidence scores
          const validateConfidence = (value: any): number => {
            const num = Number(value) || 0;
            return Math.max(0, Math.min(100, num));
          };

          // Extract all confidence scores
          const receiptNumberConfidence = validateConfidence(
            parsed.receiptNumberConfidence,
          );
          const receiptDateConfidence = validateConfidence(
            parsed.receiptDateConfidence,
          );
          const vendorNameConfidence = validateConfidence(
            parsed.vendorNameConfidence,
          );
          const vendorAddressConfidence = validateConfidence(
            parsed.vendorAddressConfidence,
          );
          const vendorTinConfidence = validateConfidence(
            parsed.vendorTinConfidence,
          );
          const amountConfidence = validateConfidence(parsed.amountConfidence);
          const expenseCategoryConfidence = validateConfidence(
            parsed.expenseCategoryConfidence,
          );

          // Validate and sanitize VAT amount
          const vatAmount = parsed.vatAmount ? Number(parsed.vatAmount) : 0;
          let vatConfidence = validateConfidence(parsed.vatAmountConfidence);

          // Validate VAT amount against total (shouldn't exceed 13% of total with margin)
          if (parsed.amount && vatAmount > parsed.amount * 0.13) {
            vatConfidence = Math.min(vatConfidence, 50); // Reduce confidence if VAT seems too high
          }

          // Validate and sanitize withholding tax amount
          const withholdingTaxAmount = parsed.withholdingTaxAmount
            ? Number(parsed.withholdingTaxAmount)
            : 0;
          let withholdingTaxConfidence = validateConfidence(
            parsed.withholdingTaxConfidence,
          );

          // Validate withholding tax (shouldn't exceed 15% of total)
          if (parsed.amount && withholdingTaxAmount > parsed.amount * 0.15) {
            withholdingTaxConfidence = Math.min(withholdingTaxConfidence, 50);
          }

          // Calculate total AI confidence as weighted average
          // Critical fields (amount, vendorName): 30% weight each = 60%
          // Important fields (receiptNumber, receiptDate, VAT): 10% weight each = 30%
          // Standard fields (address, TIN, category, withholding): 2.5% weight each = 10%
          const totalAIConfidence = Math.round(
            amountConfidence * 0.3 +
              vendorNameConfidence * 0.3 +
              receiptNumberConfidence * 0.1 +
              receiptDateConfidence * 0.1 +
              vatConfidence * 0.1 +
              vendorAddressConfidence * 0.025 +
              vendorTinConfidence * 0.025 +
              expenseCategoryConfidence * 0.025 +
              withholdingTaxConfidence * 0.025,
          );

          extractedData = {
            receiptNumber: parsed.receiptNumber || undefined,
            receiptNumberConfidence,
            receiptDate: parsed.receiptDate || undefined,
            receiptDateConfidence,
            vendorName: parsed.vendorName || undefined,
            vendorNameConfidence,
            vendorAddress: parsed.vendorAddress || undefined,
            vendorAddressConfidence,
            vendorTin: parsed.vendorTin || undefined,
            vendorTinConfidence,
            amount: parsed.amount ? Number(parsed.amount) : undefined,
            amountConfidence,
            expenseCategory: parsed.expenseCategory || undefined,
            expenseCategoryConfidence,
            vatAmount: vatAmount,
            vatAmountConfidence: vatConfidence,
            withholdingTaxAmount: withholdingTaxAmount,
            withholdingTaxConfidence: withholdingTaxConfidence,
            totalAIConfidence,
            isAiExtracted: true,
          };

          // Log the extracted data with confidence scores for debugging
          console.log('Extracted data with confidence scores:', {
            receiptNumberConfidence,
            receiptDateConfidence,
            vendorNameConfidence,
            amountConfidence,
            totalAIConfidence,
          });
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (error) {
        console.error('Failed to parse OpenAI response:', error);
        throw new BadRequestException(
          'Failed to extract receipt data. Please try again or enter manually.',
        );
      }

      return extractedData;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error extracting receipt data:', error);
      throw new BadRequestException(
        'Failed to process receipt image. Please try again or enter manually.',
      );
    }
  }

  // Removed duplicate handleWorkflowSync function - using the one defined at line 69

  /**
   * Record an approved liquidation to the petty cash holder's account
   */
  async recordLiquidationToPettyCash(liquidationId: number, remarks?: string) {
    try {
      // Get liquidation with petty cash holder
      const liquidation = await this.prisma.pettyCashLiquidation.findUnique({
        where: { id: liquidationId },
        include: {
          pettyCashHolder: true,
          requestedBy: true,
        },
      });

      if (!liquidation) {
        throw new NotFoundException('Liquidation not found');
      }

      if (liquidation.status !== 'APPROVED') {
        throw new BadRequestException(
          'Only approved liquidations can be recorded to petty cash',
        );
      }

      if (!liquidation.pettyCashHolder) {
        throw new BadRequestException(
          'No petty cash holder assigned to this liquidation',
        );
      }

      // Check if sufficient balance exists
      if (liquidation.pettyCashHolder.currentBalance < liquidation.amount) {
        throw new BadRequestException('Insufficient petty cash balance');
      }

      // Check if already recorded (prevent double recording)
      const existingTransaction =
        await this.prisma.pettyCashTransaction.findFirst({
          where: {
            type: PettyCashTransactionType.LIQUIDATION,
            pettyCashHolderId: liquidation.pettyCashHolder.id,
            reason: {
              contains: `Liquidation #${liquidation.id}`,
            },
          },
        });

      if (existingTransaction) {
        throw new BadRequestException(
          'This liquidation has already been recorded to petty cash',
        );
      }

      const currentBalance = liquidation.pettyCashHolder.currentBalance;
      const newBalance = currentBalance - liquidation.amount;

      await this.prisma.$transaction(async (tx) => {
        // Update petty cash holder balance
        await tx.pettyCashHolder.update({
          where: { id: liquidation.pettyCashHolder.id },
          data: {
            currentBalance: newBalance,
          },
        });

        // Create transaction record
        await tx.pettyCashTransaction.create({
          data: {
            type: PettyCashTransactionType.LIQUIDATION,
            amount: liquidation.amount,
            reason:
              remarks ||
              `Liquidation #${liquidation.id} - ${liquidation.businessPurpose || liquidation.description}`,
            pettyCashHolderId: liquidation.pettyCashHolder.id,
            performedById:
              this.utilityService.accountInformation?.id || 'system',
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
          },
        });

        // Note: Liquidation recording is tracked via transaction history
        // Future enhancement: Add isRecordedToPettyCash and recordedToPettyCashAt fields to schema
      });

      return {
        success: true,
        message: 'Liquidation successfully recorded to petty cash',
        liquidationId,
        amountRecorded: liquidation.amount,
        newBalance,
      };
    } catch (error) {
      console.error('Error recording liquidation to petty cash:', error);
      throw error;
    }
  }

  /**
   * Get current user's liquidations
   */
  async getMyLiquidations(holderId?: number) {
    try {
      const currentUserId = this.utilityService.accountInformation?.id;

      if (!currentUserId) {
        throw new BadRequestException('User not authenticated');
      }

      const filter: any = {
        requestedById: currentUserId,
      };

      // If holderId is provided, also filter by that
      if (holderId) {
        filter.pettyCashHolderId = holderId;
      }

      const liquidations = await this.prisma.pettyCashLiquidation.findMany({
        where: filter,
        include: {
          requestedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          attachmentProof: true,
          pettyCashHolder: true,
          workflowInstance: {
            include: {
              currentStage: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        list: liquidations.map((l) =>
          this.formatPettyCashLiquidationResponse(l),
        ),
        total: liquidations.length,
      };
    } catch (error) {
      console.error('Error fetching user liquidations:', error);
      throw error;
    }
  }

  /**
   * Approve liquidation through workflow - orchestrates calls to existing services
   */
  async approveWorkflowLiquidation(
    liquidationId: number,
    remarks?: string,
    action?: string,
  ) {
    try {
      // Get liquidation with workflow instance
      const liquidation = await this.prisma.pettyCashLiquidation.findUnique({
        where: { id: liquidationId },
        include: {
          workflowInstance: true,
        },
      });

      if (!liquidation) {
        throw new NotFoundException('Liquidation not found');
      }

      // Note: Don't check for APPROVED status here because workflow sync might have already updated it
      // We'll check for actual completion by looking at transaction history instead

      let workflowResult = null;
      let approvalResult = null;

      // 1. Handle workflow transition if workflow instance exists
      if (liquidation.workflowInstance) {
        try {
          workflowResult = await this.workflowEngineService.transitionWorkflow({
            instanceId: liquidation.workflowInstance.id,
            action: action || 'Approve', // Use passed action or default to 'Approve'
            performedById: this.utilityService.accountInformation.id,
            remarks: remarks || 'Approved via liquidation approval dialog',
            metadata: {
              approvedById: this.utilityService.accountInformation.id,
              approvedByName: `${this.utilityService.accountInformation.firstName} ${this.utilityService.accountInformation.lastName}`,
              approvedAt: new Date().toISOString(),
            },
          });
        } catch (workflowError) {
          console.error('Workflow transition failed:', workflowError);
          throw new BadRequestException(
            'Failed to update workflow status: ' + workflowError.message,
          );
        }
      }

      // 2. Call existing approveLiquidation method to handle petty cash updates
      try {
        approvalResult = await this.approveLiquidation({
          id: liquidationId,
        });
      } catch (approvalError) {
        console.error('Petty cash approval failed:', approvalError);

        // If approval fails but workflow succeeded, we have a partial failure
        if (workflowResult) {
          console.error(
            'Workflow was updated but petty cash approval failed - manual intervention may be required',
          );
        }

        throw new BadRequestException(
          'Failed to approve liquidation: ' + approvalError.message,
        );
      }

      return {
        success: true,
        message: 'Liquidation approved and recorded successfully',
        liquidationId,
        workflowUpdated: !!workflowResult,
        approvalResult,
      };
    } catch (error) {
      console.error('Error approving workflow liquidation:', error);
      throw error;
    }
  }

  /**
   * Export petty cash liquidations to Excel with date range filter
   */
  async exportLiquidations(
    startDate: string,
    endDate: string,
  ): Promise<Buffer> {
    try {
      // Parse dates and set time boundaries
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Query liquidations with the date range
      const liquidations = await this.prisma.pettyCashLiquidation.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        include: {
          requestedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          approvedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          workflowInstance: {
            include: {
              currentStage: true,
              workflow: true,
              history: {
                include: {
                  performedBy: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
                orderBy: {
                  performedAt: 'desc',
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Format data for Excel export
      const exportData = liquidations.map((liquidation: any) => {
        const netAmount =
          (liquidation.amount || 0) - (liquidation.withholdingTaxAmount || 0);

        // Get approver info from workflow history or direct approval
        let approverName = '';
        let approvalDate = '';

        if (liquidation.workflowInstance?.history?.length > 0) {
          const approvalHistory = liquidation.workflowInstance.history.find(
            (h: any) => h.action?.toLowerCase().includes('approve'),
          );
          if (approvalHistory) {
            approverName = `${approvalHistory.performedBy.firstName} ${approvalHistory.performedBy.lastName}`;
            approvalDate = this.formatDateForExcel(approvalHistory.performedAt);
          }
        } else if (liquidation.approvedBy) {
          approverName = `${liquidation.approvedBy.firstName} ${liquidation.approvedBy.lastName}`;
          // Use updatedAt as approximation for approval date for legacy approvals
          approvalDate =
            liquidation.status === 'APPROVED'
              ? this.formatDateForExcel(liquidation.updatedAt)
              : '';
        }

        return {
          referenceNumber: `LC-${liquidation.id.toString().padStart(6, '0')}`,
          createdAt: this.formatDateForExcel(liquidation.createdAt),
          requestedByName: `${liquidation.requestedBy.firstName} ${liquidation.requestedBy.lastName}`,
          employeeCode: liquidation.requestedBy.id || '',
          vendorName: liquidation.vendorName || '',
          vendorTin: liquidation.vendorTin || '',
          receiptNumber: liquidation.receiptNumber || '',
          receiptDate: liquidation.receiptDate
            ? this.formatDateForExcel(liquidation.receiptDate)
            : '',
          businessPurpose:
            liquidation.businessPurpose || liquidation.description || '',
          expenseCategory: liquidation.expenseCategory || '',
          grossAmount: liquidation.amount || 0,
          vatAmount: liquidation.vatAmount || 0,
          withholdingTaxAmount: liquidation.withholdingTaxAmount || 0,
          netAmount,
          status: this.getStatusText(liquidation),
          approverName,
          approvalDate,
          remarks: this.getRemarks(liquidation),
        };
      });

      // Define Excel columns
      const columns = [
        { header: 'Reference No.', key: 'referenceNumber', width: 20 },
        { header: 'Date Created', key: 'createdAt', width: 18 },
        { header: 'Requested By', key: 'requestedByName', width: 25 },
        { header: 'Employee Code', key: 'employeeCode', width: 15 },
        { header: 'Vendor Name', key: 'vendorName', width: 25 },
        { header: 'Vendor TIN', key: 'vendorTin', width: 20 },
        { header: 'Receipt Number', key: 'receiptNumber', width: 20 },
        { header: 'Receipt Date', key: 'receiptDate', width: 18 },
        { header: 'Business Purpose', key: 'businessPurpose', width: 35 },
        { header: 'Expense Category', key: 'expenseCategory', width: 20 },
        { header: 'Gross Amount', key: 'grossAmount', width: 15 },
        { header: 'VAT Amount (12%)', key: 'vatAmount', width: 15 },
        { header: 'Withholding Tax', key: 'withholdingTaxAmount', width: 15 },
        { header: 'Net Amount', key: 'netAmount', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Approved/Rejected By', key: 'approverName', width: 25 },
        { header: 'Approval Date', key: 'approvalDate', width: 18 },
        { header: 'Remarks', key: 'remarks', width: 30 },
      ];

      // Generate Excel file
      const buffer = await this.excelExportService.exportToExcel(
        columns,
        exportData,
        'Petty Cash Liquidations',
      );

      return buffer;
    } catch (error) {
      console.error('Error exporting liquidations:', error);
      throw new BadRequestException('Failed to export liquidations data');
    }
  }

  private formatDateForExcel(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private getStatusText(liquidation: any): string {
    if (liquidation.workflowInstance?.currentStage) {
      return liquidation.workflowInstance.currentStage.name;
    }

    switch (liquidation.status) {
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'PENDING':
        return 'Pending';
      default:
        return liquidation.status || 'Unknown';
    }
  }

  private getRemarks(liquidation: any): string {
    if (liquidation.rejectReason) {
      return `Rejected: ${liquidation.rejectReason}`;
    }

    if (liquidation.workflowInstance?.history?.length > 0) {
      const latestHistory = liquidation.workflowInstance.history[0];
      return latestHistory.remarks || '';
    }

    return '';
  }
}

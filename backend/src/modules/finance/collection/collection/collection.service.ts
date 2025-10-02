import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import {
  FundTransactionCode,
  FundTransactionType,
  Prisma,
} from '@prisma/client';
import { UtilityService } from '@common/utility.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import {
  CollectionAccomplishmentSummary,
  CreateUpdateCollectionDTO,
  ReceivePaymentDTO,
  StartCollectionDTO,
} from './collection.interface';
import { FundAccountService } from '@modules/finance/fund-account/fund-account/fund-account.service';
import { CreateTransactionDTO } from '@modules/finance/fund-account/fund-account/fund-account.interface';
import collectionTypeReference from '../../../../reference/collection-type.reference';

@Injectable()
export class CollectionService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;
  @Inject() public tableHandlerService: TableHandlerService;
  @Inject() public fundAccountService: FundAccountService;

  async getCollection(id: string) {
    const collectionInformation = await this.prisma.collection.findUnique({
      where: { id: parseInt(id) },
    });

    if (!collectionInformation) {
      throw new NotFoundException('Collection not found.');
    }

    const formattedCollection = this.formatCollectionResponse(
      collectionInformation,
    );
    return formattedCollection;
  }

  async getCollectionAccomplishmentSummary(id: string) {
    const collectionInformation = await this.prisma.collection.findUnique({
      where: { id: parseInt(id) },
      include: { accomplishmentReference: true, project: true },
    });
    const projectInformation = collectionInformation.project;
    const accomplishmentInformation =
      collectionInformation.accomplishmentReference;
    const projectAmount = projectInformation.budget;
    const downpaymentAmount =
      projectAmount * (projectInformation.downpaymentAmount / 100);
    const retentionAmount =
      projectAmount * (projectInformation.retentionAmount / 100);
    const thisPeriodPercentage =
      accomplishmentInformation.percentage -
      accomplishmentInformation.previousPercentage;

    const collectionAccomplishmentSummary: CollectionAccomplishmentSummary = {
      id: collectionInformation.id,
      amount: collectionInformation.amount,
      amountPaid: collectionInformation.amountPaid,
      description: collectionInformation.description,
      collectionType: collectionInformation.type,
      billableAmount: collectionInformation.amount,
      collectedAmount: collectionInformation.amountPaid,
      projectDownpaymentPercentage: projectInformation.downpaymentAmount,
      projectRetentionFeePercentage: projectInformation.retentionAmount,
      outstandingBalance:
        collectionInformation.amount - collectionInformation.amountPaid,
      previous: {
        percentage: accomplishmentInformation.previousPercentage,
        amount:
          projectAmount * (accomplishmentInformation.previousPercentage / 100),
        downpaymentDeduction:
          downpaymentAmount *
          (accomplishmentInformation.previousPercentage / 100),
        retentionDeduction:
          retentionAmount *
          (accomplishmentInformation.previousPercentage / 100),
        subtotal:
          projectAmount * (accomplishmentInformation.previousPercentage / 100) -
          downpaymentAmount *
            (accomplishmentInformation.previousPercentage / 100) -
          retentionAmount *
            (accomplishmentInformation.previousPercentage / 100),
      },
      toDate: {
        percentage: accomplishmentInformation.percentage,
        amount: projectAmount * (accomplishmentInformation.percentage / 100),
        downpaymentDeduction:
          downpaymentAmount * (accomplishmentInformation.percentage / 100),
        retentionDeduction:
          retentionAmount * (accomplishmentInformation.percentage / 100),
        subtotal:
          projectAmount * (accomplishmentInformation.percentage / 100) -
          downpaymentAmount * (accomplishmentInformation.percentage / 100) -
          retentionAmount * (accomplishmentInformation.percentage / 100),
      },
      thisPeriod: {
        percentage: thisPeriodPercentage,
        amount: projectAmount * (thisPeriodPercentage / 100),
        downpaymentDeduction: downpaymentAmount * (thisPeriodPercentage / 100),
        retentionDeduction: retentionAmount * (thisPeriodPercentage / 100),
        subtotal:
          projectAmount * (thisPeriodPercentage / 100) -
          downpaymentAmount * (thisPeriodPercentage / 100) -
          retentionAmount * (thisPeriodPercentage / 100),
      },
    };

    const formattedcollectionAccomplishmentSummary =
      this.formatCollectionAccomplishmentSummaryResponse(
        collectionAccomplishmentSummary,
      );
    return formattedcollectionAccomplishmentSummary;
  }

  async table(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'collection');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['include'] = {
      createdBy: true,
      project: true,
      accomplishmentReference: { include: { reviewedBy: true } },
    };
    tableQuery['where'] = {
      ...tableQuery.where,
      companyId: this.utilityService.companyId,
    };
    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.collection,
      query,
      tableQuery,
    );
    const formattedList = baseList.map((collection) =>
      this.formatCollectionResponse(collection),
    );

    return { list: formattedList, pagination, currentPage };
  }

  async createUpdateCollection(params: CreateUpdateCollectionDTO) {
    // If collectionId is present, check if the collection exists
    if (params.collectionId) {
      const collection = await this.prisma.collection.findUnique({
        where: { id: params.collectionId },
      });

      if (!collection) {
        throw new NotFoundException('Collection not found.');
      }
    }

    const createCollectionParams: Prisma.CollectionCreateInput = {
      project: { connect: { id: params.projectId } },
      type: params.collectionType,
      amount: params.amount,
      description: params.description,
      createdBy: { connect: { id: this.utilityService.accountInformation.id } },
      accomplishmentReference: params.accomplishmentReferenceId
        ? { connect: { id: params.accomplishmentReferenceId } }
        : undefined,
      company: { connect: { id: this.utilityService.companyId } },
    };

    // Check if collectionId is present, if present update the collection, else create a new collection
    let response = null;

    if (params.collectionId) {
      response = await this.prisma.collection.update({
        where: { id: params.collectionId },
        data: createCollectionParams,
      });
    } else {
      response = await this.prisma.collection.create({
        data: createCollectionParams,
      });
    }

    await this.computeProjectCollections(params.projectId);

    const formattedResponse = this.formatCollectionResponse(response);
    return formattedResponse;
  }
  async computeProjectCollections(projectId: number) {
    const collection = await this.prisma.collection.findMany({
      where: { projectId },
    });
    const totalCollection = collection.reduce(
      (acc, curr) => acc + curr.amount,
      0,
    );
    const totalCollected = collection.reduce(
      (acc, curr) => acc + curr.amountPaid,
      0,
    );
    const totalCollectionBalance = totalCollection - totalCollected;

    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        totalCollection,
        totalCollected,
        totalCollectionBalance,
      },
    });

    const projectInformation = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (projectInformation) {
      await this.computeClientCollections(projectInformation.clientId);
    }
  }
  async computeClientCollections(clientId: number) {
    const projects = await this.prisma.project.findMany({
      where: { clientId },
    });
    const totalCollection = projects.reduce(
      (acc, curr) => acc + curr.totalCollection,
      0,
    );
    const totalCollected = projects.reduce(
      (acc, curr) => acc + curr.totalCollected,
      0,
    );
    const totalCollectionBalance = projects.reduce(
      (acc, curr) => acc + curr.totalCollectionBalance,
      0,
    );

    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        totalCollection,
        totalCollected,
        totalCollectionBalance,
      },
    });
  }
  async startCollection(params: StartCollectionDTO) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: params.id },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found.');
    }

    const response = await this.prisma.collection.update({
      where: { id: params.id },
      data: {
        isForReview: false,
      },
    });

    await this.computeProjectCollections(collection.projectId);

    const formattedResponse = this.formatCollectionResponse(response);
    return formattedResponse;
  }

  async receivePayment(params: ReceivePaymentDTO) {
    const collection = await this.prisma.collection.findUnique({
      where: { id: params.collectionId },
    });
    const fundAccount = await this.prisma.fundAccount.findUnique({
      where: { id: params.fundAccountId },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found.');
    }

    if (!fundAccount) {
      throw new NotFoundException('Fund account not found.');
    }

    const remainingBalance = collection.amount - collection.amountPaid;
    if (params.paymentAmount > remainingBalance) {
      throw new BadRequestException(
        'Payment amount exceeds the remaining balance.',
      );
    }

    // update collection
    await this.prisma.collection.update({
      where: { id: params.collectionId },
      data: {
        amountPaid: collection.amountPaid + params.paymentAmount,
      },
    });

    await this.computeProjectCollections(collection.projectId);

    const projectInformation = await this.prisma.project.findUnique({
      where: { id: collection.projectId },
    });

    // create transaction
    const transactionParams: CreateTransactionDTO = {
      fundAccountId: params.fundAccountId,
      amount: params.paymentAmount,
      memo: `Collection from Project ${projectInformation.name}`,
      type: FundTransactionType.ADD,
      code: FundTransactionCode.COLLECTION,
    };

    await this.fundAccountService._createTransaction(transactionParams);
  }

  /**
   * Formats a collection response according to the standard format
   */
  private formatCollectionResponse(collection: any): any {
    if (!collection) return null;

    return {
      id: collection.id,
      project: collection.project
        ? this.formatProjectResponse(collection.project)
        : null,
      description: collection.description,
      type: collectionTypeReference.find(
        (ref) => ref.key === collection.type,
      ) || { key: collection.type, label: collection.type },
      amount: this.utilityService.formatCurrency(collection.amount),
      amountPaid: this.utilityService.formatCurrency(collection.amountPaid),
      accomplishmentReference: collection.accomplishmentReference
        ? this.formatProjectAccomplishmentResponse(
            collection.accomplishmentReference,
          )
        : null,
      reviewedBy: collection.reviewedBy
        ? this.formatAccountResponse(collection.reviewedBy)
        : null,
      createdAt: this.utilityService.formatDate(collection.createdAt),
      updatedAt: this.utilityService.formatDate(collection.updatedAt),
    };
  }

  /**
   * Formats a collection accomplishment summary response
   */
  private formatCollectionAccomplishmentSummaryResponse(summary: any): any {
    if (!summary) return null;

    return {
      id: summary.id,
      project: summary.project
        ? this.formatProjectResponse(summary.project)
        : null,
      description: summary.description,
      collectionType: collectionTypeReference.find(
        (ref) => ref.key === summary.collectionType,
      ) || { key: summary.collectionType, label: summary.collectionType },
      amount: this.utilityService.formatCurrency(summary.amount),
      amountPaid: this.utilityService.formatCurrency(summary.amountPaid),
      previous: summary.previous
        ? this.formatCollectionAccomplishmentSummaryBreakdownResponse(
            summary.previous,
          )
        : null,
      toDate: summary.toDate
        ? this.formatCollectionAccomplishmentSummaryBreakdownResponse(
            summary.toDate,
          )
        : null,
      thisPeriod: summary.thisPeriod
        ? this.formatCollectionAccomplishmentSummaryBreakdownResponse(
            summary.thisPeriod,
          )
        : null,
      billableAmount: this.utilityService.formatCurrency(
        summary.billableAmount,
      ),
      collectedAmount: this.utilityService.formatCurrency(
        summary.collectedAmount,
      ),
      outstandingBalance: this.utilityService.formatCurrency(
        summary.outstandingBalance,
      ),
      projectDownpaymentPercentage: summary.projectDownpaymentPercentage,
      projectRetentionFeePercentage: summary.projectRetentionFeePercentage,
    };
  }

  /**
   * Formats a collection accomplishment summary breakdown response
   */
  private formatCollectionAccomplishmentSummaryBreakdownResponse(
    breakdown: any,
  ): any {
    if (!breakdown) return null;

    return {
      percentage: breakdown.percentage,
      amount: this.utilityService.formatCurrency(breakdown.amount),
      downpaymentDeduction: this.utilityService.formatCurrency(
        breakdown.downpaymentDeduction,
      ),
      retentionDeduction: this.utilityService.formatCurrency(
        breakdown.retentionDeduction,
      ),
      subtotal: this.utilityService.formatCurrency(breakdown.subtotal),
    };
  }

  /**
   * Formats a project response
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

  /**
   * Formats a project accomplishment response
   */
  private formatProjectAccomplishmentResponse(accomplishment: any): any {
    if (!accomplishment) return null;

    return {
      id: accomplishment.id,
      project: accomplishment.project,
      title: accomplishment.title,
      previousPercentage: accomplishment.previousPercentage,
      percentage: accomplishment.percentage,
      accomplishmentDate: this.utilityService.formatDate(
        accomplishment.accomplishmentDate,
      ),
      attachment: accomplishment.attachment,
      description: accomplishment.description,
      reviewedBy: accomplishment.reviewedBy,
      createdAt: this.utilityService.formatDate(accomplishment.createdAt),
      updatedAt: this.utilityService.formatDate(accomplishment.updatedAt),
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
}

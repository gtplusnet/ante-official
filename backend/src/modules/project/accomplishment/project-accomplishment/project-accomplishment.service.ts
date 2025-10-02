import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { CollectionType, Prisma, ProjectAccomplishment } from '@prisma/client';
import { UtilityService } from '@common/utility.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { UpdateWorkAccomplishmentDTO } from './project-accomplishment.interface';
import { CollectionService } from '@modules/finance/collection/collection/collection.service';
import { CreateUpdateCollectionDTO } from '@modules/finance/collection/collection/collection.interface';

@Injectable()
export class ProjectAccomplishmentService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;
  @Inject() public tableHandlerService: TableHandlerService;
  @Inject() public collectionService: CollectionService;

  async create(body: UpdateWorkAccomplishmentDTO) {
    const { projectId, accomplishmentDate, attachmentId } = body;
    let { title, percentage, description } = body;

    // Check if there is existing progress
    const existingProgress = await this.prisma.projectAccomplishment.findFirst({
      where: { projectId },
      orderBy: { percentage: 'desc' },
    });

    if (!existingProgress) {
      percentage = 0;
      title = 'Project Started';
      description = 'Project has started.';
    }

    // Check if the project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new BadRequestException('Project does not exist.');
    }

    if (percentage <= project.progressPercentage && existingProgress) {
      throw new BadRequestException(
        'Progress percentage should be greater than the current progress.',
      );
    }

    // Check if description is empty
    if (!description) {
      description = 'No description';
    }

    const createProjectAccomplishmentParams: Prisma.ProjectAccomplishmentCreateInput =
      {
        project: { connect: { id: projectId } },
        title,
        previousPercentage: existingProgress ? existingProgress.percentage : 0,
        percentage,
        reviewedBy: {
          connect: { id: this.utilityService.accountInformation.id },
        },
        accomplishmentDate: new Date(accomplishmentDate),
        description,
      };

    // Check if there is an attachment
    if (attachmentId) {
      createProjectAccomplishmentParams.attachment = {
        connect: { id: attachmentId },
      };
    }

    let projectAccomplishment = null;

    // Check if the body has an accomplishmentId property
    if (body.hasOwnProperty('accomplishmentId')) {
      const checkExist = await this.prisma.projectAccomplishment.findUnique({
        where: { id: body.accomplishmentId },
      });

      if (!checkExist) {
        throw new BadRequestException('Project accomplishment does not exist.');
      }

      projectAccomplishment = await this.prisma.projectAccomplishment.update({
        where: { id: body.accomplishmentId },
        data: createProjectAccomplishmentParams,
      });
    } else {
      projectAccomplishment = await this.prisma.projectAccomplishment.create({
        data: createProjectAccomplishmentParams,
      });
    }

    // Update project progress
    const projectResponse = await this.prisma.project.update({
      where: { id: projectId },
      data: { progressPercentage: percentage, isProjectStarted: true },
    });

    // Log project progress update
    this.utilityService.log(
      `Project progress updated: ${projectResponse.progressPercentage}% for project: ${projectResponse.name}`,
    );

    // Create collection based on progress
    if (!body.hasOwnProperty('accomplishmentId')) {
      await this.createCollectionBasedOnProgress(projectAccomplishment);
    }

    const formattedResponse = await this.formatProjectAccomplishmentResponse(
      projectAccomplishment,
    );
    return formattedResponse;
  }

  async createCollectionBasedOnProgress(
    projectAccomplishment: Prisma.ProjectAccomplishmentUncheckedCreateInput,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectAccomplishment.projectId },
    });
    const projectBudget = project.budget;
    const downpaymentPercetange = project.downpaymentAmount;
    const retentionPercentage = project.retentionAmount;
    const downpaymentAmount = (downpaymentPercetange * projectBudget) / 100;
    const retentionAmount = (retentionPercentage * projectBudget) / 100;

    const collectionParams: CreateUpdateCollectionDTO = {
      projectId: projectAccomplishment.projectId,
      description: projectAccomplishment.title,
      collectionType: CollectionType.PROGRESSIVE,
      amount: 0,
      accomplishmentReferenceId: projectAccomplishment.id,
    };

    if (
      projectAccomplishment.previousPercentage == 0 &&
      projectAccomplishment.percentage == 0
    ) {
      // Create collection for down payment
      collectionParams.collectionType = CollectionType.DOWNPAYMENT;
      const amount = downpaymentAmount;
      collectionParams.amount = amount;
    } else {
      // Create collection for progress billing
      collectionParams.collectionType = CollectionType.PROGRESSIVE;
      const progressPercentage =
        projectAccomplishment.percentage -
        projectAccomplishment.previousPercentage;
      const progressBudget =
        projectBudget - downpaymentAmount - retentionAmount;
      collectionParams.amount = (progressPercentage / 100) * progressBudget;
    }

    await this.collectionService.createUpdateCollection(collectionParams);

    // Create collection for retention
    if (projectAccomplishment.percentage == 100) {
      collectionParams.collectionType = CollectionType.RETENTION;
      collectionParams.amount = retentionAmount;
      await this.collectionService.createUpdateCollection(collectionParams);
    }
  }

  async table(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'projectAccomplishment');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['include'] = {
      project: true,
      attachment: true,
      reviewedBy: true,
    };
    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.projectAccomplishment,
      query,
      tableQuery,
    );
    const formattedList = await this.formatProjectAccomplishmentResponseList(
      baseList as ProjectAccomplishment[],
    );
    return { list: formattedList, pagination, currentPage };
  }

  async getLatestAccomplishment(projectId: number) {
    projectId = Number(projectId);
    const projectAccomplishment =
      await this.prisma.projectAccomplishment.findFirst({
        where: { projectId },
        orderBy: { percentage: 'desc' },
      });

    if (!projectAccomplishment) {
      return null;
    }

    const responseFormat = await this.formatProjectAccomplishmentResponse(
      projectAccomplishment,
    );
    return responseFormat;
  }
  async delete(id: number) {
    id = Number(id);
    const projectAccomplishment =
      await this.prisma.projectAccomplishment.findUnique({ where: { id } });

    if (!projectAccomplishment) {
      throw new BadRequestException('Project accomplishment does not exist.');
    }

    const latestAccomplishment = await this.getLatestAccomplishment(
      projectAccomplishment.projectId,
    );

    if (latestAccomplishment['id'] !== id) {
      throw new BadRequestException(
        'You can only delete the latest project accomplishment.',
      );
    }

    // Delete project progress
    this.utilityService.log(
      `Project accomplishment deleted: ${projectAccomplishment.title} for project: ${projectAccomplishment.projectId}`,
    );

    // Check if the project is started
    if (latestAccomplishment['percentage'] == 0) {
      await this.prisma.project.update({
        where: { id: projectAccomplishment.projectId },
        data: { isProjectStarted: false },
      });
    }

    await this.prisma.projectAccomplishment.delete({ where: { id } });
    return projectAccomplishment;
  }

  /**
   * Formats a project accomplishment response according to the standard format
   */
  private async formatProjectAccomplishmentResponse(
    accomplishment: any,
  ): Promise<any> {
    if (!accomplishment) return null;

    return {
      id: accomplishment.id,
      project: accomplishment.project
        ? await this.formatProjectResponse(accomplishment.project)
        : null,
      title: accomplishment.title,
      previousPercentage: accomplishment.previousPercentage,
      percentage: accomplishment.percentage,
      accomplishmentDate: this.utilityService.formatDate(
        accomplishment.accomplishmentDate,
      ),
      attachment: accomplishment.attachment
        ? this.formatFilesResponse(accomplishment.attachment)
        : null,
      description: accomplishment.description,
      reviewedBy: accomplishment.reviewedBy
        ? this.formatAccountResponse(accomplishment.reviewedBy)
        : null,
      createdAt: this.utilityService.formatDate(accomplishment.createdAt),
      updatedAt: this.utilityService.formatDate(accomplishment.updatedAt),
    };
  }

  /**
   * Formats a list of project accomplishment responses
   */
  private async formatProjectAccomplishmentResponseList(
    accomplishmentList: ProjectAccomplishment[],
  ): Promise<any[]> {
    if (!accomplishmentList || accomplishmentList.length === 0) return [];

    return Promise.all(
      accomplishmentList.map((accomplishment) =>
        this.formatProjectAccomplishmentResponse(accomplishment),
      ),
    );
  }

  /**
   * Formats a project response
   */
  private async formatProjectResponse(project: any): Promise<any> {
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
   * Formats a files response
   */
  private formatFilesResponse(file: any): any {
    if (!file) return null;

    return {
      id: file.id,
      name: file.name,
      type: file.type,
      url: file.url,
      size: this.utilityService.formatFileSize(file.size),
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
}

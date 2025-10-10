import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import initialBoqReference from '../../../../reference/initial-boq.reference';
import { Prisma, Project, ProjectStatus, WarehouseType } from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { BoqFormUpsertDTO } from '@modules/project/boq/boq/boq.dto';
import configReference from '../../../../reference/config.reference';
import { BillOfQuantity } from 'interfaces/billOfQuantity.interface';
import { BoqService } from '@modules/project/boq/boq/boq.service';
import projectBoardsReference from '../../../../reference/project-boards.reference';
import winProbabilityReference from '../../../../reference/win-probability.reference';
import { WarehouseService } from '@modules/inventory/warehouse/warehouse/warehouse.service';
import { WarehouseCreateDTO } from '../../../../dto/warehouse.validator';
import { BoqInsertData } from 'interfaces/boq/boqInsertData';
import {
  AccountDataResponse,
  ClientDataResponse,
  ProjectDataResponse,
  TableResponse,
} from '../../../../shared/response';
import { LocationService } from '@modules/location/location/location/location.service';
import { LocationDataResponse } from '../../../../shared/response/location.response';
import { CompanyService } from '@modules/company/company/company.service';
import {
  ProjectCreateDto,
  ProjectUpdateDto,
  ProjectDeleteAllDto,
  ProjectBoardDto,
  ProjectMoveDto,
} from '@modules/project/project/project/project.validator.dto';
import { BOQDataResponse } from '../../../../shared/response/boq.response';

@Injectable()
export class ProjectService {
  @Inject() private utilityService: UtilityService;
  @Inject() private prisma: PrismaService;
  @Inject() private tableHandlerService: TableHandlerService;
  @Inject() private billOfQuantityService: BoqService;
  @Inject() private warehouseService: WarehouseService;
  @Inject() private locationService: LocationService;
  @Inject() private companyService: CompanyService;

  async createProject(params: ProjectCreateDto) {
    const loggedInAccount: AccountDataResponse =
      this.utilityService.accountInformation;
    const createResponse = await this.createProjectRecord(
      params,
      loggedInAccount.company.id,
    );
    await this.createInitialBoq(createResponse);
    await this.createInitialWarehouse(createResponse);
    this.logProjectCreation(createResponse);
    const formattedResponse = await this.formatResponse(createResponse);
    return formattedResponse;
  }

  private async createProjectRecord(
    projectDto: ProjectCreateDto,
    companyId: number,
  ) {
    projectDto.clientId = Number(projectDto.clientId);

    const createProjectData: Prisma.ProjectCreateInput = {
      name: projectDto.name,
      description: projectDto.description,
      budget: projectDto.budget,
      client: { connect: { id: projectDto.clientId } },
      startDate: new Date(projectDto.startDate),
      endDate: new Date(projectDto.endDate),
      status: projectDto.status,
      isLead: projectDto.isLead ?? false,
      location: { connect: { id: projectDto.locationId } },
      downpaymentAmount: projectDto.downpaymentAmount ?? 0,
      retentionAmount: projectDto.retentionAmount ?? 0,
      company: { connect: { id: companyId } },
    };

    return this.prisma.project.create({ data: createProjectData });
  }

  private async createInitialBoq(project: Project) {
    const createBoqData: BoqFormUpsertDTO = {
      projectId: project.id,
      contractId: 'C' + project.id,
      subject: project.name,
      contractLocation: 'N/A',
      expirationDate: this.utilityService.currentDate(),
    };

    const boqInformation =
      await this.billOfQuantityService.createBoqForm(createBoqData);

    for (const boqItem of initialBoqReference) {
      const boqInsertData: BoqInsertData = {
        insertReferenceMethod: boqItem.insertReferenceMethod,
        insertReferenceId: boqItem.inserReferenceId,
        insertValue: {
          itemId: null,
          description: boqItem.description,
          materialUnitCost: 0,
          materialUnit: 'unit',
          quantity: 1,
          manPowerCost: 0,
          laborUnitCost: 0,
          laborPercentageCost: 0,
          profitMarginPercentage: 0,
          isQuantityTakeOffItem: false,
        },
      };

      await this.billOfQuantityService.addItem(
        boqInformation.id,
        boqInsertData,
      );
    }
  }

  private async createInitialWarehouse(project: Project) {
    const createWarehouseData: WarehouseCreateDTO = {
      name: `Project Warehouse (${project.name})`,
      locationId: project.locationId,
      projectId: project.id,
      capacity: 1000,
      warehouseType: WarehouseType.PROJECT_WAREHOUSE,
    };

    await this.warehouseService.createWarehouse(createWarehouseData);
  }

  private logProjectCreation(project: Project) {
    this.utilityService.log(
      `Project "${project.name}" has been created by ${this.utilityService.accountInformation.username}.`,
    );
  }

  async getProjectList() {
    const loggedInAccount: AccountDataResponse =
      this.utilityService.accountInformation;

    const projects = await this.prisma.project.findMany({
      where: {
        isDeleted: false,
        companyId: loggedInAccount.company.id,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return projects.map(project => ({
      label: project.name,
      value: project.id,
    }));
  }

  async projectBoard(query: ProjectBoardDto) {
    return query.isLead === 'true'
      ? this.getLeadBoard()
      : this.getProjectBoard();
  }

  private async getProjectBoard() {
    return this.getBoardData('project');
  }

  private async getLeadBoard() {
    return this.getBoardData('lead');
  }

  private async getBoardData(boardType: string) {
    const boards = projectBoardsReference.filter(
      (board) => board.boardType === boardType,
    );

    return Promise.all(
      boards.map(async (board) => {
        const projects = await this.prisma.project.findMany({
          where: {
            isDeleted: false,
            [`${boardType}BoardStage`]: board.boardKey,
          },
        });

        board['boardProjects'] = await Promise.all(
          projects.map((p) => this.formatResponse(p)),
        );
        return board;
      }),
    );
  }

  async projectTable(
    query: TableQueryDTO,
    body: TableBodyDTO,
  ): Promise<TableResponse<ProjectDataResponse>> {
    const loggedInAccount: AccountDataResponse =
      this.utilityService.accountInformation;

    this.tableHandlerService.initialize(query, body, 'project');
    const tableQuery = this.tableHandlerService.constructTableQuery();

    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['where'] = {
      ...tableQuery['where'],
      status: ProjectStatus.PROJECT,
      isDeleted: false,
      company: { id: loggedInAccount.company.id },
    };

    tableQuery['include'] = { client: true, boqs: true };

    const {
      list: baseList,
      currentPage,
      pagination,
      totalCount,
    } = await this.tableHandlerService.getTableData<Project>(
      this.prisma.project,
      query,
      tableQuery,
    );

    const list: ProjectDataResponse[] = await Promise.all(
      baseList.map(async (item: Project) => {
        const data: ProjectDataResponse = await this.formatResponse(item);
        return data;
      }),
    );

    return { list, pagination, currentPage, totalCount };
  }

  async getProjectInformationByID({ id }: { id: string }) {
    const intId = parseInt(id, 10);

    const projectInformation = await this.prisma.project.findFirst({
      where: { id: intId },
      include: { client: true, boqs: true },
    });

    if (!projectInformation) {
      throw new NotFoundException('Project not found');
    }

    const { contractIds } = this.processProjectBOQs(projectInformation.boqs);
    projectInformation['contractIds'] = contractIds ?? [];

    projectInformation['computedDate'] = this.calculateDaysRemaining(
      new Date(),
      new Date(projectInformation.startDate),
      new Date(projectInformation.endDate),
    );

    const response = await this.formatResponse(projectInformation);

    return response;
  }

  private calculateDaysRemaining(
    now: Date,
    startDate: Date,
    endDate: Date,
  ): string {
    const currentTime = now.getTime();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const totalDurationInDays = Math.ceil(
      (endTime - startTime) / (1000 * 60 * 60 * 24),
    );
    const remainingDurationInDays =
      currentTime < startTime
        ? totalDurationInDays
        : Math.ceil((endTime - currentTime) / (1000 * 60 * 60 * 24));

    if (currentTime >= endTime) return 'Project has ended';

    const formatDuration = (totalDays: number, remainingDays: number) =>
      totalDays < 30
        ? `${totalDays} days (${remainingDays} days remaining)`
        : `${Math.ceil(totalDays / 30)} months (${Math.ceil(remainingDays / 30)} months remaining)`;

    return formatDuration(totalDurationInDays, remainingDurationInDays);
  }

  private processProjectBOQs(billOfQuantities: BillOfQuantity[]) {
    if (!billOfQuantities || billOfQuantities.length === 0) {
      return { latestBoq: null, contractIds: [] };
    }

    const latestBoq = billOfQuantities.reduce((prev, current) =>
      prev.revision > current.revision ? prev : current,
    );

    const contractIds = [
      ...new Set(billOfQuantities.map((boq) => boq.contractId)),
    ];

    return { latestBoq, contractIds };
  }

  async updateProjectInformation(projectUpdateDto: ProjectUpdateDto) {
    const updateProjectData: Prisma.ProjectUpdateInput = {
      name: projectUpdateDto.name,
      description: projectUpdateDto.description,
      budget: projectUpdateDto.budget,
      startDate: new Date(projectUpdateDto.startDate),
      endDate: new Date(projectUpdateDto.endDate),
      downpaymentAmount: projectUpdateDto.downpaymentAmount ?? 0,
      retentionAmount: projectUpdateDto.retentionAmount ?? 0,
    };

    const updateResponse = await this.prisma.project.update({
      where: { id: Number(projectUpdateDto.id) },
      data: updateProjectData,
    });

    return this.formatResponse(updateResponse);
  }

  async updateProjectBoard(params: ProjectMoveDto) {
    const boardInformation = await this.prisma.project.findUnique({
      where: { id: Number(params.projectId) },
    });

    const board = projectBoardsReference.find(
      (b) => b.boardKey === params.nowBoardStageKey,
    );

    if (!boardInformation || !board) {
      throw new BadRequestException("Board can't be updated.");
    }

    const updateData =
      board.boardType === 'lead'
        ? { leadBoardStage: board.boardKey }
        : { projectBoardStage: board.boardKey };

    const updatedProject = await this.prisma.project.update({
      where: { id: Number(params.projectId) },
      data: updateData,
    });

    // Return the updated project, not the old one
    return this.formatResponse(updatedProject);
  }

  async deleteProject(projectId: number) {
    projectId = Number(projectId);

    if (!projectId) {
      throw new BadRequestException('Project ID is required.');
    }

    const projectInformation = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!projectInformation) {
      throw new NotFoundException({
        message: 'Project not found',
        details: `Project with ID ${projectId} does not exist. Please create it first or provide a valid project ID.`,
        errorCode: 'PROJECT_NOT_FOUND',
      });
    }

    const deleteResponse = await this.prisma.project.update({
      where: { id: projectId },
      data: { isDeleted: true },
    });

    return this.formatResponse(deleteResponse);
  }

  async deleteAllProject(projectDeleteDto: ProjectDeleteAllDto) {
    if (projectDeleteDto.password !== configReference.default_password) {
      throw new BadRequestException(
        'Invalid password provided for project deletion.',
      );
    }

    const deleteResponse = await this.prisma.project.updateMany({
      where: {},
      data: { isDeleted: true },
    });

    return deleteResponse;
  }

  async checkIfProjectExists(projectId: number): Promise<boolean> {
    const projectInformation = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    return !!projectInformation;
  }

  async fetchProjectInformation(projectId: number) {
    return this.prisma.project.findUnique({ where: { id: projectId } });
  }

  async validateProjectId(projectId: number): Promise<void> {
    const projectInformation = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!projectInformation) {
      throw new NotFoundException({
        message: 'Project not found',
        details: `Project with ID ${projectId} does not exist. Please create it first or provide a valid project ID.`,
        errorCode: 'PROJECT_NOT_FOUND',
      });
    }
  }
  async formatResponse(project: Project): Promise<ProjectDataResponse> {
    let location: LocationDataResponse = null;

    try {
      // Try to get the location, but handle the case where it might not be found
      if (project.locationId) {
        location = await this.locationService.getLocationById(
          project.locationId,
        );
      }
    } catch (error) {
      // If location is not found (e.g., deleted or from different company),
      // we'll continue with null location instead of throwing an error
      console.warn(
        `Location with id ${project.locationId} not found for project ${project.id}: ${project.name}`,
      );
    }

    const client = {} as ClientDataResponse;
    const company = await this.companyService.getInformation(project.companyId);
    const latestBoq: BOQDataResponse =
      await this.billOfQuantityService.getLatestBoqOfProject(project.id);

    const response: ProjectDataResponse = {
      id: project.id,
      name: project.name,
      description: project.description,
      budget: this.utilityService.formatCurrency(project.budget),
      isDeleted: project.isDeleted,
      startDate: this.utilityService.formatDate(project.startDate),
      endDate: this.utilityService.formatDate(project.endDate),
      status: project.status,
      isLead: project.isLead,
      location,
      client,
      company,
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
      winProbability: project.winProbability
        ? winProbabilityReference.find(
            (w) => w.key === project.winProbability,
          ) || { key: project.winProbability, label: project.winProbability }
        : null,
      latestBoq,
      computedDate: this.calculateDaysRemaining(
        new Date(),
        new Date(project.startDate),
        new Date(project.endDate),
      ),
      // Include board stage fields
      projectBoardStage: project.projectBoardStage,
      leadBoardStage: project.leadBoardStage,
    };

    return response;
  }

  private async formatResponseList(
    projects: Project[],
  ): Promise<ProjectDataResponse[]> {
    return Promise.all(projects.map((project) => this.formatResponse(project)));
  }
}

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  Prisma,
  ProjectStatus,
  LeadDealStatus,
  WinProbability,
} from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import {
  AccountDataResponse,
  ClientDataResponse,
  TableResponse,
  LeadDataResponse,
  CompanyDataResponse,
  BOQDataResponse,
} from '../../../../shared/response';
import { LocationService } from '@modules/location/location/location/location.service';
import { CompanyService } from '@modules/company/company/company.service';
import { ProjectDeleteAllDto } from '@modules/project/project/project/project.validator.dto';
import {
  LeadCreateDto,
  LeadUpdateDto,
  LeadMoveDto,
} from './lead.validator.dto';

@Injectable()
export class LeadService {
  @Inject() private utilityService: UtilityService;
  @Inject() private prisma: PrismaService;
  @Inject() private tableHandlerService: TableHandlerService;
  @Inject() private locationService: LocationService;
  @Inject() private companyService: CompanyService;

  async createLead(params: LeadCreateDto) {
    const loggedInAccount: AccountDataResponse =
      this.utilityService.accountInformation;

    const startDate = new Date();
    const closeDate = this.getEndOfMonth(new Date(params.endDate));

    if (closeDate < startDate) {
      throw new BadRequestException(
        `Close date (end of month) must be greater than or equal to current date. ` +
          `Current date: ${startDate.toDateString()}, ` +
          `Close date (end of month): ${closeDate.toDateString()}`,
      );
    }

    // Map board stage to status if provided, otherwise default to OPPORTUNITY
    let status: LeadDealStatus = LeadDealStatus.OPPORTUNITY;
    if (params.leadBoardStage) {
      status = this.mapBoardStageToStatus(params.leadBoardStage);
    }

    // Map LeadCreateDto to LeadDeal creation data
    const leadDealData = {
      dealName: params.name,
      dealTypeId: params.leadType ? parseInt(params.leadType) : null,
      approvedBudgetContract: params.abc || params.budget || 0,
      monthlyRecurringRevenue: params.mmr || 0,
      implementationFee: 0,
      totalContract: params.initialCosting || 0,
      closeDate: closeDate,
      winProbability: params.winProbability || 50, // Direct number, default 50%
      locationId: params.locationId,
      dealSourceId: params.leadSource ? parseInt(params.leadSource) : null,
      relationshipOwnerId:
        params.relationshipOwnerId ||
        params.personInChargeId ||
        loggedInAccount.id,
      pointOfContactId: params.clientId || null,
      status: status,
      companyId: loggedInAccount.company.id,
      createdById: loggedInAccount.id,
      isDeleted: false,
    };

    const leadDeal = await this.prisma.leadDeal.create({
      data: leadDealData,
      include: {
        dealType: true,
        dealSource: true,
        location: true,
        relationshipOwner: true,
        pointOfContact: true,
        company: true,
      },
    });

    this.logLeadCreation(leadDeal);
    return this.formatLeadDealAsProject(leadDeal);
  }

  private logLeadCreation(lead: any) {
    this.utilityService.log(
      `Lead "${lead.dealName || lead.name}" has been created by ${this.utilityService.accountInformation.username}.`,
    );
  }

  private mapBoardStageToStatus(boardStage: string): LeadDealStatus {
    const stageMap: { [key: string]: LeadDealStatus } = {
      'prospect': LeadDealStatus.OPPORTUNITY,
      'initial_meeting': LeadDealStatus.CONTACTED,
      'technical_meeting': LeadDealStatus.TECHNICAL_MEETING,
      'proposal': LeadDealStatus.PROPOSAL,
      'in_negotiation': LeadDealStatus.IN_NEGOTIATION,
      'won': LeadDealStatus.WIN,
      'loss': LeadDealStatus.LOST,
    };

    return stageMap[boardStage] || LeadDealStatus.OPPORTUNITY;
  }

  async leadBoard() {
    return this.getLeadBoard();
  }

  private async getLeadBoard() {
    return this.getBoardData();
  }

  private async getBoardData() {
    // Define lead board stages based on LeadDealStatus
    const leadBoards = [
      {
        boardKey: 'prospect',
        boardName: 'Prospect',
        boardType: 'lead',
        status: LeadDealStatus.OPPORTUNITY,
        boardOrder: 1,
      },
      {
        boardKey: 'initial_meeting',
        boardName: 'Initial Meeting',
        boardType: 'lead',
        status: LeadDealStatus.CONTACTED,
        boardOrder: 2,
      },
      {
        boardKey: 'technical_meeting',
        boardName: 'Technical Meeting',
        boardType: 'lead',
        status: LeadDealStatus.TECHNICAL_MEETING,
        boardOrder: 3,
      },
      {
        boardKey: 'proposal',
        boardName: 'Proposal',
        boardType: 'lead',
        status: LeadDealStatus.PROPOSAL,
        boardOrder: 4,
      },
      {
        boardKey: 'in_negotiation',
        boardName: 'In-negotiation',
        boardType: 'lead',
        status: LeadDealStatus.IN_NEGOTIATION,
        boardOrder: 5,
      },
      {
        boardKey: 'won',
        boardName: 'Won',
        boardType: 'lead',
        status: LeadDealStatus.WIN,
        boardOrder: 6,
      },
      {
        boardKey: 'loss',
        boardName: 'Loss',
        boardType: 'lead',
        status: LeadDealStatus.LOST,
        boardOrder: 7,
      },
    ];

    return Promise.all(
      leadBoards.map(async (board) => {
        const leads = await this.prisma.leadDeal.findMany({
          where: {
            status: board.status,
            companyId: this.utilityService.companyId,
            isDeleted: false, // Don't show archived leads on board
          },
          include: {
            dealType: true,
            dealSource: true,
            location: true,
            relationshipOwner: true,
            pointOfContact: true,
            company: true,
          },
        });

        // Format each lead using formatLeadDealAsProject
        const formattedLeads = await Promise.all(
          leads.map(async (lead) => {
            return await this.formatLeadDealAsProject(lead);
          }),
        );

        return {
          boardKey: board.boardKey,
          boardName: board.boardName,
          boardType: board.boardType,
          boardOrder: board.boardOrder,
          boardProjects: formattedLeads,
        };
      }),
    );
  }

  async leadTable(
    query: TableQueryDTO,
    body: TableBodyDTO,
  ): Promise<TableResponse<LeadDataResponse>> {
    const loggedInAccount: AccountDataResponse =
      this.utilityService.accountInformation;

    // Build where clause for LeadDeal filtering
    const where = {
      companyId: loggedInAccount.company.id,
      isDeleted: false, // Only show non-archived leads
    };

    // Add search functionality if needed
    if (body.searchBy) {
      where['OR'] = [
        {
          dealName: {
            contains: body.searchBy,
            mode: 'insensitive',
          },
        },
        {
          pointOfContact: {
            fullName: {
              contains: body.searchBy,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const [leads, totalCount] = await Promise.all([
      this.prisma.leadDeal.findMany({
        where,
        include: {
          dealType: true,
          dealSource: true,
          location: true,
          relationshipOwner: true,
          pointOfContact: true,
          company: true,
        },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.leadDeal.count({ where }),
    ]);

    const list: LeadDataResponse[] = await Promise.all(
      leads.map(async (lead) => {
        return await this.formatLeadDealAsProject(lead);
      }),
    );

    // Generate pagination array using tableHandlerService
    const pagination: number[] = this.tableHandlerService.paginate(
      totalCount,
      query.perPage,
      2, // siblingsPage default
      query.page,
    );

    return {
      list,
      pagination,
      currentPage: query.page,
      totalCount,
    };
  }

  async getLeadInformationByID({ id }: { id: string }) {
    const intId = parseInt(id, 10);

    const leadInformation = await this.prisma.leadDeal.findFirst({
      where: {
        id: intId,
        companyId: this.utilityService.companyId,
        // Don't filter by isDeleted here - allow viewing archived leads
      },
      include: {
        dealType: true,
        dealSource: true,
        location: true,
        relationshipOwner: true,
        pointOfContact: true,
        company: true,
      },
    });

    if (!leadInformation) {
      throw new NotFoundException('Lead not found');
    }

    return this.formatLeadDealAsProject(leadInformation);
  }

  async updateLeadInformation(params: LeadUpdateDto) {
    const leadId = parseInt(params.id.toString(), 10);

    const lead = await this.prisma.leadDeal.findFirst({
      where: {
        id: leadId,
        companyId: this.utilityService.companyId,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Map ProjectUpdateDto to LeadDeal update data
    const updateData: any = {};

    if (params.name) updateData.dealName = params.name;
    if (params.leadType) updateData.dealTypeId = parseInt(params.leadType);
    if (params.abc !== undefined)
      updateData.approvedBudgetContract = params.abc;
    if (params.budget !== undefined && params.abc === undefined)
      updateData.approvedBudgetContract = params.budget;
    if (params.mmr !== undefined)
      updateData.monthlyRecurringRevenue = params.mmr;
    if (params.initialCosting !== undefined)
      updateData.totalContract = params.initialCosting;
    // Handle date updates
    if (params.endDate) {
      updateData.closeDate = this.getEndOfMonth(new Date(params.endDate));
    }
    if (params.winProbability !== undefined)
      updateData.winProbability = params.winProbability; // Direct number assignment
    if (params.leadSource)
      updateData.dealSourceId = parseInt(params.leadSource);
    if (params.relationshipOwnerId)
      updateData.relationshipOwnerId = params.relationshipOwnerId;
    if (params.personInChargeId)
      updateData.relationshipOwnerId = params.personInChargeId;

    const updatedLead = await this.prisma.leadDeal.update({
      where: { id: leadId },
      data: updateData,
      include: {
        dealType: true,
        dealSource: true,
        location: true,
        relationshipOwner: true,
        pointOfContact: true,
        company: true,
      },
    });

    return this.formatLeadDealAsProject(updatedLead);
  }

  async deleteLead(leadId: number) {
    const lead = await this.prisma.leadDeal.findFirst({
      where: {
        id: leadId,
        companyId: this.utilityService.companyId,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const archivedLead = await this.prisma.leadDeal.update({
      where: { id: leadId },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      },
      include: {
        dealType: true,
        dealSource: true,
        location: true,
        relationshipOwner: true,
        pointOfContact: true,
        company: true,
      },
    });

    return this.formatLeadDealAsProject(archivedLead);
  }

  async deleteAllLeads(params: ProjectDeleteAllDto) {
    // Parse IDs from params assuming they're strings
    const ids = Array.isArray(params)
      ? params.map((id) => parseInt(id.toString(), 10))
      : [];

    const archivedLeads = await this.prisma.leadDeal.updateMany({
      where: {
        id: { in: ids },
        companyId: this.utilityService.companyId,
      },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    });

    if (archivedLeads.count === 0) {
      throw new NotFoundException('No leads found');
    }

    return { message: `${archivedLeads.count} leads archived successfully` };
  }

  async moveLead(params: LeadMoveDto) {
    const leadId = parseInt(params.projectId, 10);
    const lead = await this.prisma.leadDeal.findFirst({
      where: {
        id: leadId,
        companyId: this.utilityService.companyId,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Extract the board stage from params or use default
    const boardStage =
      typeof params === 'object' && params !== null
        ? (params as any).boardKey || 'opportunity'
        : 'opportunity';

    // Map board stage to LeadDealStatus
    const newStatus = this.mapBoardStageToLeadDealStatus(boardStage);

    const updatedLead = await this.prisma.leadDeal.update({
      where: { id: leadId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
      include: {
        dealType: true,
        dealSource: true,
        location: true,
        relationshipOwner: true,
        pointOfContact: true,
        company: true,
      },
    });

    return this.formatLeadDealAsProject(updatedLead);
  }

  async convertLeadToProject(leadId: number) {
    const leadDeal = await this.prisma.leadDeal.findFirst({
      where: {
        id: leadId,
        companyId: this.utilityService.companyId,
      },
      include: {
        dealType: true,
        dealSource: true,
        location: true,
        relationshipOwner: true,
        pointOfContact: true,
        company: true,
      },
    });

    if (!leadDeal) {
      throw new NotFoundException('Lead not found');
    }

    // Create a new Project based on the LeadDeal data
    const projectData: Prisma.ProjectCreateInput = {
      name: leadDeal.dealName,
      description: `Converted from Lead: ${leadDeal.dealName}`,
      budget: leadDeal.approvedBudgetContract || 0,
      client: leadDeal.pointOfContactId
        ? { connect: { id: leadDeal.pointOfContactId } }
        : undefined,
      startDate: new Date(),
      endDate: leadDeal.closeDate,
      status: ProjectStatus.PROJECT,
      isLead: false,
      projectBoardStage: 'planning', // Default project board stage
      location: leadDeal.locationId
        ? { connect: { id: leadDeal.locationId } }
        : undefined,
      downpaymentAmount: 0,
      retentionAmount: 0,
      company: { connect: { id: leadDeal.companyId } },
      winProbability: this.mapIntegerToWinProbabilityEnum(
        leadDeal.winProbability,
      ),
      personInCharge: leadDeal.relationshipOwnerId
        ? { connect: { id: leadDeal.relationshipOwnerId } }
        : { connect: { id: leadDeal.createdById } },
    };

    // Create the new project
    const convertedProject = await this.prisma.project.create({
      data: projectData,
      include: {
        client: true,
        personInCharge: true,
        location: true,
        company: true,
      },
    });

    // Mark the original lead as converted/won
    await this.prisma.leadDeal.update({
      where: { id: leadId },
      data: {
        status: LeadDealStatus.WIN,
        updatedAt: new Date(),
      },
    });

    return this.formatResponse(convertedProject);
  }

  private async formatResponse(item: any): Promise<LeadDataResponse> {
    // Using any type to handle different Project schema interpretations
    // In a real implementation, you'd define a proper interface that includes all fields
    const clientData = item.client
      ? ({
          id: item.client.id,
          name: item.client.name,
          email: item.client.email,
        } as ClientDataResponse)
      : null;

    const personInChargeData = item.personInCharge
      ? ({
          id: item.personInCharge.id,
          username: item.personInCharge.username,
          firstName: item.personInCharge.firstName,
          lastName: item.personInCharge.lastName,
          email: item.personInCharge.email,
        } as AccountDataResponse)
      : null;

    // Format win probability with label
    const winProbabilityData = this.formatWinProbability(item.winProbability);

    // Format lead type with label
    const leadTypeData = this.formatLeadType(item.leadType);

    const response: LeadDataResponse = {
      id: item.id,
      name: item.name,
      description: item.description,
      budget: this.utilityService.formatCurrency(item.budget),
      client: clientData,
      clientId: item.clientId,
      startDate: this.utilityService.formatDate(item.startDate),
      endDate: this.utilityService.formatDate(item.endDate),
      status: item.status,
      isDeleted: item.isDeleted,
      isLead: item.isLead,
      // Include board stage data
      leadBoardStage: item.leadBoardStage,
      createdAt: this.utilityService.formatDate(item.createdAt),
      totalCollection: this.utilityService.formatCurrency(item.totalCollection),
      totalCollectionBalance: this.utilityService.formatCurrency(
        item.totalCollectionBalance,
      ),
      totalCollected: this.utilityService.formatCurrency(item.totalCollected),
      progressPercentage: item.progressPercentage,
      locationId: item.locationId,
      location: await this.getLocationInformation(item.locationId),
      downpaymentAmount: this.utilityService.formatCurrency(
        item.downpaymentAmount,
      ),
      retentionAmount: this.utilityService.formatCurrency(item.retentionAmount),
      winProbability: winProbabilityData,
      personInCharge: personInChargeData,
      personInChargeId: item.personInChargeId,
      company: item.company || ({} as CompanyDataResponse),
      isProjectStarted: item.isProjectStarted || false,
      latestBoq: item.latestBoq || ({} as BOQDataResponse),
      computedDate: item.computedDate || '',
      // Lead-specific fields
      abc: this.utilityService.formatCurrency(item.abc || 0),
      mmr: this.utilityService.formatCurrency(item.mmr || 0),
      initialCosting: this.utilityService.formatCurrency(
        item.initialCosting || 0,
      ),
      contactDetails: item.contactDetails || '',
      relationshipOwnerId: item.relationshipOwnerId || '',
      leadSource: item.leadSource || '',
      leadType: leadTypeData,
      clientEmailAddress: item.clientEmailAddress || item.client?.email || '',
    };

    return response;
  }

  private async formatClient(client: any): Promise<any | null> {
    if (!client) return null;

    // Using any type temporarily to avoid TypeScript errors
    // This simplifies the client data to include just essential fields
    return {
      id: client.id,
      name: client.name,
      email: client.email || '',
      isDeleted: client.isDeleted || false,
    };
  }

  private async getLocationInformation(locationId: string | number) {
    if (!locationId) return null;

    try {
      // Use the locationService which handles the type conversion internally
      return await this.locationService.getLocationById(locationId.toString());
    } catch (error) {
      return null;
    }
  }

  private formatWinProbability(winProbability: string | null | undefined) {
    if (!winProbability) {
      return {
        key: 'UNKNOWN',
        label: 'Unknown - Not Yet Assessed',
        description: 'Probability has not yet been assessed or is unclear',
      };
    }

    const winProbabilityMap: Record<
      string,
      { label: string; description: string }
    > = {
      UNKNOWN: {
        label: 'Unknown - Not Yet Assessed',
        description: 'Probability has not yet been assessed or is unclear',
      },
      VERY_HIGH: {
        label: 'Very High',
        description:
          'Exceptional fit, contract in final review, all stakeholders aligned',
      },
      HIGH: {
        label: 'High',
        description: 'Strong fit, budget approved, decision maker engaged',
      },
      MEDIUM: {
        label: 'Medium',
        description:
          'Good fit, budget discussion started, multiple stakeholders involved',
      },
      LOW: {
        label: 'Low',
        description: 'Early stage, needs qualification, budget not confirmed',
      },
      VERY_LOW: {
        label: 'Very Low',
        description: 'Initial contact, unqualified, or poor fit',
      },
    };

    const data = winProbabilityMap[winProbability] || winProbabilityMap.UNKNOWN;

    return {
      key: winProbability,
      label: data.label,
      description: data.description,
    };
  }

  private formatLeadType(
    leadType: string | null | undefined,
  ): { key: string; label: string } | undefined {
    if (!leadType) {
      return undefined;
    }

    const leadTypeMap: Record<string, string> = {
      CONSTRUCTION: 'Construction',
      SAAS: 'SaaS',
      BPO: 'BPO',
      SAAS_BPO: 'SaaS + BPO',
      CONSULTING: 'Consulting',
      RETAIL: 'Retail',
      MANUFACTURING: 'Manufacturing',
      HEALTHCARE: 'Healthcare',
      EDUCATION: 'Education',
      FINANCE: 'Finance',
      REAL_ESTATE: 'Real Estate',
      OTHER: 'Other',
    };

    const label = leadTypeMap[leadType] || leadType;

    return {
      key: leadType,
      label: label,
    };
  }

  async getEmployeeSelectList(query: any) {
    // First, get all active relationship owners to exclude them
    const activeRelationshipOwners =
      await this.prisma.leadRelationshipOwner.findMany({
        where: {
          isActive: true,
        },
        select: {
          accountId: true,
        },
      });

    const excludeAccountIds = activeRelationshipOwners.map(
      (owner) => owner.accountId,
    );

    // Build where clause for filtering
    const where: any = {
      isActive: true,
    };

    // Build account filters (starting with company filter)
    const accountFilters: any = {
      companyId: this.utilityService.companyId,
    };

    // Exclude accounts that are already active relationship owners
    if (excludeAccountIds.length > 0) {
      accountFilters.id = {
        notIn: excludeAccountIds,
      };
    }

    // Add role filter if provided
    if (query?.role && query.role !== 'all') {
      accountFilters.role = {
        name: {
          contains: query.role,
          mode: 'insensitive',
        },
      };
    }

    // Apply account filters
    where.account = accountFilters;

    // Add search filter if provided
    if (query?.search) {
      const searchConditions = [
        {
          employeeCode: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          account: {
            ...accountFilters,
            firstName: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        },
        {
          account: {
            ...accountFilters,
            lastName: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        },
      ];

      if (Object.keys(accountFilters).length > 0) {
        // If we have account filters, we need to combine them with search using AND
        where.AND = [{ account: accountFilters }, { OR: searchConditions }];
        delete where.account; // Remove the direct account filter since it's in AND clause
      } else {
        where.OR = searchConditions;
      }
    }

    // Add branch filter if provided
    if (query?.branch) {
      const branchIds = query.branch.split(',').map((id) => parseInt(id));
      where.branchId = {
        in: branchIds,
      };
    }

    // Add employment status filter if provided
    if (query?.employmentStatus && query.employmentStatus !== 'all') {
      where.activeContract = {
        employmentStatus: query.employmentStatus.toUpperCase(),
      };
    }

    // Fetch employees with their account details
    const employees = await this.prisma.employeeData.findMany({
      where,
      include: {
        account: {
          include: {
            role: true,
          },
        },
        branch: true,
        activeContract: true,
      },
      orderBy: {
        employeeCode: 'asc',
      },
    });

    // Transform data to match ManpowerSelectMultipleEmployeeDialog format
    const formattedEmployees = employees.map((employee) => ({
      employeeCode: employee.employeeCode || `EMP${employee.accountId}`,
      accountDetails: {
        id: employee.account.id,
        fullName: `${employee.account.firstName} ${employee.account.lastName}`,
        firstName: employee.account.firstName,
        lastName: employee.account.lastName,
        email: employee.account.email,
        role: {
          name: employee.account.role?.name || 'Employee',
        },
      },
      branchId: employee.branchId,
      branch: employee.branch,
      employmentStatus: employee.activeContract?.employmentStatus,
      isActive: employee.isActive,
    }));

    return formattedEmployees;
  }

  // Helper function to format LeadDeal as LeadDataResponse for frontend compatibility
  private async formatLeadDealAsProject(
    leadDeal: any,
  ): Promise<LeadDataResponse> {
    // Map LeadDeal to LeadDataResponse structure
    const clientData = leadDeal.pointOfContact
      ? ({
          id: leadDeal.pointOfContact.id,
          name: leadDeal.pointOfContact.fullName,
          email: leadDeal.pointOfContact.email,
        } as ClientDataResponse)
      : null;

    const relationshipOwnerData = leadDeal.relationshipOwner
      ? ({
          id: leadDeal.relationshipOwner.id,
          username: leadDeal.relationshipOwner.username,
          firstName: leadDeal.relationshipOwner.firstName,
          lastName: leadDeal.relationshipOwner.lastName,
          email: leadDeal.relationshipOwner.email,
        } as AccountDataResponse)
      : null;

    // Format winProbability as percentage display
    const winProbabilityData = {
      key: leadDeal.winProbability?.toString() || '50',
      label: `${leadDeal.winProbability || 50}%`,
      description: `Win probability: ${leadDeal.winProbability || 50}%`,
    };

    // Map deal type and source to string format for compatibility
    const leadTypeData = leadDeal.dealType
      ? {
          key: leadDeal.dealType.id.toString(),
          label: leadDeal.dealType.typeName,
        }
      : undefined;

    const response: LeadDataResponse = {
      id: leadDeal.id,
      name: leadDeal.dealName,
      description: leadDeal.dealName
        ? `Lead Deal - ${leadDeal.dealName}`
        : 'Lead Deal',
      budget: this.utilityService.formatCurrency(
        leadDeal.approvedBudgetContract || 0,
      ),
      client: clientData,
      clientId: leadDeal.pointOfContactId,
      startDate: this.utilityService.formatDate(new Date()), // Default to current date
      endDate: this.utilityService.formatDate(leadDeal.closeDate),
      status: 'LEAD' as any, // Keep as LEAD for frontend compatibility
      isDeleted: leadDeal.isDeleted || false,
      isLead: true,
      leadBoardStage: this.mapLeadDealStatusToBoardStage(leadDeal.status),
      createdAt: this.utilityService.formatDate(leadDeal.createdAt),
      updatedAt: this.utilityService.formatDate(leadDeal.updatedAt),
      locationId: leadDeal.locationId,
      location: leadDeal.location
        ? await this.getLocationInformation(leadDeal.locationId)
        : null,
      winProbability: winProbabilityData,
      personInCharge: relationshipOwnerData,
      personInChargeId: leadDeal.relationshipOwnerId,
      company: leadDeal.company || ({} as CompanyDataResponse),

      // Lead-specific fields mapped from LeadDeal
      abc: this.utilityService.formatCurrency(
        leadDeal.approvedBudgetContract || 0,
      ),
      mmr: this.utilityService.formatCurrency(
        leadDeal.monthlyRecurringRevenue || 0,
      ),
      initialCosting: this.utilityService.formatCurrency(
        leadDeal.totalContract || 0,
      ),
      contactDetails: '', // Not available in LeadDeal, keeping empty for compatibility
      relationshipOwnerId: leadDeal.relationshipOwnerId || '',
      leadSource: leadDeal.dealSourceId?.toString() || '',
      leadType: leadTypeData,
      clientEmailAddress: leadDeal.pointOfContact?.email || '',

      // Default values for compatibility
      totalCollection: this.utilityService.formatCurrency(0),
      totalCollectionBalance: this.utilityService.formatCurrency(0),
      totalCollected: this.utilityService.formatCurrency(0),
      progressPercentage: 0,
      downpaymentAmount: this.utilityService.formatCurrency(0),
      retentionAmount: this.utilityService.formatCurrency(0),
      isProjectStarted: false,
      latestBoq: {} as BOQDataResponse,
      computedDate: '',
    };

    return response;
  }

  // Helper to map LeadDealStatus to board stage string
  private mapLeadDealStatusToBoardStage(status: LeadDealStatus): string {
    const statusMap = {
      [LeadDealStatus.OPPORTUNITY]: 'prospect',
      [LeadDealStatus.CONTACTED]: 'initial_meeting',
      [LeadDealStatus.TECHNICAL_MEETING]: 'technical_meeting',
      [LeadDealStatus.PROPOSAL]: 'proposal',
      [LeadDealStatus.IN_NEGOTIATION]: 'in_negotiation',
      [LeadDealStatus.WIN]: 'won',
      [LeadDealStatus.LOST]: 'loss',
    };
    return statusMap[status] || 'prospect';
  }

  // Helper to map board stage string to LeadDealStatus
  private mapBoardStageToLeadDealStatus(boardStage: string): LeadDealStatus {
    const stageMap = {
      prospect: LeadDealStatus.OPPORTUNITY,
      initial_meeting: LeadDealStatus.CONTACTED,
      technical_meeting: LeadDealStatus.TECHNICAL_MEETING,
      proposal: LeadDealStatus.PROPOSAL,
      in_negotiation: LeadDealStatus.IN_NEGOTIATION,
      won: LeadDealStatus.WIN,
      loss: LeadDealStatus.LOST,
    };
    return stageMap[boardStage] || LeadDealStatus.OPPORTUNITY;
  }

  // Helper to convert integer percentage to WinProbability enum
  private mapIntegerToWinProbabilityEnum(
    percentage: number | null,
  ): WinProbability {
    if (percentage === null || percentage === undefined) {
      return WinProbability.UNKNOWN;
    }

    // Map percentage ranges to enum values
    if (percentage >= 90) return WinProbability.VERY_HIGH;
    if (percentage >= 70) return WinProbability.HIGH;
    if (percentage >= 40) return WinProbability.MEDIUM;
    if (percentage >= 20) return WinProbability.LOW;
    return WinProbability.VERY_LOW;
  }

  // Helper to get the last day of the month for a given date
  private getEndOfMonth(date: Date): Date {
    const year = date.getFullYear();
    const month = date.getMonth();
    // Setting day to 0 of next month gives us the last day of current month
    return new Date(year, month + 1, 0, 23, 59, 59, 999);
  }

  /**
   * Get dashboard counters for leads/CRM
   */
  async getLeadDashboardCounters() {
    const companyId = this.utilityService.companyId;

    // Base where clause for active deals
    const activeDealsWhere = {
      companyId,
      isDeleted: false,
      status: {
        notIn: [LeadDealStatus.WIN, LeadDealStatus.LOST],
      },
    };

    // Count active deals in pipeline (excluding WIN and LOST)
    const activeDealsCount = await this.prisma.leadDeal.count({
      where: activeDealsWhere,
    });

    // Count total opportunities
    const opportunitiesCount = await this.prisma.leadDeal.count({
      where: {
        companyId,
        isDeleted: false,
        status: LeadDealStatus.OPPORTUNITY,
      },
    });

    // Get all active deals for aggregation
    const activeDeals = await this.prisma.leadDeal.findMany({
      where: activeDealsWhere,
      select: {
        monthlyRecurringRevenue: true,
        totalContract: true,
      },
    });

    // Calculate totals
    const totalMMR = activeDeals.reduce(
      (sum, deal) => sum + (deal.monthlyRecurringRevenue || 0),
      0,
    );

    const totalInitialCost = activeDeals.reduce(
      (sum, deal) => sum + (deal.totalContract || 0),
      0,
    );

    // Format currency values
    const mmrFormatted = this.utilityService.formatCurrency(totalMMR);
    const initialCostFormatted =
      this.utilityService.formatCurrency(totalInitialCost);

    return {
      activeDealsInPipeline: activeDealsCount,
      totalOpportunities: opportunitiesCount,
      mmrOpportunity: mmrFormatted.formatCurrency,
      initialCostOpportunity: initialCostFormatted.formatCurrency,
    };
  }
}

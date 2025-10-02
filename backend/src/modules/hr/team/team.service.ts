import {
  Injectable,
  BadRequestException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import {
  CreateTeamRequest,
  UpdateTeamRequest,
  TeamDataResponse,
  TeamDetailResponse,
  AddTeamMemberRequest,
  TeamMemberResponse,
  TeamScheduleAssignmentRequest,
  TeamScheduleAssignmentResponse,
} from './team.interface';
import { TableRequest } from '@shared/request';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilityService: UtilityService,
    @Inject() private readonly tableHandlerService: TableHandlerService,
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

    this.tableHandlerService.initialize(query, tableBody, 'teams');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery.where = { ...tableQuery.where, companyId, isActive: true };

    const model = this.prisma.team;
    const result = await this.tableHandlerService.getTableData(model, query, {
      ...tableQuery,
      include: { members: true },
    });

    result.list = result.list.map((team) => this.formatTeamResponse(team));
    return result;
  }

  async getAll(companyId: number): Promise<TeamDataResponse[]> {
    const teams = await this.prisma.team.findMany({
      where: {
        companyId: companyId,
        isActive: true,
      },
      include: {
        members: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return teams.map((team) => this.formatTeamResponse(team));
  }

  async getAvailableEmployees(companyId: number): Promise<any[]> {
    // Get all employees not in any team
    const employees = await this.prisma.account.findMany({
      where: {
        companyId: companyId,
        isDeleted: false,
        EmployeeData: {
          isNot: null,
        },
        teamMembership: null,
      },
      include: {
        EmployeeData: true,
        role: {
          include: {
            roleGroup: true,
          },
        },
      },
    });

    return employees.map((account: any) => ({
      accountDetails: {
        id: account.id,
        fullName: `${account.firstName} ${account.lastName}`,
        role: account.role
          ? {
              name: account.role.name,
              roleGroup: account.role.roleGroup
                ? {
                    name: account.role.roleGroup.name,
                  }
                : null,
            }
          : null,
      },
      employeeCode: account.EmployeeData?.employeeCode || 'N/A',
    }));
  }

  async create(
    body: CreateTeamRequest,
    companyId: number,
  ): Promise<TeamDataResponse> {
    // Check if team name already exists in the company
    const existingTeam = await this.prisma.team.findFirst({
      where: {
        name: body.name,
        companyId: companyId,
        isActive: true,
      },
    });

    if (existingTeam) {
      throw new BadRequestException(
        `Team with name "${body.name}" already exists in this company.`,
      );
    }

    // If memberIds provided, validate them
    if (body.memberIds && body.memberIds.length > 0) {
      // Check if all employees exist and belong to the company
      const employees = await this.prisma.account.findMany({
        where: {
          id: { in: body.memberIds },
          companyId: companyId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });

      if (employees.length !== body.memberIds.length) {
        throw new BadRequestException(
          'Some employees not found or do not belong to this company.',
        );
      }

      // Check if any employee is already in a team
      const existingMembers = await this.prisma.teamMember.findMany({
        where: {
          accountId: { in: body.memberIds },
          team: {
            isActive: true,
            companyId: companyId,
          },
        },
        include: {
          team: true,
        },
      });

      if (existingMembers.length > 0) {
        const employeeNames = existingMembers
          .map(
            (m) =>
              `${employees.find((e) => e.id === m.accountId)?.firstName} ${employees.find((e) => e.id === m.accountId)?.lastName} (in team: ${m.team.name})`,
          )
          .join(', ');
        throw new BadRequestException(
          `The following employees are already in teams: ${employeeNames}`,
        );
      }
    }

    // Create the team with members in a transaction
    const team = await this.prisma.$transaction(async (prisma) => {
      // Create the team
      const newTeam = await prisma.team.create({
        data: {
          name: body.name,
          companyId: companyId,
          isActive: true,
        },
      });

      // Create team members if provided
      if (body.memberIds && body.memberIds.length > 0) {
        await prisma.teamMember.createMany({
          data: body.memberIds.map((accountId) => ({
            teamId: newTeam.id,
            accountId: accountId,
          })),
        });
      }

      // Return team with members
      return await prisma.team.findUnique({
        where: { id: newTeam.id },
        include: {
          members: true,
        },
      });
    });

    return this.formatTeamResponse(team);
  }

  async update(
    body: UpdateTeamRequest,
    companyId: number,
  ): Promise<TeamDataResponse> {
    // Check if team exists and belongs to the company
    const existingTeam = await this.prisma.team.findFirst({
      where: {
        id: body.id,
        companyId: companyId,
        isActive: true,
      },
    });

    if (!existingTeam) {
      throw new BadRequestException(
        'Team not found or does not belong to this company.',
      );
    }

    // Check if new name conflicts with another team (excluding current team)
    const nameConflict = await this.prisma.team.findFirst({
      where: {
        name: body.name,
        companyId: companyId,
        isActive: true,
        id: { not: body.id },
      },
    });

    if (nameConflict) {
      throw new BadRequestException(
        `Team with name "${body.name}" already exists in this company.`,
      );
    }

    // Update the team
    const updatedTeam = await this.prisma.team.update({
      where: { id: body.id },
      data: {
        name: body.name,
        updatedAt: new Date(),
      },
      include: {
        members: true,
      },
    });

    return this.formatTeamResponse(updatedTeam);
  }

  async delete(
    teamId: number,
    companyId: number,
  ): Promise<{ message: string }> {
    // Check if team exists and belongs to the company
    const existingTeam = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        companyId: companyId,
        isActive: true,
      },
    });

    if (!existingTeam) {
      throw new BadRequestException(
        'Team not found or does not belong to this company.',
      );
    }

    // Use transaction to ensure both operations succeed or fail together
    await this.prisma.$transaction(async (prisma) => {
      // First, delete all team members to free up the employees
      await prisma.teamMember.deleteMany({
        where: { teamId: teamId },
      });

      // Then soft delete the team
      await prisma.team.update({
        where: { id: teamId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });
    });

    return { message: 'Team deleted successfully.' };
  }

  async getTeamWithMembers(
    teamId: number,
    companyId: number,
  ): Promise<TeamDetailResponse> {
    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        companyId: companyId,
        isActive: true,
      },
      include: {
        members: {
          include: {
            account: {
              include: {
                EmployeeData: true,
                role: {
                  include: {
                    roleGroup: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException(
        'Team not found or does not belong to this company.',
      );
    }

    return {
      ...this.formatTeamResponse(team),
      members: team.members.map((member) =>
        this.formatTeamMemberResponse(member),
      ),
    };
  }

  async addMembers(
    body: AddTeamMemberRequest,
    companyId: number,
  ): Promise<TeamDetailResponse> {
    // Verify team exists and belongs to company
    const team = await this.prisma.team.findFirst({
      where: {
        id: body.teamId,
        companyId: companyId,
        isActive: true,
      },
    });

    if (!team) {
      throw new NotFoundException(
        'Team not found or does not belong to this company.',
      );
    }

    // Check if all employees exist and belong to the company
    const employees = await this.prisma.account.findMany({
      where: {
        id: { in: body.accountIds },
        companyId: companyId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (employees.length !== body.accountIds.length) {
      throw new BadRequestException(
        'Some employees not found or do not belong to this company.',
      );
    }

    // Check if any employee is already in a team
    const existingMembers = await this.prisma.teamMember.findMany({
      where: {
        accountId: { in: body.accountIds },
        team: {
          isActive: true,
          companyId: companyId,
        },
      },
      include: {
        team: true,
      },
    });

    if (existingMembers.length > 0) {
      const employeeNames = existingMembers
        .map(
          (m) =>
            `${employees.find((e) => e.id === m.accountId)?.firstName} ${employees.find((e) => e.id === m.accountId)?.lastName} (in team: ${m.team.name})`,
        )
        .join(', ');
      throw new BadRequestException(
        `The following employees are already in teams: ${employeeNames}`,
      );
    }

    // Add members to team
    await this.prisma.teamMember.createMany({
      data: body.accountIds.map((accountId) => ({
        teamId: body.teamId,
        accountId: accountId,
      })),
    });

    return this.getTeamWithMembers(body.teamId, companyId);
  }

  async removeMember(
    teamId: number,
    accountId: string,
    companyId: number,
  ): Promise<TeamDetailResponse> {
    // Verify team exists and belongs to company
    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        companyId: companyId,
        isActive: true,
      },
    });

    if (!team) {
      throw new NotFoundException(
        'Team not found or does not belong to this company.',
      );
    }

    // Remove member
    const result = await this.prisma.teamMember.deleteMany({
      where: {
        teamId: teamId,
        accountId: accountId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Member not found in this team.');
    }

    return this.getTeamWithMembers(teamId, companyId);
  }

  private formatTeamResponse(team: any): TeamDataResponse {
    return {
      id: team.id,
      name: team.name,
      memberCount: team.members ? team.members.length : 0,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      isActive: team.isActive,
    };
  }

  private formatTeamMemberResponse(member: any): TeamMemberResponse {
    const account = member.account;
    const role = account.role;

    return {
      id: member.id,
      accountId: account.id,
      name: `${account.firstName} ${account.lastName}`,
      position: role?.name || 'N/A',
      department: role?.roleGroup?.name || 'N/A',
      joinedAt: member.joinedAt,
    };
  }

  async getTeamScheduleAssignments(
    startDate: string,
    endDate: string,
    teamIds: number[],
    companyId: number,
  ): Promise<TeamScheduleAssignmentResponse[]> {
    const assignments = await this.prisma.teamScheduleAssignment.findMany({
      where: {
        companyId,
        teamId: { in: teamIds },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return assignments.map((assignment) => ({
      id: assignment.id,
      teamId: assignment.teamId,
      date: assignment.date,
      projectId: assignment.projectId,
      shiftId: assignment.shiftId,
      updatedAt: assignment.updatedAt,
    }));
  }

  async saveTeamScheduleAssignments(
    assignments: TeamScheduleAssignmentRequest[],
    updatedById: string,
    companyId: number,
  ): Promise<{ success: boolean; count: number }> {
    let upsertCount = 0;

    await this.prisma.$transaction(async (prisma) => {
      for (const assignment of assignments) {
        // Verify team belongs to company
        const team = await prisma.team.findFirst({
          where: {
            id: assignment.teamId,
            companyId,
            isActive: true,
          },
        });

        if (!team) {
          throw new BadRequestException(
            `Team ${assignment.teamId} not found or does not belong to this company.`,
          );
        }

        // Always upsert the assignment, even if both values are null
        await prisma.teamScheduleAssignment.upsert({
          where: {
            teamId_date_companyId: {
              teamId: assignment.teamId,
              date: assignment.date,
              companyId,
            },
          },
          update: {
            projectId: assignment.projectId,
            shiftId: assignment.shiftId,
            updatedById,
            updatedAt: new Date(),
          },
          create: {
            teamId: assignment.teamId,
            date: assignment.date,
            projectId: assignment.projectId,
            shiftId: assignment.shiftId,
            updatedById,
            companyId,
          },
        });
        upsertCount++;
      }
    });

    return {
      success: true,
      count: upsertCount,
    };
  }
}

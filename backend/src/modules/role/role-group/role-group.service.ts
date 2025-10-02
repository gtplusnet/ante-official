import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { RoleGroup } from '@prisma/client';
import { RoleGroupDataResponse } from '../../../shared/response/role.response';
@Injectable()
export class RoleGroupService {
  @Inject() public utilityService: UtilityService;
  @Inject() public prisma: PrismaService;
  @Inject() public tableHandlerService: TableHandlerService;

  async createRoleGroup({ name, description }) {
    const createRoleGroupData: Prisma.RoleGroupCreateInput = {
      name,
      description,
    };
    const createResponse = await this.prisma.roleGroup.create({
      data: createRoleGroupData,
    });

    return this.formatResponse(createResponse);
  }

  async roleGroupTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandlerService.initialize(query, body, 'roleGroup');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.roleGroup,
      query,
      tableQuery,
    );

    const list = this.formatResponseList(baseList as RoleGroup[]);

    return { list, pagination, currentPage };
  }

  async getRoleGroupByID({ id }): Promise<RoleGroupDataResponse> {
    const roleGroupInformation: RoleGroup =
      await this.prisma.roleGroup.findFirst({
        where: { id },
      });

    return this.formatResponse(roleGroupInformation);
  }

  async updateRoleGroupInformation(params: {
    id: string;
    name?: string;
    description?: string;
  }) {
    const { id, name, description } = params;
    const updateRoleGroupData: Prisma.RoleGroupUpdateInput = {};

    if (name !== undefined) {
      updateRoleGroupData.name = name;
    }
    if (description !== undefined) {
      updateRoleGroupData.description = description;
    }

    const updateResponse = await this.prisma.roleGroup.update({
      where: { id },
      data: updateRoleGroupData,
    });

    return this.formatResponse(updateResponse);
  }

  async deleteRoleGroup({ id }) {
    const checkRole = await this.prisma.role.findFirst({
      where: { roleGroupId: id, isDeleted: false },
    });

    if (checkRole) {
      throw new BadRequestException(
        'Role group have existing roles under it. Please delete the roles first.',
      );
    }

    const updateResponse = await this.prisma.roleGroup.update({
      where: { id },
      data: { isDeleted: true },
    });

    return this.formatResponse(updateResponse);
  }

  async getRoleGroupDropdownList() {
    const roleGroupInformation = await this.prisma.roleGroup.findMany({
      where: { isDeleted: false },
    });
    return this.formatResponseList(roleGroupInformation);
  }

  async getRoleGroupDropdownListForSuperAdmin(): Promise<
    RoleGroupDataResponse[]
  > {
    return await this.getRoleGroupDropdownList();
  }
  async getRoleGroupDropdownListForNonAdmin(): Promise<
    RoleGroupDataResponse[]
  > {
    const currentUserInformation = this.utilityService.accountInformation;
    const { role } = currentUserInformation;
    return [role.roleGroup];
  }

  async getListOfRoles(id: string) {
    const roleGroupInformation = await this.prisma.roleGroup.findFirst({
      where: { id },
      include: { roles: true },
    });
    const { roles } = roleGroupInformation;

    // Note: This returns role data, not role group data
    // This should be handled by the role service's formatting
    return roles;
  }

  async searchRoleGroup(
    query: TableQueryDTO,
    body: TableBodyDTO,
    searchQuery?: string,
  ) {
    this.tableHandlerService.initialize(query, body, 'roleGroup');
    const tableQuery = this.tableHandlerService.constructTableQuery();

    if (searchQuery) {
      tableQuery['where'] = {
        name: { contains: searchQuery, mode: 'insensitive' },
      };
    }

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandlerService.getTableData(
      this.prisma.roleGroup,
      query,
      tableQuery,
    );

    const list = this.formatResponseList(baseList as RoleGroup[]);

    return { list, pagination, currentPage };
  }

  async getOrCreateAdministratorRoleGroup(): Promise<RoleGroup> {
    let roleGroup = await this.prisma.roleGroup.findFirst({
      where: { name: 'Administrator' }
    });

    if (!roleGroup) {
      roleGroup = await this.prisma.roleGroup.create({
        data: {
          name: 'Administrator',
          description: 'System administrator role group',
          isDeleted: false
        }
      });
    }

    return roleGroup;
  }

  private formatResponse(data: RoleGroup): RoleGroupDataResponse {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
    };
  }

  private formatResponseList(dataList: RoleGroup[]): RoleGroupDataResponse[] {
    return dataList.map((data) => this.formatResponse(data));
  }
}

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { PrismaService } from '@common/prisma.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { UtilityService } from '@common/utility.service';
import { RoleCreateDTO, RoleUpdateDTO } from '../../../dto/role.validator.dto';
import {
  RoleDataResponse,
  RoleGroupDataResponse,
} from '../../../shared/response/role.response';
import { RoleGroupService } from '@modules/role/role-group/role-group.service';
import { UserLevelDataResponse } from '../../../shared/response/user-level.response';
import { ChangeRoleParentDto } from './dto/change-parent.dto';

@Injectable()
export class DeveloperRoleService {
  @Inject() public utility: UtilityService;
  @Inject() public prisma: PrismaService;
  @Inject() public tableHandler: TableHandlerService;
  @Inject() public roleGroupService: RoleGroupService;

  async getRole({ id }): Promise<RoleDataResponse> {
    const roleInformation: Role = await this.prisma.role.findFirst({
      where: { id, companyId: null },
      include: {
        roleGroup: true,
        parentRole: true,
      },
    });
    if (!roleInformation) throw new NotFoundException('Role not found');
    const roleResponse = this.formatData(roleInformation);
    return roleResponse;
  }
  async getTree() {
    const headTree = {
      id: 'static-head',
      name: 'Ante',
      description: 'This is a static company account.',
      child: await this.#getRoleChild(),
    };
    const treeList = [];
    treeList.push(headTree);
    return treeList;
  }
  async #getRoleChild(parentRoleId = null) {
    const roleChildList = await this.prisma.role.findMany({
      where: {
        parentRoleId,
        isDeveloper: false,
        isDeleted: false,
        companyId: null,
      },
      include: { parentRole: true, roleGroup: true },
    });
    const treeList = [];
    for (const parent of roleChildList) {
      const data = await this.formatData(parent);
      data['child'] = await this.#getRoleChild(parent.id);
      treeList.push(data);
    }
    return treeList;
  }
  async getRoleByGroup({ roleGroupId }) {
    const roleList = await this.prisma.role.findMany({
      where: { roleGroupId, isDeveloper: false, companyId: null },
      orderBy: { level: 'asc' },
    });
    if (!roleList) throw new NotFoundException('Role not found');
    const formattedRoleList = await Promise.all(
      roleList.map(async (role) => {
        const formattedRole = await this.formatData(role);
        return formattedRole;
      }),
    );
    return formattedRoleList;
  }
  async roleTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandler.initialize(query, body, 'role');
    const tableQuery = this.tableHandler.constructTableQuery();
    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: null,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandler.getTableData<Role>(
      this.prisma.role,
      query,
      tableQuery,
    );
    const list = await Promise.all(
      baseList.map(async (role) => {
        const formattedRole = await this.formatData(role);
        return formattedRole;
      }),
    );
    return { list, pagination, currentPage };
  }
  async addRole(params: RoleCreateDTO) {
    let parentRoleLevel = 0;
    if (params.parentRoleId) {
      const parentRole = await this.prisma.role.findUnique({
        where: { id: params.parentRoleId },
        select: { level: true },
      });
      if (!parentRole) throw new BadRequestException('Parent not found');
      parentRoleLevel = parentRole.level;
    }
    const childRoleLevel = parentRoleLevel + 1;
    const roleGroup = await this.prisma.roleGroup.findUnique({
      where: { id: params.roleGroupId },
    });
    if (!roleGroup) throw new BadRequestException('Role group not found');
    const createRoleData: Prisma.RoleCreateInput = {
      name: params.name,
      description: params.description,
      level: childRoleLevel,
      parentRole: params.parentRoleId
        ? { connect: { id: params.parentRoleId } }
        : undefined,
      roleGroup: { connect: { id: params.roleGroupId } },
      isFullAccess: params.isFullAccess ?? false,
    };
    const createResponse = await this.prisma.role.create({
      data: createRoleData,
    });
    // Create RoleUserLevel associations
    if (params.userLevelIds && params.userLevelIds.length > 0) {
      await this.prisma.roleUserLevel.createMany({
        data: params.userLevelIds.map((userLevelId) => ({
          roleId: createResponse.id,
          userLevelId,
        })),
      });
    }
    return this.formatData(createResponse);
  }
  async updateRole(roleUpdateDto: RoleUpdateDTO) {
    const updateRoleData: Prisma.RoleUpdateInput = {
      name: roleUpdateDto.name,
      description: roleUpdateDto.description,
      isFullAccess: roleUpdateDto.isFullAccess ?? false,
      roleGroup: { connect: { id: roleUpdateDto.roleGroupId } },
      parentRole: roleUpdateDto.parentRoleId
        ? { connect: { id: roleUpdateDto.parentRoleId } }
        : { disconnect: true },
    };
    const updateResponse = await this.prisma.role.update({
      where: { id: roleUpdateDto.id },
      data: updateRoleData,
    });
    // Update RoleUserLevel associations
    if (roleUpdateDto.userLevelIds) {
      // Remove old associations
      await this.prisma.roleUserLevel.deleteMany({
        where: { roleId: roleUpdateDto.id },
      });
      // Add new associations
      if (roleUpdateDto.userLevelIds.length > 0) {
        await this.prisma.roleUserLevel.createMany({
          data: roleUpdateDto.userLevelIds.map((userLevelId) => ({
            roleId: roleUpdateDto.id,
            userLevelId,
          })),
        });
      }
    }
    return this.formatData(updateResponse);
  }

  /**
   * Changes the parent of a developer role, with validation to prevent circular references
   */
  async changeRoleParent(data: ChangeRoleParentDto) {
    const { roleId, newParentId } = data;

    // Validate that the role exists (developer roles have companyId: null)
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        isDeleted: false,
        companyId: null,
      },
    });

    if (!role) {
      throw new NotFoundException('Developer role not found');
    }

    // Validate that role is not being assigned to itself
    if (roleId === newParentId) {
      throw new BadRequestException('A role cannot be its own parent');
    }

    // If newParentId is provided, validate it exists
    if (newParentId) {
      const newParent = await this.prisma.role.findFirst({
        where: {
          id: newParentId,
          isDeleted: false,
          companyId: null,
        },
      });

      if (!newParent) {
        throw new NotFoundException('New parent developer role not found');
      }

      // Check for circular reference
      const wouldCreateCircle = await this.wouldCreateCircularReference(
        roleId,
        newParentId,
      );
      if (wouldCreateCircle) {
        throw new BadRequestException(
          'Cannot set a descendant role as parent (circular reference)',
        );
      }
    }

    // Calculate new level based on parent
    const newLevel = await this.calculateRoleLevel(newParentId);

    // Update the parent relationship and level
    const updatedRole = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        parentRoleId: newParentId,
        level: newLevel,
      },
      include: {
        roleGroup: true,
        parentRole: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    // Update levels of all descendant roles
    await this.updateDescendantRoleLevels(roleId, newLevel);

    return {
      success: true,
      message: 'Developer role parent updated successfully',
      role: await this.formatData(updatedRole),
    };
  }

  /**
   * Checks if a role change would create a circular reference
   */
  private async wouldCreateCircularReference(
    roleId: string,
    newParentId: string,
  ): Promise<boolean> {
    if (!newParentId || roleId === newParentId) {
      return false;
    }

    // Start from the proposed parent and traverse up the hierarchy
    let currentId = newParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === roleId) {
        return true;
      }

      if (visited.has(currentId)) {
        return true;
      }
      visited.add(currentId);

      const currentRole = await this.prisma.role.findUnique({
        where: { id: currentId },
        select: { parentRoleId: true },
      });

      if (!currentRole) {
        break;
      }
      currentId = currentRole.parentRoleId;
    }

    return false;
  }

  /**
   * Calculate role level based on parent
   */
  async calculateRoleLevel(parentRoleId?: string): Promise<number> {
    let newRoleLevel = 0;
    if (parentRoleId) {
      const parentRole = await this.prisma.role.findUnique({
        where: { id: parentRoleId },
        select: { level: true },
      });
      if (parentRole) {
        newRoleLevel = parentRole.level + 1;
      }
    }
    return newRoleLevel;
  }

  /**
   * Updates the levels of all descendant roles recursively
   */
  private async updateDescendantRoleLevels(
    parentRoleId: string,
    parentLevel: number,
  ) {
    const childRoles = await this.prisma.role.findMany({
      where: {
        parentRoleId: parentRoleId,
        isDeleted: false,
        companyId: null,
      },
    });

    for (const child of childRoles) {
      const newChildLevel = parentLevel + 1;
      await this.prisma.role.update({
        where: { id: child.id },
        data: { level: newChildLevel },
      });

      // Recursively update grandchildren
      await this.updateDescendantRoleLevels(child.id, newChildLevel);
    }
  }

  async deleteRole({ id }) {
    const roleInformation = await this.prisma.role.findFirst({
      where: { id, companyId: null },
    });

    if (!roleInformation) throw new NotFoundException('Role not found');

    if (roleInformation.level === 0) {
      throw new BadRequestException('Cannot delete super admin role.');
    }
    const checkChildRole = await this.prisma.role.findFirst({
      where: { parentRoleId: id, isDeleted: false, companyId: null },
    });
    if (checkChildRole)
      throw new BadRequestException('Cannot delete role with child role');
    await this.prisma.role.delete({ where: { id } });
    return { message: 'Role deleted successfully' };
  }

  private async formatData(data: Role): Promise<RoleDataResponse> {
    const roleGroup: RoleGroupDataResponse =
      await this.roleGroupService.getRoleGroupByID({ id: data.roleGroupId });
    let parent: Role | null = null;
    let parentRole: RoleDataResponse | null = null;
    if (data.parentRoleId) {
      parent = await this.prisma.role.findUnique({
        where: { id: data.parentRoleId },
      });
      parentRole = await this.formatData(parent);
    }
    // Fetch user levels via RoleUserLevel
    const roleUserLevels = await this.prisma.roleUserLevel.findMany({
      where: { roleId: data.id },
      include: { userLevel: true },
    });
    const userLevels = roleUserLevels.map((rul) => rul.userLevel);
    // Optionally, map to UserLevelDataResponse if needed
    const userLevelResponses: UserLevelDataResponse[] = userLevels.map(
      (ul) => ({
        id: ul.id,
        label: ul.label,
        systemModule: ul.systemModule,
        scope: ul.scope,
      }),
    );
    const scopeList = [];
    userLevels.forEach((userLevel) => {
      userLevel.scope.forEach((scope) => {
        if (!scopeList.includes(scope)) {
          scopeList.push(scope);
        }
      });
    });
    const formattedData: RoleDataResponse = {
      id: data.id,
      employeeCount: 0,
      name: data.name,
      description: data.description,
      isDeveloper: data.isDeveloper,
      isDeleted: data.isDeleted,
      level: data.level,
      roleGroupId: data.roleGroupId,
      roleGroup,
      parentRole,
      userLevels: userLevelResponses,
      isFullAccess: data.isFullAccess ?? false,
      updatedAt: this.utility.formatDate(data.updatedAt),
      createdAt: this.utility.formatDate(data.createdAt),
      scopeList,
    };
    return formattedData;
  }
}

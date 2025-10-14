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
import { SystemModule } from '../../../shared/enums/user-level.enums';
import ScopeReference from '../../../reference/scope.reference';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RoleUpdatedEvent } from '../../../events/account.events';
import { ChangeRoleParentDto } from './dto/change-parent.dto';

@Injectable()
export class RoleService {
  @Inject() public utility: UtilityService;
  @Inject() public prisma: PrismaService;
  @Inject() public tableHandler: TableHandlerService;
  @Inject() public roleGroupService: RoleGroupService;
  @Inject() private eventEmitter: EventEmitter2;

  async getRole({ id }): Promise<RoleDataResponse> {
    const roleInformation: Role = await this.prisma.role.findFirst({
      where: {
        id,
      },
      include: {
        roleGroup: true,
        parentRole: true,
      },
    });

    if (!roleInformation) throw new NotFoundException('Role not found');

    const roleResponse = this.formatData(roleInformation);

    return roleResponse;
  }
  async getDeveloperRole(): Promise<RoleDataResponse> {
    const roleInformation: Role = await this.prisma.role.findFirst({
      where: { isDeveloper: true },
      include: {
        roleGroup: true,
        parentRole: true,
      },
    });

    if (!roleInformation) throw new NotFoundException('Role not found');

    const roleResponse: RoleDataResponse =
      await this.formatData(roleInformation);
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
        companyId: this.utility.companyId,
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
    const roleLevel = this.utility.accountInformation.role.level;
    const roleList = await this.prisma.role.findMany({
      where: { roleGroupId, isDeveloper: false, level: { gt: roleLevel } },
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

  async seedInitialRole() {
    const createRoleData: Prisma.RoleCreateInput = {
      name: 'Developer',
      description: 'This role can access all.',
      isDeveloper: true,
    };
    const initialRole = await this.prisma.role.create({ data: createRoleData });
    return initialRole;
  }
  async roleTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandler.initialize(query, body, 'role');
    const tableQuery = this.tableHandler.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['include'] = {
      parentRole: true,
      roleGroup: true,
    };

    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: this.utility.companyId,
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
      company: {
        connect: {
          id: this.utility.companyId,
        },
      },
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
    // Check for circular reference before updating
    if (roleUpdateDto.parentRoleId) {
      const wouldCreateCircle = await this.wouldCreateCircularReference(
        roleUpdateDto.id,
        roleUpdateDto.parentRoleId,
      );

      if (wouldCreateCircle) {
        throw new BadRequestException(
          'Cannot set this parent role as it would create a circular reference in the role hierarchy',
        );
      }
    }

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

    // Emit event for socket notification
    this.eventEmitter.emit(
      'role.updated',
      new RoleUpdatedEvent(roleUpdateDto.id),
    );

    const formattedRole = await this.formatData(updateResponse);

    return formattedRole;
  }

  /**
   * Changes the parent of a role, with validation to prevent circular references
   */
  async changeRoleParent(data: ChangeRoleParentDto) {
    const { roleId, newParentId } = data;

    // Validate that the role exists
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        isDeleted: false,
        companyId: this.utility.companyId,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
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
          companyId: this.utility.companyId,
        },
      });

      if (!newParent) {
        throw new NotFoundException('New parent role not found');
      }

      // Check for circular reference using existing method
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

    // Emit event for socket notification
    this.eventEmitter.emit('role.updated', new RoleUpdatedEvent(roleId));

    return {
      success: true,
      message: 'Role parent updated successfully',
      role: await this.formatData(updatedRole),
    };
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
    const roleInformation = await this.prisma.role.findFirst({ where: { id } });

    if (roleInformation.level === 0) {
      throw new BadRequestException('Cannot delete super admin role.');
    }

    // Prevent deletion if role is assigned to any employee
    const assignedEmployee = await this.prisma.employeeData.findFirst({
      where: { account: { roleId: id, isDeleted: false } },
    });
    if (assignedEmployee) {
      throw new BadRequestException(
        'Cannot delete role assigned to an employee.',
      );
    }

    const checkChildRole = await this.prisma.role.findFirst({
      where: { parentRoleId: id, isDeleted: false },
    });

    if (checkChildRole)
      throw new BadRequestException('Cannot delete role with child role');

    const updateResponse = await this.prisma.role.update({
      where: { id },
      data: { isDeleted: true },
    });

    return this.formatData(updateResponse);
  }

  async calculateRoleLevel(parentRoleId?: string): Promise<number> {
    let newRoleLevel = 0;
    if (parentRoleId) {
      const parentRole = await this.prisma.role.findUnique({
        where: { id: parentRoleId },
        select: { level: true },
      });

      if (!parentRole) throw new BadRequestException('Parent role not found');
      newRoleLevel = parentRole.level + 1;
    }

    return newRoleLevel;
  }

  // Method disabled - multiple level-1 roles are now allowed per role group
  // Keeping for reference in case needed in the future
  /*
  async hasLevelOneRole(roleGroupId: string, level = 1): Promise<boolean> {
    const role = await this.prisma.role.findMany({
      where: { roleGroupId: roleGroupId, level: level },
    });
    if (!role) return false;

    return role.length >= 1;
  }
  */

  async hasOneUserPerRoleHead(roleId: string): Promise<boolean> {
    try {
      return (
        (
          await this.prisma.role.findUnique({
            where: { id: roleId, level: 1 },
            include: {
              users: true,
            },
          })
        )?.users.length >= 1
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Updates the scopes associated with a given role.
   *
   * @param {string} roleID - The ID of the role to update.
   * @param {string[]} scopeIDs - An array of scope IDs to associate with the role.
   */

  /**
   * Public method to format role data that's already loaded with relations
   * This avoids re-fetching data that's already included
   */
  async formatRoleData(
    data: any,
  ): Promise<RoleDataResponse> {
    // If the role already has its relations loaded, use them directly
    // Otherwise fall back to formatData which will fetch them
    if (data.roleGroup && data.parentRole !== undefined) {
      // Data is already loaded with relations, format it directly
      return this.formatData(data);
    }
    // Data needs relations loaded, use the regular formatData
    return this.formatData(data);
  }

  async formatData(
    data: Role,
    processedRoles?: Set<string>,
  ): Promise<RoleDataResponse> {
    // Initialize processedRoles if not provided (first call)
    if (!processedRoles) {
      processedRoles = new Set<string>();
    }

    // Check for circular reference
    if (processedRoles.has(data.id)) {
      // Return a simplified version without parent to break the cycle
      return {
        id: data.id,
        name: data.name,
        employeeCount: 0,
        description: data.description,
        isDeveloper: data.isDeveloper,
        isDeleted: data.isDeleted,
        level: data.level,
        roleGroupId: data.roleGroupId,
        roleGroup: null,
        parentRole: null,
        userLevels: [],
        isFullAccess: data.isFullAccess,
        updatedAt: this.utility.formatDate(data.updatedAt),
        createdAt: this.utility.formatDate(data.createdAt),
        scopeList: [],
      };
    }

    // Add current role to processed set
    processedRoles.add(data.id);

    try {
      // Get or ensure role group
      let roleGroup: RoleGroupDataResponse;
      if (data.roleGroupId) {
        roleGroup = await this.roleGroupService.getRoleGroupByID({ id: data.roleGroupId });
      } else {
        // Role doesn't have a group - assign to default Administrator group
        const defaultGroup = await this.roleGroupService.getOrCreateAdministratorRoleGroup();

        // Update the role to have this group
        await this.prisma.role.update({
          where: { id: data.id },
          data: { roleGroupId: defaultGroup.id }
        });

        roleGroup = await this.roleGroupService.getRoleGroupByID({ id: defaultGroup.id });
      }

      const employeeCount = await this.prisma.employeeData.count({
        where: { account: { roleId: data.id, isDeleted: false } },
      });

      let parent: Role | null = null;
      let parentRole: RoleDataResponse | null = null;
      if (data.parentRoleId) {
        parent = await this.prisma.role.findUnique({
          where: { id: data.parentRoleId },
        });
        parentRole = await this.formatData(parent, processedRoles);
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

      const userLevelScopes = await this.prisma.roleUserLevel.findMany({
        where: {
          roleId: data.id,
        },
        include: {
          userLevel: true,
        },
      });

      const scopeList = [];

      if (data.isFullAccess || data.isDeveloper) {
        ScopeReference.forEach((scope) => {
          scopeList.push(scope.id);
        });
      } else {
        userLevelScopes.forEach((ul) => {
          // Add enum scopes
          ul.userLevel.scope.forEach((scope) => {
            scopeList.push(scope);
          });

          // Add dynamic scopes from JSON field
          if (ul.userLevel.scopeJson) {
            try {
              // scopeJson can be either an array or a JSON string
              const dynamicScopes = Array.isArray(ul.userLevel.scopeJson)
                ? ul.userLevel.scopeJson
                : typeof ul.userLevel.scopeJson === 'string'
                  ? JSON.parse(ul.userLevel.scopeJson)
                  : ul.userLevel.scopeJson;

              if (Array.isArray(dynamicScopes)) {
                dynamicScopes.forEach((scope) => {
                  if (!scopeList.includes(scope)) {
                    scopeList.push(scope);
                  }
                });
              }
            } catch (error) {
              // Handle JSON parse error silently
              console.error('Error parsing scopeJson:', error);
            }
          }
        });
      }

      const formattedData: RoleDataResponse = {
        id: data.id,
        name: data.name,
        employeeCount,
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
    } finally {
      // This ensures we don't keep stale data if an error occurs
      // But note: this approach has limitations when multiple formatData calls happen in parallel
    }
  }

  formatLabelOnSystemModule(module: SystemModule): string {
    let label = module.toLowerCase().replace('_', ' ');
    label = label[0].toUpperCase() + label.slice(1);
    return label;
  }

  /**
   * Check if assigning a parent to a role would create a circular reference
   * @param roleId - The role that will be updated
   * @param newParentId - The proposed parent role ID
   * @returns true if it would create a circular reference, false otherwise
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
      // If we encounter the original role in the parent chain, it would create a circle
      if (currentId === roleId) {
        return true;
      }

      // Prevent infinite loops in case there's already a circular reference
      if (visited.has(currentId)) {
        return true;
      }
      visited.add(currentId);

      // Get the parent of the current role
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
   * Returns a list of employees assigned to a given role.
   * @param roleId The role ID to filter employees by.
   * @returns Array of { employeeCode, fullName }
   */
  async getEmployeesByRole(
    roleId: string,
  ): Promise<{ employeeCode: string; fullName: string }[]> {
    const employees = await this.prisma.employeeData.findMany({
      where: {
        account: {
          roleId,
          isDeleted: false,
        },
      },
      include: {
        account: true,
      },
    });
    return employees.map((emp) => ({
      employeeCode: emp.employeeCode,
      fullName:
        `${emp.account.lastName}, ${emp.account.firstName} ${emp.account.middleName}`.trim(),
    }));
  }
}

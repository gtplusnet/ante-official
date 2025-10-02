import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { UtilityService } from '@common/utility.service';
import { CommonIdDTO } from '../../../dto/common.id.dto';
import { RoleService } from '@modules/role/role/role.service';
import { RoleGroupService } from '@modules/role/role-group/role-group.service';
import { RoleDataResponse } from '../../../shared/response/role.response';
import watcherTypeReference from '../../../reference/watcher-type.reference';
import { ChangeParentDto } from './dto/change-parent.dto';
@Injectable()
export class UserOrgService {
  @Inject() public utility: UtilityService;
  @Inject() public prisma: PrismaService;
  @Inject() public tableHandler: TableHandlerService;
  @Inject() public roleService: RoleService;
  @Inject() public roleGroupService: RoleGroupService;

  async getListOfChildAccount(
    accountId: string,
    list = [],
    visitedIds = new Set(),
  ) {
    // Prevent infinite loops
    if (visitedIds.has(accountId)) {
      console.warn(
        `Circular reference detected in getListOfChildAccount for user ID: ${accountId}`,
      );
      return list;
    }
    visitedIds.add(accountId);

    const childAccount = await this.prisma.account.findMany({
      where: {
        parentAccountId: accountId,
      },
    });

    if (childAccount.length > 0) {
      for (const account of childAccount) {
        if (!visitedIds.has(account.id)) {
          list.push(account);
          await this.getListOfChildAccount(account.id, list, visitedIds);
        }
      }
    }

    return list;
  }

  async getUserOrgList() {
    // Get all users with level 0 roles (top executives/owners)
    const topLevelUsers = await this.prisma.account.findMany({
      where: {
        role: { level: 0 },
        companyId: this.utility.companyId,
        isDeleted: false,
      },
      include: { role: true },
      orderBy: { createdAt: 'asc' },
    });

    if (topLevelUsers.length === 0) {
      return [];
    }

    // Build tree for each level 0 user
    const treeList = [];
    for (const topUser of topLevelUsers) {
      const userData = this.formatAccountResponse(topUser);
      userData['child'] = await this.#getAccountChild(
        false,
        topUser.id,
        new Set(),
      );
      treeList.push(userData);
    }

    return treeList;
  }

  async #getAccountChild(
    _isInitial = false,
    parentAccountId = null,
    visitedIds = new Set(),
  ) {
    // Prevent infinite loops by tracking visited IDs
    if (parentAccountId && visitedIds.has(parentAccountId)) {
      console.warn(
        `Circular reference detected for user ID: ${parentAccountId}`,
      );
      return [];
    }

    // Add current ID to visited set
    const newVisitedIds = new Set(visitedIds);
    if (parentAccountId) {
      newVisitedIds.add(parentAccountId);
    }

    // Get only direct reports of this user
    const where = {
      parentAccountId: parentAccountId,
      isDeleted: false,
      companyId: this.utility.companyId,
    };

    // Get the child of the parent account
    const userChildList = await this.prisma.account.findMany({
      where,
      include: {
        role: true,
      },
    });

    const treeList = [];

    // Loop through the child and get the child of each child
    for (const parent of userChildList) {
      const data = this.formatAccountResponse(parent);
      data['child'] = await this.#getAccountChild(
        false,
        parent.id,
        newVisitedIds,
      );
      treeList.push(data);
    }

    return treeList;
  }

  async getUserTree() {
    // Get company name from logged-in user's company
    const companyName =
      this.utility.accountInformation?.company?.companyName || 'Company';

    const headTree = {
      id: 'static-head',
      name: companyName,
      description: `${companyName} organizational structure`,
      child: await this.#getUserChild(),
    };
    const treeList = [];
    treeList.push(headTree);
    return treeList;
  }

  async #getUserChild(parentRoleId = null) {
    const roleChildList = await this.prisma.role.findMany({
      where: {
        parentRoleId,
        isDeveloper: false,
        companyId: this.utility.companyId,
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
          },
          where: {
            companyId: this.utility.companyId,
            isDeleted: false,
          },
        },
      },
    });

    const treeList = [];

    for (const parent of roleChildList) {
      const data = this.formatRoleResponse(parent);
      data['users'] = parent.users ?? [];
      data['child'] = await this.#getUserChild(parent.id);
      treeList.push(data);
    }

    return treeList;
  }

  async findParentUserDropdownList(roleData: CommonIdDTO): Promise<any> {
    const roleInformation = await this.roleService.getRole(roleData);
    console.log('Role Information:', roleInformation);
    const userLists = await this.getUsersAboveLevel(roleInformation);
    console.log('User Lists:', userLists);
    return userLists;
  }

  private async getUsersAboveLevel(
    roleInformation: RoleDataResponse,
  ): Promise<any> {
    const { roleGroupId, level } = roleInformation;
    console.log(
      'Getting users above level:',
      level,
      'in roleGroup:',
      roleGroupId,
      'company:',
      this.utility.companyId,
    );

    // Get users from roles above this level in the same role group
    const rolesInSameGroup = await this.prisma.role.findMany({
      where: {
        roleGroupId,
        companyId: this.utility.companyId,
        isDeveloper: false,
        level: { lt: level },
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
          },
          where: {
            isDeleted: false,
            companyId: this.utility.companyId,
          },
        },
      },
    });

    // Always include level 0 users (top executives) regardless of role group
    console.log('Checking for level 0 users...');
    const level0Roles =
      level === 0
        ? []
        : await this.prisma.role.findMany({
            where: {
              level: 0,
              companyId: this.utility.companyId,
            },
            include: {
              users: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  username: true,
                  email: true,
                },
                where: {
                  isDeleted: false,
                  companyId: this.utility.companyId,
                },
              },
            },
          });

    console.log('Level 0 roles found:', level0Roles.length);
    console.log('Roles in same group found:', rolesInSameGroup.length);

    // Combine both results
    const roleWithUser = [...level0Roles, ...rolesInSameGroup];

    // Flatten the array of users but include the role name and level
    const allUsers = roleWithUser.flatMap((role) =>
      role.users.map((user) => ({
        ...user,
        roleName: role.name,
        roleLevel: role.level,
      })),
    );

    // Remove duplicates based on user id
    const uniqueUsers = allUsers.filter(
      (user, index, self) => index === self.findIndex((u) => u.id === user.id),
    );

    // Sort by role level (level 0 first) and then by name
    uniqueUsers.sort((a, b) => {
      if (a.roleLevel !== b.roleLevel) {
        return a.roleLevel - b.roleLevel; // Lower level numbers come first
      }
      return a.firstName.localeCompare(b.firstName);
    });

    return uniqueUsers;
  }

  /**
   * Changes the parent of a user, with validation to prevent circular references
   */
  async changeUserParent(data: ChangeParentDto) {
    const { userId, newParentId } = data;

    // Validate that the user exists
    const user = await this.prisma.account.findFirst({
      where: {
        id: userId,
        isDeleted: false,
        companyId: this.utility.companyId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate that user is not being assigned to themselves
    if (userId === newParentId) {
      throw new BadRequestException('A user cannot be their own parent');
    }

    // If newParentId is provided, validate it exists
    if (newParentId) {
      const newParent = await this.prisma.account.findFirst({
        where: {
          id: newParentId,
          isDeleted: false,
          companyId: this.utility.companyId,
        },
      });

      if (!newParent) {
        throw new NotFoundException('New parent user not found');
      }

      // Check for circular reference - prevent assigning to a descendant
      const isDescendant = await this.isDescendantOf(newParentId, userId);
      if (isDescendant) {
        throw new BadRequestException(
          'Cannot set a descendant user as parent (circular reference)',
        );
      }
    }

    // Update the parent relationship
    const updatedUser = await this.prisma.account.update({
      where: { id: userId },
      data: { parentAccountId: newParentId },
      include: {
        role: true,
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'User parent updated successfully',
      user: this.formatAccountResponse(updatedUser),
    };
  }

  /**
   * Checks if a user is a descendant of another user
   * Used to prevent circular references in the hierarchy
   */
  private async isDescendantOf(
    userId: string,
    potentialAncestorId: string,
  ): Promise<boolean> {
    let currentUser = await this.prisma.account.findUnique({
      where: { id: userId },
      select: { parentAccountId: true },
    });

    const visitedIds = new Set<string>();
    visitedIds.add(userId);

    while (currentUser?.parentAccountId) {
      // Prevent infinite loops
      if (visitedIds.has(currentUser.parentAccountId)) {
        console.warn(`Circular reference detected for user ID: ${userId}`);
        return false;
      }
      visitedIds.add(currentUser.parentAccountId);

      if (currentUser.parentAccountId === potentialAncestorId) {
        return true;
      }

      currentUser = await this.prisma.account.findUnique({
        where: { id: currentUser.parentAccountId },
        select: { parentAccountId: true },
      });
    }

    return false;
  }

  /**
   * Formats an account response according to the standard format
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
      createdAt: this.utility.formatDate(account.createdAt),
      role: account.role ? this.formatRoleResponse(account.role) : null,
      parentAccountId: account.parentAccountId,
      image: account.image,
      parent: account.parent
        ? this.formatAccountResponse(account.parent)
        : null,
      watcherType: account.watcherType
        ? watcherTypeReference.find(
            (ref) => ref.key === account.watcherType,
          ) || { key: account.watcherType, label: account.watcherType }
        : null,
    };
  }

  /**
   * Formats a role response according to the standard format
   */
  private formatRoleResponse(role: any): any {
    if (!role) return null;

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isDeveloper: role.isDeveloper,
      isDeleted: role.isDeleted,
      updatedAt: this.utility.formatDate(role.updatedAt),
      createdAt: this.utility.formatDate(role.createdAt),
      roleScope: role.roleScope
        ? this.formatRoleScopeResponse(role.roleScope)
        : null,
      roleGroupId: role.roleGroupId,
      roleGroup: role.roleGroup
        ? this.formatRoleGroupResponse(role.roleGroup)
        : null,
      parentRole: role.parentRole
        ? this.formatRoleResponse(role.parentRole)
        : null,
      level: role.level,
    };
  }

  /**
   * Formats a role scope response
   */
  private formatRoleScopeResponse(roleScope: any): any {
    if (!roleScope) return null;

    // Handle array of role scopes
    if (Array.isArray(roleScope)) {
      return roleScope.map((rs) => this.formatRoleScopeResponse(rs));
    }

    return {
      roleID: roleScope.roleID,
      scopeID: roleScope.scopeID,
      scope: roleScope.scope ? this.formatScopeResponse(roleScope.scope) : null,
    };
  }

  /**
   * Formats a scope response
   */
  private formatScopeResponse(scope: any): any {
    if (!scope) return null;

    return {
      id: scope.id,
      type: scope.type,
      name: scope.name,
      description: scope.description,
    };
  }

  /**
   * Formats a role group response
   */
  private formatRoleGroupResponse(roleGroup: any): any {
    if (!roleGroup) return null;

    return {
      id: roleGroup.id,
      name: roleGroup.name,
      description: roleGroup.description,
      isDeleted: roleGroup.isDeleted,
    };
  }
}

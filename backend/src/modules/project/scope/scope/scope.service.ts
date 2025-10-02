import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';

@Injectable()
export class ScopeService {
  @Inject() public utility: UtilityService;
  @Inject() public prisma: PrismaService;
  @Inject() public tableHandler: TableHandlerService;

  async getList({ roleGroupId = null }: { roleGroupId?: string }) {
    const rolesUnderRoleGroup = await this.prisma.roleGroup.findMany({
      where: { id: roleGroupId },
      include: {
        roles: true,
      },
    });

    if (rolesUnderRoleGroup.length === 0) {
      throw new BadRequestException(
        'No roles found under the specified role group',
      );
    }

    const lowestLevelRole = this.findLowestLevelRole(rolesUnderRoleGroup);
    const scopeList = this.mapRoleScopesToScope(lowestLevelRole.roleScopes);

    return scopeList;
  }

  private findLowestLevelRole(roleGroups: any[]): any {
    return roleGroups
      .flatMap((roleGroup) => roleGroup.roles)
      .reduce(
        (lowest, role) => (lowest.level < role.level ? lowest : role),
        roleGroups.flatMap((roleGroup) => roleGroup.roles)[0],
      );
  }

  private mapRoleScopesToScope(roleScopes: any[]): any[] {
    return roleScopes.map((roleScope) => roleScope.scope);
  }
}

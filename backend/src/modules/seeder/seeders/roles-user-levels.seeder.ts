import { Injectable, Inject } from '@nestjs/common';
import { BaseSeeder, SeederMetadata } from './base.seeder';
import { PrismaService } from '@common/prisma.service';

@Injectable()
export class RolesUserLevelsSeeder extends BaseSeeder {
  constructor(@Inject(PrismaService) prisma: PrismaService) {
    super(prisma);
  }

  get type(): string {
    return 'roles_and_user_levels';
  }

  get name(): string {
    return 'Roles and User Levels';
  }

  get description(): string {
    return 'Creates default roles and user levels for a company based on system defaults';
  }

  async canSeed(companyId: number): Promise<boolean> {
    // Check if company already has roles
    const existingRoles = await this.prisma.role.count({
      where: { companyId, isDeleted: false },
    });

    // Check if company already has user levels
    const existingUserLevels = await this.prisma.userLevel.count({
      where: { companyId },
    });

    // Can seed if no roles or user levels exist
    return existingRoles === 0 && existingUserLevels === 0;
  }

  async seed(companyId: number): Promise<SeederMetadata> {
    const metadata: SeederMetadata = {
      totalRecords: 0,
      processedRecords: 0,
      skippedRecords: 0,
      errors: [],
    };

    try {
      // Use transaction for atomicity
      await this.prisma.$transaction(async (tx) => {
        const result = await this.seedRolesAndUserLevelsWithTransaction(
          tx,
          companyId,
        );
        metadata.totalRecords = result.totalRecords;
        metadata.processedRecords = result.processedRecords;
      });

      return metadata;
    } catch (error) {
      metadata.errors!.push(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
      throw error;
    }
  }

  /**
   * Seeds roles and user levels within a transaction
   * Can be called from external services with their own transaction
   */
  async seedRolesAndUserLevelsWithTransaction(
    tx: any,
    companyId: number,
  ): Promise<{ totalRecords: number; processedRecords: number }> {
    let processedRecords = 0;

    // 1. Copy all default user levels (companyId: null) to the company
    const defaultUserLevels = await tx.userLevel.findMany({
      where: { companyId: null },
    });

    const userLevelIdMap: Record<number, number> = {};

    for (const defaultUserLevel of defaultUserLevels) {
      const { id: _id, ...userLevelData } = defaultUserLevel;
      const created = await tx.userLevel.create({
        data: {
          ...userLevelData,
          companyId,
        },
      });
      userLevelIdMap[defaultUserLevel.id] = created.id;
      processedRecords++;
    }

    // 2. Copy all default roles (companyId: null) to the company
    const defaultRoleList = await tx.role.findMany({
      where: { companyId: null },
    });

    // First pass: create all roles with parentRoleId null
    const defaultIdToCompanyId: Record<string, string> = {};
    const roleUserLevelsMap: Record<string, number[]> = {};

    for (const defaultRole of defaultRoleList) {
      const {
        id: defaultRoleId,
        companyId: _,
        parentRoleId: _parentRoleId,
        ...roleData
      } = defaultRole;

      // Get userLevelIds for this role
      const roleUserLevels = await tx.roleUserLevel.findMany({
        where: { roleId: defaultRoleId },
      });
      roleUserLevelsMap[defaultRoleId] = roleUserLevels.map(
        (rul) => rul.userLevelId,
      );

      // Create role for company with parentRoleId null
      const created = await tx.role.create({
        data: {
          ...roleData,
          companyId,
          parentRoleId: null,
        },
      });
      defaultIdToCompanyId[defaultRoleId] = created.id;
      processedRecords++;
    }

    // Second pass: update parentRoleId for all company roles
    for (const defaultRole of defaultRoleList) {
      const { id: defaultRoleId, parentRoleId } = defaultRole;
      if (parentRoleId) {
        const companyRoleId = defaultIdToCompanyId[defaultRoleId];
        const newParentId = defaultIdToCompanyId[parentRoleId];
        if (companyRoleId && newParentId) {
          await tx.role.update({
            where: { id: companyRoleId },
            data: { parentRoleId: newParentId },
          });
        }
      }
    }

    // Third pass: create RoleUserLevel associations
    for (const defaultRole of defaultRoleList) {
      const { id: defaultRoleId } = defaultRole;
      const companyRoleId = defaultIdToCompanyId[defaultRoleId];
      const defaultUserLevelIds = roleUserLevelsMap[defaultRoleId] || [];

      if (companyRoleId && defaultUserLevelIds.length > 0) {
        await tx.roleUserLevel.createMany({
          data: defaultUserLevelIds.map((defaultUserLevelId) => ({
            roleId: companyRoleId,
            userLevelId: userLevelIdMap[defaultUserLevelId],
          })),
        });
        processedRecords += defaultUserLevelIds.length;
      }
    }

    const totalRecords =
      defaultUserLevels.length +
      defaultRoleList.length +
      Object.values(roleUserLevelsMap).reduce(
        (sum, arr) => sum + arr.length,
        0,
      );

    return { totalRecords, processedRecords };
  }

  async validate(companyId: number): Promise<boolean> {
    // Check if company has at least one role
    const roleCount = await this.prisma.role.count({
      where: { companyId, isDeleted: false },
    });

    // Check if company has at least one user level
    const userLevelCount = await this.prisma.userLevel.count({
      where: { companyId },
    });

    return roleCount > 0 && userLevelCount > 0;
  }
}

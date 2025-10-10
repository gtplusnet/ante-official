import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { CRMActivityService } from '../../crm-activity/crm-activity/crm-activity.service';
import { CRMActivityType, CRMEntityType } from '@prisma/client';

@Injectable()
export class LeadRelationshipOwnerService {
  @Inject() private prisma: PrismaService;
  @Inject() private utilityService: UtilityService;
  @Inject() private crmActivityService: CRMActivityService;

  // Upsert multiple owners - create or update (unarchive)
  async upsertMultiple(accountIds: string[]) {
    const createdById = this.utilityService.accountInformation.id;
    const results = [];

    for (const accountId of accountIds) {
      // Check if exists first
      const existingOwner = await this.prisma.leadRelationshipOwner.findUnique({
        where: { accountId },
        include: {
          account: true,
        },
      });

      const isNew = !existingOwner;

      // Upsert: update if exists, create if not
      const owner = await this.prisma.leadRelationshipOwner.upsert({
        where: { accountId },
        update: {
          isActive: true, // Unarchive if it was archived
          updatedAt: new Date(),
        },
        create: {
          accountId,
          createdById,
          companyId: this.utilityService.companyId,
          isActive: true,
        },
        include: {
          account: true,
        },
      });

      // Log activity for new owners OR when re-activating archived owners
      if (isNew || (existingOwner && !existingOwner.isActive)) {
        const ownerName = `${owner.account.firstName} ${owner.account.lastName}`;
        await this.crmActivityService.createActivity({
          activityType: CRMActivityType.CREATE,
          entityType: CRMEntityType.RELATIONSHIP_OWNER,
          entityId: owner.id,
          entityName: ownerName,
          description: `Added new relationship owner "${ownerName}"`,
          performedById: this.utilityService.accountInformation.id,
        });
      }

      results.push(owner);
    }

    return {
      success: true,
      count: results.length,
      data: results,
    };
  }

  // Get all active lead relationship owners
  async getLeadRelationshipOwnersList(query: any) {
    const where: any = {
      isActive: true, // Only show active (non-archived) owners by default
      companyId: this.utilityService.companyId,
    };

    // Handle search
    if (query?.search) {
      where.account = {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    // Handle branch filter
    if (query?.branch && query.branch !== 'all' && query.branch !== 'All') {
      const branchIds = query.branch
        .split(',')
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id)); // Filter out invalid numbers

      if (branchIds.length > 0) {
        where.account = {
          ...where.account,
          EmployeeData: {
            ...where.account?.EmployeeData,
            branchId: { in: branchIds },
          },
        };
      }
    }

    // Handle company filter
    if (query?.company && query.company !== 'all' && query.company !== 'All') {
      const companyIds = query.company
        .split(',')
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id)); // Filter out invalid numbers

      if (companyIds.length > 0) {
        where.account = {
          ...where.account,
          companyId: { in: companyIds },
        };
      }
    }

    // Option to show archived owners
    if (query?.showArchived === 'true') {
      delete where.isActive;
    }

    // Handle sorting
    let orderBy: any = { createdAt: 'desc' }; // Default sort

    if (query?.sortBy) {
      switch (query.sortBy) {
        case 'Name (A-Z)':
          orderBy = { account: { firstName: 'asc' } };
          break;
        case 'Name (Z-A)':
          orderBy = { account: { firstName: 'desc' } };
          break;
        case 'Job Title':
          orderBy = { account: { role: { name: 'asc' } } };
          break;
        case 'Branch':
          orderBy = { account: { EmployeeData: { branch: { name: 'asc' } } } };
          break;
        case 'Recent Activity':
          orderBy = { updatedAt: 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }
    }

    const owners = await this.prisma.leadRelationshipOwner.findMany({
      where,
      include: {
        account: {
          include: {
            role: true,
            EmployeeData: {
              include: {
                branch: true,
              },
            },
          },
        },
        createdBy: true,
      },
      orderBy,
    });

    // Format for frontend table
    return owners.map((owner) => ({
      id: owner.id,
      fullName: `${owner.account.firstName} ${owner.account.lastName}`,
      email: owner.account.email,
      branch: owner.account.EmployeeData?.branch?.name || 'N/A',
      jobTitle: owner.account.role?.name || 'N/A',
      phone: owner.account.phone || owner.account.contactNumber || 'N/A',
      dateCreated: owner.createdAt.toISOString(),
      createdBy: `${owner.createdBy.firstName} ${owner.createdBy.lastName}`,
      isActive: owner.isActive,
    }));
  }

  // Archive lead relationship owner
  async archiveOwner(id: number) {
    const owner = await this.prisma.leadRelationshipOwner.findFirst({
      where: {
        id,
        companyId: this.utilityService.companyId,
      },
      include: {
        account: true,
      },
    });

    if (!owner) {
      throw new NotFoundException('Lead relationship owner not found');
    }

    const archivedOwner = await this.prisma.leadRelationshipOwner.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Log activity
    const ownerName = `${owner.account.firstName} ${owner.account.lastName}`;
    await this.crmActivityService.createActivity({
      activityType: CRMActivityType.DELETE,
      entityType: CRMEntityType.RELATIONSHIP_OWNER,
      entityId: owner.id,
      entityName: ownerName,
      description: `Deleted relationship owner "${ownerName}"`,
      performedById: this.utilityService.accountInformation.id,
    });

    return archivedOwner;
  }

  // Toggle archive status
  async toggleArchive(id: number) {
    const owner = await this.prisma.leadRelationshipOwner.findFirst({
      where: {
        id,
        companyId: this.utilityService.companyId,
      },
    });

    if (!owner) {
      throw new NotFoundException('Lead relationship owner not found');
    }

    return await this.prisma.leadRelationshipOwner.update({
      where: { id },
      data: {
        isActive: !owner.isActive,
        updatedAt: new Date(),
      },
    });
  }
}

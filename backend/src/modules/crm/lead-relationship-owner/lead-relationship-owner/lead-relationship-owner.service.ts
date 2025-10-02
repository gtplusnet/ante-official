import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';

@Injectable()
export class LeadRelationshipOwnerService {
  @Inject() private prisma: PrismaService;
  @Inject() private utilityService: UtilityService;

  // Upsert multiple owners - create or update (unarchive)
  async upsertMultiple(accountIds: string[]) {
    const createdById = this.utilityService.accountInformation.id;
    const results = [];

    for (const accountId of accountIds) {
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
      });

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
      orderBy: { createdAt: 'desc' },
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
    });

    if (!owner) {
      throw new NotFoundException('Lead relationship owner not found');
    }

    return await this.prisma.leadRelationshipOwner.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
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

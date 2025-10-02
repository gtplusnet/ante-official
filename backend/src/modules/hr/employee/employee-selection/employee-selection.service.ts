import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { EmployeeListService } from '../employee-list/employee-list.service';
import { EmployeeSelectionFilterDto } from './employee-selection.dto';
import { EmployeeDataResponse } from '../../../../shared/response/employee.response';
import { EmployeeData, Prisma, EmploymentStatus } from '@prisma/client';

@Injectable()
export class EmployeeSelectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilityService: UtilityService,
    @Inject() private readonly employeeListService: EmployeeListService,
  ) {}

  async getSelectableEmployees(
    filters: EmployeeSelectionFilterDto,
    companyId?: number,
  ): Promise<EmployeeDataResponse[]> {
    // Use provided companyId or get from utility service
    const effectiveCompanyId = companyId || this.utilityService.companyId;

    // Build where clause
    const whereClause: Prisma.EmployeeDataWhereInput = {
      account: {
        companyId: effectiveCompanyId,
      },
    };

    // Apply exclusion filter
    if (filters.excludeAccountIds && filters.excludeAccountIds.length > 0) {
      whereClause.NOT = {
        accountId: {
          in: filters.excludeAccountIds,
        },
      };
    }

    // Apply branch filter
    if (filters.branch && filters.branch !== 'all') {
      // Handle both single string and array of branch IDs
      if (Array.isArray(filters.branch)) {
        // Multiple branches - use IN operator
        whereClause.branchId = {
          in: filters.branch
            .map((id) => parseInt(id, 10))
            .filter((id) => !isNaN(id)),
        };
      } else {
        // Single branch - backward compatibility
        const branchId = parseInt(filters.branch, 10);
        if (!isNaN(branchId)) {
          whereClause.branchId = branchId;
        }
      }
    }

    // Apply role filter
    if (filters.role && filters.role !== 'all') {
      whereClause.account = {
        ...(whereClause.account as any),
        roleId: filters.role,
      };
    }

    // Apply employment status filter
    if (filters.employmentStatus && filters.employmentStatus !== 'all') {
      // Map string to enum value
      const statusMap: Record<string, EmploymentStatus> = {
        REGULAR: EmploymentStatus.REGULAR,
        CONTRACTUAL: EmploymentStatus.CONTRACTTUAL,
        CONTRACTTUAL: EmploymentStatus.CONTRACTTUAL,
        PROBATIONARY: EmploymentStatus.PROBATIONARY,
        TRAINEE: EmploymentStatus.TRAINEE,
      };

      const enumValue = statusMap[filters.employmentStatus.toUpperCase()];
      if (enumValue) {
        whereClause.activeContract = {
          employmentStatus: enumValue,
        };
      }
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      whereClause.OR = [
        {
          account: {
            firstName: {
              contains: searchLower,
              mode: 'insensitive',
            },
          },
        },
        {
          account: {
            lastName: {
              contains: searchLower,
              mode: 'insensitive',
            },
          },
        },
        {
          employeeCode: {
            contains: searchLower,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Fetch employees
    const employees: EmployeeData[] = await this.prisma.employeeData.findMany({
      where: whereClause,
      orderBy: [
        {
          account: {
            lastName: 'asc',
          },
        },
        {
          account: {
            firstName: 'asc',
          },
        },
      ],
    });

    // Format responses
    const response: EmployeeDataResponse[] = await Promise.all(
      employees.map(async (employee: EmployeeData) => {
        return await this.employeeListService.formatResponse(
          employee,
          false,
          false,
          false,
          false,
        );
      }),
    );

    return response;
  }
}

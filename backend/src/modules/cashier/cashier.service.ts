import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { AccountService } from '@modules/account/account/account.service';
import { CashierData, Prisma } from '@prisma/client';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import {
  CashierCreateRequest,
  CashierUpdateRequest,
  CashierDeleteRequest,
  CashierListRequest,
} from '@shared/request/cashier.request';
import {
  CashierResponse,
  CashierCreateResponse,
} from '@shared/response/cashier.response';
import { AccountCreateDTO } from '@modules/account/account/account.validator';

@Injectable()
export class CashierService {
  @Inject() private readonly prismaService: PrismaService;
  @Inject() private readonly utilityService: UtilityService;
  @Inject() private readonly accountService: AccountService;

  /**
   * Generate a unique cashier code
   */
  private generateCashierCode(): string {
    return `CASH-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  }

  /**
   * Transform Prisma CashierData to response format
   */
  private toResponse(cashier: any): CashierResponse {
    return {
      accountId: cashier.accountId,
      cashierCode: cashier.cashierCode,
      isActive: cashier.isActive,
      createdAt: cashier.createdAt,
      updatedAt: cashier.updatedAt,
      account: cashier.account
        ? {
            id: cashier.account.id,
            firstName: cashier.account.firstName,
            lastName: cashier.account.lastName,
            middleName: cashier.account.middleName,
            username: cashier.account.username,
            email: cashier.account.email,
            contactNumber: cashier.account.contactNumber,
          }
        : undefined,
    };
  }

  /**
   * Get all cashiers for a company
   */
  async getAllCashiers(
    request: CashierListRequest = {},
  ): Promise<CashierResponse[]> {
    const companyId = this.utilityService.companyId;

    const where: Prisma.CashierDataWhereInput = {
      account: {
        companyId,
      },
    };

    if (!request.includeInactive) {
      where.isActive = true;
    }

    const cashiers = await this.prismaService.cashierData.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            username: true,
            email: true,
            contactNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return cashiers.map((cashier) => this.toResponse(cashier));
  }

  /**
   * Get cashiers for table view (with pagination and filters)
   */
  async getCashierTable(query: TableQueryDTO, body: TableBodyDTO) {
    const companyId = this.utilityService.companyId;

    // Parse pagination
    const page = parseInt(query.page?.toString() || '1');
    const perPage = parseInt(query.perPage?.toString() || '10');
    const skip = (page - 1) * perPage;

    // Build where clause
    const where: Prisma.CashierDataWhereInput = {
      account: {
        companyId,
      },
    };

    // Handle filters from body.filters
    if (body.filters && Array.isArray(body.filters)) {
      for (const filter of body.filters) {
        if (filter.isActive !== undefined) {
          where.isActive = filter.isActive;
        }
      }
    }

    // Handle search if provided
    if (body.searchKeyword && body.searchBy) {
      const keyword = body.searchKeyword;

      if (body.searchBy === 'fullName') {
        // Add search conditions to the account relation using AND
        where.AND = [
          { account: { companyId } },
          {
            OR: [
              {
                account: {
                  firstName: { contains: keyword, mode: 'insensitive' },
                },
              },
              {
                account: {
                  lastName: { contains: keyword, mode: 'insensitive' },
                },
              },
            ],
          },
        ];
        // Remove the base account filter since we moved it to AND
        delete where.account;
      } else if (body.searchBy === 'account.firstName') {
        where.account = {
          companyId,
          firstName: { contains: keyword, mode: 'insensitive' },
        };
      } else if (body.searchBy === 'account.lastName') {
        where.account = {
          companyId,
          lastName: { contains: keyword, mode: 'insensitive' },
        };
      } else if (body.searchBy === 'cashierCode') {
        where.cashierCode = { contains: keyword, mode: 'insensitive' };
      }
    }

    // Get total count for pagination
    const totalCount = await this.prismaService.cashierData.count({ where });

    // Get paginated data
    const cashiers = await this.prismaService.cashierData.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            username: true,
            email: true,
            contactNumber: true,
          },
        },
      },
      skip,
      take: perPage,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / perPage);
    const pagination = this.calculatePagination(page, totalPages);

    return {
      list: cashiers.map((cashier) => this.toResponse(cashier)),
      pagination,
      currentPage: page,
    };
  }

  /**
   * Calculate pagination array for display
   */
  private calculatePagination(currentPage: number, totalPages: number): (number | string)[] {
    const pagination: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pagination.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pagination.push(i);
        }
        pagination.push('...');
        pagination.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pagination.push(1);
        pagination.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pagination.push(i);
        }
      } else {
        pagination.push(1);
        pagination.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pagination.push(i);
        }
        pagination.push('...');
        pagination.push(totalPages);
      }
    }

    return pagination;
  }

  /**
   * Get a single cashier by accountId
   */
  async getCashierByAccountId(
    accountId: string,
  ): Promise<CashierResponse> {
    const companyId = this.utilityService.companyId;

    const cashier = await this.prismaService.cashierData.findFirst({
      where: {
        accountId,
        account: {
          companyId,
        },
      },
      include: {
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            username: true,
            email: true,
            contactNumber: true,
          },
        },
      },
    });

    if (!cashier) {
      throw new NotFoundException('Cashier not found');
    }

    return this.toResponse(cashier);
  }

  /**
   * Create a new cashier
   */
  async createCashier(
    data: CashierCreateRequest,
  ): Promise<CashierCreateResponse> {
    const companyId = this.utilityService.companyId;

    let accountId: string;

    // Check if accountDetails is provided (new account creation)
    if (data.accountDetails) {
      // Step 1: Check if "Cashier" role exists, create if not
      let cashierRole = await this.prismaService.role.findFirst({
        where: {
          name: 'Cashier',
          companyId,
        },
      });

      if (!cashierRole) {
        // Auto-create Cashier role
        cashierRole = await this.prismaService.role.create({
          data: {
            name: 'Cashier',
            description: 'Cashier role for POS operations',
            companyId,
            isDeveloper: false,
            isFullAccess: false,
            level: 1,
            isDeleted: false,
          },
        });
      }

      // Step 2: Create Account with Cashier role
      const accountCreateData: AccountCreateDTO = {
        firstName: data.accountDetails.firstName,
        lastName: data.accountDetails.lastName,
        middleName: data.accountDetails.middleName,
        username: data.accountDetails.username,
        password: data.accountDetails.password,
        email: data.accountDetails.email,
        contactNumber: data.accountDetails.contactNumber,
        roleID: cashierRole.id,
        companyId,
      };

      const account = await this.accountService.createAccount(accountCreateData);
      accountId = account.id;
    } else {
      throw new BadRequestException('Account details are required to create a cashier');
    }

    // Check if account already has cashier data
    const existingCashier = await this.prismaService.cashierData.findUnique({
      where: {
        accountId,
      },
    });

    if (existingCashier) {
      throw new BadRequestException('Account already has cashier data');
    }

    const cashierCode = this.generateCashierCode();

    const cashier = await this.prismaService.cashierData.create({
      data: {
        accountId,
        cashierCode,
        isActive: true,
      },
      include: {
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            username: true,
            email: true,
            contactNumber: true,
          },
        },
      },
    });

    return {
      cashier: this.toResponse(cashier),
      message: 'Cashier created successfully',
    };
  }

  /**
   * Update cashier details
   */
  async updateCashier(
    data: CashierUpdateRequest,
  ): Promise<CashierResponse> {
    const companyId = this.utilityService.companyId;

    // Verify cashier exists and belongs to company
    await this.getCashierByAccountId(data.accountId);

    // Update account details if provided
    if (data.accountUpdateDetails) {
      const accountUpdateData = {
        id: data.accountId,
        firstName: data.accountUpdateDetails.firstName,
        lastName: data.accountUpdateDetails.lastName,
        middleName: data.accountUpdateDetails.middleName,
        username: data.accountUpdateDetails.username,
        email: data.accountUpdateDetails.email,
        contactNumber: data.accountUpdateDetails.contactNumber,
        roleID: '', // Will be fetched from existing account
      };

      // Get current account to preserve roleID
      const currentAccount = await this.prismaService.account.findUnique({
        where: { id: data.accountId },
        select: { roleId: true },
      });

      if (currentAccount) {
        accountUpdateData.roleID = currentAccount.roleId;
      }

      // Update account via AccountService
      await this.accountService.updateAccount(accountUpdateData);
    }

    // Update cashier data (active status only)
    const cashier = await this.prismaService.cashierData.update({
      where: { accountId: data.accountId },
      data: {
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            username: true,
            email: true,
            contactNumber: true,
          },
        },
      },
    });

    return this.toResponse(cashier);
  }

  /**
   * Delete (soft delete) a cashier
   */
  async deleteCashier(
    data: CashierDeleteRequest,
  ): Promise<CashierResponse> {
    // Verify cashier exists and belongs to company
    await this.getCashierByAccountId(data.accountId);

    const cashier = await this.prismaService.cashierData.update({
      where: { accountId: data.accountId },
      data: {
        isActive: false,
      },
      include: {
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            username: true,
            email: true,
            contactNumber: true,
          },
        },
      },
    });

    return this.toResponse(cashier);
  }
}

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, Account } from '@prisma/client';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { PrismaService } from '@common/prisma.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { UtilityService } from '@common/utility.service';
import { EncryptionService } from '@common/encryption.service';
import { AccountDataResponse } from '../../../shared/response/account.response';
import { RoleService } from '@modules/role/role/role.service';
import { CompanyService } from '@modules/company/company/company.service';

@Injectable()
export class DeveloperAccountService {
  @Inject() public utility: UtilityService;
  @Inject() public prisma: PrismaService;
  @Inject() public tableHandler: TableHandlerService;
  @Inject() public encryption: EncryptionService;
  @Inject() public roleService: RoleService;
  @Inject() public companyService: CompanyService;

  async getDeveloperAccount({ id }): Promise<AccountDataResponse> {
    const account = await this.prisma.account.findFirst({
      where: { id, isDeleted: false },
      include: {
        role: {
          include: {
            roleGroup: true,
          },
        },
        company: true,
      },
    });

    if (!account) throw new NotFoundException('Developer account not found');

    return this.formatAccountData(account);
  }

  async developerAccountTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandler.initialize(query, body, 'account');
    const tableQuery = this.tableHandler.constructTableQuery();

    // Show only users from active companies or users without a company
    tableQuery['where'] = {
      ...tableQuery['where'],
      isDeleted: false,
      OR: [{ company: { isActive: true } }, { companyId: null }],
    };

    tableQuery['include'] = {
      role: {
        include: {
          roleGroup: true,
        },
      },
      company: true,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandler.getTableData<Account>(
      this.prisma.account,
      query,
      tableQuery,
    );

    const list = await Promise.all(
      baseList.map(async (account) => {
        return this.formatAccountData(account);
      }),
    );

    return { list, pagination, currentPage };
  }

  async createDeveloperAccount(params) {
    // Check if email or username already exists
    const existingAccount = await this.prisma.account.findFirst({
      where: {
        OR: [{ email: params.email }, { username: params.username }],
      },
    });

    if (existingAccount) {
      throw new BadRequestException('Email or username already exists');
    }

    // Validate role exists and is a developer role
    const role = await this.prisma.role.findFirst({
      where: { id: params.roleId, companyId: null },
    });

    if (!role) {
      throw new BadRequestException('Invalid role');
    }

    // Encrypt password
    const passwordEncryption = await this.encryption.encrypt(params.password);
    const encryptedPassword = passwordEncryption.encrypted;
    const encryptionKey = passwordEncryption.iv;

    const createData: Prisma.AccountCreateInput = {
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      middleName: params.middleName || '',
      contactNumber: params.contactNumber,
      username: params.username,
      password: encryptedPassword,
      key: encryptionKey,
      isDeveloper: params.isDeveloper !== undefined ? params.isDeveloper : true,
      role: { connect: { id: params.roleId } },
      company: params.companyId
        ? { connect: { id: params.companyId } }
        : undefined,
      searchKeyword: this.generateSearchKeyword(params),
    };

    const newAccount = await this.prisma.account.create({
      data: createData,
      include: {
        role: {
          include: {
            roleGroup: true,
          },
        },
        company: true,
      },
    });

    return this.formatAccountData(newAccount);
  }

  async updateDeveloperAccount(params) {
    const account = await this.prisma.account.findFirst({
      where: { id: params.id, isDeleted: false },
    });

    if (!account) {
      throw new NotFoundException('Developer account not found');
    }

    // Check for duplicate email or username if they're being changed
    if (params.email || params.username) {
      const existingAccount = await this.prisma.account.findFirst({
        where: {
          id: { not: params.id },
          OR: [
            params.email ? { email: params.email } : {},
            params.username ? { username: params.username } : {},
          ],
        },
      });

      if (existingAccount) {
        throw new BadRequestException('Email or username already exists');
      }
    }

    const updateData: Prisma.AccountUpdateInput = {
      ...(params.email && { email: params.email }),
      ...(params.firstName && { firstName: params.firstName }),
      ...(params.lastName && { lastName: params.lastName }),
      ...(params.middleName !== undefined && { middleName: params.middleName }),
      ...(params.contactNumber && { contactNumber: params.contactNumber }),
      ...(params.username && { username: params.username }),
      ...(params.isDeveloper !== undefined && {
        isDeveloper: params.isDeveloper,
      }),
      ...(params.roleId && { role: { connect: { id: params.roleId } } }),
      ...(params.companyId !== undefined && {
        company: params.companyId
          ? { connect: { id: params.companyId } }
          : { disconnect: true },
      }),
    };

    // Update password if provided
    if (params.password) {
      const passwordEncryption = await this.encryption.encrypt(params.password);
      updateData.password = passwordEncryption.encrypted;
      updateData.key = passwordEncryption.iv;
    }

    // Update search keyword
    updateData.searchKeyword = this.generateSearchKeyword({
      ...account,
      ...params,
    });

    const updatedAccount = await this.prisma.account.update({
      where: { id: params.id },
      data: updateData,
      include: {
        role: {
          include: {
            roleGroup: true,
          },
        },
        company: true,
      },
    });

    return this.formatAccountData(updatedAccount);
  }

  async deleteDeveloperAccount({ id }) {
    const account = await this.prisma.account.findFirst({
      where: { id, isDeleted: false },
    });

    if (!account) {
      throw new NotFoundException('Developer account not found');
    }

    // Soft delete
    await this.prisma.account.update({
      where: { id },
      data: { isDeleted: true },
    });

    return { message: 'Developer account deleted successfully' };
  }

  async toggleDeveloperStatus(accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, isDeleted: false },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const updatedAccount = await this.prisma.account.update({
      where: { id: accountId },
      data: { isDeveloper: !account.isDeveloper },
      include: {
        role: {
          include: {
            roleGroup: true,
          },
        },
        company: true,
      },
    });

    return {
      message: `Account ${updatedAccount.isDeveloper ? 'granted' : 'revoked'} developer access`,
      account: this.formatAccountData(updatedAccount),
    };
  }

  async getCompanies() {
    const companies = await this.prisma.company.findMany({
      orderBy: { companyName: 'asc' },
    });

    return companies.map((company) => ({
      id: company.id,
      companyName: company.companyName,
    }));
  }

  async getRoles(companyId?: number) {
    const where: any = { isDeleted: false };

    if (companyId) {
      // Get roles for specific company
      where.companyId = companyId;
    } else {
      // Get system-level roles (for developers)
      where.companyId = null;
    }

    const roles = await this.prisma.role.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
    }));
  }

  private generateSearchKeyword(account): string {
    const keywords = [
      account.firstName,
      account.lastName,
      account.middleName,
      account.email,
      account.username,
      account.contactNumber,
    ].filter(Boolean);

    return keywords.join(' ').toLowerCase();
  }

  private async formatAccountData(account): Promise<AccountDataResponse> {
    // Always use roleService for consistent formatting
    const role = await this.roleService.getRole({ id: account.roleId });

    // Format company data if available
    let company = null;
    if (account.company) {
      company = {
        id: account.company.id,
        companyName: account.company.companyName,
        domainPrefix: account.company.domainPrefix,
        businessType: account.company.businessType || '',
        industry: account.company.industry || '',
        businessTypeData: null,
        industryData: null,
        registrationNo: account.company.registrationNo || '',
        website: account.company.website || '',
        email: account.company.email || '',
        phone: account.company.phone || '',
        tinNo: account.company.tinNo || '',
        createdAt: this.utility.formatDate(account.company.createdAt),
        updatedAt: this.utility.formatDate(account.company.updatedAt),
      };
    }

    return {
      id: account.id,
      email: account.email,
      firstName: account.firstName,
      middleName: account.middleName || '',
      lastName: account.lastName,
      fullName: `${account.firstName} ${account.middleName ? account.middleName + ' ' : ''}${account.lastName}`,
      contactNumber: account.contactNumber,
      username: account.username,
      roleID: account.roleId,
      role,
      company,
      parentAccountId: account.parentAccountId,
      status: account.status,
      image: account.image,
      isDeveloper: account.isDeveloper,
      createdAt: this.utility.formatDate(account.createdAt),
      updatedAt: this.utility.formatDate(account.updatedAt),
    };
  }

  async loginAsUser(targetUserId: string) {
    // Get the target user account
    const targetAccount = await this.prisma.account.findFirst({
      where: {
        id: targetUserId,
        isDeleted: false,
      },
      include: {
        role: {
          include: {
            roleGroup: true,
          },
        },
        company: true,
      },
    });

    if (!targetAccount) {
      throw new NotFoundException('Target user not found');
    }

    // Generate a token for the target user
    const token = this.utility.randomString();
    const insertToken: Prisma.AccountTokenCreateInput = {
      account: { connect: { id: targetAccount.id } },
      payload: Buffer.from(JSON.stringify(targetAccount)).toString('base64'),
      userAgent: 'Developer Login As User',
      ipAddress: '127.0.0.1',
      token: token,
      status: 'active' as const,
      updatedAt: new Date(),
    };

    await this.prisma.accountToken.create({ data: insertToken });

    // Format account data
    const accountInformation = await this.formatAccountData(targetAccount);

    return {
      token,
      accountInformation,
    };
  }
}

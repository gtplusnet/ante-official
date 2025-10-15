import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UpdateAccountDto, ChangePasswordDto } from './dto/update-account.dto';
import {
  LinkGoogleAccountDto,
  LinkFacebookAccountDto,
  SetPasswordDto,
  AuthMethodsResponse,
} from './dto/auth-methods.dto';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';
import { PrismaService } from '@common/prisma.service';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { UtilityService } from '@common/utility.service';
import { EncryptionService } from '@common/encryption.service';
import * as bcrypt from 'bcrypt';
import {
  AccountCreateDTO,
  AccountUpdateDTO,
  ChangePasswordDTO,
} from './account.validator';
import { UploadPhotoService } from '@infrastructure/file-upload/upload-photo/upload-photo.service';
import {
  AccountDataResponse,
  MiniAccountDataResponse,
} from '../../../shared/response/account.response';
import { RoleDataResponse } from '../../../shared/response/role.response';
import { RoleService } from '@modules/role/role/role.service';
import { CompanyService } from '../../company/company/company.service';
import { CompanyDataResponse } from '../../../shared/response';
import { ExcelExportService } from '@common/services/excel-export.service';
import { Account, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AccountUpdatedEvent } from '../../../events/account.events';
import { OAuth2Client } from 'google-auth-library';
import * as axios from 'axios';
import { MulterFile } from '../../../types/multer';
import { RedisService } from '@infrastructure/redis/redis.service';

@Injectable()
export class AccountService {
  @Inject() public utility: UtilityService;
  @Inject() public prisma: PrismaService;
  @Inject() public tableHandler: TableHandlerService;
  @Inject() private crypt: EncryptionService;
  @Inject() private uploadPhotoService: UploadPhotoService;
  @Inject() private roleService: RoleService;
  @Inject() private companyService: CompanyService;
  @Inject() private excelExportService: ExcelExportService;
  @Inject() private eventEmitter: EventEmitter2;
  @Inject() private redisService: RedisService;
  private googleClient: OAuth2Client;

  async changePassword(params: ChangePasswordDTO) {
    // For admin changing another user's password
    // Use bcrypt for password hashing
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(params.password, saltRounds);

    // Keep legacy encryption for backward compatibility (will be removed later)
    const password_encryption = await this.crypt.encrypt(params.password);
    const password = password_encryption.encrypted;
    const key = password_encryption.iv;

    const updateResponse = await this.prisma.account.update({
      where: { id: params.id },
      data: {
        password,
        key,
        passwordHash, // Store bcrypt hash
      },
    });

    // Invalidate all tokens for this account in Redis (force re-login after password change)
    try {
      await this.redisService.invalidateAllAccountTokens(params.id);
      this.utility.log(
        `All tokens invalidated for account after password change: ${params.id}`,
      );
    } catch (error) {
      this.utility.log(
        `Error invalidating tokens after password change: ${error.message}`,
      );
      // Don't fail the password change if cache invalidation fails
    }

    // Also invalidate tokens in database
    try {
      await this.prisma.accountToken.updateMany({
        where: { accountId: params.id, status: 'active' },
        data: { status: 'inactive', updatedAt: new Date() },
      });
    } catch (error) {
      this.utility.log(
        `Error invalidating database tokens after password change: ${error.message}`,
      );
    }

    // Emit event for socket notification
    this.eventEmitter.emit(
      'account.updated',
      new AccountUpdatedEvent(params.id, 'password', 'admin'),
    );

    return this.formatData(updateResponse);
  }
  async changeProfilePicture(profile_photo: MulterFile | null) {
    const accountId = this.utility.accountInformation.id;
    let image: string | null;

    if (!profile_photo) {
      // Remove profile picture
      await this.prisma.account.update({
        where: { id: accountId },
        data: { image: null },
      });
      image = null;
    } else {
      // Upload new profile picture
      const path = await this.uploadPhotoService.uploadPhoto(profile_photo);
      await this.prisma.account.update({
        where: { id: accountId },
        data: { image: path },
      });
      image = path;
    }

    // Emit event for socket notification
    this.eventEmitter.emit(
      'account.updated',
      new AccountUpdatedEvent(accountId, 'profile'),
    );

    return { image };
  }

  async updateProfile(accountId: string, data: UpdateAccountDto) {
    const updatedAccount = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      },
    });

    // Emit event for socket notification
    this.eventEmitter.emit(
      'account.updated',
      new AccountUpdatedEvent(accountId, 'profile', 'self'),
    );

    const formattedAccount = await this.formatData(updatedAccount);

    return formattedAccount;
  }

  async changeUserPassword(accountId: string, data: ChangePasswordDto) {
    // Verify current password
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Verify current password
    const isPasswordValid = await this.crypt.decryptAndCompare(
      data.currentPassword,
      account.password,
      account.key as any,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Verify new passwords match
    if (data.newPassword !== data.confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    // Use bcrypt for password hashing
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.newPassword, saltRounds);

    // Keep legacy encryption for backward compatibility (will be removed later)
    const password_encryption = await this.crypt.encrypt(data.newPassword);

    // Update password
    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        password: password_encryption.encrypted,
        key: password_encryption.iv,
        passwordHash, // Store bcrypt hash
      },
    });

    // Invalidate all tokens for this account in Redis (force re-login after password change)
    try {
      await this.redisService.invalidateAllAccountTokens(accountId);
      this.utility.log(
        `All tokens invalidated for account after user password change: ${accountId}`,
      );
    } catch (error) {
      this.utility.log(
        `Error invalidating tokens after user password change: ${error.message}`,
      );
      // Don't fail the password change if cache invalidation fails
    }

    // Also invalidate tokens in database
    try {
      await this.prisma.accountToken.updateMany({
        where: { accountId, status: 'active' },
        data: { status: 'inactive', updatedAt: new Date() },
      });
    } catch (error) {
      this.utility.log(
        `Error invalidating database tokens after user password change: ${error.message}`,
      );
    }

    // Emit event for socket notification
    this.eventEmitter.emit(
      'account.updated',
      new AccountUpdatedEvent(accountId, 'password', 'self'),
    );

    return { success: true, message: 'Password updated successfully' };
  }
  async accountTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandler.initialize(query, body, 'account');
    const tableQuery = this.tableHandler.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['include'] = { role: { include: true }, parent: true };

    tableQuery['where'] = {
      isDeleted: false,
      companyId: this.utility.companyId,
      isInviteAccepted: true, // Only show accepted accounts
      ...tableQuery.where,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandler.getTableData(
      this.prisma.account,
      query,
      tableQuery,
    );
    const list = await this.formatResponseList(baseList as Account[]);
    return { list, pagination, currentPage };
  }

  async accountsNotSetupTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandler.initialize(query, body, 'account');
    const tableQuery = this.tableHandler.constructTableQuery();

    // Fix orderBy clause - ensure we have a valid field to order by
    if (
      !tableQuery.orderBy ||
      (tableQuery.orderBy &&
        typeof tableQuery.orderBy === 'object' &&
        'undefined' in tableQuery.orderBy)
    ) {
      // Replace undefined orderBy with a valid field
      tableQuery.orderBy = { firstName: 'asc' };
    }

    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['include'] = { role: { include: true }, parent: true };

    tableQuery['where'] = {
      isDeleted: false,
      companyId: this.utility.companyId,
      EmployeeData: null, // Filter accounts without EmployeeData
      ...tableQuery.where,
    };

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandler.getTableData(
      this.prisma.account,
      query,
      tableQuery,
    );
    const list = await this.formatResponseList(baseList as Account[]);
    return { list, pagination, currentPage };
  }
  async getAccountInformation({ id }): Promise<AccountDataResponse> {
    const accountInformation = await this.prisma.account.findFirst({
      where: { id },
      include: {
        role: {
          include: {
            roleGroup: true,
            parentRole: true,
          },
        },
      },
    });

    if (!accountInformation) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return await this.formatData(accountInformation);
  }

  private generateSearchKeyword(account: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
  }): string {
    return [
      account.firstName?.toLowerCase() || '',
      account.lastName?.toLowerCase() || '',
      account.email?.toLowerCase() || '',
      account.username?.toLowerCase() || '',
    ]
      .join(' ')
      .trim();
  }

  async createAccount(
    accountData: AccountCreateDTO,
  ): Promise<AccountDataResponse> {
    const developerKey = process.env.DEVELOPER_KEY;
    const assignedRole = await this.prisma.role.findFirst({
      where: { id: accountData.roleID },
    });

    if (!assignedRole) throw new NotFoundException(`Invalid Role ID`);

    if (developerKey != process.env.DEVELOPER_KEY)
      throw new NotFoundException(`Invalid Developer Key`);

    const {
      email,
      username,
      password,
      firstName,
      middleName,
      lastName,
      contactNumber,
      parentAccountId,
      image,
    } = accountData;

    const lowerCaseEmail = email.toLowerCase();
    const lowerCaseUsername = username.toLowerCase();

    // Use bcrypt for new accounts
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Keep legacy encryption for backward compatibility (will be removed later)
    const passwordEncryption = await this.crypt.encrypt(password);
    const encryptedPassword = passwordEncryption.encrypted;
    const encryptionKey = passwordEncryption.iv;

    const emailExists = await this.prisma.account.findFirst({
      where: { email: lowerCaseEmail },
    });
    const usernameExists = await this.prisma.account.findFirst({
      where: { username: lowerCaseUsername },
    });

    if (emailExists) throw new NotFoundException(`Email already exists.`);
    if (usernameExists) throw new NotFoundException(`Username already exists.`);

    let roleToAssign = assignedRole;

    if (!roleToAssign) {
      roleToAssign = await this.prisma.role.findFirst({
        where: { isDeveloper: true },
      });

      if (!roleToAssign) {
        roleToAssign = await this.roleService.seedInitialRole();
      }
    }

    // Level 0 roles should not have a parent
    if (roleToAssign.level === 0 && parentAccountId) {
      throw new BadRequestException('Level 0 roles cannot have a parent user');
    }

    const companyId = accountData.companyId
      ? accountData.companyId
      : this.utility.companyId;

    const accountDataToCreate: Prisma.AccountCreateInput = {
      username: lowerCaseUsername,
      firstName,
      middleName,
      lastName,
      contactNumber,
      email: lowerCaseEmail,
      password: encryptedPassword,
      key: encryptionKey,
      passwordHash: passwordHash, // Store bcrypt hash for new accounts
      role: { connect: { id: roleToAssign.id } },
      company: { connect: { id: companyId } },
      ...(parentAccountId
        ? { parent: { connect: { id: parentAccountId } } }
        : {}),
      image,
      sourceUrl: accountData.sourceUrl,
      searchKeyword: this.generateSearchKeyword({
        firstName,
        lastName,
        email: lowerCaseEmail,
        username: lowerCaseUsername,
      }),
      isDeleted: false, // New accounts are active by default
      ...(accountData.dateOfBirth
        ? { dateOfBirth: accountData.dateOfBirth }
        : {}),
      ...(accountData.gender ? { gender: accountData.gender } : {}),
    };

    const createdAccount = await this.prisma.account.create({
      data: accountDataToCreate,
    });

    this.utility.log(
      `${lowerCaseEmail} has successfully created an account for comapmy ${companyId}.`,
    );

    return this.formatData(createdAccount);
  }
  async updateAccount(
    accountData: AccountUpdateDTO,
  ): Promise<AccountDataResponse> {
    const assignedRole = await this.prisma.role.findFirst({
      where: { id: accountData.roleID },
    });

    if (!assignedRole) throw new NotFoundException(`Invalid Role ID`);

    // Level 0 roles should not have a parent
    if (assignedRole.level === 0 && accountData.parentAccountId) {
      throw new BadRequestException('Level 0 roles cannot have a parent user');
    }

    const updateAccountData = {
      firstName: accountData.firstName,
      lastName: accountData.lastName,
      middleName: accountData.middleName || '', // Add middleName field
      contactNumber: accountData.contactNumber,
      email: accountData.email,
      roleId: accountData.roleID,
      username: accountData.username,
      ...(accountData.parentAccountId
        ? { parentAccountId: accountData.parentAccountId }
        : {}),
      ...(accountData.dateOfBirth !== undefined
        ? { dateOfBirth: accountData.dateOfBirth }
        : {}),
      ...(accountData.gender !== undefined
        ? { gender: accountData.gender }
        : {}),
      ...(accountData.civilStatus !== undefined
        ? { civilStatus: accountData.civilStatus }
        : {}),
      ...(accountData.street !== undefined
        ? { street: accountData.street }
        : {}),
      ...(accountData.city !== undefined ? { city: accountData.city } : {}),
      ...(accountData.stateProvince !== undefined
        ? { stateProvince: accountData.stateProvince }
        : {}),
      ...(accountData.postalCode !== undefined
        ? { postalCode: accountData.postalCode }
        : {}),
      ...(accountData.zipCode !== undefined
        ? { zipCode: accountData.zipCode }
        : {}),
      ...(accountData.country !== undefined
        ? { country: accountData.country }
        : {}),
    };

    // Add searchKeyword update
    updateAccountData['searchKeyword'] = this.generateSearchKeyword({
      firstName: accountData.firstName,
      lastName: accountData.lastName,
      email: accountData.email,
      username: accountData.username,
    });

    if (accountData.parentAccountId && assignedRole.level !== 0) {
      updateAccountData['parentAccountId'] = accountData.parentAccountId;
    } else if (assignedRole.level === 0) {
      // Ensure level 0 roles have no parent
      updateAccountData['parentAccountId'] = null;
    }

    const updateResponse = await this.prisma.account.update({
      where: { id: accountData.id },
      data: updateAccountData,
    });

    // Emit event for socket notification
    this.eventEmitter.emit(
      'account.updated',
      new AccountUpdatedEvent(accountData.id, 'profile'),
    );

    const formattedResponse = await this.formatData(updateResponse);

    return formattedResponse;
  }
  async deleteUser({ id, deletedBy = null, reason = null }) {
    const accountInformation = await this.prisma.account.findFirst({
      where: { id },
      include: { role: true },
    });

    // Check if account exists
    if (!accountInformation) throw new NotFoundException(`Account not found`);

    // Check how many super admin left

    const superAdminCount = await this.prisma.account.count({
      where: { isDeleted: false, role: { level: 0 } },
    });

    // Check if account is super admin
    if (accountInformation.role.level === 0 && superAdminCount <= 1) {
      throw new NotFoundException(`Cannot delete the last super admin`);
    }

    // Cannot delete account that is currently logged in
    if (this.utility.accountInformation.id === id) {
      throw new NotFoundException(`Cannot delete currently logged in account`);
    }

    // Check child account

    const childAccount = await this.prisma.account.findFirst({
      where: { parentAccountId: id },
    });

    if (childAccount) {
      throw new NotFoundException(
        `There are accounts that are reporting to this user. Please reassign them first.`,
      );
    }

    // Get deletedBy account details if provided
    let deletedByUsername = null;
    if (deletedBy) {
      const deletedByAccount = await this.prisma.account.findUnique({
        where: { id: deletedBy },
        select: { username: true },
      });
      deletedByUsername = deletedByAccount?.username;
    }

    // Create audit log before deletion
    await this.prisma.accountDeletionLog.create({
      data: {
        deletedAccountId: accountInformation.id,
        deletedUsername: accountInformation.username,
        deletedEmail: accountInformation.email,
        deletedByAccountId: deletedBy,
        deletedByUsername: deletedByUsername,
        reason: reason,
        deletionType: 'soft',
        metadata: {
          accountType: accountInformation.accountType,
          roleId: accountInformation.roleId,
          companyId: accountInformation.companyId,
          roleLevel: accountInformation.role.level,
          isDeveloper: accountInformation.isDeveloper,
        },
      },
    });

    const updateResponse = await this.prisma.account.update({
      where: { id },
      data: { isDeleted: true },
    });

    // Emit event for socket notification
    this.eventEmitter.emit(
      'account.updated',
      new AccountUpdatedEvent(id, 'deactivation'),
    );

    return this.formatData(updateResponse);
  }

  async restoreUser(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (!account.isDeleted) {
      throw new BadRequestException('Account is already active');
    }

    const updateResponse = await this.prisma.account.update({
      where: { id },
      data: { isDeleted: false },
    });

    // Emit event for socket notification
    this.eventEmitter.emit(
      'account.updated',
      new AccountUpdatedEvent(id, 'restoration'),
    );

    return this.formatData(updateResponse);
  }

  async searchAssignees(
    query: TableQueryDTO,
    body: TableBodyDTO,
    currentUserId: string,
  ) {
    this.tableHandler.initialize(query, body, 'account');
    const tableQuery = this.tableHandler.constructTableQuery();

    if (query.search) {
      tableQuery['where'] = {
        isDeleted: false,
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    tableQuery['orderBy'] = [{ firstName: 'asc' }, { lastName: 'asc' }];

    const accounts = await this.prisma.account.findMany({
      where: {
        isDeleted: false,
        ...tableQuery.where,
      },
      include: {
        role: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    const results = accounts.map((account) => ({
      id: account.id,
      fullName:
        account.id === currentUserId
          ? `${account.firstName} ${account.lastName} (Me)`
          : `${account.firstName} ${account.lastName}`,
      role: account.role.name,
    }));

    const groupedResults = results.reduce((acc, account) => {
      if (!acc[account.role]) {
        acc[account.role] = [];
      }
      acc[account.role].push({
        id: account.id,
        fullName: account.fullName,
      });
      return acc;
    }, {});

    const categorizedResults = Object.keys(groupedResults).map((role) => ({
      role,
      users: groupedResults[role],
    }));

    return {
      list: categorizedResults,
      pagination: {
        currentPage: 1,
        perPage: accounts.length,
        total: accounts.length,
      },
    };
  }

  async searchAccount(
    query: TableQueryDTO,
    body: TableBodyDTO,
    searchQuery?: string,
  ): Promise<{
    list: MiniAccountDataResponse[];
    pagination: any;
    currentPage: number;
  }> {
    this.tableHandler.initialize(query, body, 'account');
    const tableQuery = this.tableHandler.constructTableQuery();
    // Fix orderBy clause - ensure we have a valid field to order by
    if (
      !tableQuery.orderBy ||
      (tableQuery.orderBy &&
        typeof tableQuery.orderBy === 'object' &&
        'undefined' in tableQuery.orderBy)
    ) {
      // Replace undefined orderBy with a valid field
      tableQuery.orderBy = { createdAt: 'desc' };
    }
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['include'] = { role: { include: true } };

    // Always filter by company
    tableQuery['where'] = {
      companyId: this.utility.companyId,
    };

    if (searchQuery) {
      tableQuery['where'] = {
        companyId: this.utility.companyId,
        OR: [
          { firstName: { contains: searchQuery, mode: 'insensitive' } },
          { lastName: { contains: searchQuery, mode: 'insensitive' } },
        ],
      };
    }

    const {
      list: baseList,
      currentPage,
      pagination,
    } = (await this.tableHandler.getTableData(
      this.prisma.account,
      query,
      tableQuery,
    )) as { list: Account[]; currentPage: number; pagination: any };

    // Map to MiniAccountDataResponse using miniFormatData
    const list: MiniAccountDataResponse[] = await Promise.all(
      baseList.map((account) => this.miniFormatData(account)),
    );
    return { list, pagination, currentPage };
  }

  private async formatData(
    accountInformation: any,
  ): Promise<AccountDataResponse> {
    // Check if role is already included in the account data
    let role: RoleDataResponse;
    if (accountInformation.role) {
      // Role is already loaded, format it directly
      role = await this.roleService.formatRoleData(accountInformation.role);
    } else {
      // Role not loaded, fetch it
      role = await this.roleService.getRole({
        id: accountInformation.roleId,
      });
    }

    // Only fetch company if companyId exists and is not already cached
    let company: CompanyDataResponse | null = null;
    if (accountInformation.companyId) {
      // Check Redis cache first for company
      const cacheKey = `company:${accountInformation.companyId}`;
      const cachedCompany = await this.redisService.get<CompanyDataResponse>(cacheKey);

      if (cachedCompany) {
        company = cachedCompany;
      } else {
        company = await this.companyService.getInformation(accountInformation.companyId);
        // Cache the company
        if (company) {
          await this.redisService.set(cacheKey, company, 86400); // 24hr TTL
        }
      }
    }

    const formattedData: AccountDataResponse = {
      id: accountInformation.id,
      firstName: accountInformation.firstName,
      lastName: accountInformation.lastName,
      middleName: accountInformation.middleName,
      fullName: this.setFullName(accountInformation),
      contactNumber: accountInformation.contactNumber,
      email: accountInformation.email,
      status: accountInformation.status,
      username: accountInformation.username,
      image: accountInformation.image,
      roleID: accountInformation.roleId,
      role,
      company,
      parentAccountId: accountInformation.parentAccountId,
      createdAt: this.utility.formatDate(accountInformation.createdAt),
      updatedAt: this.utility.formatDate(accountInformation.updatedAt),
      isDeleted: accountInformation.isDeleted,
      isEmailVerified: accountInformation.isEmailVerified,
      dateOfBirth: accountInformation.dateOfBirth,
      gender: accountInformation.gender,
      civilStatus: accountInformation.civilStatus,
      street: accountInformation.street,
      city: accountInformation.city,
      stateProvince: accountInformation.stateProvince,
      postalCode: accountInformation.postalCode,
      zipCode: accountInformation.zipCode,
      country: accountInformation.country,
    };

    if (accountInformation.isDeveloper) {
      formattedData.isDeveloper = true;
    }

    return formattedData;
  }

  private async formatResponseList(
    dataList: Account[],
  ): Promise<AccountDataResponse[]> {
    return Promise.all(dataList.map((account) => this.formatData(account)));
  }

  private setFullName(accountInformation: Account): string {
    const lastName =
      accountInformation.lastName.charAt(0).toUpperCase() +
      accountInformation.lastName.slice(1);
    const firstName =
      accountInformation.firstName.charAt(0).toUpperCase() +
      accountInformation.firstName.slice(1);
    const middleName =
      accountInformation.middleName.charAt(0).toUpperCase() +
      accountInformation.middleName.slice(1);
    const fullName = `${lastName}, ${firstName} ${middleName}`;
    return fullName.trim();
  }

  async exportAccountsToExcel(): Promise<Buffer> {
    // Fetch accounts (not paginated, for export)
    const accounts = await this.prisma.account.findMany({
      where: { isDeleted: false, companyId: this.utility.companyId },
      include: { role: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
    // Fetch all possible roles for dropdown
    const allRoles = await this.prisma.role.findMany({
      where: { isDeleted: false },
    });
    const roleNames = allRoles.map((r) => r.name);
    const columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Role', key: 'role', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ];
    const data = accounts.map((acc) => ({
      id: acc.id,
      firstName: acc.firstName,
      lastName: acc.lastName,
      email: acc.email,
      username: acc.username,
      role: acc.role?.name,
      status: acc.status,
    }));

    // Pass dropdowns parameter for the Role column
    return await this.excelExportService.exportToExcel(
      columns,
      data,
      'Accounts',
      [{ columnKey: 'role', options: roleNames }],
    );
  }

  private miniAccountDataResponse(account: Account): MiniAccountDataResponse {
    return {
      id: account.id,
      firstName: account.firstName,
      lastName: account.lastName,
      fullName: `${account.firstName} ${account.lastName}`,
      email: account.email,
      image: account.image,
    };
  }

  private async miniFormatData(
    account: Account,
  ): Promise<MiniAccountDataResponse> {
    return {
      id: account.id,
      firstName: account.firstName,
      lastName: account.lastName,
      fullName: this.setFullName(account),
      email: account.email,
      image: account.image,
    };
  }

  async pendingInvitesTable(query: TableQueryDTO, body: TableBodyDTO) {
    this.tableHandler.initialize(query, body, 'accountInvite');
    const tableQuery = this.tableHandler.constructTableQuery();

    tableQuery['include'] = {
      role: true,
      invitedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    };

    tableQuery['where'] = {
      companyId: this.utility.companyId,
      isAccepted: false,
      ...tableQuery.where,
    };

    // Add custom orderBy if not specified
    if (!tableQuery.orderBy) {
      tableQuery.orderBy = { createdAt: 'desc' };
    }

    const { list, currentPage, pagination } =
      await this.tableHandler.getTableData(
        this.prisma.accountInvite,
        query,
        tableQuery,
      );

    // Format the invite data
    const formattedList = list.map((invite: any) => ({
      id: invite.id,
      email: invite.email,
      firstName: invite.firstName,
      lastName: invite.lastName,
      role: invite.role,
      invitedBy: invite.invitedBy,
      createdAt: this.utility.formatDate(invite.createdAt),
      inviteTokenExpiry: this.utility.formatDate(invite.inviteTokenExpiry),
      isExpired: new Date() > new Date(invite.inviteTokenExpiry),
      status:
        new Date() > new Date(invite.inviteTokenExpiry) ? 'Expired' : 'Pending',
    }));

    return { list: formattedList, pagination, currentPage };
  }

  // Auth Methods Management
  async getAuthMethods(accountId: string): Promise<AuthMethodsResponse> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: {
        password: true,
        googleId: true,
        googleEmail: true,
        facebookId: true,
        facebookEmail: true,
        authProvider: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const hasPassword = !!account.password;
    const hasGoogle = !!account.googleId;
    const hasFacebook = !!account.facebookId;
    const connectedMethods = [hasPassword, hasGoogle, hasFacebook].filter(
      Boolean,
    ).length;

    return {
      hasPassword,
      hasGoogle,
      hasFacebook,
      googleEmail: account.googleEmail,
      facebookEmail: account.facebookEmail,
      primaryMethod: account.authProvider,
      connectedMethods,
    };
  }

  async linkGoogleAccount(
    accountId: string,
    data: LinkGoogleAccountDto,
  ): Promise<AuthMethodsResponse> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.googleId) {
      throw new BadRequestException('Google account already linked');
    }

    try {
      // Initialize Google OAuth client if not already done
      if (!this.googleClient) {
        this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      }

      // Verify the Google ID token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: data.googleIdToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new BadRequestException('Invalid Google token');
      }

      const googleId = payload.sub;
      const googleEmail = payload.email;

      // Check if this Google account is already linked to another user
      const existingAccount = await this.prisma.account.findFirst({
        where: {
          googleId,
          id: { not: accountId },
        },
      });

      if (existingAccount) {
        throw new BadRequestException(
          'This Google account is already linked to another user',
        );
      }

      // Link the Google account
      await this.prisma.account.update({
        where: { id: accountId },
        data: {
          googleId,
          googleEmail,
        },
      });

      // Emit event for socket notification
      this.eventEmitter.emit(
        'account.updated',
        new AccountUpdatedEvent(accountId, 'auth-methods'),
      );

      return this.getAuthMethods(accountId);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to verify Google token');
    }
  }

  async linkFacebookAccount(
    accountId: string,
    data: LinkFacebookAccountDto,
  ): Promise<AuthMethodsResponse> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.facebookId) {
      throw new BadRequestException('Facebook account already linked');
    }

    try {
      // Verify the Facebook access token and get user info
      const response = await axios.default.get(
        `https://graph.facebook.com/me?fields=id,email&access_token=${data.facebookAccessToken}`,
      );

      const { id: facebookId, email: facebookEmail } = response.data;

      // Check if this Facebook account is already linked to another user
      const existingAccount = await this.prisma.account.findFirst({
        where: {
          facebookId,
          id: { not: accountId },
        },
      });

      if (existingAccount) {
        throw new BadRequestException(
          'This Facebook account is already linked to another user',
        );
      }

      // Link the Facebook account
      await this.prisma.account.update({
        where: { id: accountId },
        data: {
          facebookId,
          facebookEmail,
        },
      });

      // Emit event for socket notification
      this.eventEmitter.emit(
        'account.updated',
        new AccountUpdatedEvent(accountId, 'auth-methods'),
      );

      return this.getAuthMethods(accountId);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to verify Facebook token');
    }
  }

  async setPassword(
    accountId: string,
    data: SetPasswordDto,
  ): Promise<AuthMethodsResponse> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // If user already has a password, verify the current one
    if (account.password) {
      if (!data.currentPassword) {
        throw new BadRequestException('Current password is required');
      }

      const isPasswordValid = await this.crypt.decryptAndCompare(
        data.currentPassword,
        account.password,
        account.key as any,
      );

      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }
    }

    // Use bcrypt for password hashing
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    // Keep legacy encryption for backward compatibility (will be removed later)
    const passwordEncryption = await this.crypt.encrypt(data.password);

    // Update the password
    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        password: passwordEncryption.encrypted,
        key: passwordEncryption.iv,
        passwordHash, // Store bcrypt hash
      },
    });

    // Invalidate all tokens for this account in Redis (force re-login after password change)
    try {
      await this.redisService.invalidateAllAccountTokens(accountId);
      this.utility.log(
        `All tokens invalidated for account after password set: ${accountId}`,
      );
    } catch (error) {
      this.utility.log(
        `Error invalidating tokens after password set: ${error.message}`,
      );
      // Don't fail the password change if cache invalidation fails
    }

    // Also invalidate tokens in database
    try {
      await this.prisma.accountToken.updateMany({
        where: { accountId, status: 'active' },
        data: { status: 'inactive', updatedAt: new Date() },
      });
    } catch (error) {
      this.utility.log(
        `Error invalidating database tokens after password set: ${error.message}`,
      );
    }

    // Emit event for socket notification
    this.eventEmitter.emit(
      'account.updated',
      new AccountUpdatedEvent(accountId, 'password'),
    );

    return this.getAuthMethods(accountId);
  }

  async unlinkGoogleAccount(accountId: string): Promise<AuthMethodsResponse> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (!account.googleId) {
      throw new BadRequestException('No Google account linked');
    }

    // Check if user has at least one other auth method
    const hasPassword = !!account.password;
    const hasFacebook = !!account.facebookId;

    if (!hasPassword && !hasFacebook) {
      throw new BadRequestException(
        'Cannot unlink Google account. You must have at least one login method',
      );
    }

    // If Google is the primary auth provider, switch to another available method
    let newAuthProvider = account.authProvider;
    if (account.authProvider === 'GOOGLE') {
      newAuthProvider = hasPassword ? 'LOCAL' : 'FACEBOOK';
    }

    // Unlink the Google account
    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        googleId: null,
        googleEmail: null,
        authProvider: newAuthProvider,
      },
    });

    // Emit event for socket notification
    this.eventEmitter.emit(
      'account.updated',
      new AccountUpdatedEvent(accountId, 'auth-methods'),
    );

    return this.getAuthMethods(accountId);
  }

  async unlinkFacebookAccount(accountId: string): Promise<AuthMethodsResponse> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (!account.facebookId) {
      throw new BadRequestException('No Facebook account linked');
    }

    // Check if user has at least one other auth method
    const hasPassword = !!account.password;
    const hasGoogle = !!account.googleId;

    if (!hasPassword && !hasGoogle) {
      throw new BadRequestException(
        'Cannot unlink Facebook account. You must have at least one login method',
      );
    }

    // If Facebook is the primary auth provider, switch to another available method
    let newAuthProvider = account.authProvider;
    if (account.authProvider === 'FACEBOOK') {
      newAuthProvider = hasPassword ? 'LOCAL' : 'GOOGLE';
    }

    // Unlink the Facebook account
    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        facebookId: null,
        facebookEmail: null,
        authProvider: newAuthProvider,
      },
    });

    // Emit event for socket notification
    this.eventEmitter.emit(
      'account.updated',
      new AccountUpdatedEvent(accountId, 'auth-methods'),
    );

    return this.getAuthMethods(accountId);
  }

  async disconnectPassword(accountId: string): Promise<AuthMethodsResponse> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Check if user has other auth methods
    const hasOtherMethods = account.googleId || account.facebookId;
    if (!hasOtherMethods) {
      throw new BadRequestException(
        'Cannot disconnect password. You must have at least one authentication method.',
      );
    }

    // Remove password
    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        password: null,
        key: null,
      },
    });

    // Emit event for socket notification
    this.eventEmitter.emit(
      'account.updated',
      new AccountUpdatedEvent(accountId, 'auth-methods'),
    );

    return this.getAuthMethods(accountId);
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { UtilityService } from '@common/utility.service';
import { PrismaService } from '@common/prisma.service';
import { UserLevel, SystemModule, ScopeList } from '@prisma/client';
import {
  UserLevelDataResponse,
  UserLevelTreeResponse,
} from '../../../shared/response/user-level.response';
import {
  CreateUserLevelRequest,
  UpdateUserLevelRequest,
} from '../../../shared/request/user-level.request';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { TableResponse } from '../../../shared/response/table.response';
import UserLevelReference from '../../../reference/user-level-reference';
import { OTPService } from '@modules/communication/otp/otp/otp.service';

@Injectable()
export class UserLevelService {
  @Inject() public tableHandlerService: TableHandlerService;
  @Inject() public utility: UtilityService;
  @Inject() public prisma: PrismaService;
  @Inject() public otpService: OTPService;

  async resetDefault(): Promise<{ message: string }> {
    const companyId = this.utility.companyId;
    const count = await this.prisma.userLevel.count({ where: { companyId } });
    if (count === 0) {
      // No user levels exist, reset to default automatically
      const defaultUserLevels = UserLevelReference.map((item) => {
        // Separate enum scopes from dynamic scopes
        const enumScopes = item.scope.filter((s) => s in ScopeList);
        const dynamicScopes = item.scope.filter((s) => !(s in ScopeList));

        return {
          label: item.label,
          systemModule: item.systemModule,
          scope: enumScopes, // Only enum values
          scopeJson:
            dynamicScopes.length > 0 ? JSON.stringify(dynamicScopes) : null,
          companyId,
        };
      });
      if (defaultUserLevels.length > 0) {
        await this.prisma.userLevel.createMany({ data: defaultUserLevels });
      }
      return {
        message: 'User levels were empty and have been reset to default.',
      };
    }
    // Delete all user levels for this company
    await this.prisma.userLevel.deleteMany({ where: { companyId } });
    // Prepare default user levels with companyId
    const defaultUserLevels = UserLevelReference.map((item) => {
      // Separate enum scopes from dynamic scopes
      const enumScopes = item.scope.filter((s) => s in ScopeList);
      const dynamicScopes = item.scope.filter((s) => !(s in ScopeList));

      return {
        label: item.label,
        systemModule: item.systemModule,
        scope: enumScopes, // Only enum values
        scopeJson:
          dynamicScopes.length > 0 ? JSON.stringify(dynamicScopes) : null,
        companyId,
      };
    });

    // Insert all default user levels
    if (defaultUserLevels.length > 0) {
      await this.prisma.userLevel.createMany({ data: defaultUserLevels });
    }

    return {
      message: 'User levels reset successfully',
    };
  }

  async resetDefaultWithOTP(otp: string): Promise<{ message: string }> {
    const accountId = this.utility.accountInformation.id;
    const isValid = await this.otpService.verifyGenericOTP(
      accountId,
      'RESET_USER_LEVEL',
      otp,
    );
    if (!isValid) {
      throw new NotFoundException('Invalid or expired OTP');
    }
    return this.resetDefault();
  }

  async requestResetUserLevelOTP(): Promise<{ message: string }> {
    const accountId = this.utility.accountInformation.id;
    await this.otpService.generateGenericOTP(accountId, 'RESET_USER_LEVEL');
    return { message: 'OTP sent successfully' };
  }

  private async formatResponse(
    data: UserLevel,
  ): Promise<UserLevelDataResponse> {
    // Combine enum scopes with dynamic scopes from scopeJson
    let allScopes = [...data.scope];

    // If scopeJson exists and is an array, add those scopes too
    if (data.scopeJson) {
      try {
        // scopeJson could be an array or a stringified array
        const dynamicScopes = Array.isArray(data.scopeJson)
          ? data.scopeJson
          : typeof data.scopeJson === 'string'
            ? JSON.parse(data.scopeJson)
            : data.scopeJson;

        if (Array.isArray(dynamicScopes)) {
          allScopes = [...allScopes, ...dynamicScopes];
        }
      } catch (e) {
        // If parsing fails, just use enum scopes
        this.utility.log(
          `Failed to parse scopeJson for UserLevel ${data.id}: ${e.message}`,
        );
      }
    }

    return {
      id: data.id,
      label: data.label,
      systemModule: data.systemModule,
      scope: allScopes,
    };
  }

  async add(data: CreateUserLevelRequest): Promise<UserLevelDataResponse> {
    const companyId = this.utility.companyId;

    // Separate enum scopes from dynamic scopes
    const enumScopes = data.scope.filter((scope) => {
      return Object.values(ScopeList).includes(scope as any);
    });

    // Dynamic scopes are those not in the enum
    const dynamicScopes = data.scope.filter((scope) => {
      return !Object.values(ScopeList).includes(scope as any);
    });

    const created = await this.prisma.userLevel.create({
      data: {
        label: data.label,
        systemModule: data.systemModule,
        companyId,
        scope: enumScopes,
        scopeJson: dynamicScopes.length > 0 ? dynamicScopes : null,
      },
    });
    return this.formatResponse(created);
  }

  async edit(
    id: number,
    data: UpdateUserLevelRequest,
  ): Promise<UserLevelDataResponse> {
    const companyId = this.utility.companyId;
    const existing = await this.prisma.userLevel.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId)
      throw new NotFoundException('UserLevel not found');

    // Separate enum scopes from dynamic scopes
    const enumScopes = data.scope.filter((scope) => {
      return Object.values(ScopeList).includes(scope as any);
    });

    // Dynamic scopes are those not in the enum
    const dynamicScopes = data.scope.filter((scope) => {
      return !Object.values(ScopeList).includes(scope as any);
    });

    const updated = await this.prisma.userLevel.update({
      where: { id },
      data: {
        label: data.label,
        systemModule: data.systemModule,
        scope: enumScopes,
        scopeJson: dynamicScopes.length > 0 ? dynamicScopes : null,
      },
    });
    this.utility.log(`User level ${data.label}: ${id ? 'updated' : 'created'}`);
    return this.formatResponse(updated);
  }

  async delete(id: number): Promise<UserLevelDataResponse> {
    const companyId = this.utility.companyId;
    const existing = await this.prisma.userLevel.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId)
      throw new NotFoundException('UserLevel not found');
    const deleted = await this.prisma.userLevel.delete({ where: { id } });
    return this.formatResponse(deleted);
  }

  async table(
    query: TableQueryDTO,
    body: TableBodyDTO,
  ): Promise<TableResponse<UserLevelDataResponse>> {
    this.tableHandlerService.initialize(query, body, 'userLevel');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: this.utility.companyId,
    };
    const {
      list: baseList,
      currentPage,
      pagination,
      totalCount,
    } = await this.tableHandlerService.getTableData(
      this.prisma.userLevel,
      query,
      tableQuery,
    );
    if (totalCount === 0) {
      await this.resetDefault();
      const retry = await this.tableHandlerService.getTableData(
        this.prisma.userLevel,
        query,
        tableQuery,
      );
      const formattedList: UserLevelDataResponse[] = await Promise.all(
        retry.list.map((item) => this.formatResponse(item as UserLevel)),
      );
      return {
        list: formattedList,
        pagination: retry.pagination,
        currentPage: retry.currentPage,
        totalCount: retry.totalCount,
      };
    }
    const formattedList: UserLevelDataResponse[] = await Promise.all(
      baseList.map((item) => this.formatResponse(item as UserLevel)),
    );

    return { list: formattedList, pagination, currentPage, totalCount };
  }

  async info(id: number): Promise<UserLevelDataResponse> {
    const companyId = this.utility.companyId;
    const found = await this.prisma.userLevel.findUnique({ where: { id } });
    if (!found || found.companyId !== companyId)
      throw new NotFoundException('UserLevel not found');
    return this.formatResponse(found);
  }

  async tree(): Promise<UserLevelTreeResponse[]> {
    // Group user levels by system module for the logged-in user's company
    const companyId = this.utility.companyId;
    const modules = Object.values(SystemModule);
    const all = await this.prisma.userLevel.findMany({ where: { companyId } });
    return Promise.all(
      modules.map(async (module) => ({
        id: module,
        label: module,
        userLevel: await Promise.all(
          all
            .filter((ul) => ul.systemModule === module)
            .map((ul) => this.formatResponse(ul)),
        ),
      })),
    );
  }

  // ===== DEFAULT USER LEVELS (companyId: null) =====
  async getDefaultList(): Promise<UserLevelDataResponse[]> {
    const list = await this.prisma.userLevel.findMany({
      where: { companyId: null },
    });
    return Promise.all(list.map((item) => this.formatResponse(item)));
  }

  async addDefault(
    data: CreateUserLevelRequest,
  ): Promise<UserLevelDataResponse> {
    // Separate enum scopes from dynamic scopes
    const enumScopes = data.scope.filter((scope) => {
      return Object.values(ScopeList).includes(scope as any);
    });

    // Dynamic scopes are those not in the enum
    const dynamicScopes = data.scope.filter((scope) => {
      return !Object.values(ScopeList).includes(scope as any);
    });

    const created = await this.prisma.userLevel.create({
      data: {
        label: data.label,
        systemModule: data.systemModule,
        companyId: null,
        scope: enumScopes,
        scopeJson: dynamicScopes.length > 0 ? dynamicScopes : null,
      },
    });
    return this.formatResponse(created);
  }

  async editDefault(
    id: number,
    data: UpdateUserLevelRequest,
  ): Promise<UserLevelDataResponse> {
    const existing = await this.prisma.userLevel.findUnique({ where: { id } });
    if (!existing || existing.companyId !== null)
      throw new NotFoundException('Default UserLevel not found');

    // Separate enum scopes from dynamic scopes
    const enumScopes = data.scope.filter((scope) => {
      return Object.values(ScopeList).includes(scope as any);
    });

    // Dynamic scopes are those not in the enum
    const dynamicScopes = data.scope.filter((scope) => {
      return !Object.values(ScopeList).includes(scope as any);
    });

    const updated = await this.prisma.userLevel.update({
      where: { id },
      data: {
        label: data.label,
        systemModule: data.systemModule,
        scope: enumScopes,
        scopeJson: dynamicScopes.length > 0 ? dynamicScopes : null,
      },
    });
    return this.formatResponse(updated);
  }

  async deleteDefault(id: number): Promise<UserLevelDataResponse> {
    const existing = await this.prisma.userLevel.findUnique({ where: { id } });
    if (!existing || existing.companyId !== null)
      throw new NotFoundException('Default UserLevel not found');
    const deleted = await this.prisma.userLevel.delete({ where: { id } });
    return this.formatResponse(deleted);
  }

  async tableDefault(
    query: TableQueryDTO,
    body: TableBodyDTO,
  ): Promise<TableResponse<UserLevelDataResponse>> {
    this.tableHandlerService.initialize(query, body, 'userLevel');
    const tableQuery = this.tableHandlerService.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';
    tableQuery['where'] = {
      ...tableQuery['where'],
      companyId: null,
    };
    const {
      list: baseList,
      currentPage,
      pagination,
      totalCount,
    } = await this.tableHandlerService.getTableData(
      this.prisma.userLevel,
      query,
      tableQuery,
    );
    const formattedList: UserLevelDataResponse[] = await Promise.all(
      baseList.map((item) => this.formatResponse(item as UserLevel)),
    );
    return { list: formattedList, pagination, currentPage, totalCount };
  }

  // ===== DEFAULT USER LEVELS RESET WITH OTP =====
  async requestResetDefaultUserLevelOTP(): Promise<{ message: string }> {
    const accountId = this.utility.accountInformation.id;
    await this.otpService.generateGenericOTP(
      accountId,
      'RESET_DEFAULT_USER_LEVEL',
    );
    return { message: 'OTP sent successfully' };
  }

  async resetDefaultWithOTPDefault(otp: string): Promise<{ message: string }> {
    const accountId = this.utility.accountInformation.id;
    const isValid = await this.otpService.verifyGenericOTP(
      accountId,
      'RESET_DEFAULT_USER_LEVEL',
      otp,
    );
    if (!isValid) {
      throw new NotFoundException('Invalid or expired OTP');
    }
    // Delete all default user levels
    await this.prisma.userLevel.deleteMany({ where: { companyId: null } });
    // Optionally, re-insert hardcoded defaults here if you want to repopulate
    const defaultUserLevels = UserLevelReference.map((item) => ({
      label: item.label,
      systemModule: item.systemModule,
      scope: item.scope,
      companyId: null,
    }));
    await this.prisma.userLevel.createMany({ data: defaultUserLevels });
    return { message: 'Default user levels reset successfully' };
  }

  async treeDefault(): Promise<UserLevelTreeResponse[]> {
    // Group user levels by system module for default user levels (companyId: null)
    const modules = Object.values(SystemModule);
    const all = await this.prisma.userLevel.findMany({
      where: { companyId: null },
    });
    return Promise.all(
      modules.map(async (module) => ({
        id: module,
        label: module,
        userLevel: await Promise.all(
          all
            .filter((ul) => ul.systemModule === module)
            .map((ul) => this.formatResponse(ul)),
        ),
      })),
    );
  }
}

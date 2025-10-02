import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { CompanyDataResponse } from '../../../shared/response';
import { Company, Prisma } from '@prisma/client';
import {
  CompanyCreateDTO,
  CompanyWithInitialUserDTO,
} from './company.validator';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { TableHandlerService } from '@common/table.handler/table.handler.service';
import { TableQueryDTO, TableBodyDTO } from '@common/table.dto/table.dto';
import { BUSINESS_TYPE_OPTIONS } from '../../../reference/business-type.reference';
import { INDUSTRY_OPTIONS } from '../../../reference/industry.reference';
import { UploadPhotoService } from '@infrastructure/file-upload/upload-photo/upload-photo.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CompanyCreatedEvent } from '../../../events/company.events';
import { EncryptionService } from '@common/encryption.service';
import { MulterFile } from '../../../types/multer';
import {
  AccountDataResponse,
  RoleDataResponse,
} from '../../../shared/response';
import { RedisService } from '@infrastructure/redis/redis.service';

@Injectable()
export class CompanyService {
  @Inject() private prisma: PrismaService;
  @Inject() private utility: UtilityService;
  @Inject() private tableHandler: TableHandlerService;
  @Inject() private uploadPhotoService: UploadPhotoService;
  @Inject() private eventEmitter: EventEmitter2;
  @Inject() private encryptionService: EncryptionService;
  @Inject() private redisService: RedisService;

  async getInformation(id: number): Promise<CompanyDataResponse | null> {
    if (!id) return null;

    const company: Company = await this.prisma.company.findUnique({
      where: { id: id },
    });

    if (!company) return null;

    return await this.formatResponse(company);
  }
  async createCompany(params: CompanyCreateDTO): Promise<CompanyDataResponse> {
    const companyCreateInput: Prisma.CompanyCreateInput = {
      companyName: params.companyName,
      domainPrefix: params.domainPrefix,
      businessType: params.businessType,
      industry: params.industry,
      registrationNo: params.registrationNo,
      phone: params.phone,
      tinNo: params.tinNo,
      disabledModules: params.disabledModules || [],
    };

    const company: Company = await this.prisma.company.create({
      data: companyCreateInput,
    });

    // Emit company created event for seeders and other listeners
    this.eventEmitter.emit(
      'company.created',
      new CompanyCreatedEvent(company.id, company.companyName, company),
    );

    return await this.formatResponse(company);
  }

  async updateCompany(
    id: number,
    updateData: UpdateCompanyDto,
  ): Promise<CompanyDataResponse> {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    const updateInput: Prisma.CompanyUpdateInput = {
      ...(updateData.companyName !== undefined && {
        companyName: updateData.companyName,
      }),
      ...(updateData.domainPrefix !== undefined && {
        domainPrefix: updateData.domainPrefix,
      }),
      ...(updateData.businessType !== undefined && {
        businessType: updateData.businessType,
      }),
      ...(updateData.industry !== undefined && {
        industry: updateData.industry,
      }),
      ...(updateData.registrationNo !== undefined && {
        registrationNo: updateData.registrationNo,
      }),
      ...(updateData.website !== undefined && { website: updateData.website }),
      ...(updateData.email !== undefined && { email: updateData.email }),
      ...(updateData.phone !== undefined && { phone: updateData.phone }),
      ...(updateData.tinNo !== undefined && { tinNo: updateData.tinNo }),
      ...(updateData.address !== undefined && { address: updateData.address }),
      ...(updateData.logoUrl !== undefined && { logoUrl: updateData.logoUrl }),
      ...(updateData.disabledModules !== undefined && {
        disabledModules: updateData.disabledModules,
      }),
    };

    const updatedCompany = await this.prisma.company.update({
      where: { id },
      data: updateInput,
    });

    // Invalidate cache after successful update
    await this.redisService.invalidateEntityCache('company', id);
    this.utility.log(`Company cache invalidated for ID: ${id}`);

    return this.formatResponse(updatedCompany);
  }

  private async formatResponse(data: Company): Promise<CompanyDataResponse> {
    const businessTypeOption =
      BUSINESS_TYPE_OPTIONS.find((opt) => opt.value === data.businessType) ||
      null;
    const industryOption =
      INDUSTRY_OPTIONS.find((opt) => opt.value === data.industry) || null;

    return {
      id: data.id,
      companyName: data.companyName,
      domainPrefix: data.domainPrefix,
      businessType: data.businessType,
      industry: data.industry,
      businessTypeData: businessTypeOption,
      industryData: industryOption,
      registrationNo: data.registrationNo,
      website: data.website,
      email: data.email,
      phone: data.phone,
      tinNo: data.tinNo,
      address: data.address,
      isActive: data.isActive,
      logoUrl: data.logoUrl,
      disabledModules: (data.disabledModules as string[]) || [],
      createdAt: this.utility.formatDate(data.createdAt),
      updatedAt: this.utility.formatDate(data.updatedAt),
    };
  }

  async getAllCompanies(): Promise<CompanyDataResponse[]> {
    const companies = await this.prisma.company.findMany({
      where: {
        isActive: true,
      },
    });
    return Promise.all(
      companies.map((company) => this.formatResponse(company)),
    );
  }

  async deleteCompany(id: number): Promise<CompanyDataResponse> {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    const deletedCompany = await this.prisma.company.delete({
      where: { id },
    });

    return this.formatResponse(deletedCompany);
  }

  async getCompaniesTable(
    query: TableQueryDTO,
    body: TableBodyDTO,
  ): Promise<{
    list: CompanyDataResponse[];
    pagination: any;
    currentPage: number;
  }> {
    this.tableHandler.initialize(query, body, 'companies');
    const tableQuery = this.tableHandler.constructTableQuery();
    tableQuery['relationLoadStrategy'] = 'join';

    // Add isActive filter if provided in body filters
    if (body.filters && Array.isArray(body.filters)) {
      const isActiveFilter = body.filters.find((f) => 'isActive' in f);
      if (isActiveFilter) {
        if (!tableQuery.where) {
          tableQuery.where = {};
        }
        (tableQuery.where as any).isActive = isActiveFilter.isActive;
      }
    }

    const {
      list: baseList,
      currentPage,
      pagination,
    } = await this.tableHandler.getTableData(
      this.prisma.company,
      query,
      tableQuery,
    );
    const responseList = await Promise.all(
      baseList.map((company: Company) => this.formatResponse(company)),
    );

    return { list: responseList, pagination, currentPage };
  }

  async uploadLogo(
    companyId: number,
    file: MulterFile,
  ): Promise<{ logoUrl: string }> {
    // Upload the file to S3/Spaces
    const uploadedFileUrl = await this.uploadPhotoService.uploadPhoto(file);

    // Update the company with the new logo URL
    await this.prisma.company.update({
      where: { id: companyId },
      data: { logoUrl: uploadedFileUrl },
    });

    // Invalidate cache after logo update
    await this.redisService.invalidateEntityCache('company', companyId);
    this.utility.log(`Company cache invalidated for ID: ${companyId} (logo update)`);

    return { logoUrl: uploadedFileUrl };
  }

  async createCompanyWithInitialUser(
    dto: CompanyWithInitialUserDTO,
  ): Promise<{ company: CompanyDataResponse; user: AccountDataResponse }> {
    // Pre-transaction validation: Check for existing email and username
    // Note: There's a known issue with Prisma + Supabase where findFirst can throw
    // unique constraint errors inappropriately. We handle this gracefully.

    // Check for existing username (globally unique)
    const existingUsername = await this.prisma.account.findFirst({
      where: { username: dto.user.username },
    });

    if (existingUsername) {
      throw new BadRequestException(
        `Username '${dto.user.username}' is already taken. Please choose a different username.`,
      );
    }

    // Check if company domain prefix already exists
    const existingDomain = await this.prisma.company.findFirst({
      where: { domainPrefix: dto.company.domainPrefix },
    });

    if (existingDomain) {
      throw new BadRequestException(
        `Domain prefix '${dto.company.domainPrefix}' is already in use. Please choose a different domain prefix.`,
      );
    }

    // Use a transaction to ensure atomicity with increased timeout
    let result;
    try {
      result = await this.prisma.$transaction(async (tx) => {
      // Step 1: Create the company
      const companyCreateInput: Prisma.CompanyCreateInput = {
        companyName: dto.company.companyName,
        domainPrefix: dto.company.domainPrefix,
        businessType: dto.company.businessType,
        industry: dto.company.industry,
        registrationNo: dto.company.registrationNo,
        phone: dto.company.phone,
        tinNo: dto.company.tinNo,
      };

      const company = await tx.company.create({
        data: companyCreateInput,
      });

      // Step 2: Create a minimal level 0 role directly
      const level0Role = await tx.role.create({
        data: {
          companyId: company.id,
          name: 'Admin',
          level: 0,
          description: 'Administrator role',
          isDeveloper: true,
          isDeleted: false,
        },
      });

      // Step 4: Create the user in the same transaction
      // Encrypt the password
      const passwordEncryption = await this.encryptionService.encrypt(
        dto.user.password,
      );

      // Create the initial user account
      // Wrap in try-catch to provide better error messages for constraint violations
      let account;
      try {
        account = await tx.account.create({
          data: {
            username: dto.user.username,
            email: dto.user.email,
            password: passwordEncryption.encrypted,
            key: passwordEncryption.iv,
            firstName: dto.user.firstName,
            lastName: dto.user.lastName,
            role: {
              connect: { id: level0Role.id },
            },
            company: {
              connect: { id: company.id },
            },
            contactNumber: '',
          },
          include: {
            role: true,
            company: true,
          },
        });
      } catch (error: any) {
        // Handle unique constraint violations with user-friendly messages
        if (error.code === 'P2002') {
          const target = error.meta?.target;
          if (Array.isArray(target) && target.includes('email')) {
            throw new BadRequestException(
              `Email address '${dto.user.email}' is already registered. Please use a different email address.`,
            );
          }
          if (Array.isArray(target) && target.includes('username')) {
            throw new BadRequestException(
              `Username '${dto.user.username}' is already taken. Please choose a different username.`,
            );
          }
          // Fallback for other unique constraint errors
          throw new BadRequestException(
            `Unable to create user: A unique constraint was violated. Please check your email and username.`,
          );
        }
        // Re-throw the original error if it's not a constraint violation we handle
        throw error;
      }

      // Return both company and account from the transaction
      return { company, account, level0Role };
      }, {
        maxWait: 10000, // Maximum time to wait for transaction to start (10s)
        timeout: 30000, // Maximum time for the entire transaction (30s)
      });
    } catch (error: any) {
      // If error was already handled and converted to BadRequestException, re-throw it
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Handle Prisma errors that bubble up from transaction
      if (error.code === 'P2002') {
        const message = error.message || '';
        if (message.includes('email')) {
          throw new BadRequestException(
            `Email address '${dto.user.email}' is already registered. Please use a different email address.`,
          );
        }
        if (message.includes('username')) {
          throw new BadRequestException(
            `Username '${dto.user.username}' is already taken. Please choose a different username.`,
          );
        }
        if (message.includes('domainPrefix')) {
          throw new BadRequestException(
            `Domain prefix '${dto.company.domainPrefix}' is already in use. Please choose a different domain prefix.`,
          );
        }
        // Generic unique constraint error
        throw new BadRequestException(
          'Unable to create company and user: A unique constraint was violated.',
        );
      }

      // Re-throw unexpected errors
      throw error;
    }

    // Step 5: Emit company created event for other async seeders (non-critical)
    this.eventEmitter.emit(
      'company.created',
      new CompanyCreatedEvent(
        result.company.id,
        result.company.companyName,
        result.company,
      ),
    );

    // Step 6: Format responses
    const companyResponse = await this.formatResponse(result.company);
    const accountResponse: AccountDataResponse = {
      id: result.account.id,
      firstName: result.account.firstName,
      lastName: result.account.lastName,
      middleName: result.account.middleName || '',
      username: result.account.username,
      email: result.account.email,
      contactNumber: result.account.contactNumber,
      roleID: result.level0Role.id,
      role: {
        id: result.level0Role.id,
        name: result.level0Role.name,
        level: result.level0Role.level,
        description: result.level0Role.description || '',
        isDeveloper: result.level0Role.level === 0,
        isDeleted: false,
        roleGroupId: result.level0Role.roleGroupId,
        parentRole: null,
        roleGroup: {
          id: '',
          name: '',
          description: '',
        },
        userLevels: [],
        isFullAccess: result.level0Role.level === 0,
        employeeCount: 0,
        updatedAt: this.utility.formatDate(result.level0Role.updatedAt),
        createdAt: this.utility.formatDate(result.level0Role.createdAt),
        scopeList: [],
      } as RoleDataResponse,
      company: companyResponse,
      parentAccountId: null,
      status: result.account.status,
      image: result.account.image || '',
      createdAt: this.utility.formatDate(result.account.createdAt),
      updatedAt: this.utility.formatDate(result.account.updatedAt),
    };

    return {
      company: companyResponse,
      user: accountResponse,
    };
  }


  async updateCompanyStatus(
    id: number,
    isActive: boolean,
  ): Promise<CompanyDataResponse> {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    const updatedCompany = await this.prisma.company.update({
      where: { id },
      data: { isActive },
    });

    // Invalidate cache after status update
    await this.redisService.invalidateEntityCache('company', id);
    this.utility.log(`Company cache invalidated for ID: ${id} (status update to ${isActive})`);

    return this.formatResponse(updatedCompany);
  }
}

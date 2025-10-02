import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { AllowanceConfiguration, AllowanceType, Prisma } from '@prisma/client';
import {
  CreateAllowanceConfigurationRequest,
  UpdateAllowanceConfigurationRequest,
} from '../../../../shared/request/allowance-configuration.request';
import {
  AllowanceConfigurationDataResponse,
  AllowanceCategoryDataResponse,
  TaxBasisDataResponse,
  AllowanceTreeResponse,
} from '../../../../shared/response/allowance-configuration.response';

const AllowanceTypeReference: AllowanceCategoryDataResponse[] = [
  { key: 'DEMINIMIS', value: 'De Minimis' },
  { key: 'TAXABLE', value: 'Taxable' },
  { key: 'NON_TAXABLE', value: 'Non-Taxable' },
];

const TaxBasisReference: TaxBasisDataResponse[] = [
  { key: 'TAXABLE', value: 'Taxable' },
  { key: 'NON_TAXABLE', value: 'Non-Taxable' },
];

@Injectable()
export class AllowanceConfigurationService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;

  async getById(id: number): Promise<AllowanceConfigurationDataResponse> {
    id = Number(id);
    const data = await this.prisma.allowanceConfiguration.findUnique({
      where: {
        id,
      },
    });
    return await this.formatResponse(data);
  }

  getCategories(): AllowanceCategoryDataResponse[] {
    return AllowanceTypeReference;
  }

  getTaxBasis(): TaxBasisDataResponse[] {
    return TaxBasisReference;
  }

  async getAll(): Promise<AllowanceConfigurationDataResponse[]> {
    const data = await this.prisma.allowanceConfiguration.findMany({
      where: {
        companyId: this.utilityService.companyId,
        isDeleted: false,
      },
    });
    return await Promise.all(data.map((item) => this.formatResponse(item)));
  }

  async getByCategory(
    category: AllowanceType,
  ): Promise<AllowanceConfigurationDataResponse[]> {
    const data = await this.prisma.allowanceConfiguration.findMany({
      where: {
        companyId: this.utilityService.companyId,
        isDeleted: false,
        category: category,
      },
    });

    return await Promise.all(data.map((item) => this.formatResponse(item)));
  }

  async getTree(): Promise<AllowanceTreeResponse[]> {
    const categories = this.getCategories();

    const response = await Promise.all(
      categories.map(async (category) => {
        const children: AllowanceConfigurationDataResponse[] =
          await this.getByCategory(category.key);

        return {
          key: category.key,
          value: category.value,
          children: children,
        };
      }),
    );

    return response;
  }

  async getSelectOptions(): Promise<{ label: string; value: number }[]> {
    const allowances = await this.prisma.allowanceConfiguration.findMany({
      where: {
        companyId: this.utilityService.companyId,
        isDeleted: false,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return allowances.map((allowance) => ({
      label: allowance.name,
      value: allowance.id,
    }));
  }

  async create(
    request: CreateAllowanceConfigurationRequest,
    updateId: number = null,
  ): Promise<AllowanceConfigurationDataResponse> {
    // Check if any allowance (including archived) with the same name already exists for this company
    const existingAllowance =
      await this.prisma.allowanceConfiguration.findFirst({
        where: {
          name: request.name,
          companyId: this.utilityService.companyId,
          id: updateId ? { not: updateId } : undefined,
        },
      });

    if (existingAllowance) {
      if (existingAllowance.isDeleted) {
        throw new BadRequestException(
          `Allowance with name '${request.name}' already exists as an archived item. Please use a different name.`,
        );
      } else {
        throw new BadRequestException(
          `Allowance with name '${request.name}' already exists for this company`,
        );
      }
    }

    // Only use fields that exist in the AllowanceConfiguration model
    const createInputParams: Prisma.AllowanceConfigurationCreateInput = {
      name: request.name, // should be present in the DTO and interface
      category: request.allowanceCategory, // should be present in the DTO and interface
      company: {
        connect: {
          id: this.utilityService.companyId,
        },
      },
    };

    let data = null;
    if (updateId) {
      data = await this.prisma.allowanceConfiguration.update({
        where: {
          id: updateId,
        },
        data: createInputParams,
      });
    } else {
      data = await this.prisma.allowanceConfiguration.create({
        data: createInputParams,
      });
    }
    return this.formatResponse(data);
  }

  async update(
    request: UpdateAllowanceConfigurationRequest,
  ): Promise<AllowanceConfigurationDataResponse> {
    request.id = Number(request.id);
    return await this.create(request, request.id);
  }

  async delete(id: number): Promise<AllowanceConfigurationDataResponse> {
    id = Number(id);
    const data = await this.prisma.allowanceConfiguration.update({
      where: { id },
      data: { isDeleted: true },
    });
    await this.prisma.allowancePlan.updateMany({
      where: {
        allowanceConfigurationId: id,
      },
      data: { isActive: false },
    });
    return this.formatResponse(data);
  }

  async formatResponse(
    data: AllowanceConfiguration,
  ): Promise<AllowanceConfigurationDataResponse> {
    return {
      id: data.id,
      name: data.name,
      category: AllowanceTypeReference.find((cat) => cat.key === data.category),
      taxBasis: data.taxBasis,
      createdAt: this.utilityService.formatDate(data.createdAt),
      updatedAt: this.utilityService.formatDate(data.updatedAt),
    };
  }
}

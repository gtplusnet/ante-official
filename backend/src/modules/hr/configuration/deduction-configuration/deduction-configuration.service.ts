import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  CreateDeductionConfigurationRequest,
  UpdateDeductionConfigurationRequest,
} from '../../../../shared/request';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { DeductionConfiguration, Prisma } from '@prisma/client';
import {
  DeductionCategoryDataResponse,
  DeductionConfigurationDataResponse,
} from '../../../../shared/response';
import { DeductionCategoryReference } from '../../../../reference/deduction-category.reference';

@Injectable()
export class DeductionConfigurationService {
  @Inject() public prisma: PrismaService;
  @Inject() public utilityService: UtilityService;

  async getById(id: number): Promise<DeductionConfigurationDataResponse> {
    id = Number(id);
    const data = await this.prisma.deductionConfiguration.findUnique({
      where: {
        id,
      },
    });

    return await this.formatResponse(data);
  }

  async getCategories(): Promise<DeductionCategoryDataResponse[]> {
    return DeductionCategoryReference;
  }

  async getParents(): Promise<DeductionConfigurationDataResponse[]> {
    const data = await this.prisma.deductionConfiguration.findMany({
      where: {
        companyId: this.utilityService.companyId,
        parentDeductionId: null,
        isDeleted: false,
      },
    });

    return await Promise.all(data.map((item) => this.formatResponse(item)));
  }

  async getSelectOptions(): Promise<{ label: string; value: number }[]> {
    const deductions = await this.prisma.deductionConfiguration.findMany({
      where: {
        companyId: this.utilityService.companyId,
        isDeleted: false,
        category: {
          not: 'LOAN',
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return deductions.map((deduction) => ({
      label: deduction.name,
      value: deduction.id,
    }));
  }

  async create(
    request: CreateDeductionConfigurationRequest,
    updateId: number = null,
  ) {
    // Check if any deduction (including archived) with the same name already exists for this company
    const existingDeduction =
      await this.prisma.deductionConfiguration.findFirst({
        where: {
          name: request.name,
          companyId: this.utilityService.companyId,
          id: updateId ? { not: updateId } : undefined,
        },
      });

    if (existingDeduction) {
      if (existingDeduction.isDeleted) {
        throw new BadRequestException(
          `Deduction with name '${request.name}' already exists as an archived item. Please use a different name.`,
        );
      } else {
        throw new BadRequestException(
          `Deduction with name '${request.name}' already exists for this company`,
        );
      }
    }

    const createInputParams: Prisma.DeductionConfigurationCreateInput = {
      name: request.name,
      category: request.deductionCategory,
      company: {
        connect: {
          id: this.utilityService.companyId,
        },
      },
    };

    if (request.parentDeduction) {
      const parentDeduction =
        await this.prisma.deductionConfiguration.findUnique({
          where: {
            id: request.parentDeduction,
          },
        });

      if (!parentDeduction) {
        throw new BadRequestException('Parent deduction not found');
      } else if (parentDeduction.parentDeductionId) {
        throw new BadRequestException(
          'Parent deduction is already a parent deduction',
        );
      } else {
        createInputParams.parentDeduction = {
          connect: {
            id: request.parentDeduction,
          },
        };
        createInputParams.category = parentDeduction.category;
      }
    }

    let data = null;

    if (updateId) {
      data = await this.prisma.deductionConfiguration.update({
        where: {
          id: updateId,
        },
        data: createInputParams,
      });
    } else {
      data = await this.prisma.deductionConfiguration.create({
        data: createInputParams,
      });
    }

    return this.formatResponse(data);
  }

  async update(request: UpdateDeductionConfigurationRequest) {
    request.id = Number(request.id);
    return await this.create(request, request.id);
  }

  async delete(id: number) {
    id = Number(id);
    const data = await this.prisma.deductionConfiguration.update({
      where: { id },
      data: { isDeleted: true },
    });

    await this.prisma.deductionConfiguration.updateMany({
      where: {
        parentDeductionId: id,
      },
      data: { isDeleted: true },
    });

    await this.prisma.deductionPlan.updateMany({
      where: {
        deductionConfigurationId: id,
      },
      data: { isActive: false },
    });

    return this.formatResponse(data);
  }

  async formatResponse(
    data: DeductionConfiguration,
  ): Promise<DeductionConfigurationDataResponse> {
    const childDeduction = await this.prisma.deductionConfiguration.findMany({
      where: {
        parentDeductionId: data.id,
        isDeleted: false,
      },
    });

    const childDeductionResponse = await Promise.all(
      childDeduction.map((child) => this.formatResponse(child)),
    );

    return {
      id: data.id,
      name: data.name,
      isParentDeduction: data.parentDeductionId ? false : true,
      category: DeductionCategoryReference.find(
        (category) => category.key === data.category,
      ),
      childDeduction: childDeductionResponse,
      createdAt: this.utilityService.formatDate(data.createdAt),
      updatedAt: this.utilityService.formatDate(data.updatedAt),
    };
  }
}

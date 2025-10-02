import { Test } from '@nestjs/testing';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { BadRequestException } from '@nestjs/common';
import { DeductionConfigurationService } from '../src/modules/hr/configuration/deduction-configuration/deduction-configuration.service';
import { AllowanceConfigurationService } from '../src/modules/hr/configuration/allowance-configuration/allowance-configuration.service';
import { DeductionCategory, AllowanceType, TaxBasis } from '@prisma/client';

describe('Deduction and Allowance Validation Tests', () => {
  let deductionService: DeductionConfigurationService;
  let allowanceService: AllowanceConfigurationService;
  let prismaService: PrismaService;

  const mockCompanyId = 1;
  const mockUserId = 1;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DeductionConfigurationService,
        AllowanceConfigurationService,
        {
          provide: PrismaService,
          useValue: {
            deductionConfiguration: {
              findFirst: jest.fn(),
              findMany: jest.fn().mockResolvedValue([]),
              create: jest.fn(),
              update: jest.fn(),
            },
            allowanceConfiguration: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: UtilityService,
          useValue: {
            companyId: mockCompanyId,
            userId: mockUserId,
            formatDate: jest.fn((date) => date?.toISOString()),
          },
        },
      ],
    }).compile();

    deductionService = moduleRef.get<DeductionConfigurationService>(
      DeductionConfigurationService,
    );
    allowanceService = moduleRef.get<AllowanceConfigurationService>(
      AllowanceConfigurationService,
    );
    prismaService = moduleRef.get<PrismaService>(PrismaService);
  });

  describe('Deduction Configuration Validation', () => {
    it('should throw error when name exists as archived item', async () => {
      // Mock finding an archived deduction
      jest
        .spyOn(prismaService.deductionConfiguration, 'findFirst')
        .mockResolvedValue({
          id: 1,
          name: 'SSS',
          companyId: mockCompanyId,
          isDeleted: true, // Archived item
          category: DeductionCategory.DEDUCTION,
          parentDeductionId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      await expect(
        deductionService.create({
          name: 'SSS',
          deductionCategory: DeductionCategory.DEDUCTION,
        }),
      ).rejects.toThrow(
        new BadRequestException(
          "Deduction with name 'SSS' already exists as an archived item. Please use a different name.",
        ),
      );
    });

    it('should throw error when name exists as active item', async () => {
      // Mock finding an active deduction
      jest
        .spyOn(prismaService.deductionConfiguration, 'findFirst')
        .mockResolvedValue({
          id: 1,
          name: 'SSS',
          companyId: mockCompanyId,
          isDeleted: false, // Active item
          category: DeductionCategory.DEDUCTION,
          parentDeductionId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      await expect(
        deductionService.create({
          name: 'SSS',
          deductionCategory: DeductionCategory.DEDUCTION,
        }),
      ).rejects.toThrow(
        new BadRequestException(
          "Deduction with name 'SSS' already exists for this company",
        ),
      );
    });

    it('should allow creation when name does not exist', async () => {
      // Mock not finding any existing deduction
      jest
        .spyOn(prismaService.deductionConfiguration, 'findFirst')
        .mockResolvedValue(null);

      const mockCreatedDeduction = {
        id: 1,
        name: 'NewDeduction',
        companyId: mockCompanyId,
        isDeleted: false,
        category: DeductionCategory.DEDUCTION,
        parentDeductionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(prismaService.deductionConfiguration, 'create')
        .mockResolvedValue(mockCreatedDeduction);

      const result = await deductionService.create({
        name: 'NewDeduction',
        deductionCategory: DeductionCategory.DEDUCTION,
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('NewDeduction');
    });
  });

  describe('Allowance Configuration Validation', () => {
    it('should throw error when name exists as archived item', async () => {
      // Mock finding an archived allowance
      jest
        .spyOn(prismaService.allowanceConfiguration, 'findFirst')
        .mockResolvedValue({
          id: 1,
          name: 'Transportation',
          companyId: mockCompanyId,
          isDeleted: true, // Archived item
          category: AllowanceType.DEMINIMIS,
          parentDeductionId: null,
          taxBasis: TaxBasis.TAXABLE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      await expect(
        allowanceService.create({
          name: 'Transportation',
          allowanceCategory: AllowanceType.DEMINIMIS,
        }),
      ).rejects.toThrow(
        new BadRequestException(
          "Allowance with name 'Transportation' already exists as an archived item. Please use a different name.",
        ),
      );
    });

    it('should throw error when name exists as active item', async () => {
      // Mock finding an active allowance
      jest
        .spyOn(prismaService.allowanceConfiguration, 'findFirst')
        .mockResolvedValue({
          id: 1,
          name: 'Transportation',
          companyId: mockCompanyId,
          isDeleted: false, // Active item
          category: AllowanceType.DEMINIMIS,
          parentDeductionId: null,
          taxBasis: TaxBasis.TAXABLE,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      await expect(
        allowanceService.create({
          name: 'Transportation',
          allowanceCategory: AllowanceType.DEMINIMIS,
        }),
      ).rejects.toThrow(
        new BadRequestException(
          "Allowance with name 'Transportation' already exists for this company",
        ),
      );
    });

    it('should allow creation when name does not exist', async () => {
      // Mock not finding any existing allowance
      jest
        .spyOn(prismaService.allowanceConfiguration, 'findFirst')
        .mockResolvedValue(null);

      const mockCreatedAllowance = {
        id: 1,
        name: 'NewAllowance',
        companyId: mockCompanyId,
        isDeleted: false,
        category: AllowanceType.DEMINIMIS,
        parentDeductionId: null,
        taxBasis: TaxBasis.TAXABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(prismaService.allowanceConfiguration, 'create')
        .mockResolvedValue(mockCreatedAllowance);

      const result = await allowanceService.create({
        name: 'NewAllowance',
        allowanceCategory: AllowanceType.DEMINIMIS,
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('NewAllowance');
    });
  });
});

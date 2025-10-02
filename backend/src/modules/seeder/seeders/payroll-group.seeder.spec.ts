import { Test, TestingModule } from '@nestjs/testing';
import { PayrollGroupSeeder } from './payroll-group.seeder';
import { PrismaService } from '@common/prisma.service';
import {
  CutoffType,
  SalaryRateType,
  DeductionType,
  DeductionPeriod,
  DeductionTargetBasis,
} from '@prisma/client';

describe('PayrollGroupSeeder', () => {
  let seeder: PayrollGroupSeeder;
  let prismaService: PrismaService;

  // Mock data
  const mockCompanyId = 1;
  const mockCompany = {
    id: mockCompanyId,
    companyName: 'Test Company',
    isActive: true,
  };

  const mockSemiMonthlyCutoff = {
    id: 1,
    cutoffCode: 'SEMIMONTHLY-DEFAULT',
    cutoffType: CutoffType.SEMIMONTHLY,
    cutoffConfig: JSON.stringify({
      firstCutoffPeriod: 15,
      lastCutoffPeriod: 28,
    }),
    releaseProcessingDays: 3,
    companyId: mockCompanyId,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMonthlyCutoff = {
    id: 2,
    cutoffCode: 'MONTHLY-DEFAULT',
    cutoffType: CutoffType.MONTHLY,
    cutoffConfig: JSON.stringify({ cutoffPeriod: 25 }),
    releaseProcessingDays: 5,
    companyId: mockCompanyId,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRegularMonthlyPayrollGroup = {
    id: 1,
    payrollGroupCode: 'REGULAR-MONTHLY',
    cutoffId: 1,
    salaryRateType: SalaryRateType.MONTHLY_RATE,
    lateGraceTimeMinutes: 15,
    undertimeGraceTimeMinutes: 15,
    overtimeGraceTimeMinutes: 30,
    lateDeductionType: DeductionType.BASED_ON_SALARY,
    undertimeDeductionType: DeductionType.BASED_ON_SALARY,
    lateDeductionCustom: '{}',
    undertimeDeductionCustom: '{}',
    absentDeductionHours: 8,
    shiftingWorkingDaysPerWeek: 5,
    overtimeRateFactors: '{}',
    deductionPeriodPagibig: DeductionPeriod.EVERY_PERIOD,
    deductionPeriodPhilhealth: DeductionPeriod.EVERY_PERIOD,
    deductionPeriodSSS: DeductionPeriod.EVERY_PERIOD,
    deductionPeriodWitholdingTax: DeductionPeriod.EVERY_PERIOD,
    deductionBasisPhilhealth: DeductionTargetBasis.BASIC_SALARY,
    deductionBasisSSS: DeductionTargetBasis.BASIC_SALARY,
    companyId: mockCompanyId,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock transaction object
  const mockTransaction = {
    cutoff: {
      create: jest.fn(),
    },
    payrollGroup: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: {
            company: {
              findUnique: jest.fn(),
            },
            payrollGroup: {
              count: jest.fn(),
            },
            cutoff: {
              count: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    seeder = new PayrollGroupSeeder(prismaService);
  });

  describe('Properties', () => {
    it('should have correct type', () => {
      expect(seeder.type).toBe('payroll_group');
    });

    it('should have correct name', () => {
      expect(seeder.name).toBe('Payroll Group');
    });

    it('should have correct description', () => {
      expect(seeder.description).toBe(
        'Creates default cutoffs and payroll groups for a company',
      );
    });
  });

  describe('canSeed', () => {
    it('should return true when company exists and has no payroll groups or cutoffs', async () => {
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany as any);
      jest.spyOn(prismaService.payrollGroup, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.cutoff, 'count').mockResolvedValue(0);

      const result = await seeder.canSeed(mockCompanyId);

      expect(result).toBe(true);
      expect(prismaService.company.findUnique).toHaveBeenCalledWith({
        where: { id: mockCompanyId },
      });
      expect(prismaService.payrollGroup.count).toHaveBeenCalledWith({
        where: { companyId: mockCompanyId, isDeleted: false },
      });
      expect(prismaService.cutoff.count).toHaveBeenCalledWith({
        where: { companyId: mockCompanyId, isDeleted: false },
      });
    });

    it('should return false when company does not exist', async () => {
      jest.spyOn(prismaService.company, 'findUnique').mockResolvedValue(null);

      const result = await seeder.canSeed(mockCompanyId);

      expect(result).toBe(false);
      expect(prismaService.company.findUnique).toHaveBeenCalledWith({
        where: { id: mockCompanyId },
      });
      expect(prismaService.payrollGroup.count).not.toHaveBeenCalled();
      expect(prismaService.cutoff.count).not.toHaveBeenCalled();
    });

    it('should return false when company has existing payroll groups', async () => {
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany as any);
      jest.spyOn(prismaService.payrollGroup, 'count').mockResolvedValue(1);
      jest.spyOn(prismaService.cutoff, 'count').mockResolvedValue(0);

      const result = await seeder.canSeed(mockCompanyId);

      expect(result).toBe(false);
    });

    it('should return false when company has existing cutoffs', async () => {
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany as any);
      jest.spyOn(prismaService.payrollGroup, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.cutoff, 'count').mockResolvedValue(1);

      const result = await seeder.canSeed(mockCompanyId);

      expect(result).toBe(false);
    });

    it('should return false when company has both payroll groups and cutoffs', async () => {
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany as any);
      jest.spyOn(prismaService.payrollGroup, 'count').mockResolvedValue(1);
      jest.spyOn(prismaService.cutoff, 'count').mockResolvedValue(1);

      const result = await seeder.canSeed(mockCompanyId);

      expect(result).toBe(false);
    });
  });

  describe('seed', () => {
    beforeEach(() => {
      // Setup mock returns for cutoff creation
      mockTransaction.cutoff.create
        .mockResolvedValueOnce(mockSemiMonthlyCutoff)
        .mockResolvedValueOnce(mockMonthlyCutoff);

      // Setup mock returns for payroll group creation
      mockTransaction.payrollGroup.create
        .mockResolvedValueOnce(mockRegularMonthlyPayrollGroup)
        .mockResolvedValueOnce({
          ...mockRegularMonthlyPayrollGroup,
          id: 2,
          payrollGroupCode: 'DAILY-WAGE',
        })
        .mockResolvedValueOnce({
          ...mockRegularMonthlyPayrollGroup,
          id: 3,
          payrollGroupCode: 'CONTRACTUAL',
        });
    });

    it('should successfully seed cutoffs and payroll groups', async () => {
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany as any);
      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (fn: any) => {
          return fn(mockTransaction);
        });

      const result = await seeder.seed(mockCompanyId);

      expect(result.totalRecords).toBe(5); // 2 cutoffs + 3 payroll groups
      expect(result.processedRecords).toBe(5);
      expect(result.errors).toEqual([]);
      expect(result.details).toBeDefined();
      expect(result.details?.cutoffs).toHaveLength(2);
      expect(result.details?.payrollGroups).toHaveLength(3);

      // Verify cutoff creation
      expect(mockTransaction.cutoff.create).toHaveBeenCalledTimes(2);
      expect(mockTransaction.cutoff.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cutoffCode: 'SEMIMONTHLY-DEFAULT',
          cutoffType: CutoffType.SEMIMONTHLY,
          companyId: mockCompanyId,
        }),
      });
      expect(mockTransaction.cutoff.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cutoffCode: 'MONTHLY-DEFAULT',
          cutoffType: CutoffType.MONTHLY,
          companyId: mockCompanyId,
        }),
      });

      // Verify payroll group creation
      expect(mockTransaction.payrollGroup.create).toHaveBeenCalledTimes(3);
      expect(mockTransaction.payrollGroup.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          payrollGroupCode: 'REGULAR-MONTHLY',
          salaryRateType: SalaryRateType.MONTHLY_RATE,
          companyId: mockCompanyId,
        }),
      });
    });

    it('should throw error when company does not exist', async () => {
      jest.spyOn(prismaService.company, 'findUnique').mockResolvedValue(null);

      await expect(seeder.seed(mockCompanyId)).rejects.toThrow(
        `Failed to seed payroll groups for company ${mockCompanyId}: Company with ID ${mockCompanyId} not found`,
      );
    });

    it('should handle transaction errors properly', async () => {
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany as any);
      const transactionError = new Error('Transaction failed');
      jest
        .spyOn(prismaService, '$transaction')
        .mockRejectedValue(transactionError);

      await expect(seeder.seed(mockCompanyId)).rejects.toThrow(
        `Failed to seed payroll groups for company ${mockCompanyId}: Transaction failed`,
      );
    });

    it('should return correct metadata structure', async () => {
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany as any);
      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (fn: any) => {
          return fn(mockTransaction);
        });

      const result = await seeder.seed(mockCompanyId);

      // Check metadata structure for cutoffs
      expect(result.details?.cutoffs[0]).toEqual({
        code: 'SEMIMONTHLY-DEFAULT',
        id: mockSemiMonthlyCutoff.id,
        type: CutoffType.SEMIMONTHLY,
      });

      expect(result.details?.cutoffs[1]).toEqual({
        code: 'MONTHLY-DEFAULT',
        id: mockMonthlyCutoff.id,
        type: CutoffType.MONTHLY,
      });

      // Check metadata structure for payroll groups
      expect(result.details?.payrollGroups).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'REGULAR-MONTHLY',
            salaryRateType: SalaryRateType.MONTHLY_RATE,
          }),
        ]),
      );
    });
  });

  describe('validate', () => {
    it('should return true when company has payroll groups and cutoffs', async () => {
      jest.spyOn(prismaService.payrollGroup, 'count').mockResolvedValue(3);
      jest.spyOn(prismaService.cutoff, 'count').mockResolvedValue(2);

      const result = await seeder.validate(mockCompanyId);

      expect(result).toBe(true);
      expect(prismaService.payrollGroup.count).toHaveBeenCalledWith({
        where: { companyId: mockCompanyId, isDeleted: false },
      });
      expect(prismaService.cutoff.count).toHaveBeenCalledWith({
        where: { companyId: mockCompanyId, isDeleted: false },
      });
    });

    it('should return false when company has no payroll groups', async () => {
      jest.spyOn(prismaService.payrollGroup, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.cutoff, 'count').mockResolvedValue(2);

      const result = await seeder.validate(mockCompanyId);

      expect(result).toBe(false);
    });

    it('should return false when company has no cutoffs', async () => {
      jest.spyOn(prismaService.payrollGroup, 'count').mockResolvedValue(3);
      jest.spyOn(prismaService.cutoff, 'count').mockResolvedValue(0);

      const result = await seeder.validate(mockCompanyId);

      expect(result).toBe(false);
    });

    it('should return false when company has no payroll groups and no cutoffs', async () => {
      jest.spyOn(prismaService.payrollGroup, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.cutoff, 'count').mockResolvedValue(0);

      const result = await seeder.validate(mockCompanyId);

      expect(result).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockRejectedValue(dbError);

      await expect(seeder.canSeed(mockCompanyId)).rejects.toThrow(dbError);
    });

    it('should handle partial transaction failure for cutoff creation', async () => {
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany as any);

      const partialTransaction = {
        cutoff: {
          create: jest
            .fn()
            .mockRejectedValue(new Error('Cutoff creation failed')),
        },
        payrollGroup: {
          create: jest.fn(),
        },
      };

      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (fn: any) => {
          return fn(partialTransaction);
        });

      await expect(seeder.seed(mockCompanyId)).rejects.toThrow(
        'Failed to seed payroll groups for company 1: Cutoff creation failed',
      );
    });

    it('should handle partial transaction failure for payroll group creation', async () => {
      jest
        .spyOn(prismaService.company, 'findUnique')
        .mockResolvedValue(mockCompany as any);

      const partialTransaction = {
        cutoff: {
          create: jest
            .fn()
            .mockResolvedValueOnce(mockSemiMonthlyCutoff)
            .mockResolvedValueOnce(mockMonthlyCutoff),
        },
        payrollGroup: {
          create: jest
            .fn()
            .mockRejectedValue(new Error('Payroll group creation failed')),
        },
      };

      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (fn: any) => {
          return fn(partialTransaction);
        });

      await expect(seeder.seed(mockCompanyId)).rejects.toThrow(
        'Failed to seed payroll groups for company 1: Payroll group creation failed',
      );
    });

    it('should handle invalid company ID gracefully', async () => {
      const invalidCompanyId = -1;
      jest.spyOn(prismaService.company, 'findUnique').mockResolvedValue(null);

      const result = await seeder.canSeed(invalidCompanyId);
      expect(result).toBe(false);
    });
  });
});

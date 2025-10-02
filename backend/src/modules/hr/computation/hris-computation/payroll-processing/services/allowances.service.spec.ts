import { Test, TestingModule } from '@nestjs/testing';
import { DeductionPeriod } from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { AllowancesService } from './allowances.service';
import { PayrollContext } from '../interfaces/payroll-service.interfaces';

describe('AllowancesService', () => {
  let service: AllowancesService;
  // let prismaService: PrismaService;

  const mockPrismaService = {
    allowancePlan: {
      findMany: jest.fn(),
    },
    cutoffDateRange: {
      findUnique: jest.fn(),
    },
    employeeSalaryComputationAllowances: {
      upsert: jest.fn(),
    },
    employeeSalaryAdjustment: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockContext: PayrollContext = {
    employeeData: {
      accountDetails: {
        id: 'test-account-id',
      },
    },
    employeeSalaryComputation: {
      allowance: 0,
      employeeTimekeepingCutoffId: 'test-cutoff-id',
    },
    cutoffType: {
      divisor: 2,
    },
    timekeepingCutoffData: {
      cutoffDateRangeId: 'test-date-range-id',
      cutoffDateRange: {
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-15'),
      },
    },
  } as any;

  beforeEach(async () => {
    // Reset mockContext for each test
    mockContext.employeeSalaryComputation.allowance = 0;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllowancesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AllowancesService>(AllowancesService);
    // prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('computeAllowances', () => {
    it('should only process active allowance plans', async () => {
      const activeAllowancePlan = {
        id: 'active-plan-id',
        accountId: 'test-account-id',
        isActive: true,
        amount: 1000,
        deductionPeriod: DeductionPeriod.EVERY_PERIOD,
        allowanceConfiguration: {
          category: 'TAXABLE',
        },
      };

      mockPrismaService.allowancePlan.findMany.mockResolvedValue([
        activeAllowancePlan,
      ]);

      await service.computeAllowances(mockContext);

      // Verify that findMany was called with isActive: true and effectivityDate filter
      const expectedEndOfDay = new Date(2025, 5, 1, 23, 59, 59, 999); // Month is 0-indexed
      expect(mockPrismaService.allowancePlan.findMany).toHaveBeenCalledWith({
        where: {
          accountId: 'test-account-id',
          isActive: true,
          effectivityDate: {
            lte: expectedEndOfDay,
          },
          allowanceConfiguration: {
            isDeleted: false,
          },
        },
        include: {
          allowanceConfiguration: true,
        },
      });

      // Verify that only the active plan was processed
      expect(
        mockPrismaService.employeeSalaryComputationAllowances.upsert,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockPrismaService.employeeSalaryComputationAllowances.upsert,
      ).toHaveBeenCalledWith({
        where: {
          employeeSalaryComputationId_allowancePlanId: {
            employeeSalaryComputationId: 'test-cutoff-id',
            allowancePlanId: 'active-plan-id',
          },
        },
        create: {
          employeeSalaryComputationId: 'test-cutoff-id',
          allowancePlanId: 'active-plan-id',
          amount: 500, // 1000 / 2 (divisor)
        },
        update: {
          amount: 500,
        },
      });
    });

    it('should not process any allowances if all plans are inactive', async () => {
      mockPrismaService.allowancePlan.findMany.mockResolvedValue([]);

      await service.computeAllowances(mockContext);

      const expectedEndOfDay = new Date(2025, 5, 1, 23, 59, 59, 999); // Month is 0-indexed
      expect(mockPrismaService.allowancePlan.findMany).toHaveBeenCalledWith({
        where: {
          accountId: 'test-account-id',
          isActive: true,
          effectivityDate: {
            lte: expectedEndOfDay,
          },
          allowanceConfiguration: {
            isDeleted: false,
          },
        },
        include: {
          allowanceConfiguration: true,
        },
      });

      // No allowances should be processed
      expect(
        mockPrismaService.employeeSalaryComputationAllowances.upsert,
      ).not.toHaveBeenCalled();
    });

    it('should correctly compute allowance amount for EVERY_PERIOD', async () => {
      const allowancePlan = {
        id: 'plan-id',
        accountId: 'test-account-id',
        isActive: true,
        amount: 2000,
        deductionPeriod: DeductionPeriod.EVERY_PERIOD,
        allowanceConfiguration: {
          category: 'TAXABLE',
        },
      };

      mockPrismaService.allowancePlan.findMany.mockResolvedValue([
        allowancePlan,
      ]);

      await service.computeAllowances(mockContext);

      expect(mockContext.employeeSalaryComputation.allowance).toBe(1000); // 2000 / 2
      expect(
        mockPrismaService.employeeSalaryComputationAllowances.upsert,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            amount: 1000,
          }),
        }),
      );
    });

    it('should correctly compute allowance amount for FIRST_PERIOD when period matches', async () => {
      const allowancePlan = {
        id: 'plan-id',
        accountId: 'test-account-id',
        isActive: true,
        amount: 3000,
        deductionPeriod: DeductionPeriod.FIRST_PERIOD,
        allowanceConfiguration: {
          category: 'TAXABLE',
        },
      };

      const cutoffDateRange = {
        id: 'test-date-range-id',
        cutoffPeriodType: DeductionPeriod.FIRST_PERIOD,
      };

      mockPrismaService.allowancePlan.findMany.mockResolvedValue([
        allowancePlan,
      ]);
      mockPrismaService.cutoffDateRange.findUnique.mockResolvedValue(
        cutoffDateRange,
      );

      await service.computeAllowances(mockContext);

      expect(mockContext.employeeSalaryComputation.allowance).toBe(3000); // Full amount
      expect(
        mockPrismaService.employeeSalaryComputationAllowances.upsert,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            amount: 3000,
          }),
        }),
      );
    });

    it('should not compute allowance for FIRST_PERIOD when period does not match', async () => {
      const allowancePlan = {
        id: 'plan-id',
        accountId: 'test-account-id',
        isActive: true,
        amount: 3000,
        deductionPeriod: DeductionPeriod.FIRST_PERIOD,
        allowanceConfiguration: {
          category: 'TAXABLE',
        },
      };

      const cutoffDateRange = {
        id: 'test-date-range-id',
        cutoffPeriodType: DeductionPeriod.LAST_PERIOD, // Different period
      };

      mockPrismaService.allowancePlan.findMany.mockResolvedValue([
        allowancePlan,
      ]);
      mockPrismaService.cutoffDateRange.findUnique.mockResolvedValue(
        cutoffDateRange,
      );

      await service.computeAllowances(mockContext);

      // Should not update allowance or create allowance record
      expect(mockContext.employeeSalaryComputation.allowance).toBe(0);
      expect(
        mockPrismaService.employeeSalaryComputationAllowances.upsert,
      ).not.toHaveBeenCalled();
    });

    describe('effectivity date filtering', () => {
      it('should include allowance plans with effectivity date equal to cutoff start date', async () => {
        const allowancePlanEqualDate = {
          id: 'equal-date-plan',
          accountId: 'test-account-id',
          isActive: true,
          effectivityDate: new Date('2025-06-01'), // Same as cutoff start date
          amount: 1000,
          deductionPeriod: DeductionPeriod.EVERY_PERIOD,
          allowanceConfiguration: {
            category: 'TAXABLE',
          },
        };

        mockPrismaService.allowancePlan.findMany.mockResolvedValue([
          allowancePlanEqualDate,
        ]);

        await service.computeAllowances(mockContext);

        // Verify the plan was processed
        expect(mockContext.employeeSalaryComputation.allowance).toBe(500); // 1000 / 2
        expect(
          mockPrismaService.employeeSalaryComputationAllowances.upsert,
        ).toHaveBeenCalledTimes(1);
      });

      it('should include allowance plans with effectivity date before cutoff start date', async () => {
        const allowancePlanBeforeDate = {
          id: 'before-date-plan',
          accountId: 'test-account-id',
          isActive: true,
          effectivityDate: new Date('2025-05-15'), // Before cutoff start date
          amount: 2000,
          deductionPeriod: DeductionPeriod.EVERY_PERIOD,
          allowanceConfiguration: {
            category: 'TAXABLE',
          },
        };

        mockPrismaService.allowancePlan.findMany.mockResolvedValue([
          allowancePlanBeforeDate,
        ]);

        await service.computeAllowances(mockContext);

        // Verify the plan was processed
        expect(mockContext.employeeSalaryComputation.allowance).toBe(1000); // 2000 / 2
        expect(
          mockPrismaService.employeeSalaryComputationAllowances.upsert,
        ).toHaveBeenCalledTimes(1);
      });

      it('should exclude allowance plans with effectivity date after cutoff start date', async () => {
        // allowancePlanAfterDate - plan with effectivity date after cutoff start date
        // This plan should be excluded from the results

        // Mock should return empty array since effectivity date is after cutoff start
        mockPrismaService.allowancePlan.findMany.mockResolvedValue([]);

        await service.computeAllowances(mockContext);

        // Verify the plan was NOT processed
        expect(mockContext.employeeSalaryComputation.allowance).toBe(0);
        expect(
          mockPrismaService.employeeSalaryComputationAllowances.upsert,
        ).not.toHaveBeenCalled();
      });

      it('should process multiple allowance plans with various effectivity dates correctly', async () => {
        const plans = [
          {
            id: 'plan-1',
            accountId: 'test-account-id',
            isActive: true,
            effectivityDate: new Date('2025-05-01'), // Before cutoff
            amount: 1000,
            deductionPeriod: DeductionPeriod.EVERY_PERIOD,
            allowanceConfiguration: {
              category: 'TAXABLE',
            },
          },
          {
            id: 'plan-2',
            accountId: 'test-account-id',
            isActive: true,
            effectivityDate: new Date('2025-06-01'), // Equal to cutoff start
            amount: 2000,
            deductionPeriod: DeductionPeriod.EVERY_PERIOD,
            allowanceConfiguration: {
              category: 'TAXABLE',
            },
          },
        ];

        mockPrismaService.allowancePlan.findMany.mockResolvedValue(plans);

        await service.computeAllowances(mockContext);

        // Verify both plans were processed
        expect(mockContext.employeeSalaryComputation.allowance).toBe(1500); // (1000 + 2000) / 2
        expect(
          mockPrismaService.employeeSalaryComputationAllowances.upsert,
        ).toHaveBeenCalledTimes(2);
      });
    });

    describe('deleted configuration filtering', () => {
      it('should exclude allowance plans with deleted parent configuration', async () => {
        // planWithDeletedConfig - plan with deleted config
        // This plan should be excluded from the results

        const planWithActiveConfig = {
          id: 'plan-with-active-config',
          accountId: 'test-account-id',
          isActive: true,
          effectivityDate: new Date('2025-05-01'),
          amount: 2000,
          deductionPeriod: DeductionPeriod.EVERY_PERIOD,
          allowanceConfiguration: {
            id: 'active-config',
            isDeleted: false,
            category: 'TAXABLE',
          },
        };

        // Mock should only return the plan with active configuration
        mockPrismaService.allowancePlan.findMany.mockResolvedValue([
          planWithActiveConfig,
        ]);

        await service.computeAllowances(mockContext);

        // Verify that the query includes the allowanceConfiguration filter
        const expectedEndOfDay = new Date(2025, 5, 1, 23, 59, 59, 999);
        expect(mockPrismaService.allowancePlan.findMany).toHaveBeenCalledWith({
          where: {
            accountId: 'test-account-id',
            isActive: true,
            effectivityDate: {
              lte: expectedEndOfDay,
            },
            allowanceConfiguration: {
              isDeleted: false,
            },
          },
          include: {
            allowanceConfiguration: true,
          },
        });

        // Verify only the plan with active configuration was processed
        expect(mockContext.employeeSalaryComputation.allowance).toBe(1000); // 2000 / 2
        expect(
          mockPrismaService.employeeSalaryComputationAllowances.upsert,
        ).toHaveBeenCalledTimes(1);
        expect(
          mockPrismaService.employeeSalaryComputationAllowances.upsert,
        ).toHaveBeenCalledWith({
          where: {
            employeeSalaryComputationId_allowancePlanId: {
              employeeSalaryComputationId: 'test-cutoff-id',
              allowancePlanId: 'plan-with-active-config',
            },
          },
          create: {
            employeeSalaryComputationId: 'test-cutoff-id',
            allowancePlanId: 'plan-with-active-config',
            amount: 1000,
          },
          update: {
            amount: 1000,
          },
        });
      });

      it('should process all plans when all parent configurations are active', async () => {
        const plans = [
          {
            id: 'plan-1',
            accountId: 'test-account-id',
            isActive: true,
            effectivityDate: new Date('2025-05-01'),
            amount: 1000,
            deductionPeriod: DeductionPeriod.EVERY_PERIOD,
            allowanceConfiguration: {
              id: 'config-1',
              isDeleted: false,
              category: 'TAXABLE',
            },
          },
          {
            id: 'plan-2',
            accountId: 'test-account-id',
            isActive: true,
            effectivityDate: new Date('2025-05-01'),
            amount: 2000,
            deductionPeriod: DeductionPeriod.EVERY_PERIOD,
            allowanceConfiguration: {
              id: 'config-2',
              isDeleted: false,
              category: 'TAXABLE',
            },
          },
        ];

        mockPrismaService.allowancePlan.findMany.mockResolvedValue(plans);

        await service.computeAllowances(mockContext);

        // Verify both plans were processed
        expect(mockContext.employeeSalaryComputation.allowance).toBe(1500); // (1000 + 2000) / 2
        expect(
          mockPrismaService.employeeSalaryComputationAllowances.upsert,
        ).toHaveBeenCalledTimes(2);
      });
    });
  });
});

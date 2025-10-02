import { Test, TestingModule } from '@nestjs/testing';
import { DeductionPeriod } from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { DeductionsService } from './deductions.service';
import { PayrollContext } from '../interfaces/payroll-service.interfaces';

describe('DeductionsService', () => {
  let service: DeductionsService;
  // let prismaService: PrismaService;

  const mockPrismaService = {
    deductionPlan: {
      findMany: jest.fn(),
    },
    cutoffDateRange: {
      findUnique: jest.fn(),
    },
    employeeSalaryComputationDeductions: {
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
      loans: 0,
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
    mockContext.employeeSalaryComputation.loans = 0;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeductionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DeductionsService>(DeductionsService);
    // prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('computeLoansAndDeductions', () => {
    it('should only process active deduction plans', async () => {
      const activeDeductionPlan = {
        id: 'active-plan-id',
        accountId: 'test-account-id',
        isActive: true,
        monthlyAmortization: 1000,
        deductionPeriod: DeductionPeriod.EVERY_PERIOD,
        deductionConfiguration: {
          type: 'LOAN',
        },
      };

      // inactiveDeductionPlan - should be excluded from results (isActive: false)

      // Mock should only return active plans
      mockPrismaService.deductionPlan.findMany.mockResolvedValue([
        activeDeductionPlan,
      ]);

      await service.computeLoansAndDeductions(mockContext);

      // Verify that findMany was called with isActive: true and effectivityDate filter
      const expectedEndOfDay = new Date(2025, 5, 1, 23, 59, 59, 999); // Month is 0-indexed
      expect(mockPrismaService.deductionPlan.findMany).toHaveBeenCalledWith({
        where: {
          accountId: 'test-account-id',
          isActive: true,
          effectivityDate: {
            lte: expectedEndOfDay,
          },
          deductionConfiguration: {
            isDeleted: false,
          },
        },
        include: {
          deductionConfiguration: true,
        },
      });

      // Verify that only the active plan was processed
      expect(
        mockPrismaService.employeeSalaryComputationDeductions.upsert,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockPrismaService.employeeSalaryComputationDeductions.upsert,
      ).toHaveBeenCalledWith({
        where: {
          employeeSalaryComputationId_deductionPlanId: {
            employeeSalaryComputationId: 'test-cutoff-id',
            deductionPlanId: 'active-plan-id',
          },
        },
        create: {
          employeeSalaryComputationId: 'test-cutoff-id',
          deductionPlanId: 'active-plan-id',
          amount: 500, // 1000 / 2 (divisor)
        },
        update: {
          amount: 500,
        },
      });
    });

    it('should not process any deductions if all plans are inactive', async () => {
      mockPrismaService.deductionPlan.findMany.mockResolvedValue([]);

      await service.computeLoansAndDeductions(mockContext);

      const expectedEndOfDay = new Date(2025, 5, 1, 23, 59, 59, 999); // Month is 0-indexed
      expect(mockPrismaService.deductionPlan.findMany).toHaveBeenCalledWith({
        where: {
          accountId: 'test-account-id',
          isActive: true,
          effectivityDate: {
            lte: expectedEndOfDay,
          },
          deductionConfiguration: {
            isDeleted: false,
          },
        },
        include: {
          deductionConfiguration: true,
        },
      });

      // No deductions should be processed
      expect(
        mockPrismaService.employeeSalaryComputationDeductions.upsert,
      ).not.toHaveBeenCalled();
    });

    it('should correctly compute deduction amount for EVERY_PERIOD', async () => {
      const deductionPlan = {
        id: 'plan-id',
        accountId: 'test-account-id',
        isActive: true,
        monthlyAmortization: 2000,
        deductionPeriod: DeductionPeriod.EVERY_PERIOD,
        deductionConfiguration: {
          type: 'LOAN',
        },
      };

      mockPrismaService.deductionPlan.findMany.mockResolvedValue([
        deductionPlan,
      ]);

      await service.computeLoansAndDeductions(mockContext);

      expect(mockContext.employeeSalaryComputation.loans).toBe(1000); // 2000 / 2
      expect(
        mockPrismaService.employeeSalaryComputationDeductions.upsert,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            amount: 1000,
          }),
        }),
      );
    });

    it('should correctly compute deduction amount for FIRST_PERIOD when period matches', async () => {
      const deductionPlan = {
        id: 'plan-id',
        accountId: 'test-account-id',
        isActive: true,
        monthlyAmortization: 3000,
        deductionPeriod: DeductionPeriod.FIRST_PERIOD,
        deductionConfiguration: {
          type: 'LOAN',
        },
      };

      const cutoffDateRange = {
        id: 'test-date-range-id',
        cutoffPeriodType: DeductionPeriod.FIRST_PERIOD,
      };

      mockPrismaService.deductionPlan.findMany.mockResolvedValue([
        deductionPlan,
      ]);
      mockPrismaService.cutoffDateRange.findUnique.mockResolvedValue(
        cutoffDateRange,
      );

      await service.computeLoansAndDeductions(mockContext);

      expect(mockContext.employeeSalaryComputation.loans).toBe(3000); // Full amount
      expect(
        mockPrismaService.employeeSalaryComputationDeductions.upsert,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            amount: 3000,
          }),
        }),
      );
    });

    it('should not compute deduction for FIRST_PERIOD when period does not match', async () => {
      const deductionPlan = {
        id: 'plan-id',
        accountId: 'test-account-id',
        isActive: true,
        monthlyAmortization: 3000,
        deductionPeriod: DeductionPeriod.FIRST_PERIOD,
        deductionConfiguration: {
          type: 'LOAN',
        },
      };

      const cutoffDateRange = {
        id: 'test-date-range-id',
        cutoffPeriodType: DeductionPeriod.LAST_PERIOD, // Different period
      };

      mockPrismaService.deductionPlan.findMany.mockResolvedValue([
        deductionPlan,
      ]);
      mockPrismaService.cutoffDateRange.findUnique.mockResolvedValue(
        cutoffDateRange,
      );

      await service.computeLoansAndDeductions(mockContext);

      // Should not update loans or create deduction record
      expect(mockContext.employeeSalaryComputation.loans).toBe(0);
      expect(
        mockPrismaService.employeeSalaryComputationDeductions.upsert,
      ).not.toHaveBeenCalled();
    });

    describe('effectivity date filtering', () => {
      it('should include deduction plans with effectivity date equal to cutoff start date', async () => {
        const deductionPlanEqualDate = {
          id: 'equal-date-plan',
          accountId: 'test-account-id',
          isActive: true,
          effectivityDate: new Date('2025-06-01'), // Same as cutoff start date
          monthlyAmortization: 1000,
          deductionPeriod: DeductionPeriod.EVERY_PERIOD,
          deductionConfiguration: {
            type: 'LOAN',
          },
        };

        mockPrismaService.deductionPlan.findMany.mockResolvedValue([
          deductionPlanEqualDate,
        ]);

        await service.computeLoansAndDeductions(mockContext);

        // Verify the plan was processed
        expect(mockContext.employeeSalaryComputation.loans).toBe(500); // 1000 / 2
        expect(
          mockPrismaService.employeeSalaryComputationDeductions.upsert,
        ).toHaveBeenCalledTimes(1);
      });

      it('should include deduction plans with effectivity date before cutoff start date', async () => {
        const deductionPlanBeforeDate = {
          id: 'before-date-plan',
          accountId: 'test-account-id',
          isActive: true,
          effectivityDate: new Date('2025-05-15'), // Before cutoff start date
          monthlyAmortization: 2000,
          deductionPeriod: DeductionPeriod.EVERY_PERIOD,
          deductionConfiguration: {
            type: 'LOAN',
          },
        };

        mockPrismaService.deductionPlan.findMany.mockResolvedValue([
          deductionPlanBeforeDate,
        ]);

        await service.computeLoansAndDeductions(mockContext);

        // Verify the plan was processed
        expect(mockContext.employeeSalaryComputation.loans).toBe(1000); // 2000 / 2
        expect(
          mockPrismaService.employeeSalaryComputationDeductions.upsert,
        ).toHaveBeenCalledTimes(1);
      });

      it('should exclude deduction plans with effectivity date after cutoff start date', async () => {
        // deductionPlanAfterDate - plan with effectivity date after cutoff start date
        // This plan should be excluded from the results

        // Mock should return empty array since effectivity date is after cutoff start
        mockPrismaService.deductionPlan.findMany.mockResolvedValue([]);

        await service.computeLoansAndDeductions(mockContext);

        // Verify the plan was NOT processed
        expect(mockContext.employeeSalaryComputation.loans).toBe(0);
        expect(
          mockPrismaService.employeeSalaryComputationDeductions.upsert,
        ).not.toHaveBeenCalled();
      });

      it('should process multiple deduction plans with various effectivity dates correctly', async () => {
        const plans = [
          {
            id: 'plan-1',
            accountId: 'test-account-id',
            isActive: true,
            effectivityDate: new Date('2025-05-01'), // Before cutoff
            monthlyAmortization: 1000,
            deductionPeriod: DeductionPeriod.EVERY_PERIOD,
            deductionConfiguration: {
              type: 'LOAN',
            },
          },
          {
            id: 'plan-2',
            accountId: 'test-account-id',
            isActive: true,
            effectivityDate: new Date('2025-06-01'), // Equal to cutoff start
            monthlyAmortization: 2000,
            deductionPeriod: DeductionPeriod.EVERY_PERIOD,
            deductionConfiguration: {
              type: 'LOAN',
            },
          },
        ];

        mockPrismaService.deductionPlan.findMany.mockResolvedValue(plans);

        await service.computeLoansAndDeductions(mockContext);

        // Verify both plans were processed
        expect(mockContext.employeeSalaryComputation.loans).toBe(1500); // (1000 + 2000) / 2
        expect(
          mockPrismaService.employeeSalaryComputationDeductions.upsert,
        ).toHaveBeenCalledTimes(2);
      });
    });

    describe('deleted configuration filtering', () => {
      it('should exclude deduction plans with deleted parent configuration', async () => {
        // planWithDeletedConfig - plan with deleted configuration
        // This plan should be excluded from the results

        const planWithActiveConfig = {
          id: 'plan-with-active-config',
          accountId: 'test-account-id',
          isActive: true,
          effectivityDate: new Date('2025-05-01'),
          monthlyAmortization: 2000,
          deductionPeriod: DeductionPeriod.EVERY_PERIOD,
          deductionConfiguration: {
            id: 'active-config',
            isDeleted: false,
            type: 'LOAN',
          },
        };

        // Mock should only return the plan with active configuration
        mockPrismaService.deductionPlan.findMany.mockResolvedValue([
          planWithActiveConfig,
        ]);

        await service.computeLoansAndDeductions(mockContext);

        // Verify that the query includes the deductionConfiguration filter
        const expectedEndOfDay = new Date(2025, 5, 1, 23, 59, 59, 999);
        expect(mockPrismaService.deductionPlan.findMany).toHaveBeenCalledWith({
          where: {
            accountId: 'test-account-id',
            isActive: true,
            effectivityDate: {
              lte: expectedEndOfDay,
            },
            deductionConfiguration: {
              isDeleted: false,
            },
          },
          include: {
            deductionConfiguration: true,
          },
        });

        // Verify only the plan with active configuration was processed
        expect(mockContext.employeeSalaryComputation.loans).toBe(1000); // 2000 / 2
        expect(
          mockPrismaService.employeeSalaryComputationDeductions.upsert,
        ).toHaveBeenCalledTimes(1);
        expect(
          mockPrismaService.employeeSalaryComputationDeductions.upsert,
        ).toHaveBeenCalledWith({
          where: {
            employeeSalaryComputationId_deductionPlanId: {
              employeeSalaryComputationId: 'test-cutoff-id',
              deductionPlanId: 'plan-with-active-config',
            },
          },
          create: {
            employeeSalaryComputationId: 'test-cutoff-id',
            deductionPlanId: 'plan-with-active-config',
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
            monthlyAmortization: 1000,
            deductionPeriod: DeductionPeriod.EVERY_PERIOD,
            deductionConfiguration: {
              id: 'config-1',
              isDeleted: false,
              type: 'LOAN',
            },
          },
          {
            id: 'plan-2',
            accountId: 'test-account-id',
            isActive: true,
            effectivityDate: new Date('2025-05-01'),
            monthlyAmortization: 2000,
            deductionPeriod: DeductionPeriod.EVERY_PERIOD,
            deductionConfiguration: {
              id: 'config-2',
              isDeleted: false,
              type: 'LOAN',
            },
          },
        ];

        mockPrismaService.deductionPlan.findMany.mockResolvedValue(plans);

        await service.computeLoansAndDeductions(mockContext);

        // Verify both plans were processed
        expect(mockContext.employeeSalaryComputation.loans).toBe(1500); // (1000 + 2000) / 2
        expect(
          mockPrismaService.employeeSalaryComputationDeductions.upsert,
        ).toHaveBeenCalledTimes(2);
      });
    });
  });
});

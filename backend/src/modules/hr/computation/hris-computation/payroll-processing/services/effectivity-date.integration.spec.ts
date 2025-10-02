import { Test, TestingModule } from '@nestjs/testing';
import { DeductionPeriod } from '@prisma/client';
import { PrismaService } from '@common/prisma.service';
import { DeductionsService } from './deductions.service';
import { AllowancesService } from './allowances.service';
import { PayrollContext } from '../interfaces/payroll-service.interfaces';

describe('Effectivity Date Integration Tests', () => {
  let deductionsService: DeductionsService;
  let allowancesService: AllowancesService;
  // let prismaService: PrismaService;

  const mockPrismaService = {
    deductionPlan: {
      findMany: jest.fn(),
    },
    allowancePlan: {
      findMany: jest.fn(),
    },
    cutoffDateRange: {
      findUnique: jest.fn(),
    },
    employeeSalaryComputationDeductions: {
      upsert: jest.fn(),
    },
    employeeSalaryComputationAllowances: {
      upsert: jest.fn(),
    },
    employeeSalaryAdjustment: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const cutoffStartDate = new Date('2025-06-01'); // June 1, 2025
  const cutoffEndDate = new Date('2025-06-15'); // June 15, 2025

  const mockContext: PayrollContext = {
    employeeData: {
      accountDetails: {
        id: 'test-account-id',
      },
    },
    employeeSalaryComputation: {
      loans: 0,
      allowance: 0,
      employeeTimekeepingCutoffId: 'test-cutoff-id',
    },
    cutoffType: {
      divisor: 2,
    },
    timekeepingCutoffData: {
      cutoffDateRangeId: 'test-date-range-id',
      cutoffDateRange: {
        startDate: cutoffStartDate,
        endDate: cutoffEndDate,
      },
    },
  } as any;

  beforeEach(async () => {
    // Reset amounts for each test
    mockContext.employeeSalaryComputation.loans = 0;
    mockContext.employeeSalaryComputation.allowance = 0;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeductionsService,
        AllowancesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    deductionsService = module.get<DeductionsService>(DeductionsService);
    allowancesService = module.get<AllowancesService>(AllowancesService);
    // prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cutoff Period: June 1-15, 2025', () => {
    describe('Deductions with effectivity date = June 1 (cutoff start)', () => {
      it('should include deduction when effectivity date equals cutoff start date', async () => {
        const deductionPlan = {
          id: 'deduction-june-1',
          accountId: 'test-account-id',
          isActive: true,
          effectivityDate: new Date('2025-06-01'), // Exactly the cutoff start date
          monthlyAmortization: 5000,
          deductionPeriod: DeductionPeriod.EVERY_PERIOD,
          deductionConfiguration: {
            type: 'LOAN',
          },
        };

        mockPrismaService.deductionPlan.findMany.mockResolvedValue([
          deductionPlan,
        ]);

        await deductionsService.computeLoansAndDeductions(mockContext);

        // Verify the deduction was applied
        expect(mockContext.employeeSalaryComputation.loans).toBe(2500); // 5000 / 2
        expect(
          mockPrismaService.employeeSalaryComputationDeductions.upsert,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            create: expect.objectContaining({
              deductionPlanId: 'deduction-june-1',
              amount: 2500,
            }),
          }),
        );
      });
    });

    describe('Allowances with effectivity date = June 1 (cutoff start)', () => {
      it('should include allowance when effectivity date equals cutoff start date', async () => {
        const allowancePlan = {
          id: 'allowance-june-1',
          accountId: 'test-account-id',
          isActive: true,
          effectivityDate: new Date('2025-06-01'), // Exactly the cutoff start date
          amount: 3000,
          deductionPeriod: DeductionPeriod.EVERY_PERIOD,
          allowanceConfiguration: {
            category: 'TAXABLE',
          },
        };

        mockPrismaService.allowancePlan.findMany.mockResolvedValue([
          allowancePlan,
        ]);

        await allowancesService.computeAllowances(mockContext);

        // Verify the allowance was applied
        expect(mockContext.employeeSalaryComputation.allowance).toBe(1500); // 3000 / 2
        expect(
          mockPrismaService.employeeSalaryComputationAllowances.upsert,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            create: expect.objectContaining({
              allowancePlanId: 'allowance-june-1',
              amount: 1500,
            }),
          }),
        );
      });
    });

    describe('Combined scenario with multiple effectivity dates', () => {
      it('should correctly process deductions and allowances for June 1-15 cutoff', async () => {
        // Setup deductions with various effectivity dates
        const deductions = [
          {
            id: 'ded-may-15',
            accountId: 'test-account-id',
            isActive: true,
            effectivityDate: new Date('2025-05-15'), // Before cutoff - INCLUDE
            monthlyAmortization: 1000,
            deductionPeriod: DeductionPeriod.EVERY_PERIOD,
            deductionConfiguration: {
              type: 'LOAN',
            },
          },
          {
            id: 'ded-june-1',
            accountId: 'test-account-id',
            isActive: true,
            effectivityDate: new Date('2025-06-01'), // Equal to cutoff start - INCLUDE
            monthlyAmortization: 2000,
            deductionPeriod: DeductionPeriod.EVERY_PERIOD,
            deductionConfiguration: {
              type: 'LOAN',
            },
          },
          {
            id: 'ded-june-2',
            accountId: 'test-account-id',
            isActive: true,
            effectivityDate: new Date('2025-06-02'), // After cutoff start - EXCLUDE
            monthlyAmortization: 3000,
            deductionPeriod: DeductionPeriod.EVERY_PERIOD,
            deductionConfiguration: {
              type: 'LOAN',
            },
          },
        ];

        // Setup allowances with various effectivity dates
        const allowances = [
          {
            id: 'allow-may-20',
            accountId: 'test-account-id',
            isActive: true,
            effectivityDate: new Date('2025-05-20'), // Before cutoff - INCLUDE
            amount: 1500,
            deductionPeriod: DeductionPeriod.EVERY_PERIOD,
            allowanceConfiguration: {
              category: 'TAXABLE',
            },
          },
          {
            id: 'allow-june-1',
            accountId: 'test-account-id',
            isActive: true,
            effectivityDate: new Date('2025-06-01'), // Equal to cutoff start - INCLUDE
            amount: 2500,
            deductionPeriod: DeductionPeriod.EVERY_PERIOD,
            allowanceConfiguration: {
              category: 'TAXABLE',
            },
          },
          {
            id: 'allow-june-5',
            accountId: 'test-account-id',
            isActive: true,
            effectivityDate: new Date('2025-06-05'), // After cutoff start - EXCLUDE
            amount: 3500,
            deductionPeriod: DeductionPeriod.EVERY_PERIOD,
            allowanceConfiguration: {
              category: 'TAXABLE',
            },
          },
        ];

        // Only return items with effectivityDate <= cutoff start (June 1)
        mockPrismaService.deductionPlan.findMany.mockResolvedValue([
          deductions[0], // May 15
          deductions[1], // June 1
        ]);

        mockPrismaService.allowancePlan.findMany.mockResolvedValue([
          allowances[0], // May 20
          allowances[1], // June 1
        ]);

        // Process deductions
        await deductionsService.computeLoansAndDeductions(mockContext);

        // Process allowances
        await allowancesService.computeAllowances(mockContext);

        // Verify correct amounts
        // Deductions: (1000 + 2000) / 2 = 1500
        expect(mockContext.employeeSalaryComputation.loans).toBe(1500);

        // Allowances: (1500 + 2500) / 2 = 2000
        expect(mockContext.employeeSalaryComputation.allowance).toBe(2000);

        // Verify correct number of database operations
        expect(
          mockPrismaService.employeeSalaryComputationDeductions.upsert,
        ).toHaveBeenCalledTimes(2);
        expect(
          mockPrismaService.employeeSalaryComputationAllowances.upsert,
        ).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Documentation example scenario', () => {
    it('should handle the exact scenario from the task description', async () => {
      // From task description:
      // "If the cutoff period is June 1 – June 15, and the effectivity date
      // of a Deduction Plan is June 1, the system should consider this plan
      // active and applicable for this period"

      const deductionPlan = {
        id: 'task-example-deduction',
        accountId: 'test-account-id',
        isActive: true,
        effectivityDate: new Date('2025-06-01'),
        monthlyAmortization: 1000,
        deductionPeriod: DeductionPeriod.FIRST_PERIOD,
        deductionConfiguration: {
          type: 'LOAN',
        },
      };

      const allowancePlan = {
        id: 'task-example-allowance',
        accountId: 'test-account-id',
        isActive: true,
        effectivityDate: new Date('2025-06-01'),
        amount: 500,
        deductionPeriod: DeductionPeriod.FIRST_PERIOD,
        allowanceConfiguration: {
          category: 'TAXABLE',
        },
      };

      // Mock cutoff configuration for FIRST_PERIOD
      const cutoffDateRange = {
        id: 'test-date-range-id',
        cutoffPeriodType: DeductionPeriod.FIRST_PERIOD,
      };

      mockPrismaService.deductionPlan.findMany.mockResolvedValue([
        deductionPlan,
      ]);
      mockPrismaService.allowancePlan.findMany.mockResolvedValue([
        allowancePlan,
      ]);
      mockPrismaService.cutoffDateRange.findUnique.mockResolvedValue(
        cutoffDateRange,
      );

      await deductionsService.computeLoansAndDeductions(mockContext);
      await allowancesService.computeAllowances(mockContext);

      // For FIRST_PERIOD, full amounts should be applied
      expect(mockContext.employeeSalaryComputation.loans).toBe(1000);
      expect(mockContext.employeeSalaryComputation.allowance).toBe(500);
    });
  });
});

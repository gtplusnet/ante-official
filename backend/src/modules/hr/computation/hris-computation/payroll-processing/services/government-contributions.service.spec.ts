import { Test, TestingModule } from '@nestjs/testing';
import { GovernmentContributionsService } from './government-contributions.service';
import { SssConfigurationService } from '@modules/hr/configuration/sss-configuration/sss-configuration.service';
import { PhilhealtConfigurationService } from '@modules/hr/configuration/philhealth-configuration/philhealth-configuration.service';
import { PagibigConfigurationService } from '@modules/hr/configuration/pagibig-configuration/pagibig-configuration.service';
import { PayrollRatesService } from './payroll-rates.service';
import { DeductionPeriod } from '@prisma/client';
import { PayrollContext } from '../interfaces/payroll-service.interfaces';

describe('GovernmentContributionsService - Pag-IBIG Computation', () => {
  let service: GovernmentContributionsService;
  let mockPagibigConfigurationService: jest.Mocked<PagibigConfigurationService>;
  let mockPayrollRatesService: jest.Mocked<PayrollRatesService>;

  const mockPagibigResponse = {
    dateStart: '2024-01-01',
    computationType: 'default' as any,
    label: '2024 Configuration',
    employeeMinimumShare: 200,
    employeeMinimumPercentage: 2,
    percentage: 2,
    maximumEmployerShare: 200,
    maximumEmployeeShare: 200,
    employerShare: 200,
    employeeShare: 200,
  };

  const createMockContext = (
    deductionPeriod: DeductionPeriod = DeductionPeriod.EVERY_PERIOD,
  ): PayrollContext =>
    ({
      employeeSalaryComputation: {
        monthlyRate: 20000,
        deductionPeriodPagibig: deductionPeriod,
        governmentContributionPagibig: 0,
        governmentContributionPagibigBasis: 0,
        governmentContributionPagibigEmployerShare: 0,
        governmentContributionPagibigEmployeeShare: 0,
        governmentContributionPagibigMaximumEEShare: 0,
        governmentContributionPagibigMaximumERShare: 0,
        governmentContributionPagibigMinimumPercentage: 0,
        governmentContributionPagibigMinimumShare: 0,
        governmentContributionPagibigPercentage: 0,
        governmentContributionPagibigBasisPrevious: 0,
        governmentContributionPagibigBasicCurrent: 0,
      } as any,
      previousEmployeeSalaryComputation: {
        monthlyRate: 20000,
      } as any,
      dateBasis: {
        dateStandard: new Date('2024-06-15'),
      } as any,
    }) as any;

  beforeEach(async () => {
    mockPagibigConfigurationService = {
      getPagibigBracket: jest.fn().mockResolvedValue(mockPagibigResponse),
    } as any;

    mockPayrollRatesService = {
      computeDivisor: jest.fn(),
    } as any;

    const mockSssConfigurationService = {
      getSSSConfigurationByDateAndSalary: jest.fn().mockResolvedValue({
        contributionAmount: {
          employee: { total: 0, regular: 0, mpf: 0 },
          employer: { total: 0, regular: 0, ec: 0, mpf: 0 },
        },
        monthlySalaryCredit: { regular: 0, mpf: 0, total: 0 },
      }),
    } as any;

    const mockPhilhealthConfigurationService = {
      getPhilhealthBracket: jest.fn().mockResolvedValue({
        dateBracketData: {
          percentage: 0,
          minimumContribution: 0,
          maximumContribution: 0,
        },
        employeeShare: 0,
        employerShare: 0,
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovernmentContributionsService,
        {
          provide: SssConfigurationService,
          useValue: mockSssConfigurationService,
        },
        {
          provide: PhilhealtConfigurationService,
          useValue: mockPhilhealthConfigurationService,
        },
        {
          provide: PagibigConfigurationService,
          useValue: mockPagibigConfigurationService,
        },
        {
          provide: PayrollRatesService,
          useValue: mockPayrollRatesService,
        },
      ],
    }).compile();

    service = module.get<GovernmentContributionsService>(
      GovernmentContributionsService,
    );
  });

  describe('computePagibig with different deduction periods', () => {
    it('should divide Pag-IBIG contribution by 2 for EVERY_PERIOD (semi-monthly)', async () => {
      const context = createMockContext(DeductionPeriod.EVERY_PERIOD);
      mockPayrollRatesService.computeDivisor.mockResolvedValue(2);

      await service.computeGovernmentContributions(context);

      expect(
        mockPagibigConfigurationService.getPagibigBracket,
      ).toHaveBeenCalledWith({
        date: context.dateBasis.dateStandard,
        salary: 20000,
      });

      expect(
        context.employeeSalaryComputation.governmentContributionPagibig,
      ).toBe(100); // 200 / 2
      expect(
        context.employeeSalaryComputation
          .governmentContributionPagibigEmployeeShare,
      ).toBe(100);
      expect(
        context.employeeSalaryComputation
          .governmentContributionPagibigEmployerShare,
      ).toBe(100);
    });

    it('should use full amount for FIRST_PERIOD when in first period', async () => {
      const context = createMockContext(DeductionPeriod.FIRST_PERIOD);
      mockPayrollRatesService.computeDivisor.mockResolvedValue(1);

      await service.computeGovernmentContributions(context);

      expect(
        context.employeeSalaryComputation.governmentContributionPagibig,
      ).toBe(200); // 200 / 1
      expect(
        context.employeeSalaryComputation
          .governmentContributionPagibigEmployeeShare,
      ).toBe(200);
      expect(
        context.employeeSalaryComputation
          .governmentContributionPagibigEmployerShare,
      ).toBe(200);
    });

    it('should set zero contribution when divisor is 0 (not the right period)', async () => {
      const context = createMockContext(DeductionPeriod.FIRST_PERIOD);
      mockPayrollRatesService.computeDivisor.mockResolvedValue(0);

      await service.computeGovernmentContributions(context);

      expect(
        context.employeeSalaryComputation.governmentContributionPagibig,
      ).toBe(0);
      expect(
        context.employeeSalaryComputation
          .governmentContributionPagibigEmployeeShare,
      ).toBe(0);
      expect(
        context.employeeSalaryComputation
          .governmentContributionPagibigEmployerShare,
      ).toBe(0);
    });

    it('should always use monthlyRate as basis regardless of salary', async () => {
      const context = createMockContext(DeductionPeriod.EVERY_PERIOD);
      context.employeeSalaryComputation.monthlyRate = 50000;
      mockPayrollRatesService.computeDivisor.mockResolvedValue(2);

      await service.computeGovernmentContributions(context);

      expect(
        mockPagibigConfigurationService.getPagibigBracket,
      ).toHaveBeenCalledWith({
        date: context.dateBasis.dateStandard,
        salary: 50000, // Should use monthlyRate
      });

      expect(
        context.employeeSalaryComputation.governmentContributionPagibigBasis,
      ).toBe(50000);
      expect(
        context.employeeSalaryComputation.governmentContributionPagibig,
      ).toBe(100); // Still 200/2 (fixed amount)
    });

    it('should store all Pag-IBIG related fields correctly', async () => {
      const context = createMockContext(DeductionPeriod.EVERY_PERIOD);
      mockPayrollRatesService.computeDivisor.mockResolvedValue(2);

      await service.computeGovernmentContributions(context);

      expect(
        context.employeeSalaryComputation.governmentContributionPagibigBasis,
      ).toBe(20000);
      expect(
        context.employeeSalaryComputation.governmentContributionPagibig,
      ).toBe(100);
      expect(
        context.employeeSalaryComputation
          .governmentContributionPagibigEmployerShare,
      ).toBe(100);
      expect(
        context.employeeSalaryComputation
          .governmentContributionPagibigEmployeeShare,
      ).toBe(100);
      expect(
        context.employeeSalaryComputation
          .governmentContributionPagibigMaximumEEShare,
      ).toBe(200);
      expect(
        context.employeeSalaryComputation
          .governmentContributionPagibigMaximumERShare,
      ).toBe(200);
      expect(
        context.employeeSalaryComputation
          .governmentContributionPagibigMinimumPercentage,
      ).toBe(2);
      expect(
        context.employeeSalaryComputation
          .governmentContributionPagibigMinimumShare,
      ).toBe(200);
      expect(
        context.employeeSalaryComputation
          .governmentContributionPagibigPercentage,
      ).toBe(2);
      expect(
        context.employeeSalaryComputation
          .governmentContributionPagibigBasisPrevious,
      ).toBe(20000);
      expect(
        context.employeeSalaryComputation
          .governmentContributionPagibigBasicCurrent,
      ).toBe(20000);
    });
  });
});

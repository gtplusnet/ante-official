import { Test, TestingModule } from '@nestjs/testing';
import { PagibigConfigurationService } from './pagibig-configuration.service';
import { ExternalFetchService } from '@integrations/external-fetch/external-fetch/external-fetch.service';
import { UtilityService } from '@common/utility.service';
import * as fs from 'fs/promises';

jest.mock('fs/promises');

describe('PagibigConfigurationService', () => {
  let service: PagibigConfigurationService;
  let mockExternalFetchService: jest.Mocked<ExternalFetchService>;
  let mockUtilityService: jest.Mocked<UtilityService>;

  const mockDatesJson = [
    {
      dateStart: '2024-01-01',
      computationType: 'default',
      label: '2024 Configuration',
    },
    {
      dateStart: '2021-01-01',
      computationType: 'default',
      label: '2021 Configuration',
    },
  ];

  const mock2024Config = {
    employeeMinimumShare: 200,
    employeeMinimumPercentage: 2,
    percentage: 2,
    maximumEmployerShare: 200,
    maximumEmployeeShare: 200,
  };

  const mock2021Config = {
    employeeMinimumShare: 100,
    employeeMinimumPercentage: 1,
    percentage: 1,
    maximumEmployerShare: 100,
    maximumEmployeeShare: 100,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockExternalFetchService = {
      // Add any methods if needed
    } as any;

    mockUtilityService = {
      // Add any methods if needed
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagibigConfigurationService,
        {
          provide: ExternalFetchService,
          useValue: mockExternalFetchService,
        },
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
      ],
    }).compile();

    service = module.get<PagibigConfigurationService>(
      PagibigConfigurationService,
    );

    // Mock file system reads
    (fs.readFile as jest.Mock).mockImplementation((path: string) => {
      if (path.includes('dates.json')) {
        return Promise.resolve(JSON.stringify(mockDatesJson));
      }
      if (path.includes('2024-01-01.json')) {
        return Promise.resolve(JSON.stringify(mock2024Config));
      }
      if (path.includes('2021-01-01.json')) {
        return Promise.resolve(JSON.stringify(mock2021Config));
      }
      return Promise.reject(new Error('File not found'));
    });
  });

  describe('getPagibigBracket', () => {
    it('should return fixed maximum values regardless of salary amount', async () => {
      const testCases = [
        { salary: 5000, date: '2024-06-15' },
        { salary: 10000, date: '2024-06-15' },
        { salary: 50000, date: '2024-06-15' },
        { salary: 100000, date: '2024-06-15' },
      ];

      for (const testCase of testCases) {
        const result = await service.getPagibigBracket(testCase);

        expect(result.employeeShare).toBe(200);
        expect(result.employerShare).toBe(200);
        expect(result.maximumEmployeeShare).toBe(200);
        expect(result.maximumEmployerShare).toBe(200);
      }
    });

    it('should use the correct configuration based on date', async () => {
      // Test with 2024 date
      const result2024 = await service.getPagibigBracket({
        salary: 20000,
        date: '2024-06-15',
      });

      expect(result2024.employeeShare).toBe(200);
      expect(result2024.employerShare).toBe(200);

      // Test with 2021 date
      const result2021 = await service.getPagibigBracket({
        salary: 20000,
        date: '2021-06-15',
      });

      expect(result2021.employeeShare).toBe(100);
      expect(result2021.employerShare).toBe(100);
    });

    it('should use oldest configuration for dates before any configuration', async () => {
      const result = await service.getPagibigBracket({
        salary: 20000,
        date: '2020-01-01', // Before 2021
      });

      expect(result.employeeShare).toBe(100); // Should use 2021 config
      expect(result.employerShare).toBe(100);
    });

    it('should not perform percentage calculations', async () => {
      // Test that changing salary doesn't affect the contribution
      const lowSalaryResult = await service.getPagibigBracket({
        salary: 1000,
        date: '2024-06-15',
      });

      const highSalaryResult = await service.getPagibigBracket({
        salary: 1000000,
        date: '2024-06-15',
      });

      expect(lowSalaryResult.employeeShare).toBe(
        highSalaryResult.employeeShare,
      );
      expect(lowSalaryResult.employerShare).toBe(
        highSalaryResult.employerShare,
      );
      expect(lowSalaryResult.employeeShare).toBe(200);
      expect(lowSalaryResult.employerShare).toBe(200);
    });
  });

  describe('getPagibigTable', () => {
    it('should return all configurations sorted by date in descending order', async () => {
      const result = await service.getPagibigTable();

      expect(result).toHaveLength(2);
      expect(result[0].dateStart).toBe('2024-01-01');
      expect(result[1].dateStart).toBe('2021-01-01');
      expect(result[0].maximumEmployeeShare).toBe(200);
      expect(result[1].maximumEmployeeShare).toBe(100);
    });
  });
});

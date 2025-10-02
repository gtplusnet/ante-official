import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ExternalFetchService, URLMapKey } from './external-fetch.service';
import { UtilityService } from '@common/utility.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('ExternalFetchService', () => {
  let service: ExternalFetchService;
  let mockUtilityService: jest.Mocked<UtilityService>;

  beforeEach(async () => {
    const mockUtilityServiceValue = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalFetchService,
        {
          provide: UtilityService,
          useValue: mockUtilityServiceValue,
        },
      ],
    }).compile();

    service = module.get<ExternalFetchService>(ExternalFetchService);
    mockUtilityService = module.get(UtilityService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getData', () => {
    it('should fetch data successfully with URLMapKey and file', async () => {
      const mockData = { test: 'data' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await service.getData(URLMapKey.pagibig, '/test.json');

      expect(fetch).toHaveBeenCalledWith(URLMapKey.pagibig + '/test.json');
      expect(result).toEqual(mockData);
      expect(mockUtilityService.log).toHaveBeenCalledWith(
        'Fetching data from external URL.',
      );
      expect(mockUtilityService.log).toHaveBeenCalledWith(
        'Data fetched successfully.',
      );
    });

    it('should fetch data successfully with URLMapKey only', async () => {
      const mockData = { test: 'data' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await service.getData(URLMapKey.tax);

      expect(fetch).toHaveBeenCalledWith(URLMapKey.tax + '');
      expect(result).toEqual(mockData);
    });

    it('should work with all URLMapKey values', async () => {
      const mockData = { test: 'data' };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const urlKeys = Object.values(URLMapKey);

      for (const urlKey of urlKeys) {
        const result = await service.getData(urlKey);
        expect(result).toEqual(mockData);
      }

      expect(fetch).toHaveBeenCalledTimes(urlKeys.length);
    });
  });

  describe('fetchData', () => {
    it('should fetch data successfully on first attempt', async () => {
      const mockData = { success: true, data: 'test' };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await service.fetchData('https://example.com/data.json');

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://example.com/data.json');
      expect(result).toEqual(mockData);
      expect(mockUtilityService.log).toHaveBeenCalledWith(
        'Fetching data from external URL.',
      );
      expect(mockUtilityService.log).toHaveBeenCalledWith(
        'Data fetched successfully.',
      );
    });

    it('should throw BadRequestException for HTTP error status', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(
        service.fetchData('https://example.com/notfound.json'),
      ).rejects.toThrow(
        new BadRequestException(
          'Failed to fetch data after 20 attempts: HTTP error! status: 404',
        ),
      );

      expect(mockUtilityService.log).toHaveBeenCalledWith(
        'HTTP error! status: 404',
      );
    });

    it('should retry on network error and succeed', async () => {
      const mockData = { retried: true };

      // First call fails, second succeeds
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData,
        });

      const result = await service.fetchData('https://example.com/data.json');

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockData);
      expect(mockUtilityService.log).toHaveBeenCalledWith(
        'Data fetched successfully.',
      );
    });

    it('should fail after max attempts', async () => {
      const errorMessage = 'Persistent network error';
      (fetch as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(
        service.fetchData('https://example.com/data.json'),
      ).rejects.toThrow(
        new BadRequestException(
          `Failed to fetch data after 20 attempts: ${errorMessage}`,
        ),
      );

      expect(fetch).toHaveBeenCalledTimes(20);
      expect(mockUtilityService.log).toHaveBeenCalledWith(
        `Failed to fetch data after 20 attempts: ${errorMessage}`,
      );
    });

    it('should handle JSON parsing errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(
        service.fetchData('https://example.com/invalid.json'),
      ).rejects.toThrow(BadRequestException);

      expect(fetch).toHaveBeenCalledTimes(20); // Should retry on JSON parse error
    });

    it('should handle different types of JSON data', async () => {
      const testCases = [
        { simple: 'string' },
        { number: 123 },
        { boolean: true },
        { array: [1, 2, 3] },
        { nested: { deep: { value: 'test' } } },
        null,
        [],
        '',
        0,
      ];

      for (const testData of testCases) {
        (fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => testData,
        });

        const result = await service.fetchData('https://example.com/data.json');
        expect(result).toEqual(testData);
      }
    });
  });

  describe('URLMapKey enum', () => {
    it('should have all expected URL map keys', () => {
      expect(URLMapKey.pagibig).toBe(
        'https://raw.githubusercontent.com/gtplusnet/geer-config/main/payroll/pagibig',
      );
      expect(URLMapKey.tax).toBe(
        'https://geer-config.guillermotabligan.com/payroll/tax',
      );
      expect(URLMapKey.nationalHoliday).toBe(
        'https://geer-config.guillermotabligan.com/payroll/national-holiday',
      );
      expect(URLMapKey.philhealth).toBe(
        'https://raw.githubusercontent.com/gtplusnet/geer-config/refs/heads/main/payroll/philhealth/',
      );
      expect(URLMapKey.sss).toBe(
        'https://raw.githubusercontent.com/gtplusnet/geer-config/refs/heads/main/payroll/sss/',
      );
    });

    it('should have correct number of URL map keys', () => {
      const urlKeys = Object.keys(URLMapKey);
      expect(urlKeys).toHaveLength(5);
    });
  });
});

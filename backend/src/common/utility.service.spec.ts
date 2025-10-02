import { Test, TestingModule } from '@nestjs/testing';
import { UtilityService } from './utility.service';
import { Logger } from 'winston';
import { TelegramService } from '@modules/communication/telegram/telegram/telegram.service';
// Unused import removed: import { createMockEventEmitter } from '../../test/setup';
import { Response } from 'express';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
// Unused import removed: import * as moment from 'moment-timezone';

describe('UtilityService', () => {
  let service: UtilityService;
  let mockLogger: Partial<Logger>;
  let mockTelegramService: Partial<TelegramService>;

  beforeEach(async () => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    mockTelegramService = {
      sendMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UtilityService,
        {
          provide: 'winston',
          useValue: mockLogger,
        },
        {
          provide: TelegramService,
          useValue: mockTelegramService,
        },
      ],
    }).compile();

    service = module.get<UtilityService>(UtilityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('randomString', () => {
    it('should generate a random string', () => {
      const result = service.randomString();

      expect(typeof result).toBe('string');
      expect(result.length).toBe(40); // 20 bytes = 40 hex characters
    });

    it('should generate different strings on multiple calls', () => {
      const string1 = service.randomString();
      const string2 = service.randomString();

      expect(string1).not.toBe(string2);
    });

    it('should only contain hex characters', () => {
      const result = service.randomString();
      const hexRegex = /^[a-f0-9]+$/;

      expect(hexRegex.test(result)).toBe(true);
    });
  });

  describe('setAccountInformation and context management', () => {
    const mockAccountInfo = {
      id: 'test-account-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      company: { id: 123 },
      role: {
        scopeList: ['READ_USERS', 'WRITE_USERS'],
      },
    };

    it('should set account information correctly', () => {
      service.setAccountInformation(mockAccountInfo as any);

      expect(service.accountInformation).toBe(mockAccountInfo);
      expect(service.companyId).toBe(123);
    });

    it('should handle account without company', () => {
      const accountWithoutCompany = { ...mockAccountInfo, company: null };
      service.setAccountInformation(accountWithoutCompany as any);

      expect(service.companyId).toBe(1); // default value
    });

    it('should clear context correctly', () => {
      service.setAccountInformation(mockAccountInfo as any);
      service.clearContext();

      expect(service.accountInformation).toBe(null);
      expect(service.companyId).toBe(null);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Cleared user context for system task execution',
      );
    });
  });

  describe('hasScope', () => {
    const mockAccountInfo = {
      id: 'test-account-id',
      role: {
        scopeList: ['READ_USERS', 'WRITE_USERS', 'DELETE_POSTS'],
      },
    };

    beforeEach(() => {
      service.setAccountInformation(mockAccountInfo as any);
    });

    it('should return true for existing scope', () => {
      expect(service.hasScope('READ_USERS')).toBe(true);
      expect(service.hasScope('WRITE_USERS')).toBe(true);
    });

    it('should return false for non-existing scope', () => {
      expect(service.hasScope('ADMIN_ACCESS')).toBe(false);
    });

    it('should return false when no account information is set', () => {
      service.clearContext();
      expect(service.hasScope('READ_USERS')).toBe(false);
    });

    it('should return false when role is not set', () => {
      service.setAccountInformation({ id: 'test', role: null } as any);
      expect(service.hasScope('READ_USERS')).toBe(false);
    });

    it('should return false when scopeList is not set', () => {
      service.setAccountInformation({ id: 'test', role: {} } as any);
      expect(service.hasScope('READ_USERS')).toBe(false);
    });
  });

  describe('formatDate', () => {
    it('should format valid date correctly', () => {
      const testDate = new Date('2023-12-25T10:30:00Z');
      const result = service.formatDate(testDate);

      expect(result).toHaveProperty('dateTime');
      expect(result).toHaveProperty('time');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('dateFull');
      expect(result).toHaveProperty('raw');
      expect(result.raw).toBeInstanceOf(Date);
    });

    it('should handle invalid date', () => {
      const result = service.formatDate('invalid-date');

      expect(result.dateTime).toBe('-');
      expect(result.time).toBe('-');
      expect(result.date).toBe('-');
      expect(result.raw).toBe(null);
    });

    it('should handle null date', () => {
      const result = service.formatDate(null);

      expect(result.dateTime).toBe('-');
      expect(result.time).toBe('-');
      expect(result.date).toBe('-');
      expect(result.raw).toBe(null);
    });

    it('should format string date correctly', () => {
      const result = service.formatDate('2023-12-25T10:30:00Z');

      expect(result.raw).toBeInstanceOf(Date);
      expect(result.dateTime).toContain('12/25/2023');
      expect(result.dateStandard).toBe('2023-12-25');
    });
  });

  describe('formatTime', () => {
    it('should format valid time correctly', () => {
      const result = service.formatTime('14:30');

      expect(result).toHaveProperty('time');
      expect(result).toHaveProperty('raw');
      expect(result).toHaveProperty('hours');
      expect(result).toHaveProperty('minutes');
      expect(result).toHaveProperty('seconds');
      expect(result.raw).toBe('14:30');
    });

    it('should handle invalid time', () => {
      const result = service.formatTime('invalid-time');

      expect(result.time).toBe('00:00');
      expect(result.raw).toBe('00:00');
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBe(0);
    });

    it('should handle empty time', () => {
      const result = service.formatTime('');

      expect(result.time).toBe('00:00');
      expect(result.raw).toBe('00:00');
    });
  });

  describe('formatCurrency', () => {
    it('should format positive number correctly', () => {
      const result = service.formatCurrency(1234.56);

      expect(result).toHaveProperty('formatCurrency');
      expect(result).toHaveProperty('formatNumber');
      expect(result).toHaveProperty('raw');
      expect(result.raw).toBe(1234.56);
      expect(result.formatNumber).toBe('1,234.56');
    });

    it('should handle zero correctly', () => {
      const result = service.formatCurrency(0);

      expect(result.raw).toBe(0);
      expect(result.formatNumber).toBe('0.00');
    });

    it('should handle negative numbers correctly', () => {
      const result = service.formatCurrency(-1234.56);

      expect(result.raw).toBe(-1234.56);
      expect(result.formatNumber).toBe('-1,234.56');
    });

    it('should handle null values', () => {
      const result = service.formatCurrency(null);

      expect(result.raw).toBe(0);
      expect(result.formatNumber).toBe('0.00');
    });

    it('should handle undefined values', () => {
      const result = service.formatCurrency(undefined);

      expect(result.raw).toBe(0);
      expect(result.formatNumber).toBe('0.00');
    });

    it('should handle NaN values', () => {
      const result = service.formatCurrency(NaN);

      expect(result.raw).toBe(0);
      expect(result.formatNumber).toBe('0.00');
    });

    it('should handle large numbers', () => {
      const result = service.formatCurrency(1234567890.12);

      expect(result.formatNumber).toBe('1,234,567,890.12');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with default decimal places', () => {
      expect(service.formatNumber(123.456)).toBe(123);
      expect(service.formatNumber(123.789)).toBe(124);
    });

    it('should format numbers with specified decimal places', () => {
      expect(service.formatNumber(123.456, 2)).toBe(123.46);
      expect(service.formatNumber(123.456, 1)).toBe(123.5);
    });

    it('should handle zero', () => {
      expect(service.formatNumber(0)).toBe(0);
      expect(service.formatNumber(0, 2)).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(service.formatNumber(-123.456, 2)).toBe(-123.46);
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      const result = service.formatPercentage(0.1234);

      expect(result.formatPercentage).toBe('12.34%');
      expect(result.formatNumber).toBe('12.34');
      expect(result.raw).toBe(0.1234);
    });

    it('should handle zero percentage', () => {
      const result = service.formatPercentage(0);

      expect(result.formatPercentage).toBe('0.00%');
      expect(result.raw).toBe(0);
    });

    it('should handle custom decimal places', () => {
      const result = service.formatPercentage(0.1234, 1);

      expect(result.formatPercentage).toBe('12.3%');
      expect(result.formatNumber).toBe('12.3');
    });
  });

  describe('formatHours', () => {
    it('should format whole hours correctly', () => {
      const result = service.formatHours(8);

      expect(result.formatted).toBe('08:00');
      expect(result.hours).toBe(8);
      expect(result.minutes).toBe(0);
      expect(result.totalMinutes).toBe(480);
    });

    it('should format hours with minutes correctly', () => {
      const result = service.formatHours(8.5);

      expect(result.formatted).toBe('08:30');
      expect(result.hours).toBe(8);
      expect(result.minutes).toBe(30);
      expect(result.totalMinutes).toBe(510);
    });

    it('should handle fractional hours correctly', () => {
      const result = service.formatHours(2.25);

      expect(result.formatted).toBe('02:15');
      expect(result.hours).toBe(2);
      expect(result.minutes).toBe(15);
    });

    it('should handle zero hours', () => {
      const result = service.formatHours(0);

      expect(result.formatted).toBe('00:00');
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.totalMinutes).toBe(0);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(service.formatFileSize(512)).toBe('512.00 B');
      expect(service.formatFileSize(1023)).toBe('1023.00 B');
    });

    it('should format KB correctly', () => {
      expect(service.formatFileSize(1025)).toBe('1.00 KB');
      expect(service.formatFileSize(1536)).toBe('1.50 KB');
    });

    it('should format MB correctly', () => {
      expect(service.formatFileSize(1024 * 1025)).toBe('1.00 MB');
      expect(service.formatFileSize(1024 * 1024 * 1.5)).toBe('1.50 MB');
    });

    it('should format GB correctly', () => {
      expect(service.formatFileSize(1024 * 1024 * 1025)).toBe('1.00 GB');
    });

    it('should handle zero size', () => {
      expect(service.formatFileSize(0)).toBe('0.00 B');
    });

    it('should handle very large sizes', () => {
      const result = service.formatFileSize(1024 * 1024 * 1024 * 1024 * 1025); // > 1 PB
      expect(result).toContain('PB');
    });
  });

  describe('convertToRoman', () => {
    it('should convert single digits correctly', () => {
      expect(service.convertToRoman(1)).toBe('I');
      expect(service.convertToRoman(2)).toBe('II');
      expect(service.convertToRoman(3)).toBe('III');
      expect(service.convertToRoman(4)).toBe('IV');
      expect(service.convertToRoman(5)).toBe('V');
      expect(service.convertToRoman(9)).toBe('IX');
    });

    it('should convert tens correctly', () => {
      expect(service.convertToRoman(10)).toBe('X');
      expect(service.convertToRoman(40)).toBe('XL');
      expect(service.convertToRoman(50)).toBe('L');
      expect(service.convertToRoman(90)).toBe('XC');
    });

    it('should convert hundreds correctly', () => {
      expect(service.convertToRoman(100)).toBe('C');
      expect(service.convertToRoman(400)).toBe('CD');
      expect(service.convertToRoman(500)).toBe('D');
      expect(service.convertToRoman(900)).toBe('CM');
    });

    it('should convert thousands correctly', () => {
      expect(service.convertToRoman(1000)).toBe('M');
      expect(service.convertToRoman(2023)).toBe('MMXXIII');
    });

    it('should handle complex numbers', () => {
      expect(service.convertToRoman(1994)).toBe('MCMXCIV');
      expect(service.convertToRoman(3999)).toBe('MMMCMXCIX');
    });
  });

  describe('capitalizeFirstLetter', () => {
    it('should capitalize first letter of lowercase string', () => {
      expect(service.capitalizeFirstLetter('hello')).toBe('Hello');
    });

    it('should handle already capitalized string', () => {
      expect(service.capitalizeFirstLetter('Hello')).toBe('Hello');
    });

    it('should handle single character', () => {
      expect(service.capitalizeFirstLetter('a')).toBe('A');
    });

    it('should handle empty string', () => {
      expect(service.capitalizeFirstLetter('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(service.capitalizeFirstLetter(null)).toBe('');
      expect(service.capitalizeFirstLetter(undefined)).toBe('');
    });

    it('should handle strings with spaces', () => {
      expect(service.capitalizeFirstLetter('hello world')).toBe('Hello world');
    });
  });

  describe('currentDate', () => {
    it('should return current date in correct format', () => {
      const result = service.currentDate();
      const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

      expect(dateRegex.test(result)).toBe(true);
    });
  });

  describe('getDayOfWeek', () => {
    it('should return correct day of week', () => {
      const testDate = new Date('2023-12-25'); // Monday
      const result = service.getDayOfWeek(testDate);

      expect(typeof result).toBe('string');
      expect([
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ]).toContain(result);
    });
  });

  describe('manilaToUTC', () => {
    it('should convert Manila time to UTC', () => {
      const manilaTime = '2023-12-25 10:30:00';
      const result = service.manilaToUTC(manilaTime);

      expect(result).toBeInstanceOf(Date);
    });

    it('should handle Date object input', () => {
      const testDate = new Date();
      const result = service.manilaToUTC(testDate);

      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('getHowManyDayPerYear', () => {
    it('should count Mondays in a year correctly', () => {
      const testDate = new Date('2023-01-01');
      const result = service.getHowManyDayPerYear('monday', testDate);

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(50);
      expect(result).toBeLessThan(55);
    });

    it('should handle different days of week', () => {
      const testDate = new Date('2023-01-01');
      const days = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];

      days.forEach((day) => {
        const result = service.getHowManyDayPerYear(day, testDate);
        expect(result).toBeGreaterThan(50);
        expect(result).toBeLessThan(55);
      });
    });
  });

  describe('log and error', () => {
    it('should log information correctly', () => {
      const testMessage = 'Test log message';
      service.log(testMessage);

      expect(mockLogger.info).toHaveBeenCalledWith(testMessage);
    });

    it('should log errors correctly', () => {
      const testError = 'Test error message';
      service.error(testError);

      expect(mockLogger.error).toHaveBeenCalledWith(testError);
    });
  });

  describe('errorResponse', () => {
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        req: {
          body: { test: 'body' },
          query: { test: 'query' },
          params: { test: 'params' },
          ip: '127.0.0.1',
          method: 'GET',
          url: '/test',
        },
      } as any;
    });

    it('should handle NotFoundException without sending telegram', () => {
      const error = new NotFoundException('Test not found');

      service.errorResponse(mockResponse, error, 'Test error');

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockTelegramService.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle BadRequestException without sending telegram', () => {
      const error = new BadRequestException('Test bad request');

      service.errorResponse(mockResponse, error, 'Test error');

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockTelegramService.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle ForbiddenException without sending telegram', () => {
      const error = new ForbiddenException('Test forbidden');

      service.errorResponse(mockResponse, error, 'Test error');

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockTelegramService.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle generic errors and send telegram', () => {
      const error = new Error('Generic error');
      error.stack = 'Error stack trace';

      service.errorResponse(mockResponse, error, 'Test error');

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockTelegramService.sendMessage).toHaveBeenCalled();
    });

    it('should handle errors with response property', () => {
      const error: any = {
        message: 'Test error',
        response: { message: 'Response error message' },
        stack: 'Error stack trace',
        toString: () => 'Test error',
      };

      service.errorResponse(mockResponse, error, 'Test error');

      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.errorMessage).toBe('Response error message');
    });

    it('should handle errors with meta property', () => {
      const error: any = {
        message: 'Test error',
        meta: { cause: 'Meta error cause' },
        stack: 'Error stack trace',
        toString: () => 'Test error',
      };

      service.errorResponse(mockResponse, error, 'Test error');

      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.errorMessage).toBe('Meta error cause');
    });
  });
});

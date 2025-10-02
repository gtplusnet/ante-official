import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost } from '@nestjs/common';
import { Socket } from 'socket.io';
import { WsExceptionFilter } from './ws.exception.filter';
import { CustomWsException } from './custom-ws.exception';

describe('WsExceptionFilter', () => {
  let filter: WsExceptionFilter;
  let mockSocket: jest.Mocked<Socket>;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WsExceptionFilter],
    }).compile();

    filter = module.get<WsExceptionFilter>(WsExceptionFilter);

    mockSocket = {
      emit: jest.fn(),
    } as any;

    mockArgumentsHost = {
      switchToWs: jest.fn().mockReturnValue({
        getClient: jest.fn().mockReturnValue(mockSocket),
      }),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('should emit exception with all properties', () => {
      const exception = new CustomWsException(
        400,
        'Bad Request',
        'INVALID_INPUT',
      );
      const mockDate = new Date('2023-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      filter.catch(exception, mockArgumentsHost);

      expect(mockArgumentsHost.switchToWs).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('exception', {
        statusCode: 400,
        timestamp: '2023-01-01T00:00:00.000Z',
        message: 'Bad Request',
        errorCode: 'INVALID_INPUT',
      });

      (global.Date as any).mockRestore();
    });

    it('should use default message when exception message is undefined', () => {
      const exception = new CustomWsException(500, undefined, 'SERVER_ERROR');
      const mockDate = new Date('2023-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      filter.catch(exception, mockArgumentsHost);

      expect(mockSocket.emit).toHaveBeenCalledWith('exception', {
        statusCode: 500,
        timestamp: '2023-01-01T00:00:00.000Z',
        message: 'Internal Server Error',
        errorCode: 'SERVER_ERROR',
      });

      (global.Date as any).mockRestore();
    });

    it('should use default error code when exception errorCode is undefined', () => {
      const exception = new CustomWsException(404, 'Not Found');
      const mockDate = new Date('2023-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      filter.catch(exception, mockArgumentsHost);

      expect(mockSocket.emit).toHaveBeenCalledWith('exception', {
        statusCode: 404,
        timestamp: '2023-01-01T00:00:00.000Z',
        message: 'Not Found',
        errorCode: 'UNKNOWN_ERROR',
      });

      (global.Date as any).mockRestore();
    });

    it('should use defaults when both message and errorCode are undefined', () => {
      const exception = new CustomWsException(500);
      const mockDate = new Date('2023-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      filter.catch(exception, mockArgumentsHost);

      expect(mockSocket.emit).toHaveBeenCalledWith('exception', {
        statusCode: 500,
        timestamp: '2023-01-01T00:00:00.000Z',
        message: 'Internal Server Error',
        errorCode: 'UNKNOWN_ERROR',
      });

      (global.Date as any).mockRestore();
    });

    it('should handle empty string message', () => {
      const exception = new CustomWsException(400, '', 'EMPTY_MESSAGE');
      const mockDate = new Date('2023-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      filter.catch(exception, mockArgumentsHost);

      expect(mockSocket.emit).toHaveBeenCalledWith('exception', {
        statusCode: 400,
        timestamp: '2023-01-01T00:00:00.000Z',
        message: 'Internal Server Error', // Empty string should use default
        errorCode: 'EMPTY_MESSAGE',
      });

      (global.Date as any).mockRestore();
    });

    it('should handle empty string error code', () => {
      const exception = new CustomWsException(400, 'Bad Request', '');
      const mockDate = new Date('2023-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      filter.catch(exception, mockArgumentsHost);

      expect(mockSocket.emit).toHaveBeenCalledWith('exception', {
        statusCode: 400,
        timestamp: '2023-01-01T00:00:00.000Z',
        message: 'Bad Request',
        errorCode: 'UNKNOWN_ERROR', // Empty string should use default
      });

      (global.Date as any).mockRestore();
    });

    it('should generate current timestamp', () => {
      const exception = new CustomWsException(400, 'Test', 'TEST');
      const realDate = Date;
      const mockDate = new Date('2023-06-15T10:30:45.123Z');

      global.Date = jest.fn(() => mockDate) as any;
      global.Date.now = realDate.now;
      global.Date.parse = realDate.parse;
      global.Date.UTC = realDate.UTC;

      filter.catch(exception, mockArgumentsHost);

      expect(mockSocket.emit).toHaveBeenCalledWith('exception', {
        statusCode: 400,
        timestamp: '2023-06-15T10:30:45.123Z',
        message: 'Test',
        errorCode: 'TEST',
      });

      global.Date = realDate;
    });

    it('should correctly extract client from WebSocket context', () => {
      const exception = new CustomWsException(400, 'Test', 'TEST');
      const mockGetClient = jest.fn().mockReturnValue(mockSocket);
      const mockSwitchToWs = jest.fn().mockReturnValue({
        getClient: mockGetClient,
      });

      mockArgumentsHost.switchToWs = mockSwitchToWs;

      filter.catch(exception, mockArgumentsHost);

      expect(mockSwitchToWs).toHaveBeenCalled();
      expect(mockGetClient).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalled();
    });
  });
});

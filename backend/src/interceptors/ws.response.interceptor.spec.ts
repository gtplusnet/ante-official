import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { Socket } from 'socket.io';
import { WsResponseInterceptor } from './ws.response.interceptor';
import { CustomWsException } from '../filters/custom-ws.exception';

describe('WsResponseInterceptor', () => {
  let interceptor: WsResponseInterceptor;
  let mockReflector: jest.Mocked<Reflector>;
  let mockContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockSocket: jest.Mocked<Socket>;

  beforeEach(async () => {
    mockSocket = {
      emit: jest.fn(),
      connected: true,
    } as any;

    mockReflector = {
      get: jest.fn(),
    } as any;

    mockContext = {
      switchToWs: jest.fn().mockReturnValue({
        getClient: jest.fn().mockReturnValue(mockSocket),
      }),
      getHandler: jest.fn(),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsResponseInterceptor,
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    interceptor = module.get<WsResponseInterceptor>(WsResponseInterceptor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should map data and call response handler', (done) => {
      const testData = { id: 1, name: 'Test' };
      mockCallHandler.handle.mockReturnValue(of(testData));
      mockReflector.get.mockReturnValue('test-event');

      const responseHandlerSpy = jest
        .spyOn(interceptor, 'responseHandler')
        .mockImplementation();

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual(testData);
          expect(responseHandlerSpy).toHaveBeenCalledWith(
            testData,
            mockContext,
          );
          done();
        },
      });
    });

    it('should pass through data unchanged in map operation', (done) => {
      const testData = { message: 'Hello', data: [1, 2, 3] };
      mockCallHandler.handle.mockReturnValue(of(testData));
      mockReflector.get.mockReturnValue('test-event');

      jest.spyOn(interceptor, 'responseHandler').mockImplementation();

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({ ...testData });
          done();
        },
      });
    });

    it('should handle empty data', (done) => {
      mockCallHandler.handle.mockReturnValue(of(null));
      mockReflector.get.mockReturnValue('test-event');

      jest.spyOn(interceptor, 'responseHandler').mockImplementation();

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({});
          done();
        },
      });
    });

    it('should handle undefined data', (done) => {
      mockCallHandler.handle.mockReturnValue(of(undefined));
      mockReflector.get.mockReturnValue('test-event');

      jest.spyOn(interceptor, 'responseHandler').mockImplementation();

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({});
          done();
        },
      });
    });

    it('should propagate errors from the handler', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('responseHandler', () => {
    it('should emit success response with correct event name', () => {
      const testData = { id: 1, name: 'Test' };
      mockReflector.get.mockReturnValue('user-created');

      interceptor.responseHandler(testData, mockContext);

      expect(mockContext.switchToWs).toHaveBeenCalled();
      expect(mockReflector.get).toHaveBeenCalledWith(
        'message',
        mockContext.getHandler(),
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('user-created_SUCCESS', {
        status: true,
        data: testData,
      });
    });

    it('should handle null event name', () => {
      const testData = { test: 'data' };
      mockReflector.get.mockReturnValue(null);

      interceptor.responseHandler(testData, mockContext);

      expect(mockSocket.emit).toHaveBeenCalledWith('null_SUCCESS', {
        status: true,
        data: testData,
      });
    });

    it('should handle undefined event name', () => {
      const testData = { test: 'data' };
      mockReflector.get.mockReturnValue(undefined);

      interceptor.responseHandler(testData, mockContext);

      expect(mockSocket.emit).toHaveBeenCalledWith('undefined_SUCCESS', {
        status: true,
        data: testData,
      });
    });

    it('should not emit when client is disconnected', () => {
      const testData = { test: 'data' };
      mockSocket.connected = false;
      mockReflector.get.mockReturnValue('test-event');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      interceptor.responseHandler(testData, mockContext);

      expect(consoleSpy).toHaveBeenCalledWith('Client is not connected');
      expect(mockSocket.emit).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should log when client is disconnected', () => {
      const testData = { test: 'data' };
      mockSocket.connected = false;
      mockReflector.get.mockReturnValue('test-event');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      interceptor.responseHandler(testData, mockContext);

      expect(consoleSpy).toHaveBeenCalledWith('Client is not connected');

      consoleSpy.mockRestore();
    });

    it('should handle empty string event name', () => {
      const testData = { test: 'data' };
      mockReflector.get.mockReturnValue('');

      interceptor.responseHandler(testData, mockContext);

      expect(mockSocket.emit).toHaveBeenCalledWith('_SUCCESS', {
        status: true,
        data: testData,
      });
    });

    it('should handle complex data structures', () => {
      const complexData = {
        user: { id: 1, profile: { name: 'John', settings: { theme: 'dark' } } },
        items: [
          { id: 1, name: 'Item1' },
          { id: 2, name: 'Item2' },
        ],
        metadata: { timestamp: new Date(), count: 10 },
      };
      mockReflector.get.mockReturnValue('complex-event');

      interceptor.responseHandler(complexData, mockContext);

      expect(mockSocket.emit).toHaveBeenCalledWith('complex-event_SUCCESS', {
        status: true,
        data: complexData,
      });
    });
  });

  describe('errorHandler', () => {
    it('should emit error response with correct format', () => {
      const exception = new CustomWsException(
        400,
        'Bad Request',
        'VALIDATION_ERROR',
      );

      interceptor.errorHandler(exception, mockContext);

      expect(mockContext.switchToWs).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('exception', {
        status: false,
        statusCode: 400,
        message: 'Bad Request',
      });
    });

    it('should use default message when exception message is undefined', () => {
      const exception = new CustomWsException(500, undefined, 'SERVER_ERROR');

      interceptor.errorHandler(exception, mockContext);

      expect(mockSocket.emit).toHaveBeenCalledWith('exception', {
        status: false,
        statusCode: 500,
        message: 'Internal Server Error',
      });
    });

    it('should use default message when exception message is null', () => {
      const exception = new CustomWsException(500, null as any, 'SERVER_ERROR');

      interceptor.errorHandler(exception, mockContext);

      expect(mockSocket.emit).toHaveBeenCalledWith('exception', {
        status: false,
        statusCode: 500,
        message: 'Internal Server Error',
      });
    });

    it('should use default message when exception message is empty string', () => {
      const exception = new CustomWsException(422, '', 'VALIDATION_ERROR');

      interceptor.errorHandler(exception, mockContext);

      expect(mockSocket.emit).toHaveBeenCalledWith('exception', {
        status: false,
        statusCode: 422,
        message: 'Internal Server Error',
      });
    });

    it('should handle different status codes', () => {
      const statusCodes = [400, 401, 403, 404, 422, 429, 500, 502, 503];

      statusCodes.forEach((statusCode) => {
        const exception = new CustomWsException(
          statusCode,
          `Error ${statusCode}`,
          'TEST_ERROR',
        );

        interceptor.errorHandler(exception, mockContext);

        expect(mockSocket.emit).toHaveBeenCalledWith('exception', {
          status: false,
          statusCode,
          message: `Error ${statusCode}`,
        });
      });

      expect(mockSocket.emit).toHaveBeenCalledTimes(statusCodes.length);
    });

    it('should extract client from WebSocket context correctly', () => {
      const exception = new CustomWsException(400, 'Test Error');
      const mockGetClient = jest.fn().mockReturnValue(mockSocket);
      const mockSwitchToWs = jest.fn().mockReturnValue({
        getClient: mockGetClient,
      });

      mockContext.switchToWs = mockSwitchToWs;

      interceptor.errorHandler(exception, mockContext);

      expect(mockSwitchToWs).toHaveBeenCalled();
      expect(mockGetClient).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalled();
    });
  });

  describe('integration', () => {
    it('should handle the complete flow for successful responses', (done) => {
      const testData = { message: 'Success' };
      mockCallHandler.handle.mockReturnValue(of(testData));
      mockReflector.get.mockReturnValue('test-action');

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual(testData);
          expect(mockSocket.emit).toHaveBeenCalledWith('test-action_SUCCESS', {
            status: true,
            data: testData,
          });
          done();
        },
      });
    });

    it('should work with reflector to get message metadata', () => {
      const testData = { test: 'data' };
      const handlerFunction = jest.fn();
      mockContext.getHandler.mockReturnValue(handlerFunction);
      mockReflector.get.mockReturnValue('message-event');

      interceptor.responseHandler(testData, mockContext);

      expect(mockReflector.get).toHaveBeenCalledWith(
        'message',
        handlerFunction,
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('message-event_SUCCESS', {
        status: true,
        data: testData,
      });
    });
  });
});

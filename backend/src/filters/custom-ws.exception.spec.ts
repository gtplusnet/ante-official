import { WsException } from '@nestjs/websockets';
import { CustomWsException } from './custom-ws.exception';

describe('CustomWsException', () => {
  it('should be defined', () => {
    expect(CustomWsException).toBeDefined();
  });

  it('should extend WsException', () => {
    const exception = new CustomWsException(400);
    expect(exception).toBeInstanceOf(WsException);
    expect(exception).toBeInstanceOf(CustomWsException);
  });

  describe('constructor', () => {
    it('should create exception with status only', () => {
      const exception = new CustomWsException(404);

      expect(exception.status).toBe(404);
      expect(exception.message).toBe('Custom Ws Exception');
      expect(exception.errorCode).toBeUndefined();
    });

    it('should create exception with status and message', () => {
      const exception = new CustomWsException(400, 'Bad Request');

      expect(exception.status).toBe(400);
      expect(exception.message).toBe('Bad Request');
      expect(exception.errorCode).toBeUndefined();
    });

    it('should create exception with all parameters', () => {
      const exception = new CustomWsException(
        500,
        'Internal Server Error',
        'SERVER_ERROR',
      );

      expect(exception.status).toBe(500);
      expect(exception.message).toBe('Internal Server Error');
      expect(exception.errorCode).toBe('SERVER_ERROR');
    });

    it('should handle undefined message', () => {
      const exception = new CustomWsException(401, undefined, 'UNAUTHORIZED');

      expect(exception.status).toBe(401);
      expect(exception.message).toBe('Custom Ws Exception');
      expect(exception.errorCode).toBe('UNAUTHORIZED');
    });

    it('should handle undefined errorCode', () => {
      const exception = new CustomWsException(403, 'Forbidden', undefined);

      expect(exception.status).toBe(403);
      expect(exception.message).toBe('Forbidden');
      expect(exception.errorCode).toBeUndefined();
    });

    it('should handle empty string message', () => {
      const exception = new CustomWsException(422, '', 'VALIDATION_ERROR');

      expect(exception.status).toBe(422);
      expect(exception.message).toBe('');
      expect(exception.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should handle empty string errorCode', () => {
      const exception = new CustomWsException(429, 'Too Many Requests', '');

      expect(exception.status).toBe(429);
      expect(exception.message).toBe('Too Many Requests');
      expect(exception.errorCode).toBe('');
    });

    it('should handle null values', () => {
      const exception = new CustomWsException(400, null as any, null as any);

      expect(exception.status).toBe(400);
      expect(exception.message).toBe('Custom Ws Exception');
      expect(exception.errorCode).toBeNull();
    });

    it('should call parent constructor with message', () => {
      const message = 'Test error message';
      const exception = new CustomWsException(400, message);

      // The message should be passed to the parent WsException constructor
      expect(exception.message).toBe(message);
    });

    it('should call parent constructor with undefined message', () => {
      const exception = new CustomWsException(400);

      // When no message is provided, WsException sets a default message
      expect(exception.message).toBe('Custom Ws Exception');
    });
  });

  describe('properties', () => {
    it('should have status property accessible', () => {
      const exception = new CustomWsException(418);

      expect(exception.status).toBe(418);
      expect(exception).toHaveProperty('status');
    });

    it('should have optional errorCode property', () => {
      const exception1 = new CustomWsException(400);
      const exception2 = new CustomWsException(400, 'Message', 'ERROR_CODE');

      expect(exception1).toHaveProperty('errorCode');
      expect(exception1.errorCode).toBeUndefined();

      expect(exception2).toHaveProperty('errorCode');
      expect(exception2.errorCode).toBe('ERROR_CODE');
    });

    it('should allow property modification after creation', () => {
      const exception = new CustomWsException(400);

      exception.status = 500;
      exception.errorCode = 'MODIFIED_ERROR';

      expect(exception.status).toBe(500);
      expect(exception.errorCode).toBe('MODIFIED_ERROR');
    });
  });

  describe('inheritance behavior', () => {
    it('should inherit WsException methods and properties', () => {
      const exception = new CustomWsException(400, 'Test message');

      // Should have Error behavior (WsException extends Error)
      expect(exception.name).toBe('Error');
      expect(exception.stack).toBeDefined();
    });

    it('should be catchable as WsException', () => {
      const exception = new CustomWsException(400, 'Test');

      expect(exception instanceof WsException).toBe(true);
      expect(exception instanceof Error).toBe(true);
    });

    it('should maintain error stack trace', () => {
      const exception = new CustomWsException(500, 'Server Error');

      expect(exception.stack).toBeDefined();
      expect(typeof exception.stack).toBe('string');
      expect(exception.stack).toContain('Error');
    });
  });

  describe('common HTTP status codes', () => {
    const testCases = [
      { status: 400, description: 'Bad Request' },
      { status: 401, description: 'Unauthorized' },
      { status: 403, description: 'Forbidden' },
      { status: 404, description: 'Not Found' },
      { status: 422, description: 'Unprocessable Entity' },
      { status: 429, description: 'Too Many Requests' },
      { status: 500, description: 'Internal Server Error' },
      { status: 502, description: 'Bad Gateway' },
      { status: 503, description: 'Service Unavailable' },
    ];

    test.each(testCases)(
      'should handle status $status ($description)',
      ({ status, description }) => {
        const exception = new CustomWsException(
          status,
          description,
          `${status}_ERROR`,
        );

        expect(exception.status).toBe(status);
        expect(exception.message).toBe(description);
        expect(exception.errorCode).toBe(`${status}_ERROR`);
      },
    );
  });
});

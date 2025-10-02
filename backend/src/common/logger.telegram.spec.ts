import TelegramTransport from './logger.telegram';
import { TelegramService } from '@modules/communication/telegram/telegram/telegram.service';

// Mock the TelegramService
jest.mock('@modules/communication/telegram/telegram/telegram.service');

describe('TelegramTransport', () => {
  let transport: TelegramTransport;
  let mockTelegramService: jest.Mocked<TelegramService>;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    jest.clearAllMocks();

    // Store original environment variable
    originalEnv = process.env.TELEGRAM_DEBUG;

    const mockedTelegramService = TelegramService as jest.MockedClass<
      typeof TelegramService
    >;
    mockTelegramService = {
      sendMessage: jest.fn(),
    } as any;

    mockedTelegramService.mockImplementation(() => mockTelegramService);

    transport = new TelegramTransport({});
  });

  afterEach(() => {
    // Restore original environment variable
    if (originalEnv !== undefined) {
      process.env.TELEGRAM_DEBUG = originalEnv;
    } else {
      delete process.env.TELEGRAM_DEBUG;
    }
  });

  it('should be defined', () => {
    expect(transport).toBeDefined();
  });

  it('should extend Transport class', () => {
    expect(transport).toBeInstanceOf(TelegramTransport);
    expect(typeof transport.log).toBe('function');
    expect(typeof transport.emit).toBe('function');
  });

  it('should create TelegramService instance in constructor', () => {
    expect(TelegramService).toHaveBeenCalledTimes(1);
  });

  describe('constructor', () => {
    it('should accept transport options', () => {
      const opts = { level: 'error' };
      const newTransport = new TelegramTransport(opts);

      expect(newTransport).toBeDefined();
      expect(TelegramService).toHaveBeenCalledTimes(2); // Once from beforeEach, once here
    });

    it('should initialize with empty options', () => {
      const newTransport = new TelegramTransport({});
      expect(newTransport).toBeDefined();
    });
  });

  describe('log', () => {
    it('should emit logged event', (done) => {
      const info = { message: 'Test message', level: 'info' };
      const callback = jest.fn();

      transport.on('logged', (loggedInfo) => {
        expect(loggedInfo).toBe(info);
        done();
      });

      transport.log(info, callback);
    });

    it('should call callback', () => {
      const info = { message: 'Test message' };
      const callback = jest.fn();

      transport.log(info, callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should send message to Telegram when TELEGRAM_DEBUG is true', () => {
      process.env.TELEGRAM_DEBUG = 'true';
      const info = { message: 'Debug message', level: 'error' };
      const callback = jest.fn();

      transport.log(info, callback);

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        'Debug message',
      );
      expect(mockTelegramService.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('should not send message to Telegram when TELEGRAM_DEBUG is false', () => {
      process.env.TELEGRAM_DEBUG = 'false';
      const info = { message: 'Debug message', level: 'error' };
      const callback = jest.fn();

      transport.log(info, callback);

      expect(mockTelegramService.sendMessage).not.toHaveBeenCalled();
    });

    it('should not send message to Telegram when TELEGRAM_DEBUG is undefined', () => {
      delete process.env.TELEGRAM_DEBUG;
      const info = { message: 'Debug message', level: 'error' };
      const callback = jest.fn();

      transport.log(info, callback);

      expect(mockTelegramService.sendMessage).not.toHaveBeenCalled();
    });

    it('should not send message to Telegram when TELEGRAM_DEBUG is empty string', () => {
      process.env.TELEGRAM_DEBUG = '';
      const info = { message: 'Debug message', level: 'error' };
      const callback = jest.fn();

      transport.log(info, callback);

      expect(mockTelegramService.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle info with complex message format', () => {
      process.env.TELEGRAM_DEBUG = 'true';
      const info = {
        message: 'Complex message with data',
        level: 'error',
        timestamp: '2023-01-01',
        meta: { userId: 123 },
      };
      const callback = jest.fn();

      transport.log(info, callback);

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        'Complex message with data',
      );
    });

    it('should handle info with number message', () => {
      process.env.TELEGRAM_DEBUG = 'true';
      const info = { message: 123, level: 'info' };
      const callback = jest.fn();

      transport.log(info, callback);

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith('123');
    });

    it('should handle info with null message', () => {
      process.env.TELEGRAM_DEBUG = 'true';
      const info = { message: null, level: 'info' };
      const callback = jest.fn();

      transport.log(info, callback);

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith('null');
    });

    it('should handle info with undefined message', () => {
      process.env.TELEGRAM_DEBUG = 'true';
      const info = { message: undefined, level: 'info' };
      const callback = jest.fn();

      transport.log(info, callback);

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith('undefined');
    });

    it('should handle empty info object', () => {
      process.env.TELEGRAM_DEBUG = 'true';
      const info = {};
      const callback = jest.fn();

      transport.log(info, callback);

      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith('undefined');
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('setImmediate behavior', () => {
    it('should emit logged event asynchronously', (done) => {
      const info = { message: 'Async test' };
      const callback = jest.fn();
      let emitted = false;

      transport.on('logged', () => {
        emitted = true;
        expect(callback).toHaveBeenCalled();
        done();
      });

      transport.log(info, callback);

      // At this point, the event should not have been emitted yet
      // because setImmediate makes it asynchronous
      expect(emitted).toBe(false);
    });

    it('should call callback before emitting logged event', (done) => {
      const info = { message: 'Order test' };
      let callbackCalled = false;
      let eventEmitted = false;

      const callback = () => {
        callbackCalled = true;
        // Event should not be emitted yet due to setImmediate
        expect(eventEmitted).toBe(false);
      };

      transport.on('logged', () => {
        eventEmitted = true;
        expect(callbackCalled).toBe(true);
        done();
      });

      transport.log(info, callback);
    });
  });

  describe('different TELEGRAM_DEBUG values', () => {
    const testCases = [
      { value: 'true', shouldSend: true },
      { value: 'TRUE', shouldSend: false },
      { value: 'True', shouldSend: false },
      { value: '1', shouldSend: false },
      { value: 'yes', shouldSend: false },
      { value: 'false', shouldSend: false },
      { value: '0', shouldSend: false },
    ];

    testCases.forEach(({ value, shouldSend }) => {
      it(`should ${shouldSend ? 'send' : 'not send'} message when TELEGRAM_DEBUG is '${value}'`, () => {
        process.env.TELEGRAM_DEBUG = value;
        const info = { message: 'Test message' };
        const callback = jest.fn();

        transport.log(info, callback);

        if (shouldSend) {
          expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
            'Test message',
          );
        } else {
          expect(mockTelegramService.sendMessage).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe('error handling', () => {
    it('should handle TelegramService sendMessage errors gracefully', () => {
      process.env.TELEGRAM_DEBUG = 'true';
      mockTelegramService.sendMessage.mockImplementation(() => {
        throw new Error('Telegram API error');
      });

      const info = { message: 'Error test' };
      const callback = jest.fn();

      // Should not throw error even if TelegramService throws
      expect(() => transport.log(info, callback)).not.toThrow();
      expect(callback).toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', (done) => {
      const info = { message: 'Callback error test' };
      const callback = () => {
        throw new Error('Callback error');
      };

      transport.on('logged', () => {
        // Event should still be emitted even if callback throws
        done();
      });

      // Should not throw error even if callback throws
      expect(() => transport.log(info, callback)).not.toThrow();
    });
  });
});

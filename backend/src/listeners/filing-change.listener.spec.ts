import { Test, TestingModule } from '@nestjs/testing';
import {
  FilingChangeListener,
  FilingChangeEvent,
} from './filing-change.listener';
import { SocketService } from '@modules/communication/socket/socket/socket.service';

describe('FilingChangeListener', () => {
  let listener: FilingChangeListener;
  let mockSocketService: jest.Mocked<SocketService>;

  beforeEach(async () => {
    const mockSocketServiceProvider = {
      provide: SocketService,
      useValue: {
        emitToClients: jest.fn(),
        emitToAll: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [FilingChangeListener, mockSocketServiceProvider],
    }).compile();

    listener = module.get<FilingChangeListener>(FilingChangeListener);
    mockSocketService = module.get(SocketService) as jest.Mocked<SocketService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  describe('constructor', () => {
    it('should log initialization message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      new FilingChangeListener();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[FilingChangeListener] Initialized',
      );
      consoleSpy.mockRestore();
    });
  });

  describe('handleFilingChanged', () => {
    const baseEvent: FilingChangeEvent = {
      action: 'update',
      filingId: 123,
      filing: { id: 123, status: 'PENDING' },
      affectedUserIds: [],
      timestamp: '2023-01-01T00:00:00Z',
    };

    it('should emit filing-updated to affected users when affectedUserIds is provided', async () => {
      const event: FilingChangeEvent = {
        ...baseEvent,
        affectedUserIds: ['user1', 'user2'],
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await listener.handleFilingChanged(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[FilingChangeListener] Received filing.changed event:',
        event,
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[FilingChangeListener] Emitting socket event filing-updated to affected users:',
        ['user1', 'user2'],
      );
      expect(mockSocketService.emitToClients).toHaveBeenCalledWith(
        ['user1', 'user2'],
        'filing-updated',
        event,
      );
      expect(mockSocketService.emitToAll).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should emit filing-updated to all users when no affectedUserIds provided', async () => {
      const event: FilingChangeEvent = {
        ...baseEvent,
        affectedUserIds: [],
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await listener.handleFilingChanged(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[FilingChangeListener] No affected users found, emitting to all users',
      );
      expect(mockSocketService.emitToAll).toHaveBeenCalledWith(
        'filing-updated',
        event,
      );
      expect(mockSocketService.emitToClients).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should emit filing-updated to all users when affectedUserIds is null/undefined', async () => {
      const event: FilingChangeEvent = {
        ...baseEvent,
        affectedUserIds: null as any,
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await listener.handleFilingChanged(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[FilingChangeListener] No affected users found, emitting to all users',
      );
      expect(mockSocketService.emitToAll).toHaveBeenCalledWith(
        'filing-updated',
        event,
      );

      consoleSpy.mockRestore();
    });

    describe('create action', () => {
      it('should emit filing-created to affected users', async () => {
        const event: FilingChangeEvent = {
          ...baseEvent,
          action: 'create',
          affectedUserIds: ['user1'],
        };

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await listener.handleFilingChanged(event);

        const expectedCreatedEvent = {
          filingId: 123,
          filing: { id: 123, status: 'PENDING' },
          timestamp: '2023-01-01T00:00:00Z',
        };

        expect(mockSocketService.emitToClients).toHaveBeenCalledWith(
          ['user1'],
          'filing-created',
          expectedCreatedEvent,
        );

        consoleSpy.mockRestore();
      });

      it('should emit filing-created to all users when no affected users', async () => {
        const event: FilingChangeEvent = {
          ...baseEvent,
          action: 'create',
          affectedUserIds: [],
        };

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await listener.handleFilingChanged(event);

        const expectedCreatedEvent = {
          filingId: 123,
          filing: { id: 123, status: 'PENDING' },
          timestamp: '2023-01-01T00:00:00Z',
        };

        expect(mockSocketService.emitToAll).toHaveBeenCalledWith(
          'filing-created',
          expectedCreatedEvent,
        );

        consoleSpy.mockRestore();
      });
    });

    describe('update action with APPROVED status', () => {
      it('should emit filing-approved to affected users', async () => {
        const event: FilingChangeEvent = {
          ...baseEvent,
          action: 'update',
          filing: { id: 123, status: 'APPROVED' },
          affectedUserIds: ['user1'],
        };

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await listener.handleFilingChanged(event);

        const expectedApprovedEvent = {
          filingId: 123,
          filing: { id: 123, status: 'APPROVED' },
          timestamp: '2023-01-01T00:00:00Z',
        };

        expect(mockSocketService.emitToClients).toHaveBeenCalledWith(
          ['user1'],
          'filing-approved',
          expectedApprovedEvent,
        );

        consoleSpy.mockRestore();
      });

      it('should emit filing-approved to all users when no affected users', async () => {
        const event: FilingChangeEvent = {
          ...baseEvent,
          action: 'update',
          filing: { id: 123, status: 'APPROVED' },
          affectedUserIds: [],
        };

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await listener.handleFilingChanged(event);

        const expectedApprovedEvent = {
          filingId: 123,
          filing: { id: 123, status: 'APPROVED' },
          timestamp: '2023-01-01T00:00:00Z',
        };

        expect(mockSocketService.emitToAll).toHaveBeenCalledWith(
          'filing-approved',
          expectedApprovedEvent,
        );

        consoleSpy.mockRestore();
      });
    });

    describe('update action with REJECTED status', () => {
      it('should emit filing-rejected to affected users', async () => {
        const event: FilingChangeEvent = {
          ...baseEvent,
          action: 'update',
          filing: { id: 123, status: 'REJECTED' },
          affectedUserIds: ['user1'],
        };

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await listener.handleFilingChanged(event);

        const expectedRejectedEvent = {
          filingId: 123,
          filing: { id: 123, status: 'REJECTED' },
          timestamp: '2023-01-01T00:00:00Z',
        };

        expect(mockSocketService.emitToClients).toHaveBeenCalledWith(
          ['user1'],
          'filing-rejected',
          expectedRejectedEvent,
        );

        consoleSpy.mockRestore();
      });

      it('should emit filing-rejected to all users when no affected users', async () => {
        const event: FilingChangeEvent = {
          ...baseEvent,
          action: 'update',
          filing: { id: 123, status: 'REJECTED' },
          affectedUserIds: [],
        };

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await listener.handleFilingChanged(event);

        const expectedRejectedEvent = {
          filingId: 123,
          filing: { id: 123, status: 'REJECTED' },
          timestamp: '2023-01-01T00:00:00Z',
        };

        expect(mockSocketService.emitToAll).toHaveBeenCalledWith(
          'filing-rejected',
          expectedRejectedEvent,
        );

        consoleSpy.mockRestore();
      });
    });

    describe('update action with other status', () => {
      it('should only emit filing-updated for non-APPROVED/REJECTED status', async () => {
        const event: FilingChangeEvent = {
          ...baseEvent,
          action: 'update',
          filing: { id: 123, status: 'PENDING' },
          affectedUserIds: ['user1'],
        };

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await listener.handleFilingChanged(event);

        expect(mockSocketService.emitToClients).toHaveBeenCalledWith(
          ['user1'],
          'filing-updated',
          event,
        );
        expect(mockSocketService.emitToClients).not.toHaveBeenCalledWith(
          expect.anything(),
          'filing-approved',
          expect.anything(),
        );
        expect(mockSocketService.emitToClients).not.toHaveBeenCalledWith(
          expect.anything(),
          'filing-rejected',
          expect.anything(),
        );

        consoleSpy.mockRestore();
      });
    });

    describe('delete action', () => {
      it('should only emit filing-updated for delete action', async () => {
        const event: FilingChangeEvent = {
          ...baseEvent,
          action: 'delete',
          affectedUserIds: ['user1'],
        };

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await listener.handleFilingChanged(event);

        expect(mockSocketService.emitToClients).toHaveBeenCalledWith(
          ['user1'],
          'filing-updated',
          event,
        );
        expect(mockSocketService.emitToClients).not.toHaveBeenCalledWith(
          expect.anything(),
          'filing-created',
          expect.anything(),
        );

        consoleSpy.mockRestore();
      });
    });

    describe('error handling', () => {
      it('should handle socket service errors gracefully', async () => {
        const event: FilingChangeEvent = {
          ...baseEvent,
          affectedUserIds: ['user1'],
        };

        // Make the socket service method throw synchronously to be caught by try-catch
        (mockSocketService.emitToClients as jest.Mock).mockImplementation(
          () => {
            throw new Error('Socket error');
          },
        );

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const consoleErrorSpy = jest
          .spyOn(console, 'error')
          .mockImplementation();

        await listener.handleFilingChanged(event);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error in filing change listener:',
          expect.any(Error),
        );

        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      });

      it('should handle errors gracefully and not throw', async () => {
        const event: FilingChangeEvent = {
          ...baseEvent,
          affectedUserIds: ['user1'],
        };

        (mockSocketService.emitToClients as jest.Mock).mockImplementation(
          () => {
            throw new Error('Socket error');
          },
        );

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        const consoleErrorSpy = jest
          .spyOn(console, 'error')
          .mockImplementation();

        await expect(
          listener.handleFilingChanged(event),
        ).resolves.not.toThrow();

        consoleSpy.mockRestore();
        consoleErrorSpy.mockRestore();
      });
    });

    describe('edge cases', () => {
      it('should handle filing without status property', async () => {
        const event: FilingChangeEvent = {
          ...baseEvent,
          action: 'update',
          filing: { id: 123 }, // No status property
          affectedUserIds: ['user1'],
        };

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await listener.handleFilingChanged(event);

        expect(mockSocketService.emitToClients).toHaveBeenCalledWith(
          ['user1'],
          'filing-updated',
          event,
        );
        // Should not emit status-specific events
        expect(mockSocketService.emitToClients).not.toHaveBeenCalledWith(
          expect.anything(),
          'filing-approved',
          expect.anything(),
        );

        consoleSpy.mockRestore();
      });

      it('should handle null filing object', async () => {
        const event: FilingChangeEvent = {
          ...baseEvent,
          action: 'update',
          filing: null,
          affectedUserIds: ['user1'],
        };

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await listener.handleFilingChanged(event);

        expect(mockSocketService.emitToClients).toHaveBeenCalledWith(
          ['user1'],
          'filing-updated',
          event,
        );

        consoleSpy.mockRestore();
      });
    });
  });
});

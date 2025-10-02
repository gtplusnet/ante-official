import { Test, TestingModule } from '@nestjs/testing';
import { TaskChangeListener } from './task-change.listener';
import { SocketService } from '@modules/communication/socket/socket/socket.service';

describe('TaskChangeListener', () => {
  let listener: TaskChangeListener;
  let socketService: SocketService;

  const mockSocketService = {
    emitToAll: jest.fn(),
    emitToClients: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskChangeListener,
        {
          provide: SocketService,
          useValue: mockSocketService,
        },
      ],
    }).compile();

    listener = module.get<TaskChangeListener>(TaskChangeListener);
    socketService = module.get<SocketService>(SocketService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleTaskChanged', () => {
    it('should emit task-changed event to affected clients', async () => {
      const event = {
        action: 'update' as const,
        taskId: 123,
        task: {
          id: 123,
          title: 'Test Task',
          boardLane: { key: 'IN_PROGRESS' },
        },
        affectedUserIds: ['user1', 'user2'],
        timestamp: '2024-01-01T00:00:00Z',
      };

      await listener.handleTaskChanged(event);

      expect(socketService.emitToClients).toHaveBeenCalledWith(
        ['user1', 'user2'],
        'task-changed',
        event,
      );
      expect(socketService.emitToClients).toHaveBeenCalledTimes(1);
      expect(socketService.emitToAll).not.toHaveBeenCalled();
    });

    it('should emit task-completed event when task is marked as DONE', async () => {
      const event = {
        action: 'update' as const,
        taskId: 123,
        task: {
          id: 123,
          title: 'Test Task',
          boardLane: { key: 'DONE' },
        },
        affectedUserIds: ['user1'],
        timestamp: '2024-01-01T00:00:00Z',
      };

      await listener.handleTaskChanged(event);

      expect(socketService.emitToClients).toHaveBeenCalledWith(
        ['user1'],
        'task-changed',
        event,
      );
      expect(socketService.emitToClients).toHaveBeenCalledWith(
        ['user1'],
        'task-completed',
        {
          taskId: event.taskId,
          task: event.task,
          timestamp: event.timestamp,
        },
      );
      expect(socketService.emitToClients).toHaveBeenCalledTimes(2);
      expect(socketService.emitToAll).not.toHaveBeenCalled();
    });

    it('should emit approval-processed event for APPROVAL task updates', async () => {
      const event = {
        action: 'update' as const,
        taskId: 456,
        task: {
          id: 456,
          title: 'Approval Task',
          taskType: 'APPROVAL',
          boardLane: { key: 'IN_PROGRESS' },
        },
        affectedUserIds: ['approver1'],
        timestamp: '2024-01-01T00:00:00Z',
      };

      await listener.handleTaskChanged(event);

      expect(socketService.emitToClients).toHaveBeenCalledWith(
        ['approver1'],
        'task-changed',
        event,
      );
      expect(socketService.emitToClients).toHaveBeenCalledWith(
        ['approver1'],
        'approval-processed',
        {
          taskId: event.taskId,
          task: event.task,
          timestamp: event.timestamp,
        },
      );
      expect(socketService.emitToClients).toHaveBeenCalledTimes(2);
      expect(socketService.emitToAll).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSocketService.emitToAll.mockImplementationOnce(() => {
        throw new Error('Socket error');
      });

      const event = {
        action: 'create' as const,
        taskId: 789,
        task: null,
        affectedUserIds: [],
        timestamp: '2024-01-01T00:00:00Z',
      };

      await listener.handleTaskChanged(event);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in task change listener:',
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });

    it('should emit to all when no affected users', async () => {
      const event = {
        action: 'create' as const,
        taskId: 789,
        task: null,
        affectedUserIds: [],
        timestamp: '2024-01-01T00:00:00Z',
      };

      await listener.handleTaskChanged(event);

      expect(socketService.emitToAll).toHaveBeenCalledWith(
        'task-changed',
        event,
      );
      expect(socketService.emitToAll).toHaveBeenCalledTimes(1);
      expect(socketService.emitToClients).not.toHaveBeenCalled();
    });

    it('should emit all three events for completed approval task', async () => {
      const event = {
        action: 'update' as const,
        taskId: 999,
        task: {
          id: 999,
          title: 'Approval Task Complete',
          taskType: 'APPROVAL',
          boardLane: { key: 'DONE' },
        },
        affectedUserIds: ['user1', 'user2'],
        timestamp: '2024-01-01T00:00:00Z',
      };

      await listener.handleTaskChanged(event);

      expect(socketService.emitToClients).toHaveBeenCalledWith(
        ['user1', 'user2'],
        'task-changed',
        event,
      );
      expect(socketService.emitToClients).toHaveBeenCalledWith(
        ['user1', 'user2'],
        'task-completed',
        expect.any(Object),
      );
      expect(socketService.emitToClients).toHaveBeenCalledWith(
        ['user1', 'user2'],
        'approval-processed',
        expect.any(Object),
      );
      expect(socketService.emitToClients).toHaveBeenCalledTimes(3);
      expect(socketService.emitToAll).not.toHaveBeenCalled();
    });
  });
});

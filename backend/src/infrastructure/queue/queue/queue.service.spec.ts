import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { QueueService } from './queue.service';
import { PrismaService } from '@common/prisma.service';
import { UtilityService } from '@common/utility.service';
import { QueueConfig } from './queue.config';
import { QueueMongoService } from '@common/services/queue-mongo.service';
import { QueueLogMongoService } from '@common/services/queue-log-mongo.service';
import { SocketService } from '@modules/communication/socket/socket/socket.service';
import { QueueType, QueueStatus, QueueLogStatus } from '@prisma/client';
import { QueueCreateDTO, ReinitializeQueueDTO } from './queue.interface';

describe('QueueService', () => {
  let service: QueueService;

  const mockPrismaService = {
    files: {
      findUnique: jest.fn(),
    },
  };

  const mockUtilityService = {
    error: jest.fn(),
    log: jest.fn(),
    formatPercentage: jest.fn().mockReturnValue({ formatPercentage: '50%' }),
    formatNumber: jest.fn().mockImplementation((num) => num),
    formatDate: jest.fn().mockImplementation((date) => date),
    companyId: 123,
  };

  const mockQueueConfig = {
    getQueueService: jest.fn(),
  };

  const mockQueueMongoService = {
    paginate: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
    create: jest.fn(),
    findByStatus: jest.fn(),
    update: jest.fn(),
  };

  const mockQueueLogMongoService = {
    findByQueueId: jest.fn(),
    findByQueueIDAndStatus: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockSocketService = {
    emit: jest.fn(),
    broadcast: jest.fn(),
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
    emitToCompany: jest.fn(),
  };

  const mockProcessQueue = {
    processQueueLog: jest.fn(),
    processPendingQueue: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Set default environment variable
    process.env.QUEUE_BATCH_SIZE = '5';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
        {
          provide: QueueConfig,
          useValue: mockQueueConfig,
        },
        {
          provide: QueueMongoService,
          useValue: mockQueueMongoService,
        },
        {
          provide: QueueLogMongoService,
          useValue: mockQueueLogMongoService,
        },
        {
          provide: SocketService,
          useValue: mockSocketService,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  afterEach(() => {
    delete process.env.QUEUE_BATCH_SIZE;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with correct batch size from environment variable', () => {
    expect(service.batchSize).toBe(5);
  });

  it('should initialize with default batch size when env variable is not set', async () => {
    delete process.env.QUEUE_BATCH_SIZE;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
        {
          provide: QueueConfig,
          useValue: mockQueueConfig,
        },
        {
          provide: QueueMongoService,
          useValue: mockQueueMongoService,
        },
        {
          provide: QueueLogMongoService,
          useValue: mockQueueLogMongoService,
        },
        {
          provide: SocketService,
          useValue: mockSocketService,
        },
      ],
    }).compile();

    const newService = module.get<QueueService>(QueueService);
    expect(newService.batchSize).toBe(5);
  });

  describe('getQueueTable', () => {
    it('should return paginated queue table with default parameters', async () => {
      const mockQueues = {
        data: [
          {
            _id: 'queue1',
            name: 'Test Queue 1',
            type: QueueType.EMPLOYEE_IMPORTATION,
            status: QueueStatus.PENDING,
            currentCount: 0,
            totalCount: 100,
            completePercentage: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        lastPage: 1,
      };

      mockQueueMongoService.paginate.mockResolvedValue(mockQueues);
      mockQueueLogMongoService.findByQueueId.mockResolvedValue([]);

      const result = await service.getQueueTable({});

      expect(mockQueueMongoService.paginate).toHaveBeenCalledWith(1, 10);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('lastPage', 1);
    });

    it('should return paginated queue table with custom parameters', async () => {
      const mockQueues = {
        data: [
          {
            _id: 'queue2',
            name: 'Test Queue 2',
            type: QueueType.PAYROLL_PROCESSING,
            status: QueueStatus.PROCESSING,
            currentCount: 50,
            totalCount: 100,
            completePercentage: 0.5,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        page: 2,
        lastPage: 5,
      };

      mockQueueMongoService.paginate.mockResolvedValue(mockQueues);
      mockQueueLogMongoService.findByQueueId.mockResolvedValue([]);

      const result = await service.getQueueTable({ page: '2', limit: '20' });

      expect(mockQueueMongoService.paginate).toHaveBeenCalledWith(2, 20);
      expect(result.page).toBe(2);
    });

    it('should handle invalid pagination parameters', async () => {
      const mockQueues = {
        data: [],
        total: 0,
        page: 1,
        lastPage: 1,
      };

      mockQueueMongoService.paginate.mockResolvedValue(mockQueues);

      const result = await service.getQueueTable({
        page: 'invalid',
        limit: 'invalid',
      });

      expect(mockQueueMongoService.paginate).toHaveBeenCalledWith(1, 10);
      expect(result.data).toEqual([]);
    });
  });

  describe('getQueueInfo', () => {
    it('should return queue information without logs', async () => {
      const mockQueue = {
        _id: 'queue-id-1',
        name: 'Test Queue',
        type: QueueType.EMPLOYEE_IMPORTATION,
        status: QueueStatus.COMPLETED,
        currentCount: 100,
        totalCount: 100,
        completePercentage: 1.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQueueMongoService.findById.mockResolvedValue(mockQueue);
      mockQueueLogMongoService.findByQueueId.mockResolvedValue([]);

      const result = await service.getQueueInfo('queue-id-1');

      expect(mockQueueMongoService.findById).toHaveBeenCalledWith('queue-id-1');
      expect(result).toHaveProperty('id', 'queue-id-1');
      expect(result).toHaveProperty('name', 'Test Queue');
      expect(result.logs).toEqual([]);
    });

    it('should return queue information with logs when includeLogs is true', async () => {
      const mockQueue = {
        _id: 'queue-id-2',
        name: 'Test Queue with Logs',
        type: QueueType.PAYROLL_PROCESSING,
        status: QueueStatus.PROCESSING,
        currentCount: 50,
        totalCount: 100,
        completePercentage: 0.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLogs = [
        {
          _id: 'log-1',
          queueId: 'queue-id-2',
          status: QueueLogStatus.COMPLETED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockQueueMongoService.findById.mockResolvedValue(mockQueue);
      mockQueueLogMongoService.findByQueueId.mockResolvedValue(mockLogs);

      const result = await service.getQueueInfo('queue-id-2', true);

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0]).toHaveProperty('id', 'log-1');
    });

    it('should return null when queue is not found', async () => {
      mockQueueMongoService.findById.mockResolvedValue(null);

      const result = await service.getQueueInfo('nonexistent-queue');

      expect(result).toBeNull();
    });
  });

  describe('reinitializeQueue', () => {
    it('should reinitialize queue successfully', async () => {
      const params: ReinitializeQueueDTO = {
        queueId: 1,
        status: QueueStatus.PENDING,
      };

      const mockQueue = {
        _id: 'queue-id-1',
        name: 'Test Queue',
        type: QueueType.EMPLOYEE_IMPORTATION,
        status: QueueStatus.FAILED,
      };

      mockQueueMongoService.findById.mockResolvedValue(mockQueue);
      mockQueueMongoService.updateStatus.mockResolvedValue(true);

      const result = await service.reinitializeQueue(params);

      expect(mockQueueMongoService.findById).toHaveBeenCalledWith('1');
      expect(mockQueueMongoService.updateStatus).toHaveBeenCalledWith(
        '1',
        QueueStatus.PENDING,
      );
      expect(result).toEqual(mockQueue);
    });

    it('should return null when queue is not found for reinitialization', async () => {
      const params: ReinitializeQueueDTO = {
        queueId: 999,
        status: QueueStatus.PENDING,
      };

      mockQueueMongoService.findById.mockResolvedValue(null);

      const result = await service.reinitializeQueue(params);

      expect(result).toBeNull();
      expect(mockQueueMongoService.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('createQueue', () => {
    it('should create queue without file ID', async () => {
      const params: QueueCreateDTO = {
        name: 'New Test Queue',
        type: QueueType.EMPLOYEE_IMPORTATION,
        queueSettings: { batchSize: 10 },
      };

      const mockCreatedQueue = {
        _id: 'new-queue-id',
        name: 'New Test Queue',
        type: QueueType.EMPLOYEE_IMPORTATION,
        status: QueueStatus.PENDING,
        currentCount: 0,
        totalCount: 0,
        completePercentage: 0,
        queueSettings: { batchSize: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQueueMongoService.create.mockResolvedValue(mockCreatedQueue);
      mockQueueLogMongoService.findByQueueId.mockResolvedValue([]);

      const result = await service.createQueue(params);

      expect(mockQueueMongoService.create).toHaveBeenCalledWith({
        name: 'New Test Queue',
        type: QueueType.EMPLOYEE_IMPORTATION,
        queueSettings: { batchSize: 10 },
      });
      expect(result).toHaveProperty('id', 'new-queue-id');
      expect(result).toHaveProperty('name', 'New Test Queue');
    });

    it('should create queue with valid file ID', async () => {
      const params: QueueCreateDTO = {
        name: 'Queue with File',
        type: QueueType.EMPLOYEE_IMPORTATION,
        fileId: 123,
        queueSettings: {},
      };

      const mockFile = {
        id: 123,
        filename: 'test-file.csv',
      };

      const mockCreatedQueue = {
        _id: 'queue-with-file-id',
        name: 'Queue with File',
        type: QueueType.EMPLOYEE_IMPORTATION,
        fileId: 123,
        status: QueueStatus.PENDING,
        currentCount: 0,
        totalCount: 0,
        completePercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.files.findUnique.mockResolvedValue(mockFile);
      mockQueueMongoService.create.mockResolvedValue(mockCreatedQueue);
      mockQueueLogMongoService.findByQueueId.mockResolvedValue([]);

      const result = await service.createQueue(params);

      expect(mockPrismaService.files.findUnique).toHaveBeenCalledWith({
        where: { id: 123 },
      });
      expect(mockQueueMongoService.create).toHaveBeenCalledWith({
        name: 'Queue with File',
        type: QueueType.EMPLOYEE_IMPORTATION,
        fileId: 123,
        queueSettings: {},
      });
      expect(result).toHaveProperty('id', 'queue-with-file-id');
    });

    it('should throw BadRequestException when file ID does not exist', async () => {
      const params: QueueCreateDTO = {
        name: 'Queue with Invalid File',
        type: QueueType.EMPLOYEE_IMPORTATION,
        fileId: 999,
        queueSettings: {},
      };

      mockPrismaService.files.findUnique.mockResolvedValue(null);

      await expect(service.createQueue(params)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createQueue(params)).rejects.toThrow(
        'File not found',
      );

      expect(mockPrismaService.files.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(mockQueueMongoService.create).not.toHaveBeenCalled();
    });

    it('should create queue without queueSettings', async () => {
      const params: QueueCreateDTO = {
        name: 'Simple Queue',
        type: QueueType.PAYROLL_PROCESSING,
        queueSettings: undefined,
      };

      const mockCreatedQueue = {
        _id: 'simple-queue-id',
        name: 'Simple Queue',
        type: QueueType.PAYROLL_PROCESSING,
        status: QueueStatus.PENDING,
        currentCount: 0,
        totalCount: 0,
        completePercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQueueMongoService.create.mockResolvedValue(mockCreatedQueue);
      mockQueueLogMongoService.findByQueueId.mockResolvedValue([]);

      const result = await service.createQueue(params);

      expect(mockQueueMongoService.create).toHaveBeenCalledWith({
        name: 'Simple Queue',
        type: QueueType.PAYROLL_PROCESSING,
      });
      expect(result).toHaveProperty('name', 'Simple Queue');
    });
  });

  describe('processingQueues', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should process queues with pending logs successfully', async () => {
      const mockProcessingQueues = [
        {
          _id: 'processing-queue-1',
          name: 'Processing Queue',
          type: QueueType.EMPLOYEE_IMPORTATION,
          status: QueueStatus.PROCESSING,
          currentCount: 0,
          totalCount: 100,
          completePercentage: 0,
        },
      ];

      const mockPendingLogs = [
        {
          _id: 'log-1',
          queueId: 'processing-queue-1',
          status: QueueLogStatus.PENDING,
          params: { data: 'test' },
        },
        {
          _id: 'log-2',
          queueId: 'processing-queue-1',
          status: QueueLogStatus.PENDING,
          params: { data: 'test2' },
        },
      ];

      mockQueueMongoService.findByStatus.mockResolvedValue(
        mockProcessingQueues,
      );
      mockQueueConfig.getQueueService.mockReturnValue(mockProcessQueue);
      mockQueueLogMongoService.findByQueueIDAndStatus
        .mockResolvedValueOnce(mockPendingLogs)
        .mockResolvedValueOnce([]);
      mockProcessQueue.processQueueLog.mockResolvedValue(true);
      mockQueueLogMongoService.updateStatus.mockResolvedValue(true);
      mockQueueMongoService.update.mockResolvedValue(true);

      await service.processingQueues();

      expect(mockQueueMongoService.findByStatus).toHaveBeenCalledWith(
        QueueStatus.PROCESSING,
      );
      expect(mockQueueConfig.getQueueService).toHaveBeenCalledWith(
        QueueType.EMPLOYEE_IMPORTATION,
      );
      expect(
        mockQueueLogMongoService.findByQueueIDAndStatus,
      ).toHaveBeenCalledWith('processing-queue-1', QueueLogStatus.PENDING, 5);
      expect(mockProcessQueue.processQueueLog).toHaveBeenCalledTimes(2);
      expect(mockQueueLogMongoService.updateStatus).toHaveBeenCalledTimes(4); // 2 to processing, 2 to completed
      expect(mockQueueMongoService.update).toHaveBeenCalledWith(
        'processing-queue-1',
        {
          currentCount: 2,
          completePercentage: 0.02,
        },
      );
    });

    it('should handle processing queue errors gracefully', async () => {
      const _mockProcessingQueues = [
        {
          _id: 'error-queue-1',
          name: 'Error Queue',
          type: QueueType.EMPLOYEE_IMPORTATION,
          status: QueueStatus.PROCESSING,
          currentCount: 0,
          totalCount: 100,
        },
      ];

      const mockError = new Error('Processing failed');
      mockError.stack = 'Error stack trace';

      mockQueueMongoService.findByStatus.mockRejectedValue(mockError);

      await service.processingQueues();

      expect(mockUtilityService.error).toHaveBeenCalledWith(
        'Error fetching processing queues: Processing failed',
      );
    });

    it('should handle queue log processing errors', async () => {
      const mockProcessingQueues = [
        {
          _id: 'log-error-queue',
          name: 'Log Error Queue',
          type: QueueType.EMPLOYEE_IMPORTATION,
          status: QueueStatus.PROCESSING,
          currentCount: 0,
          totalCount: 100,
        },
      ];

      const mockPendingLogs = [
        {
          _id: 'failing-log',
          queueId: 'log-error-queue',
          status: QueueLogStatus.PENDING,
          params: { data: 'test' },
        },
      ];

      const mockError = new Error('Log processing failed');
      mockError.stack = 'Error stack trace for log';

      // Reset mocks that were cleared in beforeEach
      mockQueueMongoService.findByStatus = jest
        .fn()
        .mockResolvedValue(mockProcessingQueues);
      mockQueueConfig.getQueueService = jest
        .fn()
        .mockReturnValue(mockProcessQueue);
      mockQueueLogMongoService.findByQueueIDAndStatus = jest
        .fn()
        .mockResolvedValue(mockPendingLogs);
      mockProcessQueue.processQueueLog = jest.fn().mockRejectedValue(mockError);
      mockQueueLogMongoService.updateStatus = jest.fn().mockResolvedValue(true);
      mockQueueMongoService.update = jest.fn().mockResolvedValue(true);

      await service.processingQueues();

      // When processing logs fails, it should still update progress and continue
      expect(mockQueueLogMongoService.updateStatus).toHaveBeenCalledWith(
        'failing-log',
        QueueLogStatus.PROCESSING,
      );
      expect(mockQueueLogMongoService.updateStatus).toHaveBeenCalledWith(
        'failing-log',
        QueueLogStatus.FAILED,
        'Error stack trace for log',
      );
      // Queue should still update progress after processing (even with failures)
      expect(mockQueueMongoService.update).toHaveBeenCalledWith(
        'log-error-queue',
        {
          currentCount: 1,
          completePercentage: 0.01,
        },
      );
    });

    it('should mark queue as completed when no pending logs remain', async () => {
      const mockProcessingQueues = [
        {
          _id: 'completing-queue',
          name: 'Completing Queue',
          type: QueueType.EMPLOYEE_IMPORTATION,
          status: QueueStatus.PROCESSING,
          currentCount: 100,
          totalCount: 100,
        },
      ];

      mockQueueMongoService.findByStatus.mockResolvedValue(
        mockProcessingQueues,
      );
      mockQueueConfig.getQueueService.mockReturnValue(mockProcessQueue);
      mockQueueLogMongoService.findByQueueIDAndStatus
        .mockResolvedValueOnce([]) // No pending logs
        .mockResolvedValueOnce([]); // No failed logs
      mockQueueMongoService.updateStatus.mockResolvedValue(true);
      mockQueueLogMongoService.updateStatus.mockResolvedValue(true);

      await service.processingQueues();

      expect(mockUtilityService.log).toHaveBeenCalledWith(
        'No more pending queue log found for queue #completing-queue. Marking queue as completed.',
      );
      expect(mockQueueMongoService.updateStatus).toHaveBeenCalledWith(
        'completing-queue',
        QueueStatus.COMPLETED,
      );
    });

    it('should mark queue as incomplete when failed logs exist', async () => {
      const mockProcessingQueues = [
        {
          _id: 'incomplete-queue',
          name: 'Incomplete Queue',
          type: QueueType.EMPLOYEE_IMPORTATION,
          status: QueueStatus.PROCESSING,
          currentCount: 90,
          totalCount: 100,
        },
      ];

      const mockFailedLogs = [
        {
          _id: 'failed-log',
          queueId: 'incomplete-queue',
          status: QueueLogStatus.FAILED,
        },
      ];

      mockQueueMongoService.findByStatus.mockResolvedValue(
        mockProcessingQueues,
      );
      mockQueueConfig.getQueueService.mockReturnValue(mockProcessQueue);
      mockQueueLogMongoService.findByQueueIDAndStatus
        .mockResolvedValueOnce([]) // No pending logs
        .mockResolvedValueOnce(mockFailedLogs); // Has failed logs
      mockQueueMongoService.updateStatus.mockResolvedValue(true);
      mockQueueLogMongoService.updateStatus.mockResolvedValue(true);

      await service.processingQueues();

      expect(mockQueueMongoService.updateStatus).toHaveBeenCalledWith(
        'incomplete-queue',
        QueueStatus.INCOMPLETE,
      );
      expect(mockUtilityService.error).toHaveBeenCalledWith(
        'Queue #incomplete-queue has failed queue log.',
      );
    });
  });

  describe('pendingQueues', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should process pending queues successfully', async () => {
      const mockPendingQueues = [
        {
          _id: 'pending-queue-1',
          name: 'Pending Queue',
          type: QueueType.EMPLOYEE_IMPORTATION,
          status: QueueStatus.PENDING,
        },
      ];

      mockQueueMongoService.findByStatus.mockResolvedValue(mockPendingQueues);
      mockQueueConfig.getQueueService.mockReturnValue(mockProcessQueue);
      mockProcessQueue.processPendingQueue.mockResolvedValue(true);
      mockQueueMongoService.update.mockResolvedValue(true);

      const processPendingQeueeSpy = jest.spyOn(
        service,
        'processPendingQeuee' as any,
      );

      await service.pendingQueues();

      expect(mockQueueMongoService.findByStatus).toHaveBeenCalledWith(
        QueueStatus.PENDING,
      );
      expect(processPendingQeueeSpy).toHaveBeenCalledWith(
        mockProcessQueue,
        mockPendingQueues[0],
      );
    });

    it('should handle errors when fetching pending queues', async () => {
      const mockError = new Error('Database error');
      mockQueueMongoService.findByStatus.mockRejectedValue(mockError);

      await service.pendingQueues();

      expect(mockUtilityService.error).toHaveBeenCalledWith(
        'Error fetching pending queues: Database error',
      );
    });
  });

  describe('processPendingQeuee', () => {
    it('should process pending queue successfully', async () => {
      const mockQueue = {
        _id: 'pending-queue-test',
        name: 'Pending Queue Test',
        type: QueueType.EMPLOYEE_IMPORTATION,
        status: QueueStatus.PENDING,
      };

      mockProcessQueue.processPendingQueue.mockResolvedValue(true);
      mockQueueMongoService.update.mockResolvedValue(true);

      await service.processPendingQeuee(mockProcessQueue, mockQueue);

      expect(mockProcessQueue.processPendingQueue).toHaveBeenCalledWith(
        mockQueue,
      );
      expect(mockQueueMongoService.update).toHaveBeenCalledWith(
        'pending-queue-test',
        {
          status: QueueStatus.PROCESSING,
        },
      );
    });

    it('should handle pending queue processing errors', async () => {
      const mockQueue = {
        _id: 'failing-pending-queue',
        name: 'Failing Pending Queue',
        type: QueueType.EMPLOYEE_IMPORTATION,
        status: QueueStatus.PENDING,
      };

      const mockError = new Error('Pending queue processing failed');
      mockError.stack = 'Error stack for pending queue';

      mockProcessQueue.processPendingQueue.mockRejectedValue(mockError);
      mockQueueMongoService.update.mockResolvedValue(true);

      await service.processPendingQeuee(mockProcessQueue, mockQueue);

      expect(mockUtilityService.error).toHaveBeenCalledWith(
        'Error processing Queue #failing-pending-queue: Error stack for pending queue',
      );
      expect(mockQueueMongoService.update).toHaveBeenCalledWith(
        'failing-pending-queue',
        {
          status: QueueStatus.FAILED,
          errorStatus: 'Pending queue processing failed',
        },
      );
    });
  });

  describe('constants and properties', () => {
    it('should expose QueueType and QueueStatus constants', () => {
      expect(service.QueueType).toBe(QueueType);
      expect(service.QueueStatus).toBe(QueueStatus);
    });

    it('should have correct batch size based on environment variable', () => {
      expect(service.batchSize).toBe(5);
    });
  });
});

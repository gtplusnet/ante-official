import { Test, TestingModule } from '@nestjs/testing';
import { PayrollProcessQueueService } from './payroll-process-queue.service';
import { UtilityService } from '@common/utility.service';
import { PrismaService } from '@common/prisma.service';
import { ModuleRef } from '@nestjs/core';
import { QueueLogMongoService } from '@common/services/queue-log-mongo.service';
import { QueueMongoService } from '@common/services/queue-mongo.service';

describe('PayrollProcessQueueService', () => {
  let service: PayrollProcessQueueService;

  const mockUtilityService = {
    log: jest.fn(),
  };

  const mockPrismaService = {
    employeeTimekeepingCutoff: {
      findMany: jest.fn(),
    },
  };

  const mockModuleRef = {
    create: jest.fn(),
  };

  const mockQueueLogMongoService = {
    create: jest.fn(),
  };

  const mockQueueMongoService = {
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollProcessQueueService,
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ModuleRef,
          useValue: mockModuleRef,
        },
        {
          provide: QueueLogMongoService,
          useValue: mockQueueLogMongoService,
        },
        {
          provide: QueueMongoService,
          useValue: mockQueueMongoService,
        },
      ],
    }).compile();

    service = module.get<PayrollProcessQueueService>(
      PayrollProcessQueueService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

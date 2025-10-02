import { Test, TestingModule } from '@nestjs/testing';
import { QueueController } from './queue.controller';
import { UtilityService } from '@common/utility.service';
import { QueueService } from './queue.service';

describe('QueueController', () => {
  let controller: QueueController;

  const mockUtilityService = {
    responseHandler: jest.fn(),
  };

  const mockQueueService = {
    reinitializeQueue: jest.fn(),
    getQueueInfo: jest.fn(),
    getQueueTable: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [
        {
          provide: UtilityService,
          useValue: mockUtilityService,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    controller = module.get<QueueController>(QueueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

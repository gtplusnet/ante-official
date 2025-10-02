import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppInitService } from './app-init.service';
import { PrismaService } from '@common/prisma.service';

describe('AppInitService', () => {
  let service: AppInitService;
  let prismaService: jest.Mocked<PrismaService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const mockPrismaService = {
      setEventEmitter: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppInitService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<AppInitService>(AppInitService);
    prismaService = module.get(PrismaService);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should call setEventEmitter on PrismaService with EventEmitter2', () => {
      // Mock console.log to suppress output during tests
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.onModuleInit();

      expect(prismaService.setEventEmitter).toHaveBeenCalledWith(eventEmitter);
      expect(prismaService.setEventEmitter).toHaveBeenCalledTimes(1);

      // Verify console logs were called
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AppInitService] Setting EventEmitter in PrismaService',
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '[AppInitService] EventEmitter set successfully',
      );
      expect(consoleSpy).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });

    it('should log the correct messages during initialization', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.onModuleInit();

      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        '[AppInitService] Setting EventEmitter in PrismaService',
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        2,
        '[AppInitService] EventEmitter set successfully',
      );

      consoleSpy.mockRestore();
    });

    it('should not throw an error during initialization', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      expect(() => service.onModuleInit()).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('constructor', () => {
    it('should initialize with PrismaService and EventEmitter2', () => {
      expect(service).toHaveProperty('prisma', prismaService);
      expect(service).toHaveProperty('eventEmitter', eventEmitter);
    });
  });
});

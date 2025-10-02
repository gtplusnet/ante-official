import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should extend PrismaClient', () => {
    expect(service).toBeInstanceOf(PrismaService);
    // PrismaClient functionality should be inherited
    expect(service).toHaveProperty('$connect');
    expect(service).toHaveProperty('$disconnect');
    expect(service).toHaveProperty('onModuleInit');
  });

  describe('onModuleInit', () => {
    it('should be defined', () => {
      expect(service.onModuleInit).toBeDefined();
      expect(typeof service.onModuleInit).toBe('function');
    });

    it('should call $connect when initialized', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalledTimes(1);

      connectSpy.mockRestore();
    });

    it('should handle connection errors', async () => {
      const connectionError = new Error('Connection failed');
      const connectSpy = jest
        .spyOn(service, '$connect')
        .mockRejectedValue(connectionError);

      await expect(service.onModuleInit()).rejects.toThrow(connectionError);
      expect(connectSpy).toHaveBeenCalledTimes(1);

      connectSpy.mockRestore();
    });

    it('should return a promise', () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();

      const result = service.onModuleInit();
      expect(result).toBeInstanceOf(Promise);

      connectSpy.mockRestore();
    });
  });

  describe('PrismaClient inheritance', () => {
    it('should have database access methods', () => {
      // Check that common Prisma methods are available
      expect(service).toHaveProperty('$queryRaw');
      expect(service).toHaveProperty('$executeRaw');
      expect(service).toHaveProperty('$transaction');
      expect(service).toHaveProperty('$disconnect');
    });

    it('should have transaction capabilities', () => {
      expect(typeof service.$transaction).toBe('function');
    });

    it('should have raw query capabilities', () => {
      expect(typeof service.$queryRaw).toBe('function');
      expect(typeof service.$executeRaw).toBe('function');
    });
  });

  describe('module integration', () => {
    it('should be injectable', () => {
      expect(service).toBeDefined();
    });

    it('should implement OnModuleInit', () => {
      expect(service.onModuleInit).toBeDefined();
      expect(typeof service.onModuleInit).toBe('function');
    });
  });
});

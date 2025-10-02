import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import * as fs from 'fs';
import { execSync } from 'child_process';

// Mock external dependencies
jest.mock('fs');
jest.mock('child_process');

describe('HealthController', () => {
  let controller: HealthController;
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset environment variables
    delete process.env.NODE_ENV;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('constructor and initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should load version info successfully when version.json exists', async () => {
      const mockVersionData = {
        version: '1.0.0',
        environment: 'test',
        buildDate: '2023-01-01T00:00:00.000Z',
      };

      mockFs.existsSync = jest
        .fn()
        .mockReturnValueOnce(false) // version.json first path fails
        .mockReturnValueOnce(true) // version.json second path succeeds
        .mockReturnValueOnce(false) // deployment-hash first path fails
        .mockReturnValueOnce(false) // deployment-hash second path fails
        .mockReturnValueOnce(false) // deployment-hash third path fails
        .mockReturnValueOnce(false); // deployment-hash fourth path fails

      mockFs.readFileSync = jest
        .fn()
        .mockReturnValue(JSON.stringify(mockVersionData));

      // Mock git commands for deployment info fallback
      mockExecSync
        .mockReturnValueOnce('abcd1234567890abcd1234567890abcd12345678\n')
        .mockReturnValueOnce('abcd123\n')
        .mockReturnValueOnce('main\n');

      const module: TestingModule = await Test.createTestingModule({
        controllers: [HealthController],
      }).compile();

      const newController = module.get<HealthController>(HealthController);
      const result = newController.version();

      expect(result).toEqual(mockVersionData);
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(1);
    });

    it('should handle version.json not found', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(false);
      process.env.NODE_ENV = 'production';

      const module: TestingModule = await Test.createTestingModule({
        controllers: [HealthController],
      }).compile();

      const newController = module.get<HealthController>(HealthController);
      const result = newController.version();

      expect(result).toMatchObject({
        version: '0.0.0',
        environment: 'production',
        error: 'Global version.json not found',
      });
      expect(result.buildDate).toBeDefined();
    });

    it('should handle version.json parsing error', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.readFileSync = jest.fn().mockReturnValue('invalid json');

      const module: TestingModule = await Test.createTestingModule({
        controllers: [HealthController],
      }).compile();

      const newController = module.get<HealthController>(HealthController);
      const result = newController.version();

      expect(result).toMatchObject({
        version: 'unknown',
        environment: 'development',
      });
      expect(result.error).toContain('Could not load version info:');
    });

    it('should load deployment info successfully when deployment-hash.json exists', async () => {
      const mockDeploymentData = {
        deploymentHash: 'abc123',
        timestamp: '2023-01-01T00:00:00.000Z',
        environment: 'test',
      };

      // Mock version info loading (first existsSync calls)
      mockFs.existsSync = jest
        .fn()
        .mockReturnValueOnce(false) // version.json first path
        .mockReturnValueOnce(false) // version.json second path
        .mockReturnValueOnce(false) // version.json third path
        .mockReturnValueOnce(true); // deployment-hash.json first path

      mockFs.readFileSync = jest
        .fn()
        .mockReturnValue(JSON.stringify(mockDeploymentData));

      const module: TestingModule = await Test.createTestingModule({
        controllers: [HealthController],
      }).compile();

      const newController = module.get<HealthController>(HealthController);
      const result = newController.deploymentHash();

      expect(result).toEqual(mockDeploymentData);
    });

    it('should handle deployment-hash.json not found and use git fallback', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(false);

      mockExecSync
        .mockReturnValueOnce('abcd1234567890abcd1234567890abcd12345678\n') // git rev-parse HEAD
        .mockReturnValueOnce('abcd123\n') // git rev-parse --short HEAD
        .mockReturnValueOnce('main\n'); // git rev-parse --abbrev-ref HEAD

      process.env.NODE_ENV = 'staging';

      const module: TestingModule = await Test.createTestingModule({
        controllers: [HealthController],
      }).compile();

      const newController = module.get<HealthController>(HealthController);
      const result = newController.deploymentHash();

      expect(result).toMatchObject({
        deploymentHash: 'dev-abcd123',
        environment: 'staging',
        gitCommit: 'abcd1234567890abcd1234567890abcd12345678',
        gitCommitShort: 'abcd123',
        gitBranch: 'main',
        note: 'Generated from current git state',
      });
      expect(result.timestamp).toBeDefined();
    });

    it('should handle git command failure', async () => {
      mockFs.existsSync = jest.fn().mockReturnValue(false);
      mockExecSync.mockImplementation(() => {
        throw new Error('Git not available');
      });

      const module: TestingModule = await Test.createTestingModule({
        controllers: [HealthController],
      }).compile();

      const newController = module.get<HealthController>(HealthController);
      const result = newController.deploymentHash();

      expect(result).toMatchObject({
        deploymentHash: 'unknown',
        environment: 'development',
        error: 'Could not load deployment info',
      });
      expect(result.timestamp).toBeDefined();
    });

    it('should handle deployment info parsing error', async () => {
      // Mock version info loading to not exist
      mockFs.existsSync = jest
        .fn()
        .mockReturnValueOnce(false) // version.json paths
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true); // deployment-hash.json exists

      mockFs.readFileSync = jest.fn().mockReturnValue('invalid json');

      const module: TestingModule = await Test.createTestingModule({
        controllers: [HealthController],
      }).compile();

      const newController = module.get<HealthController>(HealthController);
      const result = newController.deploymentHash();

      expect(result).toMatchObject({
        deploymentHash: 'unknown',
        environment: 'development',
      });
      expect(result.error).toContain('Could not load deployment info:');
    });
  });

  describe('check', () => {
    it('should return health check response with all info', () => {
      const result = controller.check();

      expect(result).toMatchObject({
        status: 'ok',
      });
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(result.deployment).toBeDefined();
      expect(typeof result.uptime).toBe('number');
    });

    it('should include version info in check response', () => {
      const result = controller.check();

      // Should include version info properties
      expect(result.version).toBeDefined();
      expect(result.environment).toBeDefined();
    });
  });

  describe('version', () => {
    it('should return version info', () => {
      const result = controller.version();

      expect(result).toBeDefined();
      expect(result.version).toBeDefined();
      expect(result.environment).toBeDefined();
    });
  });

  describe('deploymentHash', () => {
    it('should return deployment info', () => {
      const result = controller.deploymentHash();

      expect(result).toBeDefined();
      expect(result.deploymentHash).toBeDefined();
      expect(result.environment).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle missing NODE_ENV environment variable', async () => {
      delete process.env.NODE_ENV;
      mockFs.existsSync = jest.fn().mockReturnValue(false);

      const module: TestingModule = await Test.createTestingModule({
        controllers: [HealthController],
      }).compile();

      const newController = module.get<HealthController>(HealthController);
      const versionResult = newController.version();
      const deploymentResult = newController.deploymentHash();

      expect(versionResult.environment).toBe('development');
      expect(deploymentResult.environment).toBe('development');
    });

    it('should try multiple paths for version.json', async () => {
      mockFs.existsSync = jest
        .fn()
        .mockReturnValueOnce(false) // version.json first path fails
        .mockReturnValueOnce(false) // version.json second path fails
        .mockReturnValueOnce(true) // version.json third path succeeds
        .mockReturnValueOnce(false) // deployment-hash first path fails
        .mockReturnValueOnce(false) // deployment-hash second path fails
        .mockReturnValueOnce(false) // deployment-hash third path fails
        .mockReturnValueOnce(false); // deployment-hash fourth path fails

      const mockVersionData = { version: '2.0.0', environment: 'test' };
      mockFs.readFileSync = jest
        .fn()
        .mockReturnValue(JSON.stringify(mockVersionData));

      // Mock git commands for deployment info fallback
      mockExecSync
        .mockReturnValueOnce('abcd1234567890abcd1234567890abcd12345678\n')
        .mockReturnValueOnce('abcd123\n')
        .mockReturnValueOnce('main\n');

      const module: TestingModule = await Test.createTestingModule({
        controllers: [HealthController],
      }).compile();

      const newController = module.get<HealthController>(HealthController);
      const result = newController.version();

      expect(result).toEqual(mockVersionData);
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(1);
    });

    it('should try multiple paths for deployment-hash.json', async () => {
      mockFs.existsSync = jest
        .fn()
        .mockReturnValueOnce(false) // version.json paths
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false) // deployment-hash first path fails
        .mockReturnValueOnce(false) // deployment-hash second path fails
        .mockReturnValueOnce(true); // deployment-hash third path succeeds

      const mockDeploymentData = {
        deploymentHash: 'xyz789',
        timestamp: '2023-01-01T00:00:00.000Z',
        environment: 'test',
      };

      mockFs.readFileSync = jest
        .fn()
        .mockReturnValue(JSON.stringify(mockDeploymentData));

      const module: TestingModule = await Test.createTestingModule({
        controllers: [HealthController],
      }).compile();

      const newController = module.get<HealthController>(HealthController);
      const result = newController.deploymentHash();

      expect(result).toEqual(mockDeploymentData);
      expect(mockFs.existsSync).toHaveBeenCalledTimes(6); // 3 for version + 3 for deployment
    });
  });
});

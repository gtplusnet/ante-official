import { Test, TestingModule } from '@nestjs/testing';
import { ScopeList } from '@prisma/client';
import { AIServiceResolverService } from './ai-service-resolver.service';
import { SystemModule } from '../../../shared/enums/user-level.enums';
import { AIServiceMethod } from '../interfaces/ai-service-mapping.interface';

describe('AIServiceResolverService', () => {
  let service: AIServiceResolverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AIServiceResolverService],
    }).compile();

    service = module.get<AIServiceResolverService>(AIServiceResolverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailableServices', () => {
    it('should return empty array when user has no matching scopes', () => {
      const userScopes: ScopeList[] = ['DASHBOARD_TASK_WIDGET' as ScopeList];
      const result = service.getAvailableServices(userScopes);
      expect(result).toEqual([]);
    });

    it('should return empty array when user has no scopes', () => {
      const result = service.getAvailableServices([]);
      expect(result).toEqual([]);
    });

    it('should return manpower services when user has manpower access', () => {
      const userScopes: ScopeList[] = [
        ScopeList.MANPOWER_ACCESS,
        ScopeList.MANPOWER_HRIS_ACCESS,
        ScopeList.MANPOWER_PAYROLL_CENTER_ACCESS,
      ];

      const result = service.getAvailableServices(userScopes);

      expect(result).toHaveLength(2);
      expect(result.find((s) => s.name === 'Get Employee List')).toBeDefined();
      expect(
        result.find((s) => s.name === 'Get Payroll Summary'),
      ).toBeDefined();
    });

    it('should return project services when user has project access', () => {
      const userScopes: ScopeList[] = [ScopeList.PROJECT_ACCESS];

      const result = service.getAvailableServices(userScopes);

      expect(result).toHaveLength(2);
      expect(result.find((s) => s.name === 'Get Project List')).toBeDefined();
      expect(result.find((s) => s.name === 'Get Task List')).toBeDefined();
    });

    it('should return settings services when user has settings access', () => {
      const userScopes: ScopeList[] = [
        ScopeList.SETTINGS_ACCESS,
        ScopeList.SETTINGS_USER_ACCESS,
        ScopeList.SETTINGS_COMPANY_ACCESS,
      ];

      const result = service.getAvailableServices(userScopes);

      expect(result).toHaveLength(2);
      expect(result.find((s) => s.name === 'Get User List')).toBeDefined();
      expect(
        result.find((s) => s.name === 'Get Company Information'),
      ).toBeDefined();
    });

    it('should return only services user has specific scope access to', () => {
      // User has manpower access but only HRIS, not payroll
      const userScopes: ScopeList[] = [
        ScopeList.MANPOWER_ACCESS,
        ScopeList.MANPOWER_HRIS_ACCESS,
      ];

      const result = service.getAvailableServices(userScopes);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Get Employee List');
    });

    it('should return services from multiple modules when user has access', () => {
      const userScopes: ScopeList[] = [
        ScopeList.MANPOWER_ACCESS,
        ScopeList.MANPOWER_HRIS_ACCESS,
        ScopeList.PROJECT_ACCESS,
        ScopeList.SETTINGS_ACCESS,
        ScopeList.SETTINGS_USER_ACCESS,
      ];

      const result = service.getAvailableServices(userScopes);

      expect(result).toHaveLength(4);
      expect(result.find((s) => s.name === 'Get Employee List')).toBeDefined();
      expect(result.find((s) => s.name === 'Get Project List')).toBeDefined();
      expect(result.find((s) => s.name === 'Get Task List')).toBeDefined();
      expect(result.find((s) => s.name === 'Get User List')).toBeDefined();
    });

    it('should not return services if user has module access but not specific service access', () => {
      const userScopes: ScopeList[] = [ScopeList.SETTINGS_ACCESS]; // No specific service scopes

      const result = service.getAvailableServices(userScopes);

      expect(result).toHaveLength(0);
    });
  });

  describe('hasAccessToService', () => {
    const mockService: AIServiceMethod = {
      name: 'Test Service',
      description: 'Test Description',
      serviceClass: 'TestService',
      methodName: 'testMethod',
      requiredScopes: [
        ScopeList.MANPOWER_HRIS_ACCESS,
        ScopeList.MANPOWER_ACCESS,
      ],
    };

    it('should return true when user has all required scopes', () => {
      const userScopes = [
        ScopeList.MANPOWER_ACCESS,
        ScopeList.MANPOWER_HRIS_ACCESS,
        ScopeList.PROJECT_ACCESS,
      ];

      const result = service.hasAccessToService(userScopes, mockService);
      expect(result).toBe(true);
    });

    it('should return false when user is missing required scopes', () => {
      const userScopes = [ScopeList.MANPOWER_ACCESS]; // Missing MANPOWER_HRIS_ACCESS

      const result = service.hasAccessToService(userScopes, mockService);
      expect(result).toBe(false);
    });

    it('should return false when user has no scopes', () => {
      const result = service.hasAccessToService([], mockService);
      expect(result).toBe(false);
    });

    it('should return true when service has no required scopes', () => {
      const serviceWithNoScopes: AIServiceMethod = {
        ...mockService,
        requiredScopes: [],
      };

      const result = service.hasAccessToService([], serviceWithNoScopes);
      expect(result).toBe(true);
    });

    it('should return true when user has exact required scopes', () => {
      const userScopes = [
        ScopeList.MANPOWER_HRIS_ACCESS,
        ScopeList.MANPOWER_ACCESS,
      ];

      const result = service.hasAccessToService(userScopes, mockService);
      expect(result).toBe(true);
    });
  });

  describe('getProvidersForScope', () => {
    it('should return providers for manpower scope', () => {
      const result = service.getProvidersForScope(ScopeList.MANPOWER_ACCESS);
      expect(result).toEqual(['gemini', 'openai']);
    });

    it('should return providers for project scope', () => {
      const result = service.getProvidersForScope(ScopeList.PROJECT_ACCESS);
      expect(result).toEqual(['gemini', 'openai']);
    });

    it('should return providers for settings scope', () => {
      const result = service.getProvidersForScope(ScopeList.SETTINGS_ACCESS);
      expect(result).toEqual(['gemini', 'openai']);
    });

    it('should return default providers for unknown scope', () => {
      const unknownScope = 'UNKNOWN_SCOPE' as ScopeList;
      const result = service.getProvidersForScope(unknownScope);
      expect(result).toEqual(['gemini', 'openai']);
    });

    it('should return default providers for asset scope (not configured)', () => {
      const result = service.getProvidersForScope(ScopeList.ASSET_ACCESS);
      expect(result).toEqual(['gemini', 'openai']);
    });
  });

  describe('getServicesByModule', () => {
    it('should return services for manpower module', () => {
      const userScopes = [
        ScopeList.MANPOWER_ACCESS,
        ScopeList.MANPOWER_HRIS_ACCESS,
        ScopeList.MANPOWER_PAYROLL_CENTER_ACCESS,
      ];

      const result = service.getServicesByModule(
        SystemModule.MANPOWER,
        userScopes,
      );

      expect(result).toHaveLength(2);
      expect(result.find((s) => s.name === 'Get Employee List')).toBeDefined();
      expect(
        result.find((s) => s.name === 'Get Payroll Summary'),
      ).toBeDefined();
    });

    it('should return services for project module', () => {
      const userScopes = [ScopeList.PROJECT_ACCESS];

      const result = service.getServicesByModule(
        SystemModule.PROJECT,
        userScopes,
      );

      expect(result).toHaveLength(2);
      expect(result.find((s) => s.name === 'Get Project List')).toBeDefined();
      expect(result.find((s) => s.name === 'Get Task List')).toBeDefined();
    });

    it('should return services for settings module', () => {
      const userScopes = [
        ScopeList.SETTINGS_ACCESS,
        ScopeList.SETTINGS_USER_ACCESS,
        ScopeList.SETTINGS_COMPANY_ACCESS,
      ];

      const result = service.getServicesByModule(
        SystemModule.SETTINGS,
        userScopes,
      );

      expect(result).toHaveLength(2);
      expect(result.find((s) => s.name === 'Get User List')).toBeDefined();
      expect(
        result.find((s) => s.name === 'Get Company Information'),
      ).toBeDefined();
    });

    it('should return empty array for module without access', () => {
      const userScopes = [ScopeList.PROJECT_ACCESS];

      const result = service.getServicesByModule(
        SystemModule.MANPOWER,
        userScopes,
      );

      expect(result).toEqual([]);
    });

    it('should return empty array for unknown module', () => {
      const userScopes = [ScopeList.MANPOWER_ACCESS];
      const unknownModule = 'UNKNOWN_MODULE' as SystemModule;

      const result = service.getServicesByModule(unknownModule, userScopes);

      expect(result).toEqual([]);
    });

    it('should return only services user has specific access to within module', () => {
      const userScopes = [
        ScopeList.MANPOWER_ACCESS,
        ScopeList.MANPOWER_HRIS_ACCESS,
        // Missing MANPOWER_PAYROLL_CENTER_ACCESS
      ];

      const result = service.getServicesByModule(
        SystemModule.MANPOWER,
        userScopes,
      );

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Get Employee List');
    });
  });

  describe('getServiceByName', () => {
    it('should return service by exact name match', () => {
      const userScopes = [
        ScopeList.MANPOWER_ACCESS,
        ScopeList.MANPOWER_HRIS_ACCESS,
      ];

      const result = service.getServiceByName('Get Employee List', userScopes);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Get Employee List');
    });

    it('should return service by method name match', () => {
      const userScopes = [ScopeList.PROJECT_ACCESS];

      const result = service.getServiceByName('getProjects', userScopes);

      expect(result).toBeDefined();
      expect(result?.methodName).toBe('getProjects');
    });

    it('should be case insensitive for name matching', () => {
      const userScopes = [
        ScopeList.MANPOWER_ACCESS,
        ScopeList.MANPOWER_HRIS_ACCESS,
      ];

      const result = service.getServiceByName('get employee list', userScopes);

      expect(result).toBeDefined();
      expect(result?.name).toBe('Get Employee List');
    });

    it('should be case insensitive for method name matching', () => {
      const userScopes = [ScopeList.PROJECT_ACCESS];

      const result = service.getServiceByName('GETPROJECTS', userScopes);

      expect(result).toBeDefined();
      expect(result?.methodName).toBe('getProjects');
    });

    it('should return undefined for non-existent service', () => {
      const userScopes = [
        ScopeList.MANPOWER_ACCESS,
        ScopeList.MANPOWER_HRIS_ACCESS,
      ];

      const result = service.getServiceByName(
        'Non Existent Service',
        userScopes,
      );

      expect(result).toBeUndefined();
    });

    it('should return undefined when user lacks access to service', () => {
      const userScopes = [ScopeList.PROJECT_ACCESS]; // No manpower access

      const result = service.getServiceByName('Get Employee List', userScopes);

      expect(result).toBeUndefined();
    });

    it('should handle empty service name', () => {
      const userScopes = [
        ScopeList.MANPOWER_ACCESS,
        ScopeList.MANPOWER_HRIS_ACCESS,
      ];

      const result = service.getServiceByName('', userScopes);

      expect(result).toBeUndefined();
    });

    it('should handle whitespace in service name', () => {
      const userScopes = [
        ScopeList.MANPOWER_ACCESS,
        ScopeList.MANPOWER_HRIS_ACCESS,
      ];

      const result = service.getServiceByName(
        '  Get Employee List  ',
        userScopes,
      );

      expect(result).toBeUndefined(); // Because we trim/normalize in the comparison
    });
  });

  describe('generateServiceContext', () => {
    it('should return no services message when user has no access', () => {
      const userScopes: ScopeList[] = [];

      const result = service.generateServiceContext(userScopes);

      expect(result).toBe(
        'No additional services are available based on your current permissions.',
      );
    });

    it('should return no services message when user has module access but no specific services', () => {
      const userScopes = [ScopeList.MANPOWER_ACCESS]; // Module access but no specific service scopes

      const result = service.generateServiceContext(userScopes);

      expect(result).toBe(
        'No additional services are available based on your current permissions.',
      );
    });

    it('should generate context for manpower services', () => {
      const userScopes = [
        ScopeList.MANPOWER_ACCESS,
        ScopeList.MANPOWER_HRIS_ACCESS,
      ];

      const result = service.generateServiceContext(userScopes);

      expect(result).toContain(
        'You have access to the following system services:',
      );
      expect(result).toContain('**MANPOWER Module:**');
      expect(result).toContain(
        '- Get Employee List: Retrieve list of employees in the system',
      );
      expect(result).toContain(
        'Parameters: limit (number, optional), branchId (string, optional)',
      );
      expect(result).toContain(
        'You can ask me to use any of these services to help answer your questions.',
      );
    });

    it('should generate context for project services', () => {
      const userScopes = [ScopeList.PROJECT_ACCESS];

      const result = service.generateServiceContext(userScopes);

      expect(result).toContain('**PROJECT Module:**');
      expect(result).toContain('- Get Project List: Retrieve list of projects');
      expect(result).toContain('- Get Task List: Retrieve tasks for projects');
      expect(result).toContain(
        'Parameters: status (string, optional), limit (number, optional)',
      );
      expect(result).toContain(
        'Parameters: projectId (string, optional), assignedToId (string, optional)',
      );
    });

    it('should generate context for settings services', () => {
      const userScopes = [
        ScopeList.SETTINGS_ACCESS,
        ScopeList.SETTINGS_USER_ACCESS,
        ScopeList.SETTINGS_COMPANY_ACCESS,
      ];

      const result = service.generateServiceContext(userScopes);

      expect(result).toContain('**SETTINGS Module:**');
      expect(result).toContain(
        '- Get User List: Retrieve list of system users',
      );
      expect(result).toContain(
        '- Get Company Information: Retrieve company settings and information',
      );
      expect(result).toContain('Parameters: roleId (string, optional)');
    });

    it('should generate context for multiple modules', () => {
      const userScopes = [
        ScopeList.MANPOWER_ACCESS,
        ScopeList.MANPOWER_HRIS_ACCESS,
        ScopeList.PROJECT_ACCESS,
      ];

      const result = service.generateServiceContext(userScopes);

      expect(result).toContain('**MANPOWER Module:**');
      expect(result).toContain('**PROJECT Module:**');
      expect(result).toContain('- Get Employee List');
      expect(result).toContain('- Get Project List');
      expect(result).toContain('- Get Task List');
    });

    it('should handle service without parameters', () => {
      const userScopes = [
        ScopeList.SETTINGS_ACCESS,
        ScopeList.SETTINGS_COMPANY_ACCESS,
      ];

      const result = service.generateServiceContext(userScopes);

      expect(result).toContain(
        '- Get Company Information: Retrieve company settings and information',
      );
      // Should not contain Parameters line for service without parameters
      expect(result).not.toContain('Parameters:');
    });

    it('should show required vs optional parameters correctly', () => {
      const userScopes = [
        ScopeList.MANPOWER_ACCESS,
        ScopeList.MANPOWER_PAYROLL_CENTER_ACCESS,
      ];

      const result = service.generateServiceContext(userScopes);

      expect(result).toContain(
        '- Get Payroll Summary: Get payroll summary information',
      );
      expect(result).toContain('Parameters: cutoffId (string, required)');
    });

    it('should group services by module correctly', () => {
      const userScopes = [
        ScopeList.MANPOWER_ACCESS,
        ScopeList.MANPOWER_HRIS_ACCESS,
        ScopeList.PROJECT_ACCESS,
        ScopeList.SETTINGS_ACCESS,
        ScopeList.SETTINGS_USER_ACCESS,
      ];

      const result = service.generateServiceContext(userScopes);

      // Check that modules appear in the result
      const manpowerIndex = result.indexOf('**MANPOWER Module:**');
      const projectIndex = result.indexOf('**PROJECT Module:**');
      const settingsIndex = result.indexOf('**SETTINGS Module:**');

      expect(manpowerIndex).toBeGreaterThan(-1);
      expect(projectIndex).toBeGreaterThan(-1);
      expect(settingsIndex).toBeGreaterThan(-1);

      // Each should have their services listed
      expect(result.substring(manpowerIndex, projectIndex)).toContain(
        'Get Employee List',
      );
      expect(result.substring(projectIndex, settingsIndex)).toContain(
        'Get Project List',
      );
      expect(result.substring(settingsIndex)).toContain('Get User List');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null or undefined user scopes in getAvailableServices', () => {
      expect(() => service.getAvailableServices(null as any)).toThrow();
      expect(() => service.getAvailableServices(undefined as any)).toThrow();
    });

    it('should handle null service in hasAccessToService', () => {
      const userScopes = [ScopeList.MANPOWER_ACCESS];
      expect(() =>
        service.hasAccessToService(userScopes, null as any),
      ).toThrow();
    });

    it('should handle service with undefined requiredScopes', () => {
      const userScopes = [ScopeList.MANPOWER_ACCESS];
      const serviceWithUndefinedScopes = {
        name: 'Test Service',
        description: 'Test',
        serviceClass: 'TestService',
        methodName: 'test',
        requiredScopes: undefined as any,
      };

      expect(() =>
        service.hasAccessToService(userScopes, serviceWithUndefinedScopes),
      ).toThrow();
    });

    it('should handle empty string parameters gracefully', () => {
      const result = service.getServiceByName('', []);
      expect(result).toBeUndefined();
    });

    it('should handle invalid enum values gracefully in getProvidersForScope', () => {
      const invalidScope = 'INVALID_SCOPE_VALUE' as ScopeList;
      const result = service.getProvidersForScope(invalidScope);
      expect(result).toEqual(['gemini', 'openai']);
    });
  });
});

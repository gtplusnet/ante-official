import { Injectable } from '@nestjs/common';
import { ScopeList } from '@prisma/client';
import { SystemModule } from '../../../shared/enums/user-level.enums';
import {
  AIServiceMethod,
  AIServiceMapping,
  AIServiceResolver as IAIServiceResolver,
} from '../interfaces/ai-service-mapping.interface';

@Injectable()
export class AIServiceResolverService implements IAIServiceResolver {
  private readonly serviceMappings: AIServiceMapping[] = [
    // Manpower module services
    {
      scope: ScopeList.MANPOWER_ACCESS,
      module: SystemModule.MANPOWER,
      availableServices: [
        {
          name: 'Get Employee List',
          description: 'Retrieve list of employees in the system',
          serviceClass: 'EmployeeListService',
          methodName: 'getEmployees',
          requiredScopes: [ScopeList.MANPOWER_HRIS_ACCESS],
          parameters: [
            {
              name: 'limit',
              type: 'number',
              required: false,
              description: 'Maximum number of employees to return',
            },
            {
              name: 'branchId',
              type: 'string',
              required: false,
              description: 'Filter by specific branch',
            },
          ],
        },
        {
          name: 'Get Payroll Summary',
          description: 'Get payroll summary information',
          serviceClass: 'HrProcessingService',
          methodName: 'getPayrollSummary',
          requiredScopes: [ScopeList.MANPOWER_PAYROLL_CENTER_ACCESS],
          parameters: [
            {
              name: 'cutoffId',
              type: 'string',
              required: true,
              description: 'Cutoff period identifier',
            },
          ],
        },
      ],
      aiProviders: ['gemini', 'openai'],
    },
    // Project module services
    {
      scope: ScopeList.PROJECT_ACCESS,
      module: SystemModule.PROJECT,
      availableServices: [
        {
          name: 'Get Project List',
          description: 'Retrieve list of projects',
          serviceClass: 'ProjectService',
          methodName: 'getProjects',
          requiredScopes: [ScopeList.PROJECT_ACCESS],
          parameters: [
            {
              name: 'status',
              type: 'string',
              required: false,
              description: 'Filter by project status',
            },
            {
              name: 'limit',
              type: 'number',
              required: false,
              description: 'Maximum number of projects to return',
            },
          ],
        },
        {
          name: 'Get Task List',
          description: 'Retrieve tasks for projects',
          serviceClass: 'TaskService',
          methodName: 'getTasks',
          requiredScopes: [ScopeList.PROJECT_ACCESS],
          parameters: [
            {
              name: 'projectId',
              type: 'string',
              required: false,
              description: 'Filter by specific project',
            },
            {
              name: 'assignedToId',
              type: 'string',
              required: false,
              description: 'Filter by assigned user',
            },
          ],
        },
      ],
      aiProviders: ['gemini', 'openai'],
    },
    // Settings module services
    {
      scope: ScopeList.SETTINGS_ACCESS,
      module: SystemModule.SETTINGS,
      availableServices: [
        {
          name: 'Get User List',
          description: 'Retrieve list of system users',
          serviceClass: 'UserService',
          methodName: 'getUsers',
          requiredScopes: [ScopeList.SETTINGS_USER_ACCESS],
          parameters: [
            {
              name: 'roleId',
              type: 'string',
              required: false,
              description: 'Filter by user role',
            },
          ],
        },
        {
          name: 'Get Company Information',
          description: 'Retrieve company settings and information',
          serviceClass: 'CompanyService',
          methodName: 'getCompanyInfo',
          requiredScopes: [ScopeList.SETTINGS_COMPANY_ACCESS],
        },
      ],
      aiProviders: ['gemini', 'openai'],
    },
  ];

  /**
   * Get available services for a user based on their scopes
   */
  getAvailableServices(userScopes: ScopeList[]): AIServiceMethod[] {
    const availableServices: AIServiceMethod[] = [];

    for (const mapping of this.serviceMappings) {
      // Check if user has access to the main scope
      if (userScopes.includes(mapping.scope)) {
        for (const service of mapping.availableServices) {
          // Check if user has all required scopes for this service
          if (this.hasAccessToService(userScopes, service)) {
            availableServices.push(service);
          }
        }
      }
    }

    return availableServices;
  }

  /**
   * Check if user has access to a specific service method
   */
  hasAccessToService(
    userScopes: ScopeList[],
    serviceMethod: AIServiceMethod,
  ): boolean {
    return serviceMethod.requiredScopes.every((scope) =>
      userScopes.includes(scope),
    );
  }

  /**
   * Get AI providers available for a specific scope
   */
  getProvidersForScope(scope: ScopeList): string[] {
    const mapping = this.serviceMappings.find((m) => m.scope === scope);
    return mapping?.aiProviders || ['gemini', 'openai']; // Default to both providers
  }

  /**
   * Get services by module
   */
  getServicesByModule(
    module: SystemModule,
    userScopes: ScopeList[],
  ): AIServiceMethod[] {
    const availableServices: AIServiceMethod[] = [];

    for (const mapping of this.serviceMappings) {
      if (mapping.module === module && userScopes.includes(mapping.scope)) {
        for (const service of mapping.availableServices) {
          if (this.hasAccessToService(userScopes, service)) {
            availableServices.push(service);
          }
        }
      }
    }

    return availableServices;
  }

  /**
   * Get service method by name
   */
  getServiceByName(
    serviceName: string,
    userScopes: ScopeList[],
  ): AIServiceMethod | undefined {
    const availableServices = this.getAvailableServices(userScopes);
    return availableServices.find(
      (service) =>
        service.name.toLowerCase() === serviceName.toLowerCase() ||
        service.methodName.toLowerCase() === serviceName.toLowerCase(),
    );
  }

  /**
   * Generate service description for AI context
   */
  generateServiceContext(userScopes: ScopeList[]): string {
    const availableServices = this.getAvailableServices(userScopes);

    if (availableServices.length === 0) {
      return 'No additional services are available based on your current permissions.';
    }

    let context = 'You have access to the following system services:\n\n';

    const servicesByModule = availableServices.reduce(
      (acc, service) => {
        const mapping = this.serviceMappings.find((m) =>
          m.availableServices.some((s) => s.name === service.name),
        );
        const moduleName = mapping?.module || 'Unknown';

        if (!acc[moduleName]) {
          acc[moduleName] = [];
        }
        acc[moduleName].push(service);
        return acc;
      },
      {} as Record<string, AIServiceMethod[]>,
    );

    for (const [module, services] of Object.entries(servicesByModule)) {
      context += `**${module} Module:**\n`;
      for (const service of services) {
        context += `- ${service.name}: ${service.description}\n`;
        if (service.parameters && service.parameters.length > 0) {
          context += `  Parameters: ${service.parameters.map((p) => `${p.name} (${p.type}${p.required ? ', required' : ', optional'})`).join(', ')}\n`;
        }
      }
      context += '\n';
    }

    context +=
      'You can ask me to use any of these services to help answer your questions.';

    return context;
  }
}

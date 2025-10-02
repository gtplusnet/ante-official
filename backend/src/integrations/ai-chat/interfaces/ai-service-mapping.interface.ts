import { ScopeList } from '@prisma/client';
import { SystemModule } from '../../../shared/enums/user-level.enums';

export interface AIServiceMethod {
  name: string;
  description: string;
  serviceClass: string;
  methodName: string;
  requiredScopes: ScopeList[];
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
}

export interface AIServiceMapping {
  scope: ScopeList;
  module: SystemModule;
  availableServices: AIServiceMethod[];
  aiProviders: string[];
}

export interface AIServiceResolver {
  /**
   * Get available services for a user based on their scopes
   * @param userScopes - Array of scopes the user has access to
   * @returns Array of available AI service methods
   */
  getAvailableServices(userScopes: ScopeList[]): AIServiceMethod[];

  /**
   * Check if user has access to a specific service method
   * @param userScopes - Array of scopes the user has access to
   * @param serviceMethod - The service method to check
   * @returns Boolean indicating if user has access
   */
  hasAccessToService(
    userScopes: ScopeList[],
    serviceMethod: AIServiceMethod,
  ): boolean;

  /**
   * Get AI providers available for a specific scope
   * @param scope - The scope to check
   * @returns Array of available AI provider names
   */
  getProvidersForScope(scope: ScopeList): string[];
}

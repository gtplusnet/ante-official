import { ScopeList, SystemModule } from '@prisma/client';
import { ScopeDataResponse } from './scope.response';

export interface UserLevelTreeResponse {
  id: SystemModule;
  label: string;
  userLevel: UserLevelDataResponse[];
}

export interface UserLevelDataResponse {
  id: number;
  label: string;
  systemModule: SystemModule;
  scope: ScopeList[];
  scopeTree?: ScopeDataResponse[];
}

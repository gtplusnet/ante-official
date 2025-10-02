import { SystemModule, ScopeList } from '@prisma/client';

export interface CreateUserLevelRequest {
  label: string;
  systemModule: SystemModule;
  scope: ScopeList[];
}

export interface UpdateUserLevelRequest {
  id: number;
  label?: string;
  systemModule?: SystemModule;
  scope?: ScopeList[];
}

export interface DeleteUserLevelRequest {
  id: number;
}

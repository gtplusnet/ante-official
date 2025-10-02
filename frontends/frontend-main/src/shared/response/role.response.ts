import { DateFormat } from './utility.format';
import { ScopeList } from '@/types/prisma-enums';
import { UserLevelDataResponse } from './user-level.response';

export { ScopeList };

export interface RoleDataResponse {
  id: string;
  name: string;
  description: string;
  isDeveloper: boolean;
  isDeleted: boolean;
  roleGroupId: string;
  level: number;
  parentRole: null | RoleDataResponse;
  roleGroup: RoleGroupDataResponse;
  userLevels: UserLevelDataResponse[];
  isFullAccess: boolean;
  employeeCount: number;
  updatedAt: DateFormat;
  createdAt: DateFormat;
  scopeList: ScopeList[];
}

export interface RoleGroupDataResponse {
  id: string;
  name: string;
  description: string;
}

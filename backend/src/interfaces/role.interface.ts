import { AccountDataResponse } from '../shared/response';
import { RoleGroupInterface } from './roleGroup.interface';
import { RoleScopeInterface } from './roleScope.interface';

export interface RoleInterface {
  id: string;
  name: string;
  description: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeveloper: boolean;
  level: number;
  users: AccountDataResponse[];
  roleScopes: RoleScopeInterface[];
  roleGroup: RoleGroupInterface | null;
  roleGroupId: string | null;
  parentRole: RoleInterface | null;
  parentRoleId: string | null;
  childRoles: RoleInterface[];
}

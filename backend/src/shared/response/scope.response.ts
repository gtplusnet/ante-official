import { ScopeList } from '@prisma/client';

export interface ScopeDataResponse {
  id: ScopeList;
  type: string;
  parentId: string;
  name: string;
  description: string;
}

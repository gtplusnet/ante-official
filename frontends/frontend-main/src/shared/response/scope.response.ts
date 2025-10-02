import { ScopeList } from '@/types/prisma-enums';
export interface ScopeDataResponse {
  id: ScopeList;
  type: string;
  parentId: string;
  name: string;
  description: string;
}

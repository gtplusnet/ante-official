import { ProjectStatus } from '@/types/prisma-enums';
import { DateFormat } from './utility.format';

export interface BranchDataResponse {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
  location: any;
  parentId?: number;
  parent?: BranchDataResponse;
  children?: BranchDataResponse[];
  childrenCount?: number;
  createdAt: DateFormat;
  updatedAt: DateFormat;
}

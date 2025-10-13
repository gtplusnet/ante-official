import { ProjectStatus, WinProbability } from '@/types/prisma-enums';
export interface ProjectCreateRequest {
  id?: number;
  name: string;
  description?: string;
  budget?: number;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  clientId?: number;
  pointOfContactId?: number;
  locationId: string;
  downpaymentAmount: number;
  retentionAmount: number;
  isLead: boolean;
  winProbability?: WinProbability;
  personInChargeId?: string;
  // Lead-specific fields
  relationshipOwnerId?: string;
  abc?: number;
  mmr?: number;
  initialCosting?: number;
  contactDetails?: string;
  leadSource?: string;
  leadType?: string;
  leadBoardStage?: string;
}

export interface ProjectEditRequest {
  id?: number;
  name: string;
  description?: string;
  budget?: number;
  startDate: string;
  endDate: string;
  downpaymentAmount: number;
  retentionAmount: number;
  winProbability?: WinProbability;
  personInChargeId?: string;
  // Lead-specific fields
  relationshipOwnerId?: string;
  abc?: number;
  mmr?: number;
  initialCosting?: number;
  contactDetails?: string;
  leadSource?: string;
  leadType?: string;
}

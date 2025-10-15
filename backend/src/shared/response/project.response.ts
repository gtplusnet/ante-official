import { ProjectStatus } from '@prisma/client';

// Re-export ProjectStatus for frontend use
export { ProjectStatus };
import { CurrencyFormat, DateFormat } from './utility.format';
import { LocationDataResponse } from './location.response';
import { ClientDataResponse } from './client.response';
import { CompanyDataResponse } from './company.response';
import { BOQDataResponse } from './boq.response';

export interface ProjectDataResponse {
  id: number;
  name: string;
  description: string;
  budget: CurrencyFormat;
  isDeleted: boolean;
  startDate: DateFormat;
  endDate: DateFormat;
  status: ProjectStatus;
  isLead: boolean;
  location: LocationDataResponse;
  client: ClientDataResponse;
  company: CompanyDataResponse;
  downpaymentAmount: CurrencyFormat;
  retentionAmount: CurrencyFormat;
  totalCollection: CurrencyFormat;
  totalCollectionBalance: CurrencyFormat;
  totalCollected: CurrencyFormat;
  progressPercentage: number;
  isProjectStarted: boolean;
  latestBoq: BOQDataResponse;
  computedDate: string;
  winProbability?: any;
  personInCharge?: any;
  address?: string;
  // Board stage fields for drag-and-drop functionality
  projectBoardStage?: string;
  leadBoardStage?: string;
}

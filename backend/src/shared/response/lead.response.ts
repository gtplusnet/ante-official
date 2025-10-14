import { ProjectDataResponse } from './project.response';
import { AccountDataResponse } from './account.response';
import { DateFormat } from './utility.format';

export interface LeadDataResponse extends ProjectDataResponse {
  leadBoardStage?: string;
  winProbability?: string | { key: string; label: string; description: string };
  personInChargeId?: string;
  personInCharge?: AccountDataResponse;
  createdAt?: DateFormat;
  updatedAt?: DateFormat;
  clientId?: number;
  locationId?: string;
  abc?: any; // CurrencyFormat
  mmr?: any; // CurrencyFormat
  implementationFee?: any; // CurrencyFormat
  initialCosting?: any; // CurrencyFormat
  contactDetails?: string;
  relationshipOwnerId?: string;
  dealSource?: { key: string; label: string };
  leadSource?: string;
  leadType?: string | { key: string; label: string };
  clientEmailAddress?: string;
}

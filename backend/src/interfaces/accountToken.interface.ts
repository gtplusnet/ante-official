import { AccountDataResponse } from 'src/shared/response';

export interface AccountTokenInterface {
  sessionId: string;
  accountId: string;
  payload: string;
  userAgent: string;
  token: string;
  ipAddress: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  account?: AccountDataResponse;
}

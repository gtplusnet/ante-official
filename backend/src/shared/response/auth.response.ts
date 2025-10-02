import { AccountDataResponse } from './account.response';

export interface LoginResponse {
  token: string;
  accountInformation: AccountDataResponse;
  serverName?: string;
  supabaseToken?: string;
  supabaseRefreshToken?: string;
}

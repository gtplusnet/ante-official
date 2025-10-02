import { FundTransactionCode } from '@prisma/client';

export interface WalletCodeReferenceResponse {
  key: FundTransactionCode;
  label: string;
}

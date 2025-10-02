import { FundTransactionCode } from '@/types/prisma-enums';

export interface WalletCodeReferenceResponse {
  key: FundTransactionCode;
  label: string;
}

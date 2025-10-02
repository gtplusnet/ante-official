export interface PettyCashHolderResponse {
  id: number;
  account: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
  initialAmount: number;
  currentBalance: number;
  actualBalance: number; // Same as currentBalance, for display
  pendingLiquidation: number; // Sum of pending liquidations
  reason: string;
  isActive: boolean;
  fundAccountId?: number;
  fundAccount?: {
    id: number;
    name: string;
    accountNumber: string;
    balance: number;
  };
  createdAt: string;
  updatedAt: string;
}
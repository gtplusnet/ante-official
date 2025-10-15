export interface CashierResponse {
  accountId: string;
  cashierCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  account?: {
    id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    username: string;
    email: string;
    contactNumber?: string;
  };
}

export interface CashierCreateResponse {
  cashier: CashierResponse;
  message: string;
}

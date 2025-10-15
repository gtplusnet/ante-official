export interface CashierAccountDetails {
  firstName: string;
  lastName: string;
  middleName?: string;
  username: string;
  password: string;
  email: string;
  contactNumber: string;
}

export interface CashierAccountUpdateDetails {
  firstName: string;
  lastName: string;
  middleName?: string;
  username: string;
  email: string;
  contactNumber: string;
}

export interface CashierCreateRequest {
  accountDetails?: CashierAccountDetails;
}

export interface CashierUpdateRequest {
  accountId: string;
  accountUpdateDetails?: CashierAccountUpdateDetails;
  isActive?: boolean;
}

export interface CashierDeleteRequest {
  accountId: string;
}

export interface CashierListRequest {
  includeInactive?: boolean;
}

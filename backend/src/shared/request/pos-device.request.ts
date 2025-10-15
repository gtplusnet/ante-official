export interface POSDeviceCreateRequest {
  name: string;
  location?: string;
  branchId?: number;
}

export interface POSDeviceUpdateRequest {
  id: string;
  name?: string;
  location?: string;
  branchId?: number | null;
  isActive?: boolean;
}

export interface POSDeviceRegenerateKeyRequest {
  id: string;
}

export interface POSDeviceDeleteRequest {
  id: string;
}

export interface POSDeviceListRequest {
  includeInactive?: boolean;
}

export interface POSDeviceInitializeRequest {
  apiKey: string;
  deviceId: string;
}

export interface POSDeviceUnbindRequest {
  id: string;
}

export interface CashierLoginRequest {
  username: string;
  password: string;
}

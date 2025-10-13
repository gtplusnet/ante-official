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

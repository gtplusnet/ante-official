export interface POSDeviceResponse {
  id: string;
  deviceId: string;
  name: string;
  location: string;
  companyId: number;
  branchId: number | null;
  isActive: boolean;
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  branch?: {
    id: number;
    name: string;
  } | null;
}

export interface POSDeviceCreateResponse {
  device: POSDeviceResponse;
  apiKey: string;
  message: string;
}

export interface POSDeviceRegenerateKeyResponse {
  device: POSDeviceResponse;
  apiKey: string;
  message: string;
}

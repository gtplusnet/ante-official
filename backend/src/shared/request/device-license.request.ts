export interface DeviceLicenseGenerateRequest {
  quantity: number;
  gateId: string;
}

export interface DeviceLicenseUpdateRequest {
  id: number;
  gateId?: string;
  isActive?: boolean;
}

export interface DeviceLicenseTableRequest {
  searchKeyword?: string;
  searchBy?: string;
  gateId?: string;
  isActive?: boolean;
  isConnected?: boolean;
}

export interface DeviceConnectionRequest {
  licenseKey: string;
  deviceName: string;
  macAddress: string;
  ipAddress?: string;
  deviceInfo?: any;
}

export interface DeviceLicenseRegenerateRequest {
  id: number;
}

export interface DeviceLicenseDeleteRequest {
  ids: number[];
}

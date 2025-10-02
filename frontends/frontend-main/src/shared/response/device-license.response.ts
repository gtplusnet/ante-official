export interface DeviceLicenseResponse {
  id: number;
  licenseKey: string;
  gateId: string | null;
  gate: GateInfo | null;
  isActive: boolean;
  dateFirstUsed: Date | null;
  dateLastUsed: Date | null;
  createdAt: Date;
  updatedAt: Date;
  connectedDevice: DeviceConnectionResponse | null;
}

export interface GateInfo {
  id: string;
  gateName: string;
}

export interface DeviceConnectionResponse {
  id: number;
  deviceName: string;
  macAddress: string;
  ipAddress: string | null;
  isConnected: boolean;
  lastSeen: Date;
  connectionCount: number;
  createdAt: Date;
}

export interface DeviceLicenseListResponse {
  data: DeviceLicenseResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DeviceLicenseStats {
  totalLicenses: number;
  activeLicenses: number;
  connectedDevices: number;
  licensesPerGate: { gateName: string; count: number }[];
}

export interface SyncResult {
  studentsCount: number;
  guardiansCount: number;
  success: boolean;
  error?: string;
}

export interface SyncProgress {
  current: number;
  total: number;
  entity: 'student' | 'guardian';
}

export interface DeviceSyncSettings {
  syncInterval?: number; // in minutes
  entityTypes?: ('student' | 'guardian')[];
  maxRecordsPerSync?: number;
}

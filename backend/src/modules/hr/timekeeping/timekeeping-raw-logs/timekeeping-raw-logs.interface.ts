import { TimekeepingSource } from '@prisma/client';

export interface TimekeepingRawLogQueryDTO {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  accountId?: string;
  source?: TimekeepingSource;
  search?: string;
  importBatchId?: string;
}

export interface TimekeepingRawLogResponse {
  id: number;
  employeeCode: string;
  employeeName: string;
  timeIn: string;
  timeOut: string;
  timeSpan: string;
  source: {
    key: string;
    label: string;
  };
  // TIME-IN GEOLOCATION
  timeInLocation: string | null;
  timeInIpAddress: string | null;
  // TIME-OUT GEOLOCATION
  timeOutLocation: string | null;
  timeOutIpAddress: string | null;
  importBatchId: string | null;
  importBatch: {
    id: string;
    fileName: string;
  } | null;
  createdAt: string;
}

export interface TimekeepingRawLogListResponse {
  list: TimekeepingRawLogResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

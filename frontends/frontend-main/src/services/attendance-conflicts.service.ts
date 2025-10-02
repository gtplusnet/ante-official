import { api } from 'src/boot/axios';

export interface AttendanceConflictType {
  MISSING_LOG: 'MISSING_LOG';
  MISSING_TIME_OUT: 'MISSING_TIME_OUT';
}

export enum AttendanceConflictAction {
  IGNORED = 'IGNORED',
  RESOLVED = 'RESOLVED',
}

export interface AttendanceConflict {
  id: number;
  accountId: string;
  employeeTimekeepingId?: number;
  conflictType: 'MISSING_LOG' | 'MISSING_TIME_OUT';
  conflictDate: string;
  dateString: string;
  description: string;
  shiftInfo?: any;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
  account: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    EmployeeData: {
      employeeCode: string;
    }[];
  };
}

export interface AttendanceConflictFilters {
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  conflictType?: 'MISSING_LOG' | 'MISSING_TIME_OUT';
  isResolved?: boolean;
  page?: number;
  limit?: number;
}

export interface AttendanceConflictResponse {
  data: AttendanceConflict[];
  total: number;
  page: number;
  lastPage: number;
}

export interface AttendanceConflictStats {
  total: number;
  resolved: number;
  unresolved: number;
  byType: Record<string, number>;
}

export class AttendanceConflictsService {
  private static readonly baseUrl = '/hr/timekeeping/attendance-conflicts';

  /**
   * Get attendance conflicts with filtering and pagination
   */
  static async getConflicts(filters: AttendanceConflictFilters = {}): Promise<AttendanceConflictResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.accountId) params.append('accountId', filters.accountId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.conflictType) params.append('conflictType', filters.conflictType);
      if (filters.isResolved !== undefined) params.append('isResolved', filters.isResolved.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await api.get(`${this.baseUrl}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch attendance conflicts:', error);
      throw error;
    }
  }

  /**
   * Get attendance conflict statistics
   */
  static async getConflictStats(filters: { dateFrom?: string; dateTo?: string } = {}): Promise<AttendanceConflictStats> {
    try {
      const params = new URLSearchParams();
      
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await api.get(`${this.baseUrl}/stats?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch attendance conflict stats:', error);
      throw error;
    }
  }

  /**
   * Resolve a specific conflict
   */
  static async resolveConflict(conflictId: number, resolvedBy: string): Promise<AttendanceConflict> {
    try {
      const response = await api.put(`${this.baseUrl}/${conflictId}/resolve`, {
        resolvedBy,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to resolve attendance conflict:', error);
      throw error;
    }
  }

  /**
   * Ignore or resolve a conflict for the current user
   */
  static async ignoreConflict(conflictId: number, action: AttendanceConflictAction): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/${conflictId}/ignore`, {
        action,
      });
    } catch (error) {
      console.error('Failed to ignore/resolve attendance conflict:', error);
      throw error;
    }
  }

  /**
   * Batch resolve conflicts for a specific date and employee
   */
  static async resolveConflictsForDate(accountId: string, dateString: string, resolvedBy: string): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/resolve-batch`, {
        accountId,
        dateString,
        resolvedBy,
      });
    } catch (error) {
      console.error('Failed to batch resolve attendance conflicts:', error);
      throw error;
    }
  }

  /**
   * Get conflict by ID
   */
  static async getConflictById(conflictId: number): Promise<AttendanceConflict> {
    try {
      const response = await api.get(`${this.baseUrl}/${conflictId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch attendance conflict:', error);
      throw error;
    }
  }

  /**
   * Format conflict type for display
   */
  static formatConflictType(type: string): string {
    const typeMap: Record<string, string> = {
      MISSING_LOG: 'Missing Log',
      MISSING_TIME_OUT: 'Missing Time-out',
    };
    return typeMap[type] || type;
  }

  /**
   * Get conflict type icon
   */
  static getConflictTypeIcon(type: string): string {
    const iconMap: Record<string, string> = {
      MISSING_LOG: 'error_outline',
      MISSING_TIME_OUT: 'schedule',
    };
    return iconMap[type] || 'warning';
  }

  /**
   * Get conflict type color
   */
  static getConflictTypeColor(type: string): string {
    const colorMap: Record<string, string> = {
      MISSING_LOG: 'negative',
      MISSING_TIME_OUT: 'orange',
    };
    return colorMap[type] || 'grey';
  }
}
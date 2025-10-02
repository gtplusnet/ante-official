import { api } from 'src/boot/axios';

export interface AttendanceData {
  present: number;
  late: number;
  undertime: number;
  absent: number;
  onLeave: number;
}

export interface DailyAttendanceResponse {
  date: string;
  attendance: AttendanceData;
  totalActiveEmployees: number;
  leavesThisMonth: number;
}

export interface DailyAttendanceSummary {
  date: string;
  attendance: AttendanceData;
  totalActiveEmployees: number;
  leavesThisMonth: number;
  formattedDate: string;
  lastUpdated: Date;
}

export class DashboardAttendanceService {
  private static readonly baseUrl = '/hris/timekeeping';
  private static cache: { data: DailyAttendanceSummary | null; timestamp: number } = {
    data: null,
    timestamp: 0,
  };
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get daily attendance summary
   */
  static async getDailyAttendance(date?: string, branchId?: number): Promise<DailyAttendanceSummary> {
    try {
      
      // Check cache first
      const now = Date.now();
      if (this.cache.data && 
          (now - this.cache.timestamp) < this.CACHE_DURATION && 
          this.cache.data.date === (date || new Date().toISOString().split('T')[0])) {
        return this.cache.data;
      }

      // Fetch attendance data
      const params: any = {};
      if (date) params.date = date;
      if (branchId) params.branchId = branchId;

      const response = await api.get<DailyAttendanceResponse>(`${this.baseUrl}/daily-attendance`, {
        params
      });

      const data = response.data;
      
      // Format the date for display
      const dateObj = new Date(data.date);
      const formattedDate = dateObj.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Create summary data
      const summaryData: DailyAttendanceSummary = {
        ...data,
        formattedDate,
        lastUpdated: new Date(),
      };
      
      // Update cache
      this.cache.data = summaryData;
      this.cache.timestamp = now;
      
      return summaryData;
    } catch (error) {
      console.error('Failed to fetch daily attendance:', error);
      
      // Return cached data if available, otherwise empty data
      if (this.cache.data) {
        return this.cache.data;
      }
      
      return this.getEmptyAttendanceSummary(date);
    }
  }

  /**
   * Get empty attendance summary for error states
   */
  private static getEmptyAttendanceSummary(date?: string): DailyAttendanceSummary {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const dateObj = new Date(targetDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return {
      date: targetDate,
      attendance: {
        present: 0,
        late: 0,
        undertime: 0,
        absent: 0,
        onLeave: 0,
      },
      totalActiveEmployees: 0,
      leavesThisMonth: 0,
      formattedDate,
      lastUpdated: new Date(),
    };
  }

  /**
   * Clear cache (useful for manual refresh)
   */
  static clearCache(): void {
    this.cache.data = null;
    this.cache.timestamp = 0;
  }

  /**
   * Check if data is cached and fresh
   */
  static isCached(): boolean {
    const now = Date.now();
    return this.cache.data !== null && (now - this.cache.timestamp) < this.CACHE_DURATION;
  }
}
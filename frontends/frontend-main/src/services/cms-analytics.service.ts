import { api } from 'src/boot/axios';

export interface DashboardStats {
  contentTypes: {
    collections: number;
    singles: number;
    components: number;
    total: number;
  };
  media: {
    totalFiles: number;
    totalSize: number;
    totalSizeFormatted: string;
  };
  apiCalls: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  activity: {
    recentActions: number;
    activeUsers: number;
  };
}

export interface ContentTypeStats {
  collections: number;
  singles: number;
  components: number;
  total: number;
}

export interface MediaStats {
  totalFiles: number;
  totalSize: number;
  totalSizeFormatted: string;
}

export interface ApiUsageStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface ActivityStats {
  recentActions: number;
  activeUsers: number;
}

export interface WeeklyApiUsage {
  name: string;
  rest: number;
  restCount: number;
}

export interface ApiStatistics {
  totalRequests: number;
  avgResponseTime: number;
  successRate: number;
  activeTokens: number;
}

export interface TopEndpoint {
  method: string;
  path: string;
  calls: string;
  callCount: number;
}

export interface MediaTypeStats {
  type: 'image' | 'video' | 'document' | 'other';
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  count: number;
  size: number;
  sizeFormatted: string;
}

export interface RecentMediaUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  type: 'image' | 'video' | 'document' | 'other';
  icon: string;
  size: number;
  sizeFormatted: string;
  uploadedAt: Date;
  timeAgo: string;
  thumbnail?: string;
}

export interface DetailedMediaStats {
  storage: {
    used: number;
    total: number;
    percentage: number;
    usedFormatted: string;
    totalFormatted: string;
  };
  mediaTypes: MediaTypeStats[];
  recentUploads: RecentMediaUpload[];
  totalFiles: number;
  totalSize: number;
}

export class CMSAnalyticsService {
  /**
   * Get comprehensive dashboard statistics
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await api.get('/cms/analytics/dashboard');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch dashboard statistics:', error);
      throw error;
    }
  }

  /**
   * Get content type statistics
   */
  static async getContentTypeStats(): Promise<ContentTypeStats> {
    try {
      const response = await api.get('/cms/analytics/content-types');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch content type statistics:', error);
      throw error;
    }
  }

  /**
   * Get media statistics
   */
  static async getMediaStats(): Promise<MediaStats> {
    try {
      const response = await api.get('/cms/analytics/media');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch media statistics:', error);
      throw error;
    }
  }

  /**
   * Get detailed media statistics
   */
  static async getDetailedMediaStats(): Promise<DetailedMediaStats> {
    try {
      const response = await api.get('/cms/analytics/media/detailed');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch detailed media statistics:', error);
      throw error;
    }
  }

  /**
   * Get API usage statistics
   */
  static async getApiUsageStats(): Promise<ApiUsageStats> {
    try {
      const response = await api.get('/cms/analytics/api-usage');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch API usage statistics:', error);
      throw error;
    }
  }

  /**
   * Get activity statistics
   */
  static async getActivityStats(): Promise<ActivityStats> {
    try {
      const response = await api.get('/cms/analytics/activity');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch activity statistics:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  static async getPerformanceMetrics(): Promise<any> {
    try {
      const response = await api.get('/cms/analytics/performance');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      throw error;
    }
  }

  /**
   * Generate analytics report
   */
  static async generateReport(type: string, dateRange?: any): Promise<any> {
    try {
      const params = { type, ...dateRange };
      const response = await api.get('/cms/analytics/report', { params });
      return response.data.data;
    } catch (error) {
      console.error('Failed to generate analytics report:', error);
      throw error;
    }
  }

  /**
   * Get weekly API usage data for chart
   */
  static async getWeeklyApiUsage(): Promise<WeeklyApiUsage[]> {
    try {
      const response = await api.get('/cms/analytics/api-usage/weekly');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch weekly API usage:', error);
      throw error;
    }
  }

  /**
   * Get API usage statistics
   */
  static async getApiStatistics(): Promise<ApiStatistics> {
    try {
      const response = await api.get('/cms/analytics/api-usage/statistics');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch API usage statistics:', error);
      throw error;
    }
  }

  /**
   * Get top API endpoints
   */
  static async getTopEndpoints(): Promise<TopEndpoint[]> {
    try {
      const response = await api.get('/cms/analytics/api-usage/top-endpoints');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch top endpoints:', error);
      throw error;
    }
  }
}
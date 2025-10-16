import { apiClient, ApiResponse } from './api-client';

/**
 * Guardian Public API Client
 * Interfaces with http://100.109.133.12:3000/api/public/school-guardian
 */

// ==================== Request DTOs ====================

export interface GuardianLoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  deviceToken?: string; // FCM/APNS token for push notifications (optional, for mobile apps)
  platform?: 'ios' | 'android' | 'web';
}

export interface GuardianRegisterRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string; // ISO 8601 format (YYYY-MM-DD)
  email: string;
  password: string;
  contactNumber: string; // 10 digits starting with 9 (Philippine format)
  alternateNumber?: string;
  address?: string;
  occupation?: string;
}

export interface AddStudentRequest {
  studentId?: string;
  studentCode?: string;
  relationship?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  occupation?: string;
  preferredLanguage?: string;
}

export interface GetAttendanceLogsParams {
  studentId?: string;
  limit?: number;
  offset?: number;
  days?: number;
  startDate?: string;
  endDate?: string;
  type?: 'check-in' | 'check-out' | 'all';
}

export interface GetNotificationsParams {
  limit?: number;
  offset?: number;
  type?: 'attendance' | 'announcement' | 'emergency' | 'reminder' | 'all';
  unreadOnly?: boolean;
  studentId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface MarkNotificationsReadRequest {
  notificationIds: string[];
}

// ==================== Response DTOs ====================

export interface AttendanceEventDto {
  timestamp: string;
  gate: string;
  gateId?: string;
  photo?: string;
}

export interface TodayAttendanceDto {
  checkIns: number;
  checkOuts: number;
  totalTime?: string;
  firstCheckIn?: string;
  lastCheckOut?: string;
}

export interface StudentAttendanceStatusDto {
  studentId: string;
  studentName: string;
  studentCode: string;
  status: 'in-school' | 'out-of-school' | 'unknown';
  photoUrl?: string;
  lastCheckIn?: AttendanceEventDto;
  lastCheckOut?: AttendanceEventDto;
  todayAttendance: TodayAttendanceDto;
}

export interface GateInfoDto {
  id: string;
  name: string;
}

export interface AttendanceLogDto {
  id: string;
  studentId: string;
  studentName: string;
  type: 'check-in' | 'check-out';
  timestamp: string;
  gate: GateInfoDto;
  photo?: string;
  deviceId?: string;
  metadata?: Record<string, any>;
}

export interface NotificationDto {
  id: string;
  type: 'attendance' | 'announcement' | 'emergency' | 'reminder' | 'general';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data?: Record<string, any>;
  studentId?: string;
  studentName?: string;
  actionUrl?: string;
  iconType?: string;
}

export interface GradeLevelInfoDto {
  id: number;
  code: string;
  name: string;
  educationLevel: string;
}

export interface SectionInfoDto {
  id: string;
  name: string;
  gradeLevelId: number;
  gradeLevel: GradeLevelInfoDto | null;
  adviserName: string;
  schoolYear: string;
  capacity?: number;
}

export interface FileInfoDto {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
}

export interface StudentInfoDto {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  section?: SectionInfoDto;
  lrn?: string;
  profilePhoto?: FileInfoDto;
  dateRegistered: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  relationship?: string;
  isPrimary?: boolean;
}

export interface StudentPreviewDto {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  studentNumber: string;
  gender?: string;
  dateOfBirth?: string;
  section?: string;
  gradeLevel?: string;
  profilePhoto?: {
    id: number;
    url: string;
    name: string;
  } | null;
}

export interface GuardianProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  occupation?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  lastAppLogin?: string;
  preferredLanguage?: string;
  appVersion?: string;
  notificationPreferences?: Record<string, any>;
  students: StudentInfoDto[];
  activeDevices?: number;
}

export interface GuardianLoginResponse {
  token: string;
  guardian: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  students: StudentInfoDto[];
  permissions?: string[];
}

// ==================== API Client Class ====================

class GuardianPublicApi {
  private readonly basePath = '/api/public/school-guardian';

  /**
   * Login guardian
   */
  async login(data: GuardianLoginRequest): Promise<GuardianLoginResponse> {
    try {
      const response = await apiClient.post<GuardianLoginResponse>(
        `${this.basePath}/auth/login`,
        data
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Login failed: No data returned');
    } catch (error: any) {
      console.error('[GuardianPublicApi] Login error:', error);
      throw {
        code: error.code || 'LOGIN_ERROR',
        message: error.message || 'Unable to login. Please try again.',
        details: error.details,
      };
    }
  }

  /**
   * Register new guardian
   */
  async register(data: GuardianRegisterRequest): Promise<GuardianLoginResponse> {
    try {
      const response = await apiClient.post<GuardianLoginResponse>(
        `${this.basePath}/auth/register`,
        data
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Registration failed: No data returned');
    } catch (error: any) {
      console.error('[GuardianPublicApi] Register error:', error);
      throw {
        code: error.code || 'REGISTER_ERROR',
        message: error.message || 'Unable to register. Please try again.',
        details: error.details,
      };
    }
  }

  /**
   * Logout guardian
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.basePath}/auth/logout`, {});
    } catch (error: any) {
      console.error('[GuardianPublicApi] Logout error:', error);
      // Don't throw on logout error - still clear local storage
    }
  }

  /**
   * Get guardian's students
   */
  async getStudents(): Promise<StudentInfoDto[]> {
    try {
      const response = await apiClient.get<StudentInfoDto[]>(
        `${this.basePath}/students`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error: any) {
      console.error('[GuardianPublicApi] Get students error:', error);
      throw {
        code: error.code || 'GET_STUDENTS_ERROR',
        message: error.message || 'Failed to get students',
        details: error.details,
      };
    }
  }

  /**
   * Preview student information before adding
   */
  async previewStudent(studentId: string): Promise<StudentPreviewDto> {
    try {
      const response = await apiClient.get<StudentPreviewDto>(
        `${this.basePath}/students/preview`,
        { params: { studentId } }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Preview student failed: No data returned');
    } catch (error: any) {
      console.error('[GuardianPublicApi] Preview student error:', error);
      throw {
        code: error.code || 'PREVIEW_STUDENT_ERROR',
        message: error.message || 'Failed to preview student',
        details: error.details,
      };
    }
  }

  /**
   * Add student to guardian account
   */
  async addStudent(data: AddStudentRequest): Promise<StudentInfoDto> {
    try {
      const response = await apiClient.post<StudentInfoDto>(
        `${this.basePath}/students/add`,
        data
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Add student failed: No data returned');
    } catch (error: any) {
      console.error('[GuardianPublicApi] Add student error:', error);
      throw {
        code: error.code || 'ADD_STUDENT_ERROR',
        message: error.message || 'Failed to add student',
        details: error.details,
      };
    }
  }

  /**
   * Remove student from guardian account
   */
  async removeStudent(studentId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.basePath}/students/${studentId}`);
    } catch (error: any) {
      console.error('[GuardianPublicApi] Remove student error:', error);
      throw {
        code: error.code || 'REMOVE_STUDENT_ERROR',
        message: error.message || 'Failed to remove student',
        details: error.details,
      };
    }
  }

  /**
   * Get current attendance status for all students
   */
  async getAttendanceStatus(): Promise<StudentAttendanceStatusDto[]> {
    try {
      const response = await apiClient.get<StudentAttendanceStatusDto[]>(
        `${this.basePath}/attendance/status`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error: any) {
      console.error('[GuardianPublicApi] Get attendance status error:', error);
      throw {
        code: error.code || 'GET_ATTENDANCE_STATUS_ERROR',
        message: error.message || 'Failed to get attendance status',
        details: error.details,
      };
    }
  }

  /**
   * Get attendance logs
   */
  async getAttendanceLogs(params?: GetAttendanceLogsParams): Promise<AttendanceLogDto[]> {
    try {
      const response = await apiClient.get<{ logs: AttendanceLogDto[]; total: number }>(
        `${this.basePath}/attendance/logs`,
        { params }
      );

      if (response.success && response.data) {
        // Backend returns { logs, total } - extract logs array
        return response.data.logs || [];
      }

      return [];
    } catch (error: any) {
      console.error('[GuardianPublicApi] Get attendance logs error:', error);
      throw {
        code: error.code || 'GET_ATTENDANCE_LOGS_ERROR',
        message: error.message || 'Failed to get attendance logs',
        details: error.details,
      };
    }
  }

  /**
   * Get notifications
   */
  async getNotifications(params?: GetNotificationsParams): Promise<NotificationDto[]> {
    try {
      const response = await apiClient.get<{ notifications: NotificationDto[]; total: number; unreadCount: number }>(
        `${this.basePath}/notifications`,
        { params }
      );

      if (response.success && response.data) {
        // Backend returns { notifications, total, unreadCount } - extract notifications array
        return response.data.notifications || [];
      }

      return [];
    } catch (error: any) {
      console.error('[GuardianPublicApi] Get notifications error:', error);
      throw {
        code: error.code || 'GET_NOTIFICATIONS_ERROR',
        message: error.message || 'Failed to get notifications',
        details: error.details,
      };
    }
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsRead(notificationIds: string[]): Promise<void> {
    try {
      await apiClient.post(`${this.basePath}/notifications/read`, {
        notificationIds,
      });
    } catch (error: any) {
      console.error('[GuardianPublicApi] Mark notifications read error:', error);
      throw {
        code: error.code || 'MARK_NOTIFICATIONS_READ_ERROR',
        message: error.message || 'Failed to mark notifications as read',
        details: error.details,
      };
    }
  }

  /**
   * Get guardian profile
   */
  async getProfile(): Promise<GuardianProfileDto> {
    try {
      const response = await apiClient.get<GuardianProfileDto>(
        `${this.basePath}/profile`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Get profile failed: No data returned');
    } catch (error: any) {
      console.error('[GuardianPublicApi] Get profile error:', error);
      throw {
        code: error.code || 'GET_PROFILE_ERROR',
        message: error.message || 'Failed to get profile',
        details: error.details,
      };
    }
  }

  /**
   * Update guardian profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<GuardianProfileDto> {
    try {
      const response = await apiClient.put<GuardianProfileDto>(
        `${this.basePath}/profile`,
        data
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Update profile failed: No data returned');
    } catch (error: any) {
      console.error('[GuardianPublicApi] Update profile error:', error);
      throw {
        code: error.code || 'UPDATE_PROFILE_ERROR',
        message: error.message || 'Failed to update profile',
        details: error.details,
      };
    }
  }
}

// Export singleton instance
export const guardianPublicApi = new GuardianPublicApi();

// API Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Auth Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface GuardianAuthInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  contactNumber: string;
  alternateNumber?: string;
  address?: string;
  occupation?: string;
  lastLogin?: Date;
  students: StudentFullInfo[];
}

export interface StudentBasicInfo {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  grade?: string;
  section?: string;
  relationship: string;
  isPrimary: boolean;
  photoUrl?: string;
}

// Full student information matching backend StudentFullInfoDto
export interface GradeLevelInfo {
  id: number;
  code: string;
  name: string;
  educationLevel: string;
}

export interface SectionInfo {
  id: string;
  name: string;
  gradeLevelId: number;
  gradeLevel: GradeLevelInfo | null;
  adviserName: string;
  schoolYear: string;
  capacity?: number;
}

export interface FileInfo {
  id: string;
  url: string;
  name: string;
  size?: number;
  type?: string;
}

export interface GuardianInfo {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  relationship: string;
}

export interface StudentFullInfo {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  section?: SectionInfo;
  lrn?: string;
  profilePhoto?: FileInfo;
  dateRegistered: string;
  isActive: boolean;
  guardian?: GuardianInfo;
  temporaryGuardianName?: string;
  temporaryGuardianAddress?: string;
  temporaryGuardianContactNumber?: string;
  createdAt: string;
  updatedAt: string;
  relationship?: string;
  isPrimary?: boolean;
}

export interface CompanyInfo {
  id: number;
  name: string;
  logo?: string;
}

// Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  deviceInfo?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  email: string;
  password: string;
  contactNumber: string;
  alternateNumber?: string;
  address?: string;
  occupation?: string;
  deviceId?: string;
}

export interface GuardianAuthResponse {
  guardian: GuardianAuthInfo;
  tokens: AuthTokens;
  company: CompanyInfo;
}

// Profile Types
export interface GuardianProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  contactNumber: string;
  alternateNumber?: string;
  address?: string;
  occupation?: string;
  deviceTokens: string[];
  preferredLanguage: string;
  notificationPreferences?: NotificationPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  attendance: boolean;
  payment: boolean;
  announcement: boolean;
  emergency: boolean;
  general: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
}

// Notification Types
export interface GuardianNotification {
  id: string;
  type: 'attendance' | 'payment' | 'announcement' | 'emergency' | 'general';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  data?: any;
  readAt?: string;
  createdAt: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Common Response Format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

// Attendance Types
export interface StudentStatusDto {
  studentId: string;
  studentName: string;
  studentNumber: string;
  currentStatus: 'in_school' | 'out_of_school' | 'no_attendance';
  lastAction?: {
    type: 'check_in' | 'check_out';
    timestamp: string;
    location?: string;
  };
}

export interface AttendanceLogDto {
  id: string;
  studentId: string;
  studentName: string;
  action: 'check_in' | 'check_out';
  timestamp: string;
  formattedDate: string;
  formattedTime: string;
  location?: string;
  deviceId?: string;
}
export interface GuardianAuthResponse {
  guardian: GuardianInfo;
  tokens: AuthTokens;
  company: CompanyInfo;
}

export interface GuardianInfo {
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
  students: StudentInfo[];
}

export interface StudentInfo {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  grade?: string;
  section?: string;
  relationship: string;
  isPrimary: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface CompanyInfo {
  id: number;
  name: string;
  logo?: string;
}

export interface GuardianProfileResponse {
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

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  action: 'check_in' | 'check_out';
  timestamp: string;
  location?: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  data?: any;
  readAt?: string;
  createdAt: string;
}

export interface BillingSummary {
  totalBalance: number;
  totalPaid: number;
  totalPending: number;
  overdueAmount: number;
  nextDueDate?: string;
  students: StudentBilling[];
}

export interface StudentBilling {
  studentId: string;
  studentName: string;
  balance: number;
  pendingBills: number;
  overdueBills: number;
}

export interface Bill {
  id: string;
  studentId: string;
  studentName: string;
  description: string;
  amount: number;
  balance: number;
  dueDate: string;
  status: string;
  type: string;
  billingPeriod: string;
  schoolYear: string;
  gradingPeriod: string;
}

export interface PaymentProof {
  id: string;
  billId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  status: string;
  trackingNumber: string;
  submittedAt: string;
}

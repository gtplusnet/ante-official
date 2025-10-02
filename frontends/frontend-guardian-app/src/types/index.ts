// User and Authentication Types
export interface Guardian {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

// Student Types
export interface Student {
  id: string;
  name: string;
  grade?: string;
  section?: string;
  photoUrl?: string;
  status: 'active' | 'inactive';
  currentStatus: 'in_school' | 'out_of_school';
  guardianId: string;
}

// Attendance Types
export interface AttendanceLog {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: Date;
  type: 'entry' | 'exit';
  location?: string;
}

// Notification Types
export type NotificationType = 'attendance' | 'payment' | 'emergency' | 'general' | 'announcement';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  studentId?: string;
  studentName?: string;
  actionUrl?: string;
  actionText?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Payment Types
export interface PaymentAdvisory {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  dueDate: Date;
  description: string;
  status: 'pending' | 'paid' | 'overdue';
}

// Billing Types
export interface Bill {
  id: string;
  studentId: string;
  studentName: string;
  schoolYear: string; // "S.Y. 2025-2026"
  gradingPeriod: string; // "1st Quarter", "2nd Quarter", etc.
  type: 'tuition' | 'miscellaneous' | 'books' | 'activities' | 'other';
  description: string;
  amount: number;
  dueDate: Date;
  billingPeriod: string; // e.g., "Q1 2025", "July 2025"
  status: 'pending' | 'paid' | 'overdue' | 'partial' | 'processing';
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillBreakdown {
  billId: string;
  // Basic Fees
  tuitionFee: number;
  miscellaneousFee: number;
  
  // Technology & Learning
  computerLaboratoryFee?: number;
  internetFee?: number;
  learningManagementSystemFee?: number;
  
  // Facilities
  energyFee?: number;
  facilitiesUsageFee?: number;
  
  // Academic Materials
  books?: {
    description: string;
    amount: number;
  }[];
  schoolSupplies?: number;
  uniformSets?: {
    description: string;
    quantity: number;
    amount: number;
  }[];
  
  // Activities & Programs
  athleticsFee?: number;
  studentActivitiesFee?: number;
  fieldTrips?: {
    description: string;
    date: Date;
    amount: number;
  }[];
  
  // Other Fees
  idCardFee?: number;
  insuranceFee?: number;
  ptaContribution?: number;
  yearbook?: number;
  
  // Totals
  subtotal: number;
  discounts?: {
    description: string;
    amount: number;
  }[];
  totalAmount: number;
}

// Payment Proof Types
export type PaymentMethod = 
  | 'bank_deposit'
  | 'online_banking'
  | 'gcash'
  | 'maya'
  | 'over_the_counter'
  | 'check'
  | 'cash'
  | 'credit_card'
  | 'debit_card';

export interface PaymentProof {
  id: string;
  billId: string;
  studentId: string;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  referenceNumber: string;
  amountPaid: number;
  paymentChannel: string; // Bank name or payment service
  proofUrls: string[]; // Array of uploaded file URLs
  notes?: string;
  status: 'pending' | 'verified' | 'rejected' | 'needs_clarification';
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  submittedAt: Date;
  submittedBy: string;
  trackingNumber: string;
}

export interface PaymentHistory {
  id: string;
  billId: string;
  paymentProofId: string;
  amount: number;
  paymentDate: Date;
  verifiedDate?: Date;
  method: PaymentMethod;
  referenceNumber: string;
}

// Navigation Types
export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

// Filter Types
export interface DateFilter {
  from: Date | null;
  to: Date | null;
}

// Pagination Types
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}
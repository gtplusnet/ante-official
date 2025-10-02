import { Guardian, Student, AttendanceLog, Notification, PaymentAdvisory, Bill, BillBreakdown, PaymentProof, PaymentHistory } from '@/types';

// Mock Guardian Data
export const mockGuardian: Guardian = {
  id: '1',
  name: 'Ms. Dela Cruz',
  email: 'dela.cruz@example.com',
  photoUrl: '/images/guardian-1.jpg',
};

// Mock Students Data
export const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Juan Dela Cruz',
    grade: 'Grade 6',
    section: 'St. Joseph',
    photoUrl: '/images/student-1.jpg',
    status: 'active',
    currentStatus: 'in_school',
    guardianId: '1',
  },
  {
    id: '2',
    name: 'Maria Dela Cruz',
    grade: 'Grade 4',
    section: 'St. Mary',
    photoUrl: '/images/student-2.jpg',
    status: 'active',
    currentStatus: 'out_of_school',
    guardianId: '1',
  },
  {
    id: '3',
    name: 'Pedro Dela Cruz',
    grade: 'Grade 2',
    section: 'St. Peter',
    photoUrl: '/images/student-3.jpg',
    status: 'inactive',
    currentStatus: 'out_of_school',
    guardianId: '1',
  },
];

// Mock Attendance Logs
export const mockAttendanceLogs: AttendanceLog[] = [
  {
    id: '1',
    studentId: '1',
    studentName: 'Juan Dela Cruz',
    timestamp: new Date('2025-07-01T08:05:00'),
    type: 'entry',
    location: 'Main Gate',
  },
  {
    id: '2',
    studentId: '2',
    studentName: 'Maria Dela Cruz',
    timestamp: new Date('2025-07-01T08:05:00'),
    type: 'entry',
    location: 'Main Gate',
  },
  {
    id: '3',
    studentId: '1',
    studentName: 'Juan Dela Cruz',
    timestamp: new Date('2025-06-30T16:30:00'),
    type: 'exit',
    location: 'Main Gate',
  },
  {
    id: '4',
    studentId: '2',
    studentName: 'Maria Dela Cruz',
    timestamp: new Date('2025-06-30T16:30:00'),
    type: 'exit',
    location: 'Main Gate',
  },
  {
    id: '5',
    studentId: '1',
    studentName: 'Juan Dela Cruz',
    timestamp: new Date('2025-06-30T08:00:00'),
    type: 'entry',
    location: 'Main Gate',
  },
  {
    id: '6',
    studentId: '2',
    studentName: 'Maria Dela Cruz',
    timestamp: new Date('2025-06-30T08:00:00'),
    type: 'entry',
    location: 'Main Gate',
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'payment',
    title: 'Payment Advisory',
    message: "Today's the due date for Aaron James Dela Cruz's school fee. Don't forget to settle it. Tap to pay now.",
    timestamp: new Date('2025-07-01T09:00:00'),
    read: false,
    studentId: '1',
    studentName: 'Aaron James Dela Cruz',
    actionUrl: '/tuition',
    actionText: 'Tap to pay now',
    priority: 'high',
  },
  {
    id: '2',
    type: 'attendance',
    title: 'Student Name has entered the school premises',
    message: 'If this was unexpected, please contact the school immediately. Thank you.',
    timestamp: new Date('2025-07-01T08:05:00'),
    read: false,
    studentId: '1',
    studentName: 'Student Name',
    priority: 'medium',
  },
  {
    id: '3',
    type: 'attendance',
    title: 'Student Name has left the school premises',
    message: 'If this was unexpected, please contact the school immediately. Thank you.',
    timestamp: new Date('2025-07-01T16:30:00'),
    read: true,
    studentId: '2',
    studentName: 'Student Name',
    priority: 'medium',
  },
  {
    id: '4',
    type: 'attendance',
    title: 'Student Name has entered the school premises',
    message: 'If this was unexpected, please contact the school immediately. Thank you.',
    timestamp: new Date('2025-07-01T08:00:00'),
    read: true,
    studentId: '1',
    studentName: 'Student Name',
    priority: 'medium',
  },
  {
    id: '5',
    type: 'attendance',
    title: 'Student Name has left the school premises',
    message: 'If this was unexpected, please contact the school immediately. Thank you.',
    timestamp: new Date('2025-06-30T16:35:00'),
    read: true,
    studentId: '2',
    studentName: 'Student Name',
    priority: 'medium',
  },
];

// Mock Payment Advisories
export const mockPaymentAdvisories: PaymentAdvisory[] = [
  {
    id: '1',
    studentId: '1',
    studentName: 'Juan Dela Cruz',
    amount: 15000,
    dueDate: new Date('2025-07-01'),
    description: 'Tuition Fee - July 2025',
    status: 'pending',
  },
  {
    id: '2',
    studentId: '2',
    studentName: 'Maria Dela Cruz',
    amount: 12000,
    dueDate: new Date('2025-07-05'),
    description: 'Tuition Fee - July 2025',
    status: 'pending',
  },
  {
    id: '3',
    studentId: '1',
    studentName: 'Juan Dela Cruz',
    amount: 15000,
    dueDate: new Date('2025-06-01'),
    description: 'Tuition Fee - June 2025',
    status: 'paid',
  },
];

// Helper functions to get filtered data
export const getRecentAttendanceLogs = (limit: number = 5): AttendanceLog[] => {
  return mockAttendanceLogs
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
};

export const getUnreadNotifications = (): Notification[] => {
  return mockNotifications.filter(n => !n.read);
};

export const getStudentsByStatus = (status: 'in_school' | 'out_of_school'): Student[] => {
  return mockStudents.filter(s => s.currentStatus === status && s.status === 'active');
};

export const getAttendanceLogsByDateRange = (from: Date, to: Date): AttendanceLog[] => {
  return mockAttendanceLogs.filter(log => 
    log.timestamp >= from && log.timestamp <= to
  );
};

// Mock Bills Data
export const mockBills: Bill[] = [
  // Juan Dela Cruz - Grade 6
  {
    id: 'bill-1',
    studentId: '1',
    studentName: 'Juan Dela Cruz',
    schoolYear: 'S.Y. 2025-2026',
    gradingPeriod: '1st Quarter',
    type: 'tuition',
    description: 'Tuition Fee - 1st Quarter',
    amount: 15000,
    dueDate: new Date('2025-07-15'),
    billingPeriod: 'Q1 2025',
    status: 'pending',
    balance: 15000,
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2025-06-01'),
  },
  {
    id: 'bill-2',
    studentId: '1',
    studentName: 'Juan Dela Cruz',
    schoolYear: 'S.Y. 2025-2026',
    gradingPeriod: '1st Quarter',
    type: 'miscellaneous',
    description: 'Miscellaneous Fees',
    amount: 3500,
    dueDate: new Date('2025-07-15'),
    billingPeriod: 'Q1 2025',
    status: 'pending',
    balance: 3500,
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2025-06-01'),
  },
  {
    id: 'bill-3',
    studentId: '1',
    studentName: 'Juan Dela Cruz',
    schoolYear: 'S.Y. 2025-2026',
    gradingPeriod: 'Annual',
    type: 'books',
    description: 'Textbooks and Learning Materials',
    amount: 5800,
    dueDate: new Date('2025-06-30'),
    billingPeriod: 'Annual',
    status: 'paid',
    balance: 0,
    createdAt: new Date('2025-05-15'),
    updatedAt: new Date('2025-06-20'),
  },
  // Maria Dela Cruz - Grade 4
  {
    id: 'bill-4',
    studentId: '2',
    studentName: 'Maria Dela Cruz',
    schoolYear: 'S.Y. 2025-2026',
    gradingPeriod: '1st Quarter',
    type: 'tuition',
    description: 'Tuition Fee - 1st Quarter',
    amount: 13500,
    dueDate: new Date('2025-07-15'),
    billingPeriod: 'Q1 2025',
    status: 'partial',
    balance: 5000,
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2025-07-01'),
  },
  {
    id: 'bill-5',
    studentId: '2',
    studentName: 'Maria Dela Cruz',
    schoolYear: 'S.Y. 2025-2026',
    gradingPeriod: '1st Quarter',
    type: 'activities',
    description: 'Field Trip - Science Museum',
    amount: 1200,
    dueDate: new Date('2025-07-20'),
    billingPeriod: 'July 2025',
    status: 'pending',
    balance: 1200,
    createdAt: new Date('2025-07-01'),
    updatedAt: new Date('2025-07-01'),
  },
  // Pedro Dela Cruz - Grade 2 (Inactive student example)
  {
    id: 'bill-6',
    studentId: '3',
    studentName: 'Pedro Dela Cruz',
    schoolYear: 'S.Y. 2025-2026',
    gradingPeriod: '1st Quarter',
    type: 'tuition',
    description: 'Tuition Fee - 1st Quarter',
    amount: 12000,
    dueDate: new Date('2025-06-30'),
    billingPeriod: 'Q1 2025',
    status: 'overdue',
    balance: 12000,
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2025-07-01'),
  },
];

// Mock Bill Breakdowns
export const mockBillBreakdowns: Record<string, BillBreakdown> = {
  'bill-1': {
    billId: 'bill-1',
    tuitionFee: 12000,
    miscellaneousFee: 0,
    computerLaboratoryFee: 1500,
    learningManagementSystemFee: 500,
    energyFee: 800,
    facilitiesUsageFee: 200,
    subtotal: 15000,
    totalAmount: 15000,
  },
  'bill-2': {
    billId: 'bill-2',
    tuitionFee: 0,
    miscellaneousFee: 2000,
    idCardFee: 150,
    insuranceFee: 350,
    ptaContribution: 500,
    athleticsFee: 500,
    subtotal: 3500,
    totalAmount: 3500,
  },
  'bill-3': {
    billId: 'bill-3',
    tuitionFee: 0,
    miscellaneousFee: 0,
    books: [
      { description: 'Mathematics Grade 6', amount: 850 },
      { description: 'Science Grade 6', amount: 920 },
      { description: 'English Grade 6', amount: 780 },
      { description: 'Filipino Grade 6', amount: 650 },
      { description: 'Social Studies Grade 6', amount: 720 },
      { description: 'Values Education Grade 6', amount: 480 },
      { description: 'Computer Education Grade 6', amount: 680 },
    ],
    schoolSupplies: 720,
    subtotal: 5800,
    totalAmount: 5800,
  },
};

// Mock Payment Proofs
export const mockPaymentProofs: PaymentProof[] = [
  {
    id: 'proof-1',
    billId: 'bill-3',
    studentId: '1',
    paymentMethod: 'bank_deposit',
    paymentDate: new Date('2025-06-20'),
    referenceNumber: 'BDO-2025062012345',
    amountPaid: 5800,
    paymentChannel: 'BDO - SM Santa Maria Branch',
    proofUrls: ['/mock-receipts/deposit-slip-1.jpg'],
    status: 'verified',
    verifiedBy: 'Finance Office',
    verifiedAt: new Date('2025-06-21'),
    submittedAt: new Date('2025-06-20T14:30:00'),
    submittedBy: 'Maria Dela Cruz',
    trackingNumber: 'PAY-20250620-001',
  },
  {
    id: 'proof-2',
    billId: 'bill-4',
    studentId: '2',
    paymentMethod: 'gcash',
    paymentDate: new Date('2025-07-01'),
    referenceNumber: '1234567890123',
    amountPaid: 8500,
    paymentChannel: 'GCash',
    proofUrls: ['/mock-receipts/gcash-screenshot-1.jpg'],
    notes: 'Partial payment for 1st Quarter tuition',
    status: 'verified',
    verifiedBy: 'Finance Office',
    verifiedAt: new Date('2025-07-02'),
    submittedAt: new Date('2025-07-01T09:15:00'),
    submittedBy: 'Maria Dela Cruz',
    trackingNumber: 'PAY-20250701-002',
  },
  {
    id: 'proof-3',
    billId: 'bill-1',
    studentId: '1',
    paymentMethod: 'online_banking',
    paymentDate: new Date('2025-07-05'),
    referenceNumber: 'BPI-ONL-2025070598765',
    amountPaid: 15000,
    paymentChannel: 'BPI Online',
    proofUrls: ['/mock-receipts/online-transfer-1.jpg'],
    status: 'pending',
    submittedAt: new Date('2025-07-05T16:45:00'),
    submittedBy: 'Maria Dela Cruz',
    trackingNumber: 'PAY-20250705-003',
  },
];

// Mock Payment History
export const mockPaymentHistory: PaymentHistory[] = [
  {
    id: 'history-1',
    billId: 'bill-3',
    paymentProofId: 'proof-1',
    amount: 5800,
    paymentDate: new Date('2025-06-20'),
    verifiedDate: new Date('2025-06-21'),
    method: 'bank_deposit',
    referenceNumber: 'BDO-2025062012345',
  },
  {
    id: 'history-2',
    billId: 'bill-4',
    paymentProofId: 'proof-2',
    amount: 8500,
    paymentDate: new Date('2025-07-01'),
    verifiedDate: new Date('2025-07-02'),
    method: 'gcash',
    referenceNumber: '1234567890123',
  },
];

// Helper functions for bills
export const getBillsByStudent = (studentId: string): Bill[] => {
  return mockBills.filter(bill => bill.studentId === studentId);
};

export const getPendingBills = (): Bill[] => {
  return mockBills.filter(bill => bill.status === 'pending' || bill.status === 'partial');
};

export const getOverdueBills = (): Bill[] => {
  return mockBills.filter(bill => bill.status === 'overdue');
};

export const getTotalBalance = (studentId?: string): number => {
  const bills = studentId ? getBillsByStudent(studentId) : mockBills;
  return bills.reduce((total, bill) => total + bill.balance, 0);
};

export const getPaymentProofsByBill = (billId: string): PaymentProof[] => {
  return mockPaymentProofs.filter(proof => proof.billId === billId);
};

export const getPaymentHistoryByStudent = (studentId: string): PaymentHistory[] => {
  const studentBillIds = mockBills
    .filter(bill => bill.studentId === studentId)
    .map(bill => bill.id);
  
  return mockPaymentHistory.filter(history => 
    studentBillIds.includes(history.billId)
  );
};
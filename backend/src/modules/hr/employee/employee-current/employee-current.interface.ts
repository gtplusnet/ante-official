export interface EmploymentDetailsResponse {
  employeeCode: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth?: string;
    civilStatus?: string;
    gender?: string;
  };
  contactInfo: {
    email: string;
    contactNumber?: string;
    address?: string;
  };
  workAssignment: {
    department?: string;
    position?: string;
    branch?: string;
    employmentStatus?: string;
    dateHired?: Date;
  };
}

export interface JobDetailsResponse {
  bankingInfo: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  salaryInfo: {
    basicSalary?: number;
    salaryGrade?: string;
    payrollGroup?: string;
    paymentMethod?: string;
  };
  employmentInfo: {
    employmentType?: string;
    jobTitle?: string;
    jobLevel?: string;
    reportingTo?: string;
  };
}

export interface ShiftDetailsResponse {
  currentShift: {
    shiftName?: string;
    startTime?: string;
    endTime?: string;
    breakDuration?: number;
  };
  weeklySchedule: Array<{
    day: string;
    startTime?: string;
    endTime?: string;
    isRestDay: boolean;
  }>;
  scheduleAssignment?: {
    effectiveDate?: Date;
    scheduleType?: string;
  };
}

export interface AllowancesResponse {
  allowances: Array<{
    id: number;
    name: string;
    amount: number;
    frequency: string;
    status: string;
    effectiveDate?: Date;
    endDate?: Date;
  }>;
  totalMonthlyAllowance: number;
}

export interface DocumentsResponse {
  documents: Array<{
    id: number;
    documentName: string;
    documentType: string;
    uploadDate: Date;
    fileUrl?: string;
    fileSize?: number;
    status: string;
  }>;
  totalDocuments: number;
}

export interface ContractDetailsResponse {
  currentContract: {
    contractNumber?: string;
    contractType?: string;
    startDate?: Date;
    endDate?: Date;
    status: string;
    terms?: string;
  };
  contractHistory: Array<{
    contractNumber: string;
    type: string;
    startDate: Date;
    endDate?: Date;
    status: string;
  }>;
}

export interface GovernmentIdsResponse {
  tin?: string;
  sss?: string;
  hdmf?: string;
  phic?: string;
  otherIds?: Array<{
    type: string;
    number: string;
  }>;
}

export interface LeavesResponse {
  leaveBalances: Array<{
    leaveType: string;
    totalDays: number;
    usedDays: number;
    remainingDays: number;
    expiryDate?: Date;
  }>;
  leaveHistory: Array<{
    id: number;
    leaveType: string;
    startDate: Date;
    endDate: Date;
    days: number;
    status: string;
    reason?: string;
  }>;
}

export interface DeductionsResponse {
  regularDeductions: Array<{
    id: number;
    name: string;
    amount: number;
    frequency: string;
    status: string;
  }>;
  loans: Array<{
    id: number;
    loanType: string;
    principalAmount: number;
    remainingBalance: number;
    monthlyAmortization: number;
    startDate: Date;
    endDate?: Date;
    status: string;
  }>;
  totalMonthlyDeduction: number;
}

export interface TimesheetResponse {
  currentPeriod: {
    startDate: Date;
    endDate: Date;
    totalHours: number;
    overtimeHours: number;
    lateMinutes: number;
    undertime: number;
  };
  recentLogs: Array<{
    date: Date;
    timeIn?: string;
    timeOut?: string;
    breakIn?: string;
    breakOut?: string;
    totalHours: number;
    status: string;
  }>;
  attendanceSummary: {
    present: number;
    absent: number;
    late: number;
    onLeave: number;
  };
}
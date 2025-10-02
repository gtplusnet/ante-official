// Local definitions for Prisma enums to replace @prisma/client imports
// This file contains only the enum types needed by the frontend

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  PROJECT = 'PROJECT',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum DeductionType {
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  PERCENTAGE = 'PERCENTAGE',
  VARIABLE = 'VARIABLE'
}

export enum EmailProtocol {
  SMTP = 'SMTP',
  IMAP = 'IMAP',
  POP3 = 'POP3'
}

export enum EmailProvider {
  GMAIL = 'GMAIL',
  OUTLOOK = 'OUTLOOK',
  YAHOO = 'YAHOO',
  CUSTOM = 'CUSTOM'
}

export enum BillOfQuantityStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FINALIZED = 'FINALIZED'
}

export enum CutoffType {
  MONTHLY = 'MONTHLY',
  SEMI_MONTHLY = 'SEMI_MONTHLY',
  SEMIMONTHLY = 'SEMIMONTHLY',
  WEEKLY = 'WEEKLY',
  DAILY = 'DAILY'
}

export enum EducationLevel {
  ELEMENTARY = 'ELEMENTARY',
  JUNIOR_HIGH_SCHOOL = 'JUNIOR_HIGH_SCHOOL',
  SENIOR_HIGH_SCHOOL = 'SENIOR_HIGH_SCHOOL',
  COLLEGE = 'COLLEGE',
  VOCATIONAL = 'VOCATIONAL',
  GRADUATE = 'GRADUATE'
}

export enum ScopeList {
  ADMIN = 'ADMIN',
  HR = 'HR',
  ACCOUNTING = 'ACCOUNTING',
  INVENTORY = 'INVENTORY',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  MANPOWER_TIME_KEEPING_ACCESS_ALL = 'MANPOWER_TIME_KEEPING_ACCESS_ALL'
}

export enum SystemModule {
  DASHBOARD = 'DASHBOARD',
  HR = 'HR',
  ACCOUNTING = 'ACCOUNTING',
  INVENTORY = 'INVENTORY',
  PROJECTS = 'PROJECTS',
  SETTINGS = 'SETTINGS'
}

export enum ShiftType {
  REGULAR = 'REGULAR',
  NIGHT = 'NIGHT',
  SPLIT = 'SPLIT',
  FLEXIBLE = 'FLEXIBLE',
  REST_DAY = 'REST_DAY'
}

export enum SalaryRateType {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
  PROJECT_BASED = 'PROJECT_BASED',
  DAILY_RATE = 'DAILY_RATE',
  MONTHLY_RATE = 'MONTHLY_RATE',
  FIXED_RATE = 'FIXED_RATE'
}

export enum DeductionPeriod {
  MONTHLY = 'MONTHLY',
  SEMI_MONTHLY = 'SEMI_MONTHLY',
  WEEKLY = 'WEEKLY',
  DAILY = 'DAILY',
  ONE_TIME = 'ONE_TIME',
  FIRST_PERIOD = 'FIRST_PERIOD',
  LAST_PERIOD = 'LAST_PERIOD'
}

export enum DeductionTargetBasis {
  GROSS_PAY = 'GROSS_PAY',
  BASIC_PAY = 'BASIC_PAY',
  NET_PAY = 'NET_PAY'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum BoqType {
  MATERIAL = 'MATERIAL',
  LABOR = 'LABOR',
  EQUIPMENT = 'EQUIPMENT',
  OVERHEAD = 'OVERHEAD'
}

export enum AllowanceType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
  VARIABLE = 'VARIABLE'
}

export enum TaxBasis {
  GROSS = 'GROSS',
  NET = 'NET',
  BASIC = 'BASIC'
}

export enum LocationRegion {
  REGION_I = 'REGION_I',
  REGION_II = 'REGION_II',
  REGION_III = 'REGION_III',
  REGION_IV_A = 'REGION_IV_A',
  REGION_IV_B = 'REGION_IV_B',
  REGION_V = 'REGION_V',
  REGION_VI = 'REGION_VI',
  REGION_VII = 'REGION_VII',
  REGION_VIII = 'REGION_VIII',
  REGION_IX = 'REGION_IX',
  REGION_X = 'REGION_X',
  REGION_XI = 'REGION_XI',
  REGION_XII = 'REGION_XII',
  NCR = 'NCR',
  CAR = 'CAR',
  BARMM = 'BARMM',
  CARAGA = 'CARAGA'
}

export enum LocationProvince {
  // This would be a very long list, keeping it simplified for now
  METRO_MANILA = 'METRO_MANILA',
  CEBU = 'CEBU',
  DAVAO = 'DAVAO'
}

export enum LocationMunicipality {
  // This would be a very long list, keeping it simplified for now  
  QUEZON_CITY = 'QUEZON_CITY',
  MANILA = 'MANILA',
  CEBU_CITY = 'CEBU_CITY'
}

export enum LocationBarangay {
  // This would be a very long list, keeping it simplified for now
  BARANGAY_1 = 'BARANGAY_1',
  BARANGAY_2 = 'BARANGAY_2'
}

export enum FileType {
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  SPREADSHEET = 'SPREADSHEET',
  PDF = 'PDF',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  ARCHIVE = 'ARCHIVE',
  OTHER = 'OTHER'
}

export enum HolidayType {
  REGULAR = 'REGULAR',
  SPECIAL = 'SPECIAL',
  LOCAL = 'LOCAL',
  COMPANY = 'COMPANY'
}

export enum QueueLogStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum QueueStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED'
}

export enum QueueType {
  EMAIL = 'EMAIL',
  NOTIFICATION = 'NOTIFICATION',
  REPORT = 'REPORT',
  BACKUP = 'BACKUP',
  SYNC = 'SYNC'
}

export enum BreakdownType {
  REGULAR = 'REGULAR',
  OVERTIME = 'OVERTIME',
  HOLIDAY = 'HOLIDAY',
  NIGHT_DIFFERENTIAL = 'NIGHT_DIFFERENTIAL'
}

export enum ActiveShiftType {
  DAY = 'DAY',
  NIGHT = 'NIGHT',
  SWING = 'SWING',
  GRAVEYARD = 'GRAVEYARD'
}

export enum TimekeepingSource {
  BIOMETRIC = 'BIOMETRIC',
  MANUAL = 'MANUAL',
  MOBILE = 'MOBILE',
  WEB = 'WEB'
}

export enum CutoffPeriodType {
  MONTHLY = 'MONTHLY',
  SEMI_MONTHLY = 'SEMI_MONTHLY',
  WEEKLY = 'WEEKLY',
  FIRST_PERIOD = 'FIRST_PERIOD',
  MIDDLE_PERIOD = 'MIDDLE_PERIOD',
  LAST_PERIOD = 'LAST_PERIOD'
}

export enum CutoffDateRangeStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  LOCKED = 'LOCKED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  PROCESSED = 'PROCESSED',
  APPROVED = 'APPROVED',
  POSTED = 'POSTED'
}

export enum EmploymentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TERMINATED = 'TERMINATED',
  RESIGNED = 'RESIGNED',
  SUSPENDED = 'SUSPENDED'
}

export enum DeductionCategory {
  MANDATORY = 'MANDATORY',
  VOLUNTARY = 'VOLUNTARY',
  LOAN = 'LOAN',
  ADJUSTMENT = 'ADJUSTMENT',
  DEDUCTION = 'DEDUCTION'
}

export enum PayrollFilingType {
  OVERTIME = 'OVERTIME',
  LEAVE = 'LEAVE',
  ADJUSTMENT = 'ADJUSTMENT',
  ATTENDANCE = 'ATTENDANCE'
}

export enum WinProbability {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

export enum FundTransactionCode {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND'
}
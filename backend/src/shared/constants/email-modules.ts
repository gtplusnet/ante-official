export const EMAIL_MODULES = {
  PAYROLL: 'PAYROLL',
  HR_FILING: 'HR_FILING',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  SYSTEM: 'SYSTEM',
  USER_MANAGEMENT: 'USER_MANAGEMENT',
  NOTIFICATIONS: 'NOTIFICATIONS',
  APPROVAL: 'APPROVAL',
} as const;

export const EMAIL_MODULE_LABELS: Record<string, string> = {
  PAYROLL: 'Payroll',
  HR_FILING: 'HR Filing',
  PURCHASE_ORDER: 'Purchase Order',
  SYSTEM: 'System',
  USER_MANAGEMENT: 'User Management',
  NOTIFICATIONS: 'Notifications',
  APPROVAL: 'Approval',
};

export const EMAIL_MODULE_CONTEXTS = {
  APPROVAL_REQUEST: 'APPROVAL_REQUEST',
  NOTIFICATION: 'NOTIFICATION',
  REMINDER: 'REMINDER',
  ALERT: 'ALERT',
  REPORT: 'REPORT',
  CONFIRMATION: 'CONFIRMATION',
} as const;

export const EMAIL_STATUS = {
  SENT: 'SENT',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
} as const;

export type EmailModule = (typeof EMAIL_MODULES)[keyof typeof EMAIL_MODULES];
export type EmailModuleContext =
  (typeof EMAIL_MODULE_CONTEXTS)[keyof typeof EMAIL_MODULE_CONTEXTS];
export type EmailStatus = (typeof EMAIL_STATUS)[keyof typeof EMAIL_STATUS];

import { ShowDialogModules } from '../interfaces/showDialogModules.interface';

export default {
  TASK_CREATED: {
    key: 'TASK_CREATED',
    message: 'created a task',
    showDialogModule: ShowDialogModules.TASK,
  },
  TASK_ASSIGNED: {
    key: 'TASK_ASSIGNED',
    message: 'assigned a task to you',
    showDialogModule: ShowDialogModules.TASK,
  },
  TASK_MOVED: {
    key: 'TASK_MOVED',
    message: 'moved a task',
    showDialogModule: ShowDialogModules.TASK,
  },
  DISCUSSION_MENTION: {
    key: 'DISCUSSION_MENTION',
    message: 'mentioned you in a discussion',
    showDialogModule: ShowDialogModules.DISCUSSION,
  },
  DISCUSSION_REPLY: {
    key: 'DISCUSSION_REPLY',
    message: 'replied to a discussion',
    showDialogModule: ShowDialogModules.DISCUSSION,
  },
  DISCUSSION_UPDATE: {
    key: 'DISCUSSION_UPDATE',
    message: 'updated a discussion',
    showDialogModule: ShowDialogModules.DISCUSSION,
  },
  DISCUSSION_MESSAGE: {
    key: 'DISCUSSION_MESSAGE',
    message: 'sent a message in a discussion',
    showDialogModule: ShowDialogModules.DISCUSSION,
  },
  FILING_APPROVAL_PENDING: {
    key: 'FILING_APPROVAL_PENDING',
    message: 'sent you a filing approval request',
    showDialogModule: ShowDialogModules.FILING_APPROVAL,
  },
  FILING_APPROVAL_APPROVED: {
    key: 'FILING_APPROVAL_APPROVED',
    message: 'approved your filing request',
    showDialogModule: ShowDialogModules.FILING_APPROVAL,
  },
  FILING_APPROVAL_REJECTED: {
    key: 'FILING_APPROVAL_REJECTED',
    message: 'rejected your filing request',
    showDialogModule: ShowDialogModules.FILING_APPROVAL,
  },
  FILING_APPROVAL_INFO_REQUESTED: {
    key: 'FILING_APPROVAL_INFO_REQUESTED',
    message: 'requested additional information for your filing',
    showDialogModule: ShowDialogModules.FILING_APPROVAL,
  },
  FILING_APPROVAL_CANCELLED: {
    key: 'FILING_APPROVAL_CANCELLED',
    message: 'cancelled their filing request',
    showDialogModule: ShowDialogModules.FILING_APPROVAL,
  },
  PAYROLL_APPROVAL_REQUIRED: {
    key: 'PAYROLL_APPROVAL_REQUIRED',
    message: 'requires your approval for payroll',
    showDialogModule: ShowDialogModules.PAYROLL_APPROVAL,
  },
  PAYROLL_APPROVED: {
    key: 'PAYROLL_APPROVED',
    message: 'approved the payroll',
    showDialogModule: ShowDialogModules.PAYROLL_APPROVAL,
  },
  PAYROLL_REJECTED: {
    key: 'PAYROLL_REJECTED',
    message: 'rejected the payroll',
    showDialogModule: ShowDialogModules.PAYROLL_APPROVAL,
  },
  PAYROLL_MANUAL_OVERRIDE: {
    key: 'PAYROLL_MANUAL_OVERRIDE',
    message: 'manually overrode your payroll approval task',
    showDialogModule: ShowDialogModules.PAYROLL_APPROVAL,
  },
};

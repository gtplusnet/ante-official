import { WorkflowDialogOption } from './purchase-request-dialogs.reference';

export const commonDialogs: WorkflowDialogOption[] = [
  {
    type: 'default_approval',
    name: 'Default Approval Dialog',
    description: 'Default approval dialog with remarks and attachments',
    isCommon: true,
    supportsRejection: true,
    rejectionConfig: {
      requireComment: true,
      showFallbackStage: true,
    },
    configSchema: {
      requireComment: { type: 'boolean', default: false },
      allowAttachments: { type: 'boolean', default: true },
      approvalLevels: { type: 'number', default: 1 },
      timeoutDays: { type: 'number', default: 7 },
      enableReminders: { type: 'boolean', default: true },
    },
  },
  {
    type: 'reason_dialog',
    name: 'Reason Dialog',
    description: 'Dialog for entering a reason for an action',
    isCommon: true,
    supportsRejection: false,
    configSchema: {
      showDetails: { type: 'boolean', default: true },
      requireComment: { type: 'boolean', default: false },
      customMessage: { type: 'string', default: '' },
    },
  },
  {
    type: 'attach_file_dialog',
    name: 'Attach File Dialog',
    description: 'Dialog for attaching files to a request',
    isCommon: true,
    supportsRejection: false,
    configSchema: {
      showDetails: { type: 'boolean', default: true },
      requireComment: { type: 'boolean', default: false },
      customMessage: { type: 'string', default: '' },
    },
  },
];

export default commonDialogs;

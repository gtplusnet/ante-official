import { WorkflowDialogOption } from './purchase-request-dialogs.reference';

export const deliveryDialogs: WorkflowDialogOption[] = [
  {
    type: 'default_approval',
    name: 'Default Approval Dialog',
    description: 'Standard approval/rejection dialog with comments',
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
    },
  },
  {
    type: 'truck_load_confirmation',
    name: 'Truck Load Confirmation Dialog',
    description: 'Dialog for confirming items loaded into truck',
    isCommon: false,
    supportsRejection: true,
    rejectionConfig: {
      requireComment: true,
      showFallbackStage: true,
    },
    configSchema: {
      requireItemVerification: { type: 'boolean', default: true },
      allowPartialLoad: { type: 'boolean', default: true },
      requireDriverSignature: { type: 'boolean', default: true },
      requirePhotos: { type: 'boolean', default: false },
    },
  },
  {
    type: 'pickup_authorization',
    name: 'Pickup Authorization Dialog',
    description: 'Dialog for authorizing item pickup',
    isCommon: false,
    supportsRejection: true,
    rejectionConfig: {
      requireComment: true,
      showFallbackStage: true,
    },
    configSchema: {
      requireCustomerSignature: { type: 'boolean', default: true },
      allowProxyPickup: { type: 'boolean', default: false },
      requireIdentification: { type: 'boolean', default: true },
      notificationSettings: {
        type: 'object',
        default: { sms: true, email: true },
      },
    },
  },
  {
    type: 'delivery_status_update',
    name: 'Delivery Status Update Dialog',
    description: 'Dialog for updating delivery status and location',
    isCommon: false,
    supportsRejection: true,
    rejectionConfig: {
      requireComment: true,
      showFallbackStage: true,
    },
    configSchema: {
      requireLocationUpdate: { type: 'boolean', default: true },
      allowStatusNotes: { type: 'boolean', default: true },
      requireTimeStamp: { type: 'boolean', default: true },
      enableGPSTracking: { type: 'boolean', default: false },
    },
  },
  {
    type: 'delivery_confirmation',
    name: 'Delivery Confirmation Dialog',
    description: 'Dialog for confirming successful delivery',
    isCommon: false,
    supportsRejection: true,
    rejectionConfig: {
      requireComment: true,
      showFallbackStage: true,
    },
    configSchema: {
      requireRecipientSignature: { type: 'boolean', default: true },
      requireDeliveryPhoto: { type: 'boolean', default: false },
      allowPartialDelivery: { type: 'boolean', default: true },
      requireFeedback: { type: 'boolean', default: false },
    },
  },
  {
    type: 'incomplete_delivery',
    name: 'Incomplete Delivery Dialog',
    description: 'Dialog for handling incomplete or failed deliveries',
    isCommon: false,
    supportsRejection: true,
    rejectionConfig: {
      requireComment: true,
      showFallbackStage: true,
    },
    configSchema: {
      requireFailureReason: { type: 'boolean', default: true },
      allowReschedule: { type: 'boolean', default: true },
      requirePhotos: { type: 'boolean', default: true },
      notifyCustomer: { type: 'boolean', default: true },
    },
  },
];

export default deliveryDialogs;

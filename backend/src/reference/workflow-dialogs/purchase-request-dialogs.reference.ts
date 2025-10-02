export interface WorkflowDialogOption {
  type: string;
  name: string;
  description: string;
  isCommon: boolean;
  supportsRejection: boolean;
  configSchema?: any;
  rejectionConfig?: {
    requireComment: boolean;
    showFallbackStage: boolean;
  };
}

export const purchaseRequestDialogs: WorkflowDialogOption[] = [
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
    type: 'supplier_selection',
    name: 'Supplier Selection Dialog',
    description: 'Dialog for selecting and evaluating suppliers',
    isCommon: false,
    supportsRejection: true,
    rejectionConfig: {
      requireComment: true,
      showFallbackStage: true,
    },
    configSchema: {
      allowMultipleSuppliers: { type: 'boolean', default: true },
      requireQuotation: { type: 'boolean', default: true },
      minimumSuppliers: { type: 'number', default: 1 },
      evaluationCriteria: {
        type: 'array',
        default: ['price', 'quality', 'delivery_time'],
      },
    },
  },
  {
    type: 'canvassing',
    name: 'Canvassing Dialog',
    description: 'Dialog for canvassing and price comparison',
    isCommon: false,
    supportsRejection: true,
    rejectionConfig: {
      requireComment: true,
      showFallbackStage: true,
    },
    configSchema: {
      minimumQuotes: { type: 'number', default: 3 },
      allowCounterOffers: { type: 'boolean', default: true },
      requireSpecifications: { type: 'boolean', default: true },
      evaluationDeadline: { type: 'number', default: 7 }, // days
    },
  },
  {
    type: 'materials_approval',
    name: 'Materials Approval Dialog',
    description: 'Dialog for approving material specifications and quantities',
    isCommon: false,
    supportsRejection: true,
    rejectionConfig: {
      requireComment: true,
      showFallbackStage: true,
    },
    configSchema: {
      requireSpecificationReview: { type: 'boolean', default: true },
      allowQuantityAdjustment: { type: 'boolean', default: true },
      requireBudgetCheck: { type: 'boolean', default: true },
    },
  },
  {
    type: 'purchase_order_approval',
    name: 'Purchase Order Approval Dialog',
    description: 'Dialog for final purchase order approval',
    isCommon: false,
    supportsRejection: true,
    rejectionConfig: {
      requireComment: true,
      showFallbackStage: true,
    },
    configSchema: {
      requireAuthorizedSignature: { type: 'boolean', default: true },
      allowTermsModification: { type: 'boolean', default: false },
      requireBudgetConfirmation: { type: 'boolean', default: true },
    },
  },
];

export default purchaseRequestDialogs;

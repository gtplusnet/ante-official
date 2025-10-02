export interface WorkflowDialogOption {
  type: string;
  name: string;
  description: string;
  isCommon: boolean;
  supportsRejection: boolean;
  rejectionConfig?: {
    requireComment: boolean;
    showFallbackStage: boolean;
  };
  configSchema?: Record<string, any>;
}

export const pettyCashLiquidationDialogs: WorkflowDialogOption[] = [
  {
    type: 'liquidation_approval',
    name: 'Liquidation Approval Dialog',
    description:
      'Shows liquidation summary and records to petty cash upon approval',
    isCommon: false,
    supportsRejection: false,
    configSchema: {
      showLiquidationSummary: { type: 'boolean', default: true },
      showPettyCashBalance: { type: 'boolean', default: true },
      showVendorDetails: { type: 'boolean', default: true },
      showTaxDetails: { type: 'boolean', default: true },
      requireRemarks: { type: 'boolean', default: false },
      autoRecordToPettyCash: { type: 'boolean', default: true },
      customApprovalMessage: {
        type: 'string',
        default:
          'By approving this liquidation, the amount will be recorded to the petty cash ledger.',
      },
    },
  },
  {
    type: 'liquidation_rejection',
    name: 'Liquidation Rejection Dialog',
    description:
      'Rejection dialog specifically for liquidations with required reason',
    isCommon: false,
    supportsRejection: true,
    rejectionConfig: {
      requireComment: true,
      showFallbackStage: false,
    },
    configSchema: {
      showLiquidationDetails: { type: 'boolean', default: true },
      minReasonLength: { type: 'number', default: 20 },
      customRejectionMessage: {
        type: 'string',
        default:
          'Please provide a detailed reason for rejecting this liquidation.',
      },
    },
  },
];

export default pettyCashLiquidationDialogs;

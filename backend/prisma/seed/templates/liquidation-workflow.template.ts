// Define stages based on frontend reference data structure
const pettyCashLiquidationStatusReference = [
  {
    label: 'Pending Review',
    key: 'PENDING',
    color: '#FFA726',
    textColor: 'white',
    nextStage: 'APPROVED,REJECTED',
    nextStageLabel: 'Approved,Rejected',
    isInitial: true,
    isFinal: false,
  },
  {
    label: 'Approved',
    key: 'APPROVED',
    color: '#66BB6A',
    textColor: 'white',
    isInitial: false,
    isFinal: true,
  },
  {
    label: 'Rejected',
    key: 'REJECTED',
    color: '#EF5350',
    textColor: 'white',
    isInitial: false,
    isFinal: true,
  },
];

export const liquidationWorkflowTemplate = {
  name: "Petty Cash Liquidation",
  code: "petty_cash_liquidation", 
  description: "Workflow configuration for Petty Cash Liquidation",
  module: "FINANCE",
  version: "1",
  isActive: true,
  isDefault: false,
  
  // Configuration metadata
  config: {
    allowParallelApprovals: false,
    requireRemarks: true,
    autoAssignment: true,
    notificationEnabled: true,
    escalationEnabled: true,
    escalationTimeHours: 48
  },
  
  // Default stages - derived from frontend reference
  stages: pettyCashLiquidationStatusReference.map((status, index) => ({
    code: status.key,
    name: status.label,
    description: status.isFinal ? 
      `Liquidation has been ${status.key.toLowerCase()}` : 
      "Initial submission pending review",
    order: index + 1,
    stageType: status.isInitial ? "INITIAL" : (status.isFinal ? "FINAL" : "INTERMEDIATE"),
    assigneeType: null,
    assigneeId: null,
    config: {
      color: status.color,
      textColor: status.textColor,
      icon: status.key === "PENDING" ? "pending" : 
            (status.key === "APPROVED" ? "check_circle" : "cancel"),
      allowEdit: status.key === "PENDING",
      allowDelete: status.key === "PENDING",
      allowReassign: false,
      ...(status.key === "REJECTED" && { requireRemarks: true }),
      ...(status.key === "APPROVED" && { 
        triggerActions: ["updateBalance", "createTransaction", "sendNotification"] 
      }),
      ...(status.key === "REJECTED" && { 
        triggerActions: ["sendRejectionNotification"] 
      })
    }
  })),
  
  // Default transitions - matching frontend Reset to Default
  transitions: [
    {
      code: "APPROVE",
      name: "Approve",
      fromStageCode: "PENDING",
      toStageCode: "APPROVED",
      order: 1,
      dialogType: "liquidation_approval",
      config: {
        buttonColor: "#4CAF50", // green hex color
        buttonIcon: "check",
        confirmationRequired: true,
        confirmationTitle: "Approve Liquidation",
        confirmationMessage: "Review the liquidation details and approve to record to petty cash",
        requireRemarks: false,
        requireAttachment: false,
        permissions: ["APPROVE_LIQUIDATION", "FINANCE_MANAGER"],
      }
    },
    {
      code: "REJECT",
      name: "Reject",
      fromStageCode: "PENDING",
      toStageCode: "REJECTED",
      order: 2,
      dialogType: "reason_dialog",
      config: {
        buttonColor: "#F44336", // red hex color
        buttonIcon: "close",
        confirmationRequired: true,
        confirmationTitle: "Reject Liquidation",
        confirmationMessage: "Are you sure you want to reject this liquidation?",
        requireRemarks: true,
        remarkPrompt: "Please provide a reason for rejection",
        requireAttachment: false,
        permissions: ["APPROVE_LIQUIDATION", "FINANCE_MANAGER"],
      }
    }
  ],
  
  // Button configurations - matching frontend Reset to Default
  buttonConfigs: [
    {
      transitionCode: "APPROVE",
      buttonLabel: "Approve",
      buttonColor: "#4CAF50", // green hex color
      buttonIcon: "check",
      buttonSize: "medium",
      confirmationRequired: true,
      confirmationTitle: "Approve Liquidation",
      confirmationMessage: "Review the liquidation details and approve to record to petty cash",
      position: 1,
      visibility: "ALWAYS",
      remarkRequired: false
    },
    {
      transitionCode: "REJECT",
      buttonLabel: "Reject",
      buttonColor: "#F44336", // red hex color
      buttonIcon: "close",
      buttonSize: "medium",
      confirmationRequired: true,
      confirmationTitle: "Reject Liquidation",
      confirmationMessage: "Are you sure you want to reject this liquidation?",
      position: 2,
      visibility: "ALWAYS",
      remarkRequired: true,
      remarkPrompt: "Please provide a reason for rejection"
    }
  ]
};
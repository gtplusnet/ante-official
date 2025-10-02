export const purchaseRequestWorkflowTemplate = {
  name: "Purchase Request Workflow",
  code: "PURCHASE_REQUEST",
  description: "Multi-level approval workflow for purchase requests v1",
  module: "PROCUREMENT",
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
    escalationTimeHours: 24
  },
  
  // Multi-level approval stages
  stages: [
    {
      code: "DRAFT",
      name: "Draft",
      description: "Initial draft state",
      stageType: "INITIAL",
      order: 1,
      assigneeType: null,
      assigneeId: null,
      config: {
        color: "#9E9E9E",
        textColor: "white",
        icon: "edit",
        allowEdit: true,
        allowDelete: true,
        allowReassign: false
      }
    },
    {
      code: "PENDING_SUPERVISOR",
      name: "Pending Supervisor Approval",
      description: "Awaiting supervisor approval",
      stageType: "INTERMEDIATE",
      order: 2,
      assigneeType: "DIRECT_SUPERVISOR",
      assigneeId: null,
      config: {
        color: "#FF9800",
        textColor: "white",
        icon: "supervisor_account",
        allowEdit: false,
        allowDelete: false,
        allowReassign: true
      }
    },
    {
      code: "PENDING_MANAGER",
      name: "Pending Manager Approval",
      description: "Awaiting department manager approval",
      stageType: "INTERMEDIATE",
      order: 3,
      assigneeType: "DEPARTMENT",
      assigneeId: null,
      config: {
        color: "#2196F3",
        textColor: "white",
        icon: "manage_accounts",
        allowEdit: false,
        allowDelete: false,
        allowReassign: true
      }
    },
    {
      code: "PENDING_FINANCE",
      name: "Pending Finance Approval",
      description: "Awaiting finance department approval",
      stageType: "INTERMEDIATE",
      order: 4,
      assigneeType: "ROLE",
      assigneeId: null, // Will be set to Finance Manager role ID
      config: {
        color: "#9C27B0",
        textColor: "white",
        icon: "account_balance",
        allowEdit: false,
        allowDelete: false,
        allowReassign: true
      }
    },
    {
      code: "APPROVED",
      name: "Approved",
      description: "Purchase request has been fully approved",
      stageType: "FINAL",
      order: 5,
      assigneeType: null,
      assigneeId: null,
      config: {
        color: "#4CAF50",
        textColor: "white",
        icon: "check_circle",
        allowEdit: false,
        allowDelete: false,
        allowReassign: false,
        triggerActions: ["createPurchaseOrder", "notifyRequester", "notifyProcurement"]
      }
    },
    {
      code: "REJECTED",
      name: "Rejected",
      description: "Purchase request has been rejected",
      stageType: "FINAL",
      order: 6,
      assigneeType: null,
      assigneeId: null,
      config: {
        color: "#F44336",
        textColor: "white",
        icon: "cancel",
        allowEdit: false,
        allowDelete: false,
        allowReassign: false,
        requireRemarks: true,
        triggerActions: ["notifyRejection"]
      }
    },
    {
      code: "CANCELLED",
      name: "Cancelled",
      description: "Purchase request has been cancelled",
      stageType: "FINAL",
      order: 7,
      assigneeType: null,
      assigneeId: null,
      config: {
        color: "#757575",
        textColor: "white",
        icon: "block",
        allowEdit: false,
        allowDelete: false,
        allowReassign: false,
        triggerActions: ["notifyCancellation"]
      }
    }
  ],
  
  // Multi-level transitions
  transitions: [
    // Draft to Supervisor
    {
      code: "SUBMIT",
      name: "Submit for Approval",
      fromStageCode: "DRAFT",
      toStageCode: "PENDING_SUPERVISOR",
      order: 1,
      config: {
        buttonColor: "primary",
        requireRemarks: false,
        requireAttachment: false,
        validationRules: [
          {
            type: "REQUIRED_FIELDS",
            value: ["items", "justification", "deliveryDate"],
            message: "All required fields must be filled"
          }
        ],
        permissions: ["CREATE_PURCHASE_REQUEST"],
        conditionType: "ALL"
      }
    },
    // Supervisor approval paths
    {
      code: "SUPERVISOR_APPROVE",
      name: "Approve (Supervisor)",
      fromStageCode: "PENDING_SUPERVISOR",
      toStageCode: "PENDING_MANAGER",
      order: 2,
      config: {
        buttonColor: "positive",
        requireRemarks: false,
        requireAttachment: false,
        validationRules: [
          {
            type: "AMOUNT_THRESHOLD",
            value: 10000,
            operator: "LESS_THAN",
            skipStage: "PENDING_MANAGER",
            goToStage: "PENDING_FINANCE",
            message: "Amount below manager approval threshold"
          }
        ],
        permissions: ["APPROVE_AS_SUPERVISOR"],
        conditionType: "ANY"
      }
    },
    {
      code: "SUPERVISOR_REJECT",
      name: "Reject (Supervisor)",
      fromStageCode: "PENDING_SUPERVISOR",
      toStageCode: "REJECTED",
      order: 3,
      config: {
        buttonColor: "negative",
        requireRemarks: true,
        remarkPrompt: "Please provide a reason for rejection",
        requireAttachment: false,
        permissions: ["APPROVE_AS_SUPERVISOR"],
        conditionType: null
      }
    },
    // Manager approval paths
    {
      code: "MANAGER_APPROVE",
      name: "Approve (Manager)",
      fromStageCode: "PENDING_MANAGER",
      toStageCode: "PENDING_FINANCE",
      order: 4,
      config: {
        buttonColor: "positive",
        requireRemarks: false,
        requireAttachment: false,
        validationRules: [
          {
            type: "BUDGET_CHECK",
            value: true,
            message: "Budget allocation must be available"
          }
        ],
        permissions: ["APPROVE_AS_MANAGER"],
        conditionType: "ALL"
      }
    },
    {
      code: "MANAGER_REJECT",
      name: "Reject (Manager)",
      fromStageCode: "PENDING_MANAGER",
      toStageCode: "REJECTED",
      order: 5,
      config: {
        buttonColor: "negative",
        requireRemarks: true,
        remarkPrompt: "Please provide a reason for rejection",
        requireAttachment: false,
        permissions: ["APPROVE_AS_MANAGER"],
        conditionType: null
      }
    },
    // Finance approval paths
    {
      code: "FINANCE_APPROVE",
      name: "Approve (Finance)",
      fromStageCode: "PENDING_FINANCE",
      toStageCode: "APPROVED",
      order: 6,
      config: {
        buttonColor: "positive",
        requireRemarks: false,
        requireAttachment: false,
        validationRules: [
          {
            type: "FUND_AVAILABILITY",
            value: true,
            message: "Sufficient funds must be available"
          },
          {
            type: "VENDOR_VERIFICATION",
            value: true,
            message: "Vendor must be verified"
          }
        ],
        permissions: ["APPROVE_AS_FINANCE"],
        conditionType: "ALL"
      }
    },
    {
      code: "FINANCE_REJECT",
      name: "Reject (Finance)",
      fromStageCode: "PENDING_FINANCE",
      toStageCode: "REJECTED",
      order: 7,
      config: {
        buttonColor: "negative",
        requireRemarks: true,
        remarkPrompt: "Please provide a reason for rejection",
        requireAttachment: false,
        permissions: ["APPROVE_AS_FINANCE"],
        conditionType: null
      }
    },
    // Cancellation from any non-final state
    {
      code: "CANCEL",
      name: "Cancel Request",
      fromStageCode: "*",
      toStageCode: "CANCELLED",
      order: 8,
      config: {
        buttonColor: "warning",
        requireRemarks: true,
        remarkPrompt: "Please provide a reason for cancellation",
        requireAttachment: false,
        allowFromAnyStage: true,
        excludeFinalStages: true,
        permissions: ["CANCEL_PURCHASE_REQUEST"],
        conditionType: null
      }
    }
  ],
  
  // Button configurations for each transition
  buttonConfigs: [
    {
      transitionCode: "SUBMIT",
      buttonLabel: "Submit for Approval",
      buttonColor: "primary",
      buttonIcon: "send",
      buttonSize: "medium",
      confirmationRequired: true,
      confirmationTitle: "Submit Purchase Request",
      confirmationMessage: "Are you sure you want to submit this purchase request for approval?",
      position: 1,
      visibility: "ALWAYS",
      remarkRequired: false
    },
    {
      transitionCode: "SUPERVISOR_APPROVE",
      buttonLabel: "Approve",
      buttonColor: "positive",
      buttonIcon: "check",
      buttonSize: "medium",
      confirmationRequired: true,
      confirmationTitle: "Approve Purchase Request",
      confirmationMessage: "Are you sure you want to approve this purchase request?",
      position: 1,
      visibility: "ROLE_BASED",
      remarkRequired: false
    },
    {
      transitionCode: "SUPERVISOR_REJECT",
      buttonLabel: "Reject",
      buttonColor: "negative",
      buttonIcon: "close",
      buttonSize: "medium",
      confirmationRequired: true,
      confirmationTitle: "Reject Purchase Request",
      confirmationMessage: "Are you sure you want to reject this purchase request?",
      position: 2,
      visibility: "ROLE_BASED",
      remarkRequired: true,
      remarkPrompt: "Please provide a reason for rejection"
    },
    {
      transitionCode: "MANAGER_APPROVE",
      buttonLabel: "Approve",
      buttonColor: "positive",
      buttonIcon: "check",
      buttonSize: "medium",
      confirmationRequired: true,
      confirmationTitle: "Approve Purchase Request",
      confirmationMessage: "Are you sure you want to approve this purchase request?",
      position: 1,
      visibility: "ROLE_BASED",
      remarkRequired: false
    },
    {
      transitionCode: "MANAGER_REJECT",
      buttonLabel: "Reject",
      buttonColor: "negative",
      buttonIcon: "close",
      buttonSize: "medium",
      confirmationRequired: true,
      confirmationTitle: "Reject Purchase Request",
      confirmationMessage: "Are you sure you want to reject this purchase request?",
      position: 2,
      visibility: "ROLE_BASED",
      remarkRequired: true,
      remarkPrompt: "Please provide a reason for rejection"
    },
    {
      transitionCode: "FINANCE_APPROVE",
      buttonLabel: "Approve",
      buttonColor: "positive",
      buttonIcon: "check",
      buttonSize: "medium",
      confirmationRequired: true,
      confirmationTitle: "Approve Purchase Request",
      confirmationMessage: "Are you sure you want to approve this purchase request?",
      position: 1,
      visibility: "ROLE_BASED",
      remarkRequired: false
    },
    {
      transitionCode: "FINANCE_REJECT",
      buttonLabel: "Reject",
      buttonColor: "negative",
      buttonIcon: "close",
      buttonSize: "medium",
      confirmationRequired: true,
      confirmationTitle: "Reject Purchase Request",
      confirmationMessage: "Are you sure you want to reject this purchase request?",
      position: 2,
      visibility: "ROLE_BASED",
      remarkRequired: true,
      remarkPrompt: "Please provide a reason for rejection"
    },
    {
      transitionCode: "CANCEL",
      buttonLabel: "Cancel Request",
      buttonColor: "warning",
      buttonIcon: "block",
      buttonSize: "medium",
      confirmationRequired: true,
      confirmationTitle: "Cancel Purchase Request",
      confirmationMessage: "Are you sure you want to cancel this purchase request?",
      position: 3,
      visibility: "OWNER_ONLY",
      remarkRequired: true,
      remarkPrompt: "Please provide a reason for cancellation"
    }
  ]
};
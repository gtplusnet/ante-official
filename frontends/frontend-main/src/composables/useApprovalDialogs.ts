import { Component } from 'vue';
import FilingApprovalDialog from '@/components/dialog/FilingApprovalDialog/FilingApprovalDialog.vue';

// Map of source modules to their corresponding approval dialog components
const approvalDialogMap: Record<string, Component> = {
  'HR_FILING': FilingApprovalDialog,
  // Future approval dialogs can be added here:
  // 'PAYROLL_PROCESSING': PayrollApprovalDialog,
  // 'PURCHASE_ORDER': PurchaseOrderApprovalDialog,
  // 'EXPENSE_CLAIM': ExpenseClaimApprovalDialog,
};

export function useApprovalDialogs() {
  /**
   * Get the appropriate dialog component for a given source module
   * @param sourceModule - The module identifier from ApprovalMetadata
   * @returns The dialog component or null if not found
   */
  const getApprovalDialog = (sourceModule: string): Component | null => {
    return approvalDialogMap[sourceModule] || null;
  };

  /**
   * Check if a source module has a registered approval dialog
   * @param sourceModule - The module identifier to check
   * @returns true if dialog exists, false otherwise
   */
  const hasApprovalDialog = (sourceModule: string): boolean => {
    return sourceModule in approvalDialogMap;
  };

  /**
   * Get all registered source modules
   * @returns Array of source module identifiers
   */
  const getRegisteredModules = (): string[] => {
    return Object.keys(approvalDialogMap);
  };

  return {
    getApprovalDialog,
    hasApprovalDialog,
    getRegisteredModules,
  };
}
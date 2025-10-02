import purchaseRequestDialogs from './purchase-request-dialogs.reference';
import deliveryDialogs from './delivery-dialogs.reference';
import commonDialogs from './common-dialogs.reference';
import pettyCashLiquidationDialogs from './petty-cash-liquidation-dialogs.reference';
import { WorkflowDialogOption } from './purchase-request-dialogs.reference';

export { WorkflowDialogOption };

export const workflowDialogs = {
  purchase_request: purchaseRequestDialogs,
  delivery_status: deliveryDialogs,
  petty_cash_liquidation: pettyCashLiquidationDialogs,
  common: commonDialogs,
};

export function getDialogsForWorkflow(
  workflowCode: string,
): WorkflowDialogOption[] {
  const workflowSpecificDialogs =
    workflowDialogs[workflowCode as keyof typeof workflowDialogs] || [];
  const commonDialogsFiltered = commonDialogs.filter(
    (dialog) => dialog.isCommon,
  );

  // Merge workflow-specific dialogs with common dialogs, avoiding duplicates
  const mergedDialogs = [...workflowSpecificDialogs];

  commonDialogsFiltered.forEach((commonDialog) => {
    if (!mergedDialogs.find((dialog) => dialog.type === commonDialog.type)) {
      mergedDialogs.push(commonDialog);
    }
  });

  return mergedDialogs;
}

export function getDialogByType(
  dialogType: string,
  workflowCode?: string,
): WorkflowDialogOption | undefined {
  if (workflowCode) {
    const workflowDialogs = getDialogsForWorkflow(workflowCode);
    return workflowDialogs.find((dialog) => dialog.type === dialogType);
  }

  // Search in all dialogs
  const allDialogs = [
    ...purchaseRequestDialogs,
    ...deliveryDialogs,
    ...commonDialogs,
  ];

  return allDialogs.find((dialog) => dialog.type === dialogType);
}

export default workflowDialogs;

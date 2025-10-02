import { liquidationWorkflowTemplate } from './liquidation-workflow.template';
import { purchaseRequestWorkflowTemplate } from './purchase-request-workflow.template';

export const defaultWorkflowTemplates = [
  liquidationWorkflowTemplate,
  purchaseRequestWorkflowTemplate,
];

export { liquidationWorkflowTemplate, purchaseRequestWorkflowTemplate };
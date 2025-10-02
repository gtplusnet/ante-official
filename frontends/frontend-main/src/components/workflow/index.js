/**
 * Workflow Components Export
 * 
 * This file exports all workflow-related components for easy importing
 * throughout the application.
 * 
 * Usage:
 * import { WorkflowStatusBadge, WorkflowTimeline } from '@/components/workflow';
 */

// Core Components
export { default as WorkflowStatusBadge } from './WorkflowStatusBadge.vue';
export { default as WorkflowTimeline } from './WorkflowTimeline.vue';
export { default as WorkflowActionButtons } from './WorkflowActionButtons.vue';
export { default as PendingApprovalsView } from './PendingApprovalsView.vue';

// Dialog Components
export { default as WorkflowApprovalDialog } from './WorkflowApprovalDialog.vue';
export { default as WorkflowRejectionDialog } from './WorkflowRejectionDialog.vue';

// Service (for convenience)
export { default as WorkflowService } from '../../services/workflow.service';

/**
 * Component Documentation:
 * 
 * WorkflowStatusBadge - Displays the current workflow stage as a colored badge
 * Props: stage, status, size, dense, square, showTooltip, customLabel
 * 
 * WorkflowTimeline - Shows the complete workflow history as a timeline
 * Props: workflowInstanceId, layout, showCurrentStage, autoRefresh, refreshInterval
 * 
 * WorkflowActionButtons - Renders available workflow actions as buttons
 * Props: workflowInstanceId, size, showEmptyState, autoRefresh, refreshInterval
 * 
 * PendingApprovalsView - Displays all pending workflow approvals for the user
 * Props: sourceModule, pageSize, autoRefresh, refreshInterval
 * 
 * WorkflowApprovalDialog - Confirmation dialog for approval actions
 * Props: modelValue, action, workflowInstanceId, loading, showRemarks
 * 
 * WorkflowRejectionDialog - Dialog for rejection with required reason
 * Props: modelValue, action, workflowInstanceId, loading, showAdditionalRemarks, minReasonLength
 */
<template>
  <div>
    <!-- chose item dialog -->
    <ChooseItemDialog :emitKey="emitKey" v-if="isChooseItemDialogOpen" v-model="isChooseItemDialogOpen" />

    <!-- item information dialog -->
    <ItemInformationDialog :itemId="itemId" v-if="isItemInformationDialogOpen" v-model="isItemInformationDialogOpen" />

    <!-- payroll summary dialog -->
    <PayrollSummaryDialog
      :enableDiscussionButton="false"
      v-if="isPayrollSummaryDialogOpen"
      :selectedPayroll="selectedPayroll"
      v-model="isPayrollSummaryDialogOpen"
    />

    <!-- Task Information Dialog -->
    <task-information-dialog 
      :taskInformation="taskInformation" 
      :hideDiscussionButton="hideTaskDiscussionButton"
      v-if="taskInformation && isTaskInformationDialogOpen" 
      v-model="isTaskInformationDialogOpen" 
    />
    
    <!-- Discussion Dialog -->
    <discussion-dialog 
      :data="discussionData" 
      v-if="discussionData && isDiscussionDialogOpen" 
      v-model="isDiscussionDialogOpen" 
    />
    
    <!-- Filing Approval Dialog -->
    <filing-approval-dialog 
      v-if="isFilingApprovalDialogOpen" 
      v-model="isFilingApprovalDialogOpen" 
      :task="approvalTask" 
      :filing="filingData" 
      @approved="handleApprovalComplete" 
      @rejected="handleApprovalComplete" 
      @info-requested="handleApprovalComplete" 
    />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import bus from 'src/bus';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ChooseItemDialog = defineAsyncComponent(() =>
  import("../components/dialog/ChooseItemDialog.vue")
);
const ItemInformationDialog = defineAsyncComponent(() =>
  import("../components/dialog/ItemInformationDialog/ItemInformationDialog.vue")
);
const TaskInformationDialog = defineAsyncComponent(() =>
  import('../components/dialog/TaskInformationDialog/TaskInformationDialog.vue')
);
const PayrollSummaryDialog = defineAsyncComponent(() =>
  import("../pages/Member/Manpower/dialogs/payroll/ManpowerPayrollSummaryDialog.vue")
);
const DiscussionDialog = defineAsyncComponent(() =>
  import('../components/shared/discussion/DiscussionDialog.vue')
);
const FilingApprovalDialog = defineAsyncComponent(() =>
  import('../components/dialog/FilingApprovalDialog/FilingApprovalDialog.vue')
);

export default {
  name: 'GlobaLayoutDialog',
  components: {
    ChooseItemDialog,
    ItemInformationDialog,
    PayrollSummaryDialog,
    TaskInformationDialog,
    DiscussionDialog,
    FilingApprovalDialog,
  },
  props: {},
  data: () => ({
    isChooseItemDialogOpen: false,
    isItemInformationDialogOpen: false,
    isPayrollSummaryDialogOpen: false,
    itemId: null,
    emitKey: null,
    selectedPayroll: null,
    // Notification dialog states
    taskInformation: null,
    isTaskInformationDialogOpen: false,
    hideTaskDiscussionButton: false,
    discussionData: null,
    isDiscussionDialogOpen: false,
    approvalTask: null,
    filingData: null,
    isFilingApprovalDialogOpen: false,
  }),
  watch: {},
  mounted() {
    bus.on('showPayrollSummaryDialog', (data) => {
      this.isPayrollSummaryDialogOpen = true;
      this.selectedPayroll = data;
    });

    this.$bus.on('showChooseItemDialog', (emitKey) => {
      this.emitKey = emitKey;
      this.isChooseItemDialogOpen = true;
    });

    this.$bus.on('showItemInformationDialog', (itemId) => {
      this.itemId = itemId;
      this.isItemInformationDialogOpen = true;
    });

    // Notification dialog event handlers
    bus.on('showTaskDialog', (data) => {
      if (data && typeof data === 'object' && data.task) {
        // New format: { task: taskData, fromDiscussion: boolean }
        this.taskInformation = data.task;
        this.hideTaskDiscussionButton = data.fromDiscussion || false;
      } else {
        // Legacy format: just the task data
        this.taskInformation = data;
        this.hideTaskDiscussionButton = false;
      }
      this.isTaskInformationDialogOpen = true;
    });

    bus.on('showDiscussionDialog', (data) => {
      this.discussionData = data;
      this.isDiscussionDialogOpen = true;
    });

    bus.on('showFilingApprovalDialog', ({ task, filing }) => {
      this.approvalTask = task;
      this.filingData = filing;
      this.isFilingApprovalDialogOpen = true;
    });

    bus.on('notificationApprovalComplete', () => {
      this.handleApprovalComplete();
    });
  },
  methods: {
    handleApprovalComplete() {
      // Refresh notifications after approval action
      this.approvalTask = null;
      this.filingData = null;
      this.isFilingApprovalDialogOpen = false;
      // Emit event for notification components to refresh
      bus.emit('refreshNotifications');
    }
  },
};
</script>

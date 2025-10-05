<template>
  <q-dialog
    v-model="dialogModel"
    :maximized="$q.platform.is.mobile"
    :transition-show="$q.platform.is.mobile ? 'slide-up' : 'scale'"
    :transition-hide="$q.platform.is.mobile ? 'slide-down' : 'scale'"
  >
    <q-card class="filing-approval-dialog" :class="{ 'mobile-dialog': $q.platform.is.mobile }">
      <!-- Header with MD3 styling -->
      <q-card-section class="dialog-header">
        <div class="row items-center no-wrap">
          <q-icon name="o_task_alt" size="24px" class="q-mr-sm text-primary" />
          <div class="text-h6 text-grey-9">Filing Approval Request</div>
          <q-space />
          <g-button
            variant="text"
            icon="close"
            @click="$emit('update:modelValue', false)"
            class="text-grey-8"
            dense
          >
            <q-tooltip>Close</q-tooltip>
          </g-button>
        </div>
      </q-card-section>
      <q-separator />

      <!-- Loading State -->
      <q-card-section v-if="isLoadingFiling" class="q-pa-xl">
        <div class="column items-center q-gutter-md">
          <q-circular-progress
            indeterminate
            color="primary"
            size="48px"
            :thickness="0.1"
            track-color="grey-3"
          />
          <div class="text-body1 text-grey-7">Loading filing details...</div>
        </div>
      </q-card-section>

      <!-- Content State -->
      <q-card-section v-else-if="displayFiling" class="content-section">
        <!-- Dynamic Component based on filing type -->
        <div class="filing-content-wrapper">
          <component :is="filingDisplayComponent" v-if="filingDisplayComponent" :filing="displayFiling" />

          <!-- Fallback with unified design -->
          <UnifiedFilingDisplay v-else :filing="displayFiling" />
        </div>
      </q-card-section>

      <!-- Action Section -->
      <q-card-section v-if="displayFiling" class="action-section">

        <!-- Own Request Message -->
        <div v-if="isPending && isOwnRequest" class="status-message">
          <div class="row items-center q-gutter-sm">
            <q-icon name="o_info" size="18px" color="amber-8" />
            <div class="text-body2 text-grey-8">
              You cannot approve or reject your own request
            </div>
          </div>
          <g-button
            variant="outline"
            color="negative"
            label="Cancel Request"
            @click="onCancelRequest"
            :loading="isProcessing"
            class="q-mt-sm"
            size="sm"
          />
        </div>

        <!-- Not Pending Message -->
        <div v-else-if="!isPending" class="status-message">
          <div class="row items-center q-gutter-sm">
            <q-icon name="o_info" size="18px" color="grey-6" />
            <div class="text-body2 text-grey-7">
              This filing is not in pending status
            </div>
          </div>
        </div>

        <!-- Action Buttons for Pending Requests -->
        <div v-else-if="isPending && !isOwnRequest" class="row justify-end q-gutter-md">
          <g-button
            variant="outline"
            color="grey-8"
            label="Reject"
            icon="close"
            @click="onReject"
            :loading="isProcessing"
            class="text-label-large"
          />
          <g-button
            variant="filled"
            color="primary"
            label="Approve"
            icon="o_check"
            @click="onApprove"
            :loading="isProcessing"
            class="text-label-large"
          />
        </div>
      </q-card-section>

      <!-- Error State -->
      <q-card-section v-else class="q-pa-xl">
        <div class="column items-center q-gap-md">
          <q-icon name="o_error_outline" size="64px" color="negative" />
          <div class="text-h6 text-grey-8">Unable to load filing details</div>
          <div class="text-body2 text-grey-6">Please try again or contact support</div>
        </div>
      </q-card-section>

      <!-- Reject Dialog -->
      <RejectFilingDialog v-model="isRejectDialogOpen" @rejectedDone="onRejectDone" :task="$props.task" :filing="displayFiling" />
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, ref, watch } from 'vue';
import { defineAsyncComponent } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { useAuthStore } from 'src/stores/auth';
import { CombinedTaskResponseInterface } from 'src/shared/interfaces/task.interfaces';
import { FilingDisplayData } from 'src/interfaces/filing-notification.interface';
import { FilingDataResolver } from 'src/services/filing-data-resolver.service';
import { FileService } from 'src/services/file.service';
import UnifiedFilingDisplay from './components/UnifiedFilingDisplay.vue';
import OvertimeFilingDisplay from './components/OvertimeFilingDisplay.vue';
import LeaveFilingDisplay from './components/LeaveFilingDisplay.vue';
import OfficialBusinessFilingDisplay from './components/OfficialBusinessFilingDisplay.vue';
import CertificateOfAttendanceFilingDisplay from './components/CertificateOfAttendanceFilingDisplay.vue';
import ScheduleAdjustmentFilingDisplay from './components/ScheduleAdjustmentFilingDisplay.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const RejectFilingDialog = defineAsyncComponent(() =>
  import('./RejectFilingDialog.vue')
);

export default defineComponent({
  name: 'FilingApprovalDialog',
  components: {
    GButton,
    RejectFilingDialog,
    UnifiedFilingDisplay,
    OvertimeFilingDisplay,
    LeaveFilingDisplay,
    OfficialBusinessFilingDisplay,
    CertificateOfAttendanceFilingDisplay,
    ScheduleAdjustmentFilingDisplay,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    filing: {
      type: Object as PropType<FilingDisplayData | null>,
      default: null,
    },
    task: {
      type: Object as PropType<CombinedTaskResponseInterface | null>,
      default: null,
    },
  },
  emits: ['update:modelValue', 'approved', 'rejected', 'info-requested', 'cancelled'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const authStore = useAuthStore();
    const isRejectDialogOpen = ref(false);
    const filingData = ref<FilingDisplayData | null>(null);
    const loadingFile = ref(false);
    const isLoadingFiling = ref(false);
    const isProcessing = ref(false);

    const dialogModel = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    // Use filing data from props or loaded data

    const displayFiling = computed(() => {
      const filing = filingData.value || props.filing;
      return filing;
    });

    // Determine which component to use based on filing type
    const filingDisplayComponent = computed(() => {
      if (!displayFiling.value?.filingType?.label) {
        return null;
      }

      const filingTypeLabel = displayFiling.value.filingType.label;
      const filingType = filingTypeLabel.toLowerCase().trim();

      // More flexible matching
      if (filingType.includes('overtime') || filingType === 'ot') {
        return 'OvertimeFilingDisplay';
      } else if (filingType.includes('leave')) {
        return 'LeaveFilingDisplay';
      } else if (filingType.includes('official') || filingType.includes('business') || filingType === 'ob') {
        return 'OfficialBusinessFilingDisplay';
      } else if (filingType.includes('certificate') || filingType.includes('attendance') || filingType === 'coa') {
        return 'CertificateOfAttendanceFilingDisplay';
      } else if (filingType.includes('schedule') || filingType.includes('adjustment')) {
        return 'ScheduleAdjustmentFilingDisplay';
      }

      // Return null to use UnifiedFilingDisplay as fallback
      return null;
    });

    // Load filing data using the unified resolver
    const loadFilingData = async () => {
      if (props.task && !props.filing) {
        isLoadingFiling.value = true;
        try {
          const resolvedData = await FilingDataResolver.resolveFilingData({
            type: 'task',
            data: props.task,
          });
          filingData.value = resolvedData;
        } catch (error) {
          console.error('Failed to resolve filing data:', error);
          filingData.value = null;
        } finally {
          isLoadingFiling.value = false;
        }
      }
    };

    // Load filing data when dialog opens
    watch(dialogModel, (newVal) => {
      if (newVal) {
        loadFilingData();
      } else {
        // Clear loaded data when dialog closes
        filingData.value = null;
      }
    });

    // Also watch for task prop changes to load data immediately
    watch(
      () => props.task,
      (newTask) => {
        if (newTask && newTask.approvalMetadata && !props.filing) {
          loadFilingData();
        }
      },
      { immediate: true }
    );

    const onApprove = async () => {
      // Handle task-based approval
      if (props.task && props.task.id) {
        isProcessing.value = true;
        try {
          await api.patch(`/approval/task/${props.task.id}`, {
            action: 'approve',
            remarks: 'Approved',
          });

          $q.notify({
            type: 'positive',
            message: 'Filing approved successfully',
          });

          emit('approved');
          dialogModel.value = false;
        } catch (error) {
          console.error('Error approving filing:', error);
          $q.notify({
            type: 'negative',
            message: 'Failed to approve filing',
          });
        } finally {
          isProcessing.value = false;
        }
      }
      // Handle direct filing approval
      else if (displayFiling.value && displayFiling.value.id) {
        isProcessing.value = true;
        try {
          await api.post('/hr-filing/filing/approve', {
            id: displayFiling.value.id,
            remarks: 'Approved',
          });

          $q.notify({
            type: 'positive',
            message: 'Filing approved successfully',
          });

          emit('approved');
          dialogModel.value = false;
        } catch (error) {
          console.error('Error approving filing:', error);
          $q.notify({
            type: 'negative',
            message: 'Failed to approve filing',
          });
        } finally {
          isProcessing.value = false;
        }
      }
    };

    const onRejectDone = () => {
      dialogModel.value = false;
    };

    const onReject = () => {
      isRejectDialogOpen.value = true;
      // if (!props.task || !props.task.id) return;

      // dialog({
      //   title: 'Reject Filing',
      //   message: 'Please provide a reason for rejection:',
      //   prompt: {
      //     model: '',
      //     type: 'textarea',
      //   },
      //   cancel: true,
      //   persistent: true,
      // }).onOk(async (remarks) => {
      //   if (!props.task || !props.task.id) return;

      //   try {
      //     await api.patch(`/approval/task/${props.task.id}`, {
      //       action: 'reject',
      //       remarks: remarks || 'Rejected',
      //     });

      //     notify({
      //       type: 'positive',
      //       message: 'Filing rejected',
      //     });

      //     emit('rejected');
      //     dialogModel.value = false;
      //   } catch (error) {
      //     console.error('Error rejecting filing:', error);
      //     notify({
      //       type: 'negative',
      //       message: 'Failed to reject filing',
      //     });
      //   }
      // });
    };

    // const onRequestInfo = async () => {
    //   if (!props.task || !props.task.id) return;

    //   dialog({
    //     title: 'Request Information',
    //     message: 'What information do you need?',
    //     prompt: {
    //       model: '',
    //       type: 'textarea',
    //     },
    //     cancel: true,
    //     persistent: true,
    //   }).onOk(async (remarks) => {
    //     if (!props.task || !props.task.id) return;

    //     try {
    //       await api.patch(`/approval/task/${props.task.id}`, {
    //         action: 'request_info',
    //         remarks: remarks || 'Additional information needed',
    //       });

    //       notify({
    //         type: 'positive',
    //         message: 'Information request sent',
    //       });

    //       emit('info-requested');
    //       dialogModel.value = false;
    //     } catch (error) {
    //       console.error('Error requesting info:', error);
    //       notify({
    //         type: 'negative',
    //         message: 'Failed to request information',
    //       });
    //     }
    //   });
    // };

    const onCancel = () => {
      dialogModel.value = false;
    };

    const onCancelRequest = async () => {
      if (!displayFiling.value?.id) return;

      $q.dialog({
        title: 'Cancel Filing Request',
        message: 'Are you sure you want to cancel this filing request?',
        ok: {
          label: 'Yes, Cancel Request',
          color: 'negative',
          unelevated: true,
        },
        cancel: {
          label: 'No',
          color: 'grey',
          outline: true,
        },
        persistent: true,
      }).onOk(async () => {
        isProcessing.value = true;
        try {
          await api.post('/hr-filing/filing/cancel', {
            id: displayFiling.value!.id,
            remarks: 'Cancelled by requestor',
          });

          $q.notify({
            type: 'positive',
            message: 'Filing request cancelled successfully',
          });

          emit('cancelled');
          dialogModel.value = false;
        } catch (error) {
          console.error('Error cancelling filing:', error);
          $q.notify({
            type: 'negative',
            message: 'Failed to cancel filing request',
          });
        } finally {
          isProcessing.value = false;
        }
      });
    };

    // Computed property to check if filing is pending
    const isPending = computed(() => {
      return displayFiling.value?.status === 'PENDING';
    });

    // Computed property to check if current user is the requestor
    const isOwnRequest = computed(() => {
      // Check if filing has accountId
      if (displayFiling.value?.accountId) {
        return String(displayFiling.value.accountId) === String(authStore.accountInformation.id);
      }

      // Also check approval metadata sourceData for requestorId
      if (props.task?.approvalMetadata?.sourceData?.requestorId) {
        return String(props.task.approvalMetadata.sourceData.requestorId) === String(authStore.accountInformation.id);
      }

      return false;
    });

    // Status color mapping
    const getStatusColor = (status: string) => {
      const colors: Record<string, string> = {
        PENDING: 'amber-9',
        APPROVED: 'green-7',
        REJECTED: 'red',
        CANCELLED: 'grey',
      };
      return colors[status] || 'grey';
    };

    // Status label formatting
    const getStatusLabel = (status: string) => {
      const labels: Record<string, string> = {
        PENDING: 'Pending',
        APPROVED: 'Approved',
        REJECTED: 'Rejected',
        CANCELLED: 'Cancelled',
      };
      return labels[status] || status;
    };

    // Handle file attachment viewing
    const viewAttachment = async () => {
      if (!displayFiling.value?.file) return;

      loadingFile.value = true;
      try {
        // If we have a URL, use it directly
        if (displayFiling.value.file.url) {
          FileService.viewFile(displayFiling.value.file.url);
        } else if (displayFiling.value.file.id || displayFiling.value.fileId) {
          // Otherwise, fetch file info from API
          const fileId = displayFiling.value.file.id || displayFiling.value.fileId;
          const fileInfo = await FileService.getFileInfo(fileId!);
          if (fileInfo && fileInfo.url) {
            FileService.viewFile(fileInfo.url);
          } else {
            $q.notify({
              type: 'negative',
              message: 'Unable to retrieve file information',
            });
          }
        }
      } catch (error) {
        console.error('Error viewing attachment:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to view attachment',
        });
      } finally {
        loadingFile.value = false;
      }
    };

    // Handle file attachment download
    const downloadAttachment = async () => {
      if (!displayFiling.value?.file) return;

      loadingFile.value = true;
      try {
        // If we have a URL, use it directly
        if (displayFiling.value.file.url) {
          FileService.downloadFile(displayFiling.value.file.url, displayFiling.value.file.name);
        } else if (displayFiling.value.file.id || displayFiling.value.fileId) {
          // Otherwise, fetch file info from API
          const fileId = displayFiling.value.file.id || displayFiling.value.fileId;
          const fileInfo = await FileService.getFileInfo(fileId!);
          if (fileInfo && fileInfo.url) {
            FileService.downloadFile(fileInfo.url, fileInfo.name);
          } else {
            $q.notify({
              type: 'negative',
              message: 'Unable to retrieve file information',
            });
          }
        }
      } catch (error) {
        console.error('Error downloading attachment:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to download attachment',
        });
      } finally {
        loadingFile.value = false;
      }
    };

    return {
      isRejectDialogOpen,
      dialogModel,
      displayFiling,
      filingDisplayComponent,
      isPending,
      isOwnRequest,
      loadingFile,
      isLoadingFiling,
      isProcessing,
      getStatusColor,
      getStatusLabel,
      onApprove,
      onReject,
      // onRequestInfo,
      onCancel,
      onCancelRequest,
      onRejectDone,
      viewAttachment,
      downloadAttachment,
    };
  },
});
</script>

<style scoped lang="scss">
.filing-approval-dialog {
  min-width: 600px;
  max-width: 800px;
  border-radius: 28px;
}

.dialog-header {
  padding: 24px;
}

.content-section {
  padding: 0;
}

.filing-content-wrapper {
  max-height: 60dvh;
  overflow: auto;
  padding: 24px;
  background-color: #fff;

  @media (max-width: 768px) {
    max-height: 100dvh;
  }

  @media (max-width: 599px) {
    max-height: 100svh;
  }
}

.action-section {
  padding: 16px 24px;
  background-color: #fff;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.status-message {
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.file-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

// Material Design 3 elevation
.q-card {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.06);
}

// Button hover effects
.g-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover:not(.g-button--disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  }
}

// Loading state animation
.q-circular-progress {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

// Scrollbar styling
.filing-content-wrapper {
  &::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #d9d9d9;
    border-radius: 50px;
  }

  &::-webkit-scrollbar-track {
    background-color: #f4f4f4;
    border-radius: 50px;
  }
}

// Mobile styles
@media (max-width: 768px) {
  .filing-approval-dialog {
    min-width: unset;
    max-width: unset;

    &.mobile-dialog {
      width: 100%;
      height: 100dvh;
      max-height: 100dvh;
      border-radius: 0;
      margin: 0;

      .dialog-header {
        padding: 16px;
        position: sticky;
        top: 0;
        background: white;
        z-index: 10;

        .text-h6 {
          font-size: 18px;
        }
      }

      .content-section {
        padding: 0;
        height: calc(100vh - 140px); // Header + Action section
        overflow-y: auto;
      }

      .action-section {
        position: sticky;
        bottom: 0;
        background: white;
        border-top: 1px solid rgba(0, 0, 0, 0.12);
        padding: 12px 16px;
        z-index: 10;
      }
    }
  }
}
</style>

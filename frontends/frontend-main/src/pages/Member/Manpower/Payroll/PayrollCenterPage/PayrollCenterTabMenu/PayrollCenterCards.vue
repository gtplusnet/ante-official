<template>
  <div class="card-items q-py-sm">
    <!-- List Item Card -->
    <div v-if="isInitialLoading" class="q-pa-lg text-center">
      <q-spinner-dots size="2em" color="primary" class="q-mt-md" />
    </div>
    <div v-else-if="!cutoffList.length" class="q-pa-lg text-center text-grey">
      <span class="text-label-medium text-grey-6">No Data Available</span>
    </div>
    <div v-else>
      <div v-for="(item, index) in cutoffList" :key="index" class="process-item q-pa-md q-my-sm" @click="showPayrollSummaryDialog(item)">
        <div class="">
          <div class="text-label-large q-py-xs">
            {{ item.label }}
          </div>
          <span class="text-body-small q-py-xs">Payroll for {{ item.processingDate.dateFull }}</span>
        </div>
        <div class="column">
          <!-- Pending Status -->
          <div class="text-right">
            <span class="text-label-medium q-py-xs">
              <span v-if="item.processQueueResponse && item.processQueueResponse.status !== 'COMPLETED'">
                <queue-status-badge :queueReponse="item.processQueueResponse" class="q-ml-sm" />
              </span>
              <span v-else>
                <q-badge color="green" text-color="white" :label="item.totalNetPay.formatCurrency" />
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Payroll Summary Dialog -->
    <PayrollSummaryDialog 
      v-model="openPayrollSummaryDialog" 
      v-if="selectedPayroll" 
      :selectedPayroll="selectedPayroll" 
      @reload="handlePayrollReload" 
    />
  </div>
</template>

<script lang="ts">
import PayrollSummaryDialog from '../../../dialogs/payroll/ManpowerPayrollSummaryDialog.vue';
import { onMounted, onUnmounted, ref, Ref } from 'vue';
import { CutoffDateRangeResponse } from "@shared/response";
import { api } from 'src/boot/axios';
import QueueStatusBadge from "../../../../../../components/dialog/QueueDialog/QueueStatusBadge.vue";
import bus from 'src/bus';

export default {
  name: 'PayrollPending',
  components: {
    PayrollSummaryDialog,
    QueueStatusBadge,
  },
  props: {
    status: {
      type: String,
      default: 'PENDING',
    },
  },

  setup(props, { emit }) {
    const openPayrollSummaryDialog: Ref<boolean> = ref(false);
    const cutoffList: Ref<CutoffDateRangeResponse[]> = ref([]);
    const pollingIntervals: Map<string, number> = new Map();

    let isInitialLoading: Ref<boolean> = ref(true);
    let isLoading: Ref<boolean> = ref(false);

    const apiGetCutoffList = async () => {
      if (isLoading.value) return;
      isLoading.value = true;

      try {
        const response = await api.get('/hr-processing/get-cutoff-list', {
          params: {
            status: props.status,
          },
        });

        if (response.status === 200) {
          cutoffList.value = response.data;
          emit('update-count', cutoffList.value.length);
          
          // Start polling for any items that are in PROCESSING state
          cutoffList.value.forEach((item) => {
            if (item.processQueueResponse && 
                (item.processQueueResponse.status === 'PROCESSING' || 
                 item.processQueueResponse.status === 'PENDING')) {
              startPollingForQueue(item.processQueueResponse.id);
            }
          });
        }
      } finally {
        isLoading.value = false;
        isInitialLoading.value = false;
      }
    };

    // Simple debounce implementation
    let debounceTimer: number | null = null;
    const debouncedRefresh = () => {
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = window.setTimeout(() => {
        apiGetCutoffList();
        debounceTimer = null;
      }, 300);
    };

    // Socket event handlers
    const handleCutoffListChanged = (data: any) => {
      // Only refresh if the affected statuses include our current status
      if (data.affectedStatuses && data.affectedStatuses.includes(props.status)) {
        debouncedRefresh();
      }
    };

    // Handle queue progress updates via socket
    const handleQueueProgressUpdate = (data: any) => {
      // Update the specific cutoff item's queue response
      const cutoffItem = cutoffList.value.find(
        (item) => item.processQueueResponse?.id === data.queueId
      );
      
      if (cutoffItem && cutoffItem.processQueueResponse) {
        cutoffItem.processQueueResponse.currentCount = data.currentCount;
        cutoffItem.processQueueResponse.totalCount = data.totalCount;
        cutoffItem.processQueueResponse.status = data.status;
        cutoffItem.processQueueResponse.completePercentage = {
          raw: data.completePercentage,
          formatPercentage: `${Math.round(data.completePercentage * 100)}%`,
          formatNumber: Math.round(data.completePercentage * 100).toString()
        };
        
        // If status changed from PROCESSING to something else, stop polling for this item
        if (data.status !== 'PROCESSING') {
          stopPollingForQueue(data.queueId);
        }
      }
    };

    const handleCutoffItemUpdated = (data: any) => {
      // Check if this update affects our current view
      if (data.status === props.status || 
          (data.previousStatus && data.previousStatus === props.status)) {
        debouncedRefresh();
      }
    };

    const handleCutoffStatusUpdated = () => {
      // This is the legacy event, still handle it
      debouncedRefresh();
    };

    // Polling mechanism for queue status
    const startPollingForQueue = (queueId: string) => {
      // Don't start if already polling
      if (pollingIntervals.has(queueId)) return;
      
      const intervalId = window.setInterval(async () => {
        try {
          const response = await api.get(`/queue/info?id=${queueId}`);
          if (response.status === 200) {
            const queueData = response.data;
            
            // Update the specific cutoff item's queue response
            const cutoffItem = cutoffList.value.find(
              (item) => item.processQueueResponse?.id === queueId
            );
            
            if (cutoffItem && cutoffItem.processQueueResponse) {
              cutoffItem.processQueueResponse = queueData;
              
              // Stop polling if status is not PROCESSING
              if (queueData.status !== 'PROCESSING' && queueData.status !== 'PENDING') {
                stopPollingForQueue(queueId);
              }
            }
          }
        } catch (error) {
          console.error('Error polling queue status:', error);
        }
      }, 2000); // Poll every 2 seconds
      
      pollingIntervals.set(queueId, intervalId);
    };
    
    const stopPollingForQueue = (queueId: string) => {
      const intervalId = pollingIntervals.get(queueId);
      if (intervalId) {
        clearInterval(intervalId);
        pollingIntervals.delete(queueId);
      }
    };
    
    const stopAllPolling = () => {
      pollingIntervals.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      pollingIntervals.clear();
    };

    onMounted(() => {
      // Initial load
      apiGetCutoffList().then(() => {
        // Start polling for any items that are in PROCESSING state
        cutoffList.value.forEach((item) => {
          if (item.processQueueResponse && 
              (item.processQueueResponse.status === 'PROCESSING' || 
               item.processQueueResponse.status === 'PENDING')) {
            startPollingForQueue(item.processQueueResponse.id);
          }
        });
      });

      // Set up socket listeners
      bus.on('payroll-cutoff-list-changed', handleCutoffListChanged);
      bus.on('payroll-cutoff-item-updated', handleCutoffItemUpdated);
      bus.on('cutoff-date-range-status-updated', handleCutoffStatusUpdated);
      bus.on('queue-progress-updated', handleQueueProgressUpdate);
    });

    // Clean up listeners when component is unmounted
    onUnmounted(() => {
      bus.off('payroll-cutoff-list-changed', handleCutoffListChanged);
      bus.off('payroll-cutoff-item-updated', handleCutoffItemUpdated);
      bus.off('cutoff-date-range-status-updated', handleCutoffStatusUpdated);
      bus.off('queue-progress-updated', handleQueueProgressUpdate);
      
      // Clear any pending debounce timer
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
      
      // Stop all polling
      stopAllPolling();
    });

    const selectedPayroll: Ref<CutoffDateRangeResponse | null> = ref(null);

    const showPayrollSummaryDialog = (item: CutoffDateRangeResponse) => {
      selectedPayroll.value = item;
      openPayrollSummaryDialog.value = true;
    };

    const handlePayrollReload = () => {
      // Reload the cutoff list to get the latest status
      apiGetCutoffList();
      
      // Emit event to parent component to update counts
      bus.emit('cutoff-date-range-status-updated');
    };

    const isClickable = (status: string) => {
      return status === 'Saving... 50%' || status === 'In Queue...';
    };


    return {
      showPayrollSummaryDialog,
      openPayrollSummaryDialog,
      selectedPayroll,
      isClickable,
      cutoffList,
      isLoading,
      isInitialLoading,
      handlePayrollReload,
    };
  },
};
</script>

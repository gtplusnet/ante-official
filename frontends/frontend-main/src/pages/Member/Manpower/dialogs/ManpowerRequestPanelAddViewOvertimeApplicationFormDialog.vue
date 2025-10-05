<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" @before-show="fetchData" @hide="$emit('hide')">
    <TemplateDialog icon="alarm_add" width="650px" icon-color="#fb8c00" :scrollable="false">
      <template #DialogTitle>
        <span class="ot-title">Overtime Application Form {{ filing ? `(${filing?.status.label})` : '' }}</span>
      </template>

      <template #DialogContent>
        <q-form @submit.prevent="onSubmit" style="width: 100%" class="q-pa-md form-content">
          <div class="column form-container">
            <div class="row q-col-gutter-md q-pb-md">
              <div class="col">
                <label class="text-label-large">Date</label>
                <g-input 
                  required 
                  class="text-body-medium" 
                  v-model="form.date" 
                  :type="!isEditable ? 'readonly' : 'date'" 
                  dense 
                  outlined 
                  @update:model-value="onDateChange"
                />
              </div>
              <div class="col">
                <label class="text-label-large">Regular Overtime Hours</label>
                <q-input required v-model="form.hours" class="ipt text-body-medium" type="number" min="0" dense outlined :readonly="!isEditable" />
              </div>
              <div class="col">
                <label class="text-label-large">Night Differential Hours</label>
                <q-input v-model="form.nightDifferentialHours" class="ipt text-body-medium" type="number" min="0" dense outlined :readonly="!isEditable" />
                <div class="text-body-medium text-grey-7">Hours worked between 10PM-6AM</div>
              </div>
            </div>

            <!-- Shift Information Section -->
            <div v-if="timekeepingData && timekeepingData.activeShift" class="q-mb-md">
              <q-separator class="q-mb-md" />
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <label class="text-label-large text-weight-medium">Shift Information</label>
                </div>
                <div class="col-4">
                  <div class="text-body-medium text-grey-8">Shift Code</div>
                  <div class="text-body-medium text-weight-medium">{{ timekeepingData.activeShift.shiftCode || 'N/A' }}</div>
                </div>
                <div class="col-4">
                  <div class="text-body-medium text-grey-8">Shift Type</div>
                  <div class="text-body-medium text-weight-medium">{{ timekeepingData.activeShift.type || 'N/A' }}</div>
                </div>
                <div class="col-4">
                  <div class="text-body-medium text-grey-8">Schedule</div>
                  <div class="text-body-medium text-weight-medium">
                    {{ formatShiftTime(timekeepingData.activeShift.startTime) }} - {{ formatShiftTime(timekeepingData.activeShift.endTime) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Time Breakdown Section -->
            <div v-if="timekeepingData && timekeepingData.timeBreakdown?.length > 0" class="q-mb-md">
              <q-separator class="q-mb-md" />
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <label class="text-label-large text-weight-medium">Time Breakdown</label>
                </div>
                <div class="col-12">
                  <q-table
                    :rows="timekeepingData.timeBreakdown"
                    :columns="timeBreakdownColumns"
                    row-key="sourceRawId"
                    hide-header
                    dense
                    flat
                    class="time-breakdown-table"
                  >
                    <template #body="props">
                      <q-tr :props="props">
                        <q-td class="text-body-medium">{{ props.row.timeIn.time || 'N/A' }}</q-td>
                        <q-td class="text-body-medium">{{ props.row.timeOut.time || 'N/A' }}</q-td>
                        <q-td class="text-body-medium">{{ props.row.hours.raw || 0 }} hours</q-td>
                      </q-tr>
                    </template>
                  </q-table>
                </div>
              </div>
            </div>

            <!-- No Records Warning -->
            <div v-if="!hasTimekeepingLogs" class="q-mb-md">
              <q-banner class="bg-warning text-white" rounded>
                <template #avatar>
                  <q-icon name="warning" />
                </template>
                No attendance records found for this date. You cannot file overtime without recorded time logs.
              </q-banner>
            </div>

            <div :class="!isEditable ? 'q-pb-md' : ''">
              <label class="text-label-large">Reason for filing (Optional)</label>
              <g-input class="text-body-medium" placeholder="Type your reason" v-model="form.reason" :type="!isEditable ? 'readonly' : 'textarea'" dense outlined />
            </div>
          </div>
          <div class="row justify-end action-buttons">
            <div v-if="filing?.status.key === 'REJECTED' || filing?.status.key === 'APPROVED'">
              <g-button no-caps unelevated variant="tonal" label="Close" type="button" color="light-grey" v-close-popup />
            </div>

            <div v-else>
              <g-button
                no-caps
                unelevated
                variant="tonal"
                type="button"
                color="light-grey"
                class="q-mr-sm"
                @click="filing && filing.status?.key === 'PENDING' ? cancelRequest() : hideDialog()"
              >
                <q-icon v-if="filing" name="block" size="16px" class="q-mr-xs text-dark" />
                <span class="text-dark">{{ filing ? 'Cancel Request' : 'Cancel' }}</span>
              </g-button>
              <g-button 
                v-if="isEditable" 
                no-caps 
                unelevated 
                :label="filing ? 'Update' : 'Submit'" 
                type="submit" 
                color="secondary" 
                :disable="!hasTimekeepingLogs && !filing"
              />
            </div>
          </div>
        </q-form>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style src="../../Dashboard/RequestPanelWidget/RequestPanelWidget.scss" lang="scss" scoped></style>
<style lang="scss" scoped>
@media (max-width: 768px) {
  .form-container {
    height: calc(100dvh - 200px);
  }
}
@media (max-width: 599px) {
  .form-content {
    padding: 12px;
  }

  .ot-title {
    font-size: 16px;
  }

  .form-container {
    padding: 0;

    .q-col-gutter-md {
      display: flex;
      flex-direction: column;
    }
  }

  .action-buttons {
    bottom: -55px;
    right: 12px;
    position: absolute;
    width: 100%;
  }

  .time-breakdown-table {
    .q-table__card {
      box-shadow: none;
    }
    
    .q-table thead th {
      border-bottom: 1px solid #e0e0e0;
    }
    
    .q-table tbody td {
      border-bottom: 1px solid #f5f5f5;
    }
  }
}
</style>

<script lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { defineAsyncComponent } from 'vue';
import GInput from '../../../../components/shared/form/GInput.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';
import { formatDate } from '../../../../utility/formatter';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from '../../../../utility/axios.error.handler';
import { useAuthStore } from '../../../../stores/auth';
import type { Filing } from '../../Dashboard/RequestPanelWidget/types/filing.types';
import type { CreateFilingRequest, UpdateFilingRequest } from 'src/types/filing.types';
import { AxiosError } from 'axios';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

// Simple debounce implementation to avoid external dependency
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

interface FormData {
  date: string;
  hours: string;
  nightDifferentialHours: string;
  reason: string;
}

interface TimekeepingData {
  activeShift?: {
    shiftCode?: string;
    type?: string;
    startTime?: string;
    endTime?: string;
  };
  timeBreakdown?: Array<{
    sourceRawId?: string;
    timeIn: { time: string; raw: number };
    timeOut: { time: string; raw: number };
    hours: { raw: number };
  }>;
  timekeepingComputed?: {
    overtime: { raw: number };
    nightDifferentialOvertime: { raw: number };
  };
}

export default {
  name: 'CreateOvertimeApplicationFormDialog',
  components: {
    GInput,
    TemplateDialog,
    GButton,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    filing: {
      type: Object as () => Filing | null,
      default: null,
    },
  },
  emits: ['update:modelValue', 'saveDone', 'cancelled', 'hide'],

  setup(props, { emit }) {
    const q = useQuasar();
    const authStore = useAuthStore();
    const form = ref<FormData>({
      date: '',
      hours: '',
      nightDifferentialHours: '',
      reason: '',
    });

    const timekeepingData = ref<TimekeepingData | null>(null);
    const isLoading = ref(false);
    const abortController = ref<AbortController | null>(null);

    // Check if filing is editable (only PENDING or new filings can be edited)
    const isEditable = computed(() => !props.filing || props.filing.status?.key === 'PENDING');

    // Check if there are timekeeping logs for validation
    const hasTimekeepingLogs = computed(() => {
      return timekeepingData.value?.timeBreakdown && timekeepingData.value.timeBreakdown.length > 0;
    });

    // Table columns for time breakdown
    const timeBreakdownColumns = ref([
      { name: 'timeIn', label: 'Time In', align: 'left' },
      { name: 'timeOut', label: 'Time Out', align: 'left' },
      { name: 'hours', label: 'Hours', align: 'left' },
    ]);

    const fetchData = async () => {
      if (props.filing) {
        // Edit mode - populate with existing data
        form.value.date = props.filing.date ? formatDate(props.filing.date) : '';
        form.value.hours = props.filing.hours?.toString() || '0';
        form.value.nightDifferentialHours = props.filing.nightDifferentialHours?.toString() || '0';
        form.value.reason = props.filing.remarks || '';
      } else {
        // Create mode - default values
        const today = new Date();
        form.value.date = today.toISOString().split('T')[0];
        form.value.hours = '0';
        form.value.nightDifferentialHours = '0';
        form.value.reason = '';
      }
      
      // Fetch timekeeping data for the selected date
      if (form.value.date) {
        await fetchTimekeepingData(form.value.date);
      }
    };

    const fetchTimekeepingData = async (date: string) => {
      if (!date || !authStore.accountInformation?.id) {
        timekeepingData.value = null;
        return;
      }

      // Cancel previous request if exists
      if (abortController.value) {
        abortController.value.abort();
      }

      abortController.value = new AbortController();

      try {
        isLoading.value = true;
        const response = await api.get('/hris/timekeeping/employee/by-date', {
          params: {
            employeeAccountId: authStore.accountInformation.id,
            date: date,
          },
          signal: abortController.value.signal,
        });

        timekeepingData.value = response.data;

        // Auto-fill overtime hours if computed data is available and this is a new filing
        if (!props.filing && response.data?.timekeepingComputed) {
          const computed = response.data.timekeepingComputed;
          if (computed.overtime?.raw > 0) {
            form.value.hours = computed.overtime.raw.toString();
          }
          if (computed.nightDifferentialOvertime?.raw > 0) {
            form.value.nightDifferentialHours = computed.nightDifferentialOvertime.raw.toString();
          }
        }

      } catch (error) {
        // Only log error if it's not an abort error
        if (error.name !== 'AbortError') {
          console.error('Error fetching timekeeping data:', error);
          timekeepingData.value = null;
        }
        // Don't show error message for this, just clear the data
      } finally {
        if (abortController.value && !abortController.value.signal.aborted) {
          isLoading.value = false;
        }
      }
    };

    // Create debounced version of fetchTimekeepingData
    const debouncedFetchTimekeepingData = debounce(fetchTimekeepingData, 300);

    const onDateChange = (newDate: string) => {
      if (newDate) {
        // Reset hours when date changes for new filings
        if (!props.filing) {
          form.value.hours = '0';
          form.value.nightDifferentialHours = '0';
        }
        debouncedFetchTimekeepingData(newDate);
      }
    };

    // Cleanup on component unmount
    onUnmounted(() => {
      if (abortController.value) {
        abortController.value.abort();
      }
    });

    const formatShiftTime = (time: string) => {
      if (!time) return 'N/A';
      // Format time from HH:MM:SS to HH:MM AM/PM
      try {
        const [hours, minutes] = time.split(':');
        const hour24 = parseInt(hours);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
      } catch {
        return time;
      }
    };

    const onSubmit = () => {
      // Format date for display
      const displayDate = new Date(form.value.date).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });

      // Validate night differential hours
      const nightDiffHours = Number(form.value.nightDifferentialHours) || 0;
      const totalHours = Number(form.value.hours) || 0;

      if (nightDiffHours > totalHours) {
        q.notify({
          type: 'negative',
          message: 'Night differential hours cannot exceed total overtime hours',
        });
        return;
      }

      // Show confirmation dialog
      q.dialog({
        title: 'Confirm Overtime Filing',
        message: `Are you sure you want to file the following overtime for ${displayDate}?<br><br>
                  <b>Regular Overtime:</b> ${form.value.hours} hours<br>
                  <b>Night Differential:</b> ${form.value.nightDifferentialHours} hours`,
        ok: 'Yes',
        cancel: 'No',
        html: true,
      }).onOk(() => {
        q.loading.show();
        const params: CreateFilingRequest = {
          type: 'OVERTIME',
          accountId: authStore.accountInformation?.id ? Number(authStore.accountInformation.id) : 0,
          date: formatDate(form.value.date),
          filingType: 'OVERTIME',
          hours: Number(form.value.hours),
          nightDifferentialHours: Number(form.value.nightDifferentialHours),
          reason: form.value.reason,
        };

        const apiCall = props.filing ? api.patch('hr-filing/filing', { ...params, id: props.filing.id } as UpdateFilingRequest) : api.post('hr-filing/filing', params);

        apiCall
          .then(() => {
            emit('update:modelValue', false);
            emit('saveDone');
          })
          .catch((error) => {
            handleAxiosError(q, error);
          })
          .finally(() => {
            q.loading.hide();
          });
      });
    };

    const cancelRequest = async () => {
      if (!props.filing || !props.filing.id) return;

      q.dialog({
        title: 'Cancel Filing Request',
        message: 'Are you sure you want to cancel this overtime filing request?',
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
        q.loading.show();
        try {
          await api.post('/hr-filing/filing/cancel', {
            id: props.filing!.id,
            remarks: 'Cancelled by requestor',
          });

          q.notify({
            type: 'positive',
            message: 'Overtime filing cancelled successfully',
          });

          emit('update:modelValue', false);

          emit('cancelled');
          emit('saveDone'); // For compatibility with existing refresh logic
        } catch (error) {
          if (error instanceof Error) {
            handleAxiosError(q, error as AxiosError);
          }
        } finally {
          q.loading.hide();
        }
      });
    };

    const hideDialog = () => {
      emit('update:modelValue', false);
    };

    return {
      q,
      form,
      timekeepingData,
      isLoading,
      isEditable,
      hasTimekeepingLogs,
      timeBreakdownColumns,
      fetchData,
      onSubmit,
      cancelRequest,
      hideDialog,
      onDateChange,
      formatShiftTime,
    };
  },
};
</script>

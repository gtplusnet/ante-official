<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" @before-show="fetchData" @hide="$emit('hide')">
    <TemplateDialog
      icon="brightness_6"
      size="sm"
      icon-color="#8e24aa"
      :scrollable="false"
    >
      <template #DialogTitle>
        Schedule Adjustment {{ filing ? `(${filing?.status.label})` : '' }}
      </template>

      <template #DialogContent>
        <q-form @submit.prevent="onSubmit" id="schedule-adjustment-form">
          <div class="schedule-adjustment-content q-pa-md" :class="form.shiftType === 'Time Bound' ? 'time-bound' : ''">
            <div class="q-pb-md">
              <label class="text-label-large">Date</label>
              <g-input class="text-body-medium" v-model="form.date" required :type="!isEditable ? 'readonly' : 'date'" />
            </div>

            <ShiftFormFields v-model="form" :readonly="!isEditable" :hide-shift-code="true" />

            <div v-if="filing?.status.key === 'REJECTED'" class="column">
              <label class="text-label-large">Reason For Rejection</label>
              <g-input class="text-body-medium" type="readonly" v-model="form.reason" />
            </div>
          </div>
        </q-form>
      </template>

      <template #DialogSubmitActions>
        <div v-if="filing?.status.key === 'REJECTED' || filing?.status.key === 'APPROVED'">
          <q-btn no-caps unelevated class="text-label-large text-black" label="Close" type="button" color="light-grey" v-close-popup />
        </div>

        <div v-else class="q-gutter-x-sm">
          <g-button
            no-caps
            unelevated
            variant="tonal"
            type="button"
            color="light-grey"
            @click="filing && filing.status?.key === 'PENDING' ? cancelRequest() : hideDialog()"
          >
            <q-icon v-if="filing" name="block" size="16px" class="q-mr-xs" />
            {{ filing ? 'Cancel Request' : 'Cancel' }}
          </g-button>
          <g-button 
            v-if="isEditable" 
            no-caps 
            unelevated 
            :label="filing ? 'Update' : 'Submit'" 
            type="submit"
            form="schedule-adjustment-form"
            color="secondary" 
          />
        </div>
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<style src="../../Dashboard/RequestPanelWidget/RequestPanelWidget.scss" scoped></style>
<style lang="scss" scoped>
.schedule-adjustment-content {
  @media (max-width: 768px) {
    max-height: 88dvh;
    padding: 16px;
  }

  @media (max-width: 599px) {
    max-height: calc(100vh - 138px);
  }
}
</style>

<script lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import GInput from '../../../../components/shared/form/GInput.vue';
import GButton from '../../../../components/shared/buttons/GButton.vue';
import ShiftFormFields from '../../../../components/shared/form/ShiftFormFields.vue';
import TemplateDialog from '../../../../components/dialog/TemplateDialog.vue';
import { api } from 'src/boot/axios';
import { handleAxiosError } from '../../../../utility/axios.error.handler';
import type { Filing } from '../../Dashboard/RequestPanelWidget/types/filing.types';
import type { ShiftFormData } from '../../../../components/shared/form/ShiftFormFields.vue';
import { AxiosError } from 'axios';

interface FormData extends ShiftFormData {
  date: string;
}

export default {
  name: 'AddViewScheduleAdjustmentDialog',
  components: {
    GInput,
    GButton,
    ShiftFormFields,
    TemplateDialog,
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
    const form = ref<FormData>({
      date: new Date().toISOString().split('T')[0],
      shiftCode: '', // Will be auto-generated
      shiftType: '',
      workingHours: [{ start: '00:00', end: '00:00', isBreakTime: false }],
      targetHours: 0,
      totalBreakHours: 0,
      reason: '',
    });

    // Check if filing is editable (only PENDING or new filings can be edited)
    const isEditable = computed(() => !props.filing || props.filing.status?.key === 'PENDING');

    const generateShiftCode = () => {
      // Generate unique shift code for adjustment
      const timestamp = Date.now();
      const userId = props.filing?.accountId || 'NEW';
      return `ADJ-${userId}-${timestamp}`;
    };

    const createSaveParams = () => {
      // Generate shift code if not exists
      if (!form.value.shiftCode) {
        form.value.shiftCode = generateShiftCode();
      }

      // Convert date to ISO 8601 format
      const isoDate = new Date(form.value.date).toISOString();

      const params = {
        filingType: 'SCHEDULE_ADJUSTMENT',
        date: isoDate,
        shiftData: {
          shiftCode: form.value.shiftCode,
          shiftType: form.value.shiftType,
          targetHours: form.value.targetHours,
          totalBreakHours: form.value.totalBreakHours,
          workingHours:
            form.value.shiftType === 'Time Bound'
              ? form.value.workingHours.map((hour) => ({
                  startTime: hour.start,
                  endTime: hour.end,
                  isBreakTime: hour.isBreakTime,
                }))
              : [],
        },
      };

      return params;
    };

    const onSubmit = () => {
      // Format date for display
      const displayDate = new Date(form.value.date).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });

      // Show confirmation dialog
      q.dialog({
        title: 'Confirm Schedule Adjustment',
        message: `Are you sure you want to file Schedule Adjustment for ${displayDate}?`,
        ok: 'Yes',
        cancel: 'No',
        html: true,
      }).onOk(() => {
        q.loading.show();

        const params = createSaveParams();

        const apiCall = props.filing ? api.patch('hr-filing/filing', { ...params, id: props.filing.id }) : api.post('hr-filing/filing', params);

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

    const fetchData = async () => {
      if (props.filing) {
        // Edit mode - populate with existing data
        const filingDate = props.filing.date ? new Date(props.filing.date.raw) : null;
        const isValidDate = filingDate && !isNaN(filingDate.getTime());
        form.value.date = isValidDate ? filingDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        // Parse shift data if available
        if (props.filing.shiftData && typeof props.filing.shiftData === 'object') {
          const shiftData = props.filing.shiftData as {
            shiftCode?: string;
            shiftType?: string;
            targetHours?: number;
            totalBreakHours?: number;
            workingHours?: Array<{
              startTime?: string;
              endTime?: string;
              isBreakTime?: boolean;
            }>;
          };
          form.value.shiftCode = shiftData.shiftCode || '';
          form.value.shiftType = shiftData.shiftType || '';
          form.value.targetHours = shiftData.targetHours || 0;
          form.value.totalBreakHours = shiftData.totalBreakHours || 0;
          form.value.reason = props.filing.rejectReason || '';

          // Parse working hours if available
          if (shiftData.workingHours && Array.isArray(shiftData.workingHours)) {
            form.value.workingHours = shiftData.workingHours.map((wh) => ({
              start: wh.startTime || '00:00',
              end: wh.endTime || '00:00',
              isBreakTime: wh.isBreakTime || false,
            }));
          }
        }
      } else {
        // Create mode - reset to defaults
        form.value = {
          date: new Date().toISOString().split('T')[0],
          shiftCode: '',
          shiftType: '',
          workingHours: [{ start: '00:00', end: '00:00', isBreakTime: false }],
          targetHours: 0,
          totalBreakHours: 0,
          reason: '',
        };
      }
    };

    const cancelRequest = async () => {
      if (!props.filing || !props.filing.id) return;

      q.dialog({
        title: 'Cancel Filing Request',
        message: 'Are you sure you want to cancel this schedule adjustment filing request?',
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
            message: 'Schedule adjustment filing cancelled successfully',
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
      form,
      isEditable,
      onSubmit,
      fetchData,
      generateShiftCode,
      cancelRequest,
      hideDialog,
    };
  },
};
</script>

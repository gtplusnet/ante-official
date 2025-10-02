<template>
  <q-dialog v-model="dialogOpen" persistent>
    <q-card style="min-width: 500px; max-width: 600px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Adjust Shift</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="q-mb-md">
          <div class="text-subtitle2 text-grey-7">Employee</div>
          <div class="text-body1">{{ employeeName }}</div>
        </div>

        <div class="q-mb-md">
          <div class="text-subtitle2 text-grey-7">Date</div>
          <div class="text-body1">{{ selectedOutputData?.dateFormatted?.date }} ({{ selectedOutputData?.dateFormatted?.day }})</div>
        </div>

        <div class="q-mb-lg">
          <div class="text-subtitle2 text-grey-7">
            Current Shift
            <q-chip v-if="hasIndividualAdjustment" size="sm" color="orange" text-color="white" class="q-ml-sm">
              Adjusted
            </q-chip>
          </div>
          <div class="row items-center q-gutter-sm">
            <q-chip 
              :style="{ backgroundColor: selectedOutputData?.activeShiftType?.color || '#f5f5f5', color: getContrastColor(selectedOutputData?.activeShiftType?.color) }"
              class="text-weight-medium"
            >
              {{ selectedOutputData?.activeShift?.shiftType?.label || 'N/A' }}
            </q-chip>
            <span v-if="currentShiftDetails" class="text-caption text-grey-6">
              {{ currentShiftDetails }}
            </span>
          </div>
        </div>

        <q-separator class="q-mb-lg" />

        <div>
          <q-select
            v-model="selectedShift"
            :options="formattedShiftOptions"
            :loading="shiftsLoading"
            label="Select New Shift"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            outlined
            dense
            :rules="[val => val !== null || 'Please select a shift']"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>
                    <span class="text-weight-medium">{{ scope.opt.label }}</span>
                  </q-item-label>
                  <q-item-label caption v-if="scope.opt.details">
                    {{ scope.opt.details }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
            <template v-slot:selected-item="scope">
              <div v-if="scope.opt">
                <span class="text-weight-medium">{{ scope.opt.label }}</span>
                <span v-if="scope.opt.details" class="text-caption text-grey-6 q-ml-sm">
                  ({{ scope.opt.details }})
                </span>
              </div>
            </template>
          </q-select>
        </div>

        <div v-if="selectedShift && getShiftInfo(selectedShift)" class="q-mt-md q-pa-md bg-blue-1 rounded-borders">
          <div class="text-subtitle2 text-blue-9 q-mb-sm">New Shift Details</div>
          <div class="text-body2">{{ getShiftInfo(selectedShift) }}</div>
        </div>

        <div v-if="hasIndividualAdjustment" class="q-mt-md q-pa-md bg-orange-1 rounded-borders">
          <div class="text-subtitle2 text-orange-9 q-mb-sm">
            <q-icon name="info" size="18px" class="q-mr-xs" />
            Individual Adjustment Detected
          </div>
          <div class="text-body2">This date has an individual shift adjustment that overrides the default schedule.</div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn 
          v-if="hasIndividualAdjustment"
          flat 
          label="Clear Adjustment" 
          color="orange-8" 
          @click="clearShiftAdjustment"
          :loading="clearing"
          icon="clear"
          class="q-mr-auto"
        />
        <q-btn 
          flat 
          label="Cancel" 
          color="grey-7" 
          v-close-popup 
        />
        <q-btn 
          unelevated 
          label="Save" 
          color="primary" 
          @click="saveShiftAdjustment"
          :loading="saving"
          :disable="!selectedShift || selectedShift === currentShiftId"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from '../../../../utility/axios.error.handler';
import { TimekeepingOutputResponse } from '@shared/response';

interface ShiftOption {
  label: string;
  value: number;
  shiftCode?: string;
  startTime?: string;
  endTime?: string;
  workHours?: number;
  workHoursFormatted?: string;
  shiftType?: string;
  details?: string;
}

export default {
  name: 'PayrollShiftAdjustmentDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    employeeAccountId: {
      type: String,
      required: true,
    },
    selectedOutputData: {
      type: Object as () => TimekeepingOutputResponse | null,
      default: null,
    },
    shiftOptions: {
      type: Array as () => ShiftOption[],
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'shift-adjusted'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const dialogOpen = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value),
    });

    const selectedShift = ref<number | null>(null);
    const saving = ref(false);
    const clearing = ref(false);
    const shiftsLoading = ref(false);
    const hasIndividualAdjustment = ref(false);

    // Get current shift ID
    const currentShiftId = computed(() => {
      return props.selectedOutputData?.activeShift?.id || null;
    });

    // Format shift options for display
    const formattedShiftOptions = computed(() => {
      return props.shiftOptions.map((shift: ShiftOption) => {
        let details = '';
        
        if (shift.startTime && shift.endTime) {
          details = `${shift.startTime} - ${shift.endTime}`;
          if (shift.workHoursFormatted) {
            details += ` (${shift.workHoursFormatted})`;
          }
        } else if (shift.shiftType === 'REST_DAY') {
          details = 'Rest Day';
        } else if (shift.shiftType === 'EXTRA_DAY') {
          details = 'Extra Day';
        }

        return {
          ...shift,
          details,
        };
      });
    });

    // Get current shift details for display
    const currentShiftDetails = computed(() => {
      const shift = props.selectedOutputData?.activeShift;
      if (!shift) return '';

      // Check if shift has shiftTime array (detailed shift breakdown)
      if (shift.shiftTime && shift.shiftTime.length > 0) {
        const firstShift = shift.shiftTime[0];
        if (firstShift?.startTime?.time && firstShift?.endTime?.time) {
          let details = `${firstShift.startTime.time} - ${firstShift.endTime.time}`;
          if (firstShift?.workHours?.formatted) {
            details += ` (${firstShift.workHours.formatted})`;
          }
          return details;
        }
      }
      
      // Fallback to simple properties if available
      const shiftAny = shift as any;
      if (shiftAny.startTime && shiftAny.endTime) {
        let details = `${shiftAny.startTime} - ${shiftAny.endTime}`;
        if (shiftAny.workHours) {
          const hours = Math.floor(shiftAny.workHours);
          const minutes = Math.round((shiftAny.workHours - hours) * 60);
          details += ` (${hours}h${minutes > 0 ? ` ${minutes}m` : ''})`;
        }
        return details;
      }
      
      return '';
    });

    // Get shift info for selected shift
    const getShiftInfo = (shiftId: number): string => {
      const shift = props.shiftOptions.find((s: ShiftOption) => s.value === shiftId);
      if (!shift) return '';

      let info = `Type: ${shift.label}`;
      if (shift.startTime && shift.endTime) {
        info += `\nSchedule: ${shift.startTime} - ${shift.endTime}`;
        if (shift.workHoursFormatted) {
          info += `\nWork Hours: ${shift.workHoursFormatted}`;
        }
      }
      return info;
    };

    // Get contrast color for chip text
    const getContrastColor = (hexColor: string | undefined): string => {
      if (!hexColor) return '#000000';
      
      // Remove # if present
      const color = hexColor.replace('#', '');
      
      // Convert to RGB
      const r = parseInt(color.substr(0, 2), 16);
      const g = parseInt(color.substr(2, 2), 16);
      const b = parseInt(color.substr(4, 2), 16);
      
      // Calculate luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      return luminance > 0.5 ? '#000000' : '#ffffff';
    };

    // Save shift adjustment
    const saveShiftAdjustment = async () => {
      if (!selectedShift.value || selectedShift.value === currentShiftId.value) {
        return;
      }

      saving.value = true;
      
      try {
        // Format date as MM/DD/YYYY to match the scheduling format
        const formattedDate = props.selectedOutputData?.dateFormatted?.date; // This should already be in MM/DD/YYYY format
        
        // First, update the shift assignment using the same endpoint as IndividualSchedulingMenuPage
        const assignment = {
          employeeId: props.employeeAccountId,
          date: formattedDate,
          shiftId: selectedShift.value,
        };

        await api.post('/hris/employee/individual-schedule-assignments/bulk', {
          assignments: [assignment]
        });

        // Then recompute timekeeping for this date
        await api.post('/hris/timekeeping/recompute', {
          employeeAccountId: props.employeeAccountId,
          date: props.selectedOutputData?.dateFormatted?.dateStandard,
        });

        $q.notify({
          type: 'positive',
          message: `Shift adjusted successfully for ${props.selectedOutputData?.dateFormatted?.date}`,
          position: 'top',
          timeout: 3000,
        });

        emit('shift-adjusted');
        dialogOpen.value = false;
      } catch (error: any) {
        console.error('Error adjusting shift:', error);
        handleAxiosError($q, error);
      } finally {
        saving.value = false;
      }
    };

    // Check for individual adjustment
    const checkForIndividualAdjustment = async () => {
      try {
        const formattedDate = props.selectedOutputData?.dateFormatted?.date;
        if (!formattedDate) return;

        // Fetch individual schedule assignments to check if there's an adjustment
        const response = await api.get('/hris/employee/individual-schedule-assignments', {
          params: {
            startDate: formattedDate,
            endDate: formattedDate,
            employeeIds: [props.employeeAccountId]
          }
        });

        if (response.data && response.data.length > 0) {
          // Check if there's an individual assignment for this date
          const assignment = response.data.find((a: any) => 
            a.employeeId === props.employeeAccountId && 
            a.date === formattedDate
          );
          
          hasIndividualAdjustment.value = !!assignment && assignment.shiftId !== null;
        } else {
          hasIndividualAdjustment.value = false;
        }
      } catch (error) {
        console.error('Error checking for individual adjustment:', error);
        hasIndividualAdjustment.value = false;
      }
    };

    // Clear shift adjustment
    const clearShiftAdjustment = async () => {
      clearing.value = true;
      
      try {
        const formattedDate = props.selectedOutputData?.dateFormatted?.date;
        
        // Clear the adjustment by setting shiftId to null
        const assignment = {
          employeeId: props.employeeAccountId,
          date: formattedDate,
          shiftId: null, // This will clear the individual adjustment
        };

        await api.post('/hris/employee/individual-schedule-assignments/bulk', {
          assignments: [assignment]
        });

        // Then recompute timekeeping for this date
        await api.post('/hris/timekeeping/recompute', {
          employeeAccountId: props.employeeAccountId,
          date: props.selectedOutputData?.dateFormatted?.dateStandard,
        });

        $q.notify({
          type: 'positive',
          message: `Shift adjustment cleared for ${props.selectedOutputData?.dateFormatted?.date}`,
          position: 'top',
          timeout: 3000,
        });

        emit('shift-adjusted');
        dialogOpen.value = false;
      } catch (error: any) {
        console.error('Error clearing shift adjustment:', error);
        handleAxiosError($q, error);
      } finally {
        clearing.value = false;
      }
    };

    // Reset when dialog opens
    watch(dialogOpen, async (newValue) => {
      if (newValue) {
        selectedShift.value = currentShiftId.value;
        await checkForIndividualAdjustment();
      }
    });

    return {
      dialogOpen,
      selectedShift,
      saving,
      clearing,
      shiftsLoading,
      currentShiftId,
      formattedShiftOptions,
      currentShiftDetails,
      hasIndividualAdjustment,
      saveShiftAdjustment,
      clearShiftAdjustment,
      getShiftInfo,
      getContrastColor,
    };
  },
};
</script>

<style scoped>
.rounded-borders {
  border-radius: 8px;
}
</style>
<template>
  <div>
    <!-- Shift Code - only show if not hidden -->
    <div v-if="!hideShiftCode" class="q-mb-md">
      <g-input v-model="localForm.shiftCode" label="Shift Code" :readonly="readonly" />
    </div>

    <!-- Shift Type -->
    <div>
      <g-input :type="!readonly ? 'select' : 'readonly'" :modelValue="localForm.shiftType" @update:modelValue="updateShiftType" label="Shift Type" apiUrl="/hr-configuration/shift/type" />
    </div>

    <!-- Time Bound Configuration -->
    <div v-if="localForm.shiftType === 'Time Bound' || localForm.shiftType === 'TIME_BOUND'">
      <div class="q-mt-md q-mb-md row justify-end">
        <div class="text-subtitle2 q-mr-md">
          Shift Working Hours: <span class="text-weight-regular">{{ computedTotalHours }}</span>
        </div>
        <div class="text-subtitle2">
          Shift Break Hours: <span class="text-weight-regular">{{ computedTotalBreakHours }}</span>
        </div>
      </div>

      <!-- Initial shift time row -->
      <div v-if="localForm.workingHours && localForm.workingHours.length > 0" class="se-section q-pa-md q-mb-md bg-grey-2 row justify-start">
        <div class="col-4 se-input">
          <div class="text-subtitle2">Start</div>
          <q-input v-model="localForm.workingHours[0].start" type="time" outlined dense class="time-input" :readonly="readonly" />
        </div>
        <div class="col-4 se-input">
          <div class="text-subtitle2">End</div>
          <q-input v-model="localForm.workingHours[0].end" type="time" outlined dense class="time-input" :readonly="readonly" />
        </div>
        <div class="col-4 self-stretch text-right"></div>
      </div>

      <!-- Repeated rows for shift time -->
      <div v-for="(hours, index) in localForm.workingHours.slice(1)" :key="index" class="q-pa-md q-mb-md bg-grey-2">
        <div class="row items-center q-gutter-y-sm se-section">
          <!-- Start Time -->
          <div class="col-4 se-input">
            <q-input v-model="localForm.workingHours[index + 1].start" type="time" label="Start" outlined dense class="time-input" :readonly="readonly" />
          </div>

          <!-- End Time -->
          <div class="col-4 se-input">
            <q-input v-model="localForm.workingHours[index + 1].end" type="time" label="End" outlined dense class="time-input" :readonly="readonly" />
          </div>

          <!-- Remove Button -->
          <div class="remove-btn col-4 row justify-end items-center">
            <q-btn v-if="!readonly" no-caps outline type="button" color="grey-10" icon="close" @click="removeWorkingHoursRow(index + 1)">
              <span class="gt-xs">Remove</span>
            </q-btn>
          </div>
        </div>

        <!-- Checkbox below -->
        <div class="q-mt-sm">
          <q-checkbox v-model="localForm.workingHours[index + 1].isBreakTime" label="Break Hours" :disable="readonly" />
        </div>
      </div>

      <div v-if="!readonly" class="text-right">
        <q-btn no-caps type="button" color="primary" outline icon="add" @click="addWorkingHoursRow" />
      </div>
    </div>

    <!-- Working Hours and Break Hours -->
    <div class="q-pa-md q-mb-md q-mt-md bg-grey-2 row justify-start wbr-section">
      <div class="col-4 wbr-input" v-if="localForm.shiftType !== 'Time Bound' && localForm.shiftType !== 'TIME_BOUND'">
        <div class="text-subtitle2">Working Hours</div>
        <q-input v-model="localForm.targetHours" type="number" min="0" outlined dense class="time-input" :readonly="readonly" />
      </div>
      <div class="col-4 wbr-input">
        <div class="text-subtitle2">Flexible Break Hours</div>
        <q-input v-model="localForm.totalBreakHours" type="number" min="0" outlined dense class="time-input" :readonly="readonly" />
      </div>
      <div class="col-4 gt-xs self-stretch text-right"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick, PropType } from 'vue';
import { useQuasar } from 'quasar';
import GInput from './GInput.vue';

interface WorkingHour {
  start: string;
  end: string;
  isBreakTime: boolean;
}

export interface ShiftFormData {
  shiftCode: string;
  shiftType: string;
  workingHours: WorkingHour[];
  targetHours: number;
  totalBreakHours: number;
  reason: string;
}

export default defineComponent({
  name: 'ShiftFormFields',
  components: {
    GInput,
  },
  props: {
    modelValue: {
      type: Object as PropType<ShiftFormData>,
      required: true,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    hideShiftCode: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const q = useQuasar();

    // Local copy of form data
    const localForm = ref<ShiftFormData>({
      shiftCode: '',
      shiftType: '',
      workingHours: [{ start: '00:00', end: '00:00', isBreakTime: false }],
      targetHours: 0,
      totalBreakHours: 0,
      reason: '',
    });

    // Initialize form from props
    if (props.modelValue) {
      Object.assign(localForm.value, props.modelValue);
      // Ensure workingHours array has at least one element
      if (!localForm.value.workingHours || localForm.value.workingHours.length === 0) {
        localForm.value.workingHours = [{ start: '00:00', end: '00:00', isBreakTime: false }];
      }
    }

    // Watch for prop changes and update local form
    watch(
      () => props.modelValue,
      (newValue) => {
        if (newValue && !isUpdating.value) {
          // Only update fields that actually changed
          Object.keys(newValue).forEach((key) => {
            const typedKey = key as keyof ShiftFormData;
            if (localForm.value[typedKey] !== newValue[typedKey]) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (localForm.value as any)[typedKey] = newValue[typedKey];
            }
          });
          // Ensure workingHours array has at least one element after update
          if (!localForm.value.workingHours || localForm.value.workingHours.length === 0) {
            localForm.value.workingHours = [{ start: '00:00', end: '00:00', isBreakTime: false }];
          }
        }
      },
      { deep: true }
    );

    // Flag to prevent circular updates
    const isUpdating = ref(false);

    // Watch for local changes and emit
    watch(
      localForm,
      (newValue) => {
        isUpdating.value = true;
        emit('update:modelValue', { ...newValue });
        // Reset flag after next tick
        nextTick(() => {
          isUpdating.value = false;
        });
      },
      { deep: true }
    );

    const updateShiftType = (value: string) => {
      localForm.value.shiftType = value;
    };

    const computedTotalBreakHours = computed(() => {
      let totalMinutes = 0;

      localForm.value.workingHours.forEach((hours) => {
        if (hours.start && hours.end && hours.isBreakTime) {
          const [startHour, startMinute] = hours.start.split(':').map(Number);
          const [endHour, endMinute] = hours.end.split(':').map(Number);

          let durationMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);

          if (durationMinutes < 0) {
            durationMinutes += 24 * 60;
          }
          totalMinutes += durationMinutes;
        }
      });

      const calculatedTotalHours = (totalMinutes / 60).toFixed(2);
      return calculatedTotalHours > '0' ? calculatedTotalHours : '0';
    });

    const computedTotalHours = computed(() => {
      let totalMinutes = 0;
      localForm.value.workingHours.forEach((hours) => {
        if (hours.start && hours.end && !hours.isBreakTime) {
          const [startHour, startMinute] = hours.start.split(':').map(Number);
          const [endHour, endMinute] = hours.end.split(':').map(Number);

          let durationMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);

          if (durationMinutes < 0) {
            durationMinutes += 24 * 60;
          }
          totalMinutes += durationMinutes;
        }
      });
      const calculatedTotalHours = (totalMinutes / 60).toFixed(2);
      return calculatedTotalHours > '0' ? calculatedTotalHours : '0';
    });

    const addWorkingHoursRow = () => {
      const lastEndTime = localForm.value.workingHours.length > 0 ? localForm.value.workingHours[localForm.value.workingHours.length - 1].end : '00:00';

      localForm.value.workingHours.push({
        start: lastEndTime || '00:00',
        end: '00:00',
        isBreakTime: false,
      });
    };

    const removeWorkingHoursRow = (index: number) => {
      if (localForm.value.workingHours.length > 1) {
        localForm.value.workingHours.splice(index, 1);
      } else {
        q.notify({ type: 'warning', message: 'At least one time interval is required.' });
        localForm.value.workingHours[0] = { start: '00:00', end: '00:00', isBreakTime: false };
      }
    };

    const timeToMinutes = (timeStr: string): number => {
      if (!timeStr || !timeStr.includes(':')) return 0;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const validateWorkingHours = (): boolean => {
      if (!localForm.value.workingHours || localForm.value.workingHours.length <= 1) {
        return true;
      }

      const intervals = localForm.value.workingHours
        .map((wh) => {
          const startMinutes = timeToMinutes(wh.start);
          let endMinutes = timeToMinutes(wh.end);

          // If end time is 00:00 it should mean the end of the day (1440 minutes)
          // unless start time is also 00:00
          if (endMinutes === 0 && startMinutes !== 0) {
            endMinutes = 24 * 60;
          }
          // Handle overnight intervals where end time is on the next day
          else if (endMinutes < startMinutes) {
            endMinutes += 24 * 60;
          }

          return { startMinutes, endMinutes };
        })
        .filter((interval) => interval.startMinutes !== interval.endMinutes); // Ignore zero-duration intervals

      if (intervals.length <= 1) {
        return true; // No overlaps possible if only one valid interval remains
      }

      intervals.sort((a, b) => a.startMinutes - b.startMinutes);

      for (let i = 0; i < intervals.length - 1; i++) {
        if (intervals[i].endMinutes > intervals[i + 1].startMinutes) {
          console.warn('Overlap detected:', localForm.value.workingHours[i], localForm.value.workingHours[i + 1]);
          return false; // Overlap found
        }
      }

      return true;
    };

    return {
      localForm,
      computedTotalBreakHours,
      computedTotalHours,
      addWorkingHoursRow,
      removeWorkingHoursRow,
      validateWorkingHours,
      updateShiftType,
    };
  },
});
</script>

<style scoped>
.time-input {
  max-width: 150px;

  @media (max-width: 599px) {
    max-width: 150px;
  }
}

.se-section {
  @media (max-width: 599px) {
    gap: 10px;
  }
}

.se-input {
  @media (max-width: 599px) {
    width: 120px;
  }
}

.remove-btn {
  @media (max-width: 599px) {
    width: 55px;
  }
}

.wbr-section {
  @media (max-width: 599px) {
    justify-content: space-between;
  }
}

.wbr-input {
  @media (max-width: 599px) {
    width: 150px;
  }
}
</style>

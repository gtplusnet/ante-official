<template>
  <q-dialog v-model="dialogModel" @hide="onDialogHide">
    <q-card class="dialog-card">
      <!-- Header -->
      <q-card-section class="q-pb-sm">
        <div class="row items-center">
          <div class="text-h6">Create Team Schedule</div>
          <q-space />
          <q-btn 
            icon="close" 
            flat 
            round 
            dense 
            v-close-popup 
          />
        </div>
      </q-card-section>
      
      <q-separator />
      
      <!-- Form Fields -->
      <q-card-section class="q-pt-md">
        <!-- Date Range Section -->
        <div class="text-subtitle2 q-mb-sm">Date Range</div>
        <div class="row q-gutter-sm q-mb-sm">
          <div class="col">
            <q-input
              v-model="formData.fromDate"
              label="From"
              outlined
              dense
              mask="##/##/####"
              placeholder="MM/DD/YYYY"
              :rules="[val => !!val || 'From date is required']"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date 
                      v-model="formData.fromDate" 
                      mask="MM/DD/YYYY"
                      @update:model-value="validateDateRange"
                    >
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col">
            <q-input
              v-model="formData.toDate"
              label="To"
              outlined
              dense
              mask="##/##/####"
              placeholder="MM/DD/YYYY"
              :rules="[val => !!val || 'To date is required', validateToDate]"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date 
                      v-model="formData.toDate" 
                      mask="MM/DD/YYYY"
                      @update:model-value="validateDateRange"
                    >
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>
        
        <!-- Select Team -->
        <div class="q-mb-sm">
          <q-select
            v-model="formData.teamId"
            :options="teamOptions"
            label="Select Team"
            outlined
            dense
            emit-value
            map-options
            option-label="label"
            option-value="value"
            :rules="[val => !!val || 'Team is required']"
          />
        </div>
        
        <!-- Project/Branch -->
        <div class="q-mb-md">
          <q-select
            v-model="formData.projectId"
            :options="projectOptions"
            label="Project/Branch"
            outlined
            dense
            emit-value
            map-options
            option-label="label"
            option-value="value"
          />
        </div>
        
        <!-- Shift Code -->
        <div class="q-mb-md">
          <q-select
            v-model="formData.shiftId"
            :options="shiftOptions"
            label="Shift Code"
            outlined
            dense
            emit-value
            map-options
            option-label="label"
            option-value="value"
          />
        </div>

        <!-- Actions -->
      <div align="right">
        <q-btn 
          label="Cancel" 
          flat 
          color="light-gray"
          class="q-mr-sm"
          outlined
          no-caps
          unelevated
          v-close-popup
        />
        <q-btn 
          no-caps
          unelevated
          label="Save" 
          color="primary"
          :loading="saving"
          :disable="!isFormValid"
          @click="handleSave"
        />
      </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { handleAxiosError } from '../../../../utility/axios.error.handler';

interface TeamOption {
  label: string;
  value: number;
}

interface ProjectOption {
  label: string;
  value: number | null;
}

interface ShiftOption {
  label: string;
  value: number | null;
}

export default defineComponent({
  name: 'CreateTeamScheduleDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    teams: {
      type: Array as PropType<TeamOption[]>,
      default: () => []
    },
    projects: {
      type: Array as PropType<ProjectOption[]>,
      default: () => []
    },
    shifts: {
      type: Array as PropType<ShiftOption[]>,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'saved'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const saving = ref(false);
    
    // Form data
    const formData = ref({
      fromDate: '',
      toDate: '',
      teamId: null as number | null,
      projectId: null as number | null,
      shiftId: null as number | null
    });
    
    // Dialog model
    const dialogModel = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val)
    });
    
    // Options for dropdowns
    const teamOptions = computed(() => props.teams);
    const projectOptions = computed(() => props.projects);
    const shiftOptions = computed(() => props.shifts);
    
    // Validate that to date is after or equal to from date
    const validateToDate = (val: string) => {
      if (!val) return 'To date is required';
      if (!formData.value.fromDate) return true;
      
      const from = new Date(formData.value.fromDate);
      const to = new Date(val);
      
      if (to < from) {
        return 'To date must be after or equal to From date';
      }
      return true;
    };
    
    // Validate date range
    const validateDateRange = () => {
      // Trigger validation when dates change
      return true;
    };
    
    // Check if form is valid
    const isFormValid = computed(() => {
      return !!(
        formData.value.fromDate &&
        formData.value.toDate &&
        formData.value.teamId &&
        validateToDate(formData.value.toDate) === true
      );
    });
    
    // Generate array of dates between from and to (inclusive)
    const generateDateRange = (fromDate: string, toDate: string): string[] => {
      const dates: string[] = [];
      const from = new Date(fromDate);
      const to = new Date(toDate);
      
      // Format date to YYYY-MM-DD for API
      const formatDateForAPI = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // Generate all dates in range
      const current = new Date(from);
      while (current <= to) {
        dates.push(formatDateForAPI(new Date(current)));
        current.setDate(current.getDate() + 1);
      }
      
      return dates;
    };
    
    // Handle save
    const handleSave = async () => {
      if (!isFormValid.value) return;
      
      try {
        saving.value = true;
        
        // Generate dates in range
        const dates = generateDateRange(formData.value.fromDate, formData.value.toDate);
        
        // Create assignments for each date
        const assignments = dates.map(date => ({
          teamId: formData.value.teamId,
          date: date,
          projectId: formData.value.projectId,
          shiftId: formData.value.shiftId
        }));
        
        // Save using bulk endpoint
        await api.post('/hr/team/schedule-assignments/bulk', {
          assignments
        });
        
        // Show success message
        $q.notify({
          type: 'positive',
          message: `Schedule created for ${dates.length} day${dates.length > 1 ? 's' : ''}`,
          position: 'top',
          timeout: 2000
        });
        
        // Emit saved event and close dialog
        emit('saved');
        dialogModel.value = false;
      } catch (error: any) {
        console.error('Error saving team schedule:', error);
        handleAxiosError($q, error);
      } finally {
        saving.value = false;
      }
    };
    
    // Reset form when dialog closes
    const onDialogHide = () => {
      formData.value = {
        fromDate: '',
        toDate: '',
        teamId: null,
        projectId: null,
        shiftId: null
      };
    };
    
    return {
      dialogModel,
      formData,
      saving,
      teamOptions,
      projectOptions,
      shiftOptions,
      isFormValid,
      validateToDate,
      validateDateRange,
      handleSave,
      onDialogHide
    };
  }
});
</script>

<style scoped>
.dialog-card {
  border-radius: 16px;
  min-width: 400px;
  min-height: fit-content;
}
</style>
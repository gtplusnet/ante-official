<template>
  <q-dialog v-model="show" class="md3-dialog-dense">
    <q-card style="width: 800px; max-width: 90vw">
      <!-- MD3 Dense Header -->
      <div class="md3-header-dense">
        <q-icon name="schedule" size="20px" />
        <span class="md3-title">My Shift</span>
        <q-space />
        <q-btn flat round dense icon="close" size="sm" v-close-popup />
      </div>

      <!-- MD3 Dense Content -->
      <q-card-section class="md3-content-dense">
        <!-- Loading State -->
        <div v-if="loading" class="md3-loading-dense">
          <q-spinner-dots size="40px" color="primary" />
          <div class="loading-text">Loading shift information...</div>
        </div>

        <!-- Content -->
        <div v-else-if="shiftData">
          <!-- Current Shift Section -->
          <div class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="access_time" size="18px" />
              Current Shift Assignment
            </div>
            <div class="md3-grid-dense cols-4">
              <div class="md3-card-dense">
                <div class="md3-card-title">Shift Name</div>
                <div class="md3-card-value" style="font-size: 16px;">
                  {{ shiftData.currentShift.shiftName || 'Not Assigned' }}
                </div>
              </div>
              <div class="md3-card-dense">
                <div class="md3-card-title">Start Time</div>
                <div class="md3-card-value" style="font-size: 16px;">
                  {{ formatTime(shiftData.currentShift.startTime) || '--:--' }}
                </div>
              </div>
              <div class="md3-card-dense">
                <div class="md3-card-title">End Time</div>
                <div class="md3-card-value" style="font-size: 16px;">
                  {{ formatTime(shiftData.currentShift.endTime) || '--:--' }}
                </div>
              </div>
              <div class="md3-card-dense">
                <div class="md3-card-title">Break Duration</div>
                <div class="md3-card-value" style="font-size: 16px;">
                  {{ shiftData.currentShift.breakDuration || 0 }} min
                </div>
              </div>
            </div>
          </div>

          <!-- Weekly Schedule Section -->
          <div class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="calendar_month" size="18px" />
              Weekly Schedule
            </div>
            <div class="weekly-schedule-grid">
              <div 
                v-for="day in shiftData.weeklySchedule" 
                :key="day.day"
                class="day-card"
                :class="{ 'rest-day': day.isRestDay }"
              >
                <div class="day-header">
                  <span class="day-name">{{ day.day }}</span>
                  <q-chip 
                    v-if="day.isRestDay" 
                    dense 
                    size="xs"
                    color="grey-4"
                    text-color="grey-8"
                  >
                    REST DAY
                  </q-chip>
                </div>
                <div v-if="!day.isRestDay" class="day-content">
                  <div class="time-slot">
                    <q-icon name="login" size="16px" color="green" />
                    <span>{{ formatTime(day.startTime) || '--:--' }}</span>
                  </div>
                  <div class="time-slot">
                    <q-icon name="logout" size="16px" color="red" />
                    <span>{{ formatTime(day.endTime) || '--:--' }}</span>
                  </div>
                </div>
                <div v-else class="day-content rest">
                  <q-icon name="weekend" size="24px" color="grey" />
                </div>
              </div>
            </div>
          </div>

          <!-- Schedule Assignment Details -->
          <div v-if="shiftData.scheduleAssignment" class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="info" size="18px" />
              Assignment Details
            </div>
            <div class="md3-info-row-dense">
              <span class="md3-info-label">Effective Date:</span>
              <span class="md3-info-value">
                {{ formatDate(shiftData.scheduleAssignment.effectiveDate) || 'Not specified' }}
              </span>
            </div>
            <div class="md3-info-row-dense">
              <span class="md3-info-label">Schedule Type:</span>
              <span class="md3-info-value">
                <span class="md3-badge-dense info">
                  {{ shiftData.scheduleAssignment.scheduleType || 'Regular' }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="md3-empty-dense">
          <q-icon name="error_outline" />
          <div class="empty-title">Error Loading Data</div>
          <div class="empty-subtitle">{{ error }}</div>
        </div>

        <!-- Empty State -->
        <div v-else class="md3-empty-dense">
          <q-icon name="event_busy" />
          <div class="empty-title">No Shift Assigned</div>
          <div class="empty-subtitle">You don't have a shift schedule assigned yet</div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { date } from 'quasar';
import employeeInfoService, { type ShiftDetailsResponse } from 'src/services/employee-info.service';

export default defineComponent({
  name: 'MyShiftDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const show = ref(props.modelValue);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const shiftData = ref<ShiftDetailsResponse | null>(null);

    // Watch for prop changes
    watch(() => props.modelValue, (newVal) => {
      show.value = newVal;
      if (newVal) {
        loadShiftDetails();
      }
    });

    // Emit changes
    watch(show, (newVal) => {
      emit('update:modelValue', newVal);
    });

    const loadShiftDetails = async () => {
      loading.value = true;
      error.value = null;
      try {
        shiftData.value = await employeeInfoService.getShiftDetails();
      } catch (err: any) {
        console.error('Error loading shift details:', err);
        error.value = err.response?.data?.message || 'Failed to load shift details';
      } finally {
        loading.value = false;
      }
    };

    const formatTime = (timeString: string | undefined) => {
      if (!timeString) return null;
      // If it's already in HH:MM format, return as is
      if (timeString.match(/^\d{1,2}:\d{2}/)) {
        return timeString;
      }
      // Otherwise, try to parse and format
      try {
        const time = new Date(`2000-01-01T${timeString}`);
        return date.formatDate(time, 'h:mm A');
      } catch {
        return timeString;
      }
    };

    const formatDate = (dateString: string | Date | undefined) => {
      if (!dateString) return null;
      return date.formatDate(dateString, 'MMM DD, YYYY');
    };

    return {
      show,
      loading,
      error,
      shiftData,
      formatTime,
      formatDate,
    };
  },
});
</script>

<style scoped lang="scss">
@import './md3-dialog-styles.scss';

.weekly-schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
  
  .day-card {
    background: white;
    border: 1px solid var(--md3-outline-variant);
    border-radius: 8px;
    padding: 8px;
    transition: all 0.2s;
    
    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    &.rest-day {
      background: var(--md3-surface-container-low);
      opacity: 0.8;
    }
    
    .day-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--md3-outline-variant);
      
      .day-name {
        font-size: 12px;
        font-weight: 600;
        color: var(--md3-on-surface);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }
    
    .day-content {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-height: 50px;
      
      &.rest {
        align-items: center;
        justify-content: center;
      }
      
      .time-slot {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--md3-on-surface-variant);
        
        .q-icon {
          flex-shrink: 0;
        }
      }
    }
  }
}

@media (max-width: 600px) {
  .weekly-schedule-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
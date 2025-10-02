<template>
  <q-dialog v-model="show" class="md3-dialog-dense">
    <q-card style="width: 800px; max-width: 90vw">
      <div class="md3-header-dense">
        <q-icon name="access_time" size="20px" />
        <span class="md3-title">Time Sheet</span>
        <q-space />
        <q-btn flat round dense icon="close" size="sm" v-close-popup />
      </div>
      <q-card-section class="md3-content-dense">
        <div class="md3-dialog-content-wrapper">
          <div v-if="loading" class="md3-loading-dense">
            <q-spinner-dots size="40px" color="primary" />
            <div class="loading-text">Loading timesheet...</div>
          </div>
          <div v-else-if="timesheetData">
          <!-- Current Period Summary -->
          <div class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="date_range" size="18px" />
              Current Period Summary
            </div>
            <div class="md3-grid-dense cols-4">
              <div class="md3-card-dense">
                <div class="md3-card-title">Total Hours</div>
                <div class="md3-card-value" style="font-size: 20px;">{{ timesheetData.currentPeriod.totalHours }}</div>
                <div class="md3-card-subtitle">hours worked</div>
              </div>
              <div class="md3-card-dense">
                <div class="md3-card-title">Overtime</div>
                <div class="md3-card-value" style="font-size: 20px; color: var(--q-positive);">
                  {{ timesheetData.currentPeriod.overtimeHours }}
                </div>
                <div class="md3-card-subtitle">OT hours</div>
              </div>
              <div class="md3-card-dense">
                <div class="md3-card-title">Late</div>
                <div class="md3-card-value" style="font-size: 20px; color: var(--q-warning);">
                  {{ timesheetData.currentPeriod.lateMinutes }}
                </div>
                <div class="md3-card-subtitle">minutes</div>
              </div>
              <div class="md3-card-dense">
                <div class="md3-card-title">Undertime</div>
                <div class="md3-card-value" style="font-size: 20px; color: var(--q-negative);">
                  {{ timesheetData.currentPeriod.undertime }}
                </div>
                <div class="md3-card-subtitle">minutes</div>
              </div>
            </div>
          </div>

          <!-- Attendance Summary -->
          <div class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="analytics" size="18px" />
              Attendance Summary
            </div>
            <div class="md3-grid-dense cols-4">
              <div class="attendance-stat">
                <q-circular-progress
                  :value="timesheetData.attendanceSummary.present"
                  :max="30"
                  size="60px"
                  :thickness="0.2"
                  color="positive"
                  track-color="grey-3"
                  class="q-ma-sm"
                />
                <div class="text-center">
                  <div class="text-weight-medium">{{ timesheetData.attendanceSummary.present }}</div>
                  <div class="text-dense-caption">Present</div>
                </div>
              </div>
              <div class="attendance-stat">
                <q-circular-progress
                  :value="timesheetData.attendanceSummary.absent"
                  :max="30"
                  size="60px"
                  :thickness="0.2"
                  color="negative"
                  track-color="grey-3"
                  class="q-ma-sm"
                />
                <div class="text-center">
                  <div class="text-weight-medium">{{ timesheetData.attendanceSummary.absent }}</div>
                  <div class="text-dense-caption">Absent</div>
                </div>
              </div>
              <div class="attendance-stat">
                <q-circular-progress
                  :value="timesheetData.attendanceSummary.late"
                  :max="30"
                  size="60px"
                  :thickness="0.2"
                  color="warning"
                  track-color="grey-3"
                  class="q-ma-sm"
                />
                <div class="text-center">
                  <div class="text-weight-medium">{{ timesheetData.attendanceSummary.late }}</div>
                  <div class="text-dense-caption">Late</div>
                </div>
              </div>
              <div class="attendance-stat">
                <q-circular-progress
                  :value="timesheetData.attendanceSummary.onLeave"
                  :max="30"
                  size="60px"
                  :thickness="0.2"
                  color="info"
                  track-color="grey-3"
                  class="q-ma-sm"
                />
                <div class="text-center">
                  <div class="text-weight-medium">{{ timesheetData.attendanceSummary.onLeave }}</div>
                  <div class="text-dense-caption">On Leave</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Time Logs -->
          <div v-if="timesheetData.recentLogs.length > 0" class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="history" size="18px" />
              Recent Time Logs
            </div>
            <table class="md3-table-dense">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time In</th>
                  <th>Break In</th>
                  <th>Break Out</th>
                  <th>Time Out</th>
                  <th>Total Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in timesheetData.recentLogs" :key="log.date">
                  <td>{{ formatDate(log.date) }}</td>
                  <td>{{ log.timeIn || '-' }}</td>
                  <td>{{ log.breakIn || '-' }}</td>
                  <td>{{ log.breakOut || '-' }}</td>
                  <td>{{ log.timeOut || '-' }}</td>
                  <td><strong>{{ log.totalHours }}</strong></td>
                  <td>
                    <span class="md3-badge-dense" :class="getStatusClass(log.status)">
                      {{ log.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="md3-empty-dense">
          <q-icon name="schedule" />
          <div class="empty-title">No Timesheet Data</div>
          <div class="empty-subtitle">Timesheet information not available</div>
        </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { date } from 'quasar';
import employeeInfoService, { type TimesheetResponse } from 'src/services/employee-info.service';

export default defineComponent({
  name: 'TimeSheetDialog',
  props: { modelValue: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const show = ref(props.modelValue);
    const loading = ref(false);
    const timesheetData = ref<TimesheetResponse | null>(null);

    watch(() => props.modelValue, (newVal) => {
      show.value = newVal;
      if (newVal) loadTimesheet();
    });

    watch(show, (newVal) => emit('update:modelValue', newVal));

    const loadTimesheet = async () => {
      loading.value = true;
      try {
        timesheetData.value = await employeeInfoService.getTimesheet();
      } catch (err) {
        console.error('Error loading timesheet:', err);
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (dateString: any) => date.formatDate(dateString, 'MMM DD, YYYY');
    const getStatusClass = (status: string) => {
      const lower = status.toLowerCase();
      if (lower.includes('present')) return 'active';
      if (lower.includes('absent')) return 'inactive';
      if (lower.includes('late')) return 'pending';
      return 'info';
    };

    return { show, loading, timesheetData, formatDate, getStatusClass };
  },
});
</script>

<style scoped lang="scss">
@import './md3-dialog-styles.scss';

.attendance-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
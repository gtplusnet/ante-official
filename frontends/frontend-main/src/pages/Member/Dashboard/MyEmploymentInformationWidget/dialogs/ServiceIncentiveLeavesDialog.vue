<template>
  <q-dialog v-model="show" class="md3-dialog-dense">
    <q-card style="width: 700px; max-width: 90vw">
      <div class="md3-header-dense">
        <q-icon name="beach_access" size="20px" />
        <span class="md3-title">Service Incentive Leaves</span>
        <q-space />
        <q-btn flat round dense icon="close" size="sm" v-close-popup />
      </div>
      <q-card-section class="md3-content-dense">
        <div class="md3-dialog-content-wrapper">
          <div v-if="loading" class="md3-loading-dense">
            <q-spinner-dots size="40px" color="primary" />
            <div class="loading-text">Loading leave information...</div>
          </div>
          <div v-else-if="leavesData">
          <div class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="event_available" size="18px" />
              Leave Balances
            </div>
            <div class="md3-grid-dense cols-3">
              <div v-for="balance in leavesData.leaveBalances" :key="balance.leaveType" class="md3-card-dense">
                <div class="md3-card-title">{{ balance.leaveType }}</div>
                <div class="md3-card-value" style="font-size: 18px;">
                  {{ balance.remainingDays }}/{{ balance.totalDays }}
                </div>
                <div class="md3-card-subtitle">days remaining</div>
                <q-linear-progress :value="balance.remainingDays / balance.totalDays" color="primary" style="margin-top: 8px;" />
              </div>
            </div>
          </div>
          <div v-if="leavesData.leaveHistory && leavesData.leaveHistory.length > 0" class="md3-section-dense">
            <div class="md3-section-title">
              <q-icon name="history" size="18px" />
              Recent Leave History
            </div>
            <table class="md3-table-dense">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="leave in leavesData.leaveHistory" :key="leave.id">
                  <td>{{ leave.leaveType }}</td>
                  <td>{{ formatDate(leave.startDate) }}</td>
                  <td>{{ formatDate(leave.endDate) }}</td>
                  <td>{{ leave.days }}</td>
                  <td>
                    <span class="md3-badge-dense" :class="getStatusClass(leave.status)">
                      {{ leave.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="md3-empty-dense">
          <q-icon name="event_busy" />
          <div class="empty-title">No Leave Information</div>
          <div class="empty-subtitle">Leave balance information not available</div>
        </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { date } from 'quasar';
import employeeInfoService, { type LeavesResponse } from 'src/services/employee-info.service';

export default defineComponent({
  name: 'ServiceIncentiveLeavesDialog',
  props: { modelValue: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const show = ref(props.modelValue);
    const loading = ref(false);
    const leavesData = ref<LeavesResponse | null>(null);

    watch(() => props.modelValue, (newVal) => {
      show.value = newVal;
      if (newVal) loadLeaves();
    });

    watch(show, (newVal) => emit('update:modelValue', newVal));

    const loadLeaves = async () => {
      loading.value = true;
      try {
        leavesData.value = await employeeInfoService.getLeaves();
      } catch (err) {
        console.error('Error loading leaves:', err);
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (dateString: any) => date.formatDate(dateString, 'MMM DD, YYYY');
    const getStatusClass = (status: string) => {
      const lower = status.toLowerCase();
      if (lower.includes('approved')) return 'active';
      if (lower.includes('rejected')) return 'inactive';
      return 'pending';
    };

    return { show, loading, leavesData, formatDate, getStatusClass };
  },
});
</script>

<style scoped lang="scss">
@import './md3-dialog-styles.scss';
</style>
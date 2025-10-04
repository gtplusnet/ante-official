<template>
  <div class="dashboard-card-container">
    <GlobalWidgetCounter
      icon="downloading"
      icon-color="var(--q-primary)"
      :value="pendingApprovalsDisplay"
      label="Pending Approvals"
      card-class="dashboard-card-1"
      :loading="loading"
      :clickable="true"
      @click="showPendingApprovalsDialog = true"
    />
    <GlobalWidgetCounter
      icon="today"
      icon-color="var(--q-secondary)"
      :value="daysBeforeCutoffDisplay"
      label="Days Before Cut-off"
      card-class="dashboard-card-2"
      :loading="loading"
      :clickable="true"
      @click="showCutoffDatesDialog = true"
    />
    <GlobalWidgetCounter
      icon="checklist"
      icon-color="var(--q-accent)"
      :value="pendingProcessingDisplay"
      label="Pending Processing"
      card-class="dashboard-card-3"
      :loading="loading"
    />
    <GlobalWidgetCounter
      icon="event"
      icon-color="#9333ea"
      :value="leavesThisMonth.toString()"
      label="Leaves This Month"
      card-class="leaves-card"
      :loading="loading"
    />
  </div>

  <!-- Pending Approvals Dialog -->
  <PendingApprovalsDialog v-model="showPendingApprovalsDialog" @filings-updated="fetchDashboardCounters" />

  <!-- Cutoff Dates Dialog -->
  <CutoffDatesDialog v-model="showCutoffDatesDialog" />
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import GlobalWidgetCounter from '../../../../../components/shared/global/GlobalWidgetCounter.vue';
import PendingApprovalsDialog from '../../dialogs/PendingApprovalsDialog.vue';
import CutoffDatesDialog from '../../dialogs/CutoffDatesDialog.vue';
import { useManpowerDashboardStore } from '../../../../../stores/manpowerDashboard';
import { useTimekeepingStore } from '../../../../../stores/timekeeping.store';
import { DashboardAttendanceService } from '../../../../../services/dashboard-attendance.service';

export default defineComponent({
  name: 'ManpowerDashboardCounters',
  components: {
    GlobalWidgetCounter,
    PendingApprovalsDialog,
    CutoffDatesDialog,
  },
  setup() {
    const instance = getCurrentInstance();
    const $api = instance?.appContext.config.globalProperties.$api;
    const dashboardStore = useManpowerDashboardStore();
    const timekeepingStore = useTimekeepingStore();

    const loading = ref(false);
    const error = ref<string | null>(null);
    const showPendingApprovalsDialog = ref(false);
    const showCutoffDatesDialog = ref(false);
    const leavesThisMonth = ref(0);

    // Use store getters for display values
    const pendingApprovalsDisplay = computed(() => dashboardStore.pendingApprovalsDisplay);
    const daysBeforeCutoffDisplay = computed(() => dashboardStore.daysBeforeCutoffDisplay);
    const pendingProcessingDisplay = computed(() => dashboardStore.pendingProcessingDisplay);

    const fetchDashboardCounters = async () => {
      if (!$api) return;

      // Only show loading on initial load (when no data exists)
      if (dashboardStore.isInitialLoad && !dashboardStore.counters) {
        loading.value = true;
      }

      try {
        // Load timekeeping data first to ensure cutoff calculation is accurate
        if (!timekeepingStore.isTimekeepingDateRangeLoaded) {
          await timekeepingStore.loadTimekeepingDateRange();
        }

        // Fetch dashboard counters and attendance data in parallel
        const [, attendanceData] = await Promise.all([
          dashboardStore.fetchCounters($api),
          DashboardAttendanceService.getDailyAttendance()
        ]);

        leavesThisMonth.value = attendanceData.leavesThisMonth;
        error.value = null;
      } catch (err: any) {
        error.value = err.message || 'Failed to fetch dashboard data';
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      // Load from localStorage first
      dashboardStore.loadFromStorage();

      // Then fetch fresh data
      fetchDashboardCounters();

      // Refresh data every 5 minutes
      const interval = setInterval(fetchDashboardCounters, 5 * 60 * 1000);

      // Clean up interval on component unmount
      onUnmounted(() => clearInterval(interval));
    });

    return {
      loading,
      error,
      pendingApprovalsDisplay,
      daysBeforeCutoffDisplay,
      pendingProcessingDisplay,
      showPendingApprovalsDialog,
      showCutoffDatesDialog,
      fetchDashboardCounters,
      leavesThisMonth,
    };
  },
});
</script>

<style scoped lang="scss">
.dashboard-card-container {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
}

.leaves-card {
  background-image: url('assets/img/card1.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #DEF0FF;
}
</style>

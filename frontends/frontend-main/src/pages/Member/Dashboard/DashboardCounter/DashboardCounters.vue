<template>
  <div class="dashboard-card-container">
    <GlobalWidgetCounter
      icon="downloading"
      icon-color="var(--q-primary)"
      :value="outstandingRequestsDisplay"
      label="Outstanding Requests"
      card-class="dashboard-card-1"
      :loading="showLoading"
    />
    <GlobalWidgetCounter
      icon="today"
      icon-color="var(--q-secondary)"
      :value="daysBeforeCutoffDisplay"
      label="Days Before Cut-off"
      card-class="dashboard-card-2"
      :loading="showLoading"
    />
    <GlobalWidgetCounter
      icon="sick"
      icon-color="var(--q-hero)"
      :value="sickLeaveDisplay"
      label="Sick Leave"
      card-class="dashboard-card-3"
      :loading="showLoading"
    />
    <GlobalWidgetCounter
      icon="spa"
      icon-color="var(--q-accent)"
      :value="vacationLeaveDisplay"
      label="Vacation Leave"
      card-class="dashboard-card-4"
      :loading="showLoading"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { api } from 'src/boot/axios';
import { useAuthStore } from 'src/stores/auth';
import GlobalWidgetCounter from '../../../../components/shared/global/GlobalWidgetCounter.vue';
import { dashboardCache, DashboardCountersData } from '../../../../utils/cache/implementations';
import { useCache } from '../../../../composables/useCache';

interface LeaveBalance {
  used: number;
  total: number;
}

export default defineComponent({
  name: 'DashboardCounters',
  components: {
    GlobalWidgetCounter,
  },
  setup() {
    // const instance = getCurrentInstance();
    // const $q = instance?.proxy?.$q;  // Not currently used
    const authStore = useAuthStore();

    const loading = ref(false);
    const outstandingRequests = ref(0);
    const daysBeforeCutoff = ref<number | null>(null);
    const sickLeave = ref<LeaveBalance | null>(null);
    const vacationLeave = ref<LeaveBalance | null>(null);

    const outstandingRequestsDisplay = computed(() => outstandingRequests.value.toString());
    
    const daysBeforeCutoffDisplay = computed(() => {
      if (daysBeforeCutoff.value === null) {
        return 'N/A';
      }
      return daysBeforeCutoff.value.toString();
    });
    
    const sickLeaveDisplay = computed(() => {
      if (!sickLeave.value) {
        return 'N/A';
      }
      return `${sickLeave.value.used}/${sickLeave.value.total}`;
    });
    
    const vacationLeaveDisplay = computed(() => {
      if (!vacationLeave.value) {
        return 'N/A';
      }
      return `${vacationLeave.value.used}/${vacationLeave.value.total}`;
    });

    // Use the centralized cache system
    const {
      data: countersData,
      isCached,
      isRefreshing,
      lastUpdated,
      refresh,
      load
    } = useCache<DashboardCountersData>(
      dashboardCache,
      async () => {
        // Check if account info is loaded
        const accountId = authStore.accountInformation?.id;
        if (!accountId) {
          console.log('Account information not loaded yet, waiting...');
          throw new Error('Account not loaded');
        }

        const response = await api.get<DashboardCountersData>('/dashboard/employee-counters');
        return response.data;
      },
      {
        cacheKey: 'counters',
        invalidateEvents: [
          'filing-updated',
          'filing-created',
          'filing-approved',
          'filing-rejected',
          'cutoff-date-range-status-updated',
          'leave-request-changed',
          'payroll-cutoff-list-changed'
        ],
        // Use default 24-hour TTL for dashboard counters
        autoFetch: false // We'll manually control when to load
      }
    );

    // Watch for counter data changes and update local refs
    const updateLocalData = () => {
      if (countersData.value) {
        outstandingRequests.value = countersData.value.outstandingRequests;
        daysBeforeCutoff.value = countersData.value.daysBeforeCutoff;
        sickLeave.value = countersData.value.sickLeave;
        vacationLeave.value = countersData.value.vacationLeave;
      }
    };

    // Watch the cached data
    watch(countersData, () => {
      updateLocalData();
    }, { immediate: true });

    // Computed property to determine if loading should be shown
    // Only show loading skeleton on initial load when there's no cached data
    const showLoading = computed(() => {
      // Don't show loading if we have cached data or if we have data already
      if (isCached.value || countersData.value) return false;
      // Show loading only when refreshing with no data
      return isRefreshing.value;
    });

    onMounted(() => {
      // Use load() instead of refresh() to check cache first
      if (authStore.accountInformation?.id) {
        load(); // This will check cache first, then fetch if needed
      } else {
        // Watch for account to become available
        const unwatch = watch(
          () => authStore.accountInformation?.id,
          (newId) => {
            if (newId) {
              load(); // Use load() instead of refresh()
              unwatch();
            }
          }
        );
      }
    });

    return {
      loading,
      showLoading,
      outstandingRequestsDisplay,
      daysBeforeCutoffDisplay,
      sickLeaveDisplay,
      vacationLeaveDisplay,
      isCached,
      isRefreshing,
      lastUpdated,
      refresh,
      load,
    };
  },
});
</script>

<style scoped lang="scss">
.dashboard-card-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 25px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}

.dashboard-card-4 {
  background-image: url('../../../../assets/img/card1.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #f3e8ff;
}
</style>

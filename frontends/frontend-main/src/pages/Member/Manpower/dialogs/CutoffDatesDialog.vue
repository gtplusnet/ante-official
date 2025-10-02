<template>
  <q-dialog v-model="dialogModel">
    <q-card class="cutoff-dates-dialog">
      <!-- MD3 Header -->
      <q-card-section class="dialog-header">
        <div class="row items-center">
          <div class="text-headline-small text-on-surface">
            Cutoff Dates
            <q-chip 
              v-if="!loading && activeCutoffs.length > 0"
              size="sm" 
              color="primary" 
              text-color="white"
              class="q-ml-sm"
            >
              {{ activeCutoffs.length }} active
            </q-chip>
          </div>
          <q-space />
          <q-btn 
            icon="close" 
            flat 
            round 
            dense 
            v-close-popup 
            class="text-on-surface-variant"
          />
        </div>
      </q-card-section>

      <!-- Filter Section -->
      <q-card-section class="q-pt-none">
        <div class="row items-center">
          <div class="col">
            <q-tabs
              v-model="statusTab"
              active-color="primary"
              indicator-color="primary"
              align="left"
              class="text-on-surface-variant md3-tabs"
            >
              <q-tab name="active" label="Current & On Process" class="text-label-medium" />
              <q-tab name="all" label="All" class="text-label-medium" />
            </q-tabs>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Content -->
      <q-card-section class="dialog-content q-pa-none">
        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <div class="loading-content">
            <q-circular-progress
              indeterminate
              size="56px"
              :thickness="0.08"
              color="primary"
              track-color="transparent"
              class="q-mb-md"
            />
            <div class="text-body-medium text-on-surface-variant">Loading cutoff dates...</div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center q-pa-xl">
          <q-icon name="error_outline" size="64px" color="error" />
          <div class="text-body-medium text-on-surface q-mt-md">{{ error }}</div>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredCutoffs.length === 0" class="empty-state-container">
          <div class="empty-state">
            <q-icon name="event_available" size="64px" color="on-surface-variant" />
            <div class="text-title-medium text-on-surface-variant q-mt-lg">No cutoff dates found</div>
            <div class="text-body-medium text-on-surface-variant q-mt-sm">
              No cutoff dates are currently available
            </div>
          </div>
        </div>

        <!-- Cutoff Cards -->
        <div v-else class="cutoff-list">
          <div v-for="cutoff in filteredCutoffs" :key="cutoff.key" class="cutoff-card">
            <div class="cutoff-card-header">
              <div class="cutoff-info">
                <div class="cutoff-title">
                  {{ formatCutoffTitle(cutoff) }}
                </div>
                <div class="cutoff-subtitle text-on-surface-variant">
                  {{ cutoff.cutoffCode }}
                </div>
              </div>
              <div class="cutoff-status">
                <q-chip 
                  :color="getStatusColor(cutoff.dateRangeStatus)" 
                  text-color="white"
                  size="sm"
                  class="text-body-small"
                >
                  {{ cutoff.dateRangeStatus }}
                </q-chip>
              </div>
            </div>

            <div class="cutoff-dates">
              <div class="date-row">
                <div class="date-label">Period:</div>
                <div class="date-value">
                  {{ formatDate(cutoff.startDate?.dateFull) }} - {{ formatDate(cutoff.endDate?.dateFull) }}
                </div>
              </div>
              <div class="date-row">
                <div class="date-label">Processing Date:</div>
                <div class="date-value">
                  {{ formatDate(cutoff.processingDate?.dateFull) }}
                </div>
              </div>
              <div v-if="cutoff.dateRangeStatus === 'Current'" class="date-row days-remaining">
                <div class="date-label">Days Remaining:</div>
                <div class="date-value text-primary">
                  <q-icon name="schedule" size="16px" class="q-mr-xs" />
                  {{ calculateDaysRemaining(cutoff.processingDate?.dateFull) }} days
                </div>
              </div>
              <div v-else-if="cutoff.dateRangeStatus === 'On Process'" class="date-row processing">
                <div class="date-label">Status:</div>
                <div class="date-value text-orange">
                  <q-icon name="pending" size="16px" class="q-mr-xs" />
                  Currently being processed
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import { useTimekeepingStore } from '../../../../stores/timekeeping.store';
import { CutoffDateRangeResponse } from '@shared/response';
import { date } from 'quasar';

export default defineComponent({
  name: 'CutoffDatesDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const timekeepingStore = useTimekeepingStore();
    
    const dialogModel = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val),
    });

    const statusTab = ref('active');
    const loading = ref(false);
    const error = ref<string>('');

    // Computed properties for cutoff date ranges
    const isDateRangeLoaded = computed(() => timekeepingStore.isTimekeepingDateRangeLoaded);
    const allDateRanges = computed(() => timekeepingStore.timekeepingDateRange);
    
    // Filter active cutoffs (Current and On Process)
    const activeCutoffs = computed(() => {
      return allDateRanges.value.filter(cutoff => 
        cutoff.dateRangeStatus === 'Current' || cutoff.dateRangeStatus === 'On Process'
      );
    });

    // Filter cutoffs based on selected tab
    const filteredCutoffs = computed(() => {
      if (statusTab.value === 'active') {
        return activeCutoffs.value;
      }
      return allDateRanges.value;
    });

    // Watch for dialog open/close
    watch(() => props.modelValue, async (newVal) => {
      if (newVal) {
        loading.value = true;
        error.value = '';
        
        try {
          // Load cutoff date ranges if not loaded
          if (!isDateRangeLoaded.value) {
            await timekeepingStore.loadTimekeepingDateRange();
          }
        } catch (err: any) {
          error.value = err.message || 'Failed to load cutoff dates';
        } finally {
          loading.value = false;
        }
      }
    });

    const formatCutoffTitle = (cutoff: CutoffDateRangeResponse) => {
      const periodType = cutoff.cutoffPeriodType?.key;
      let period = '';
      
      switch (periodType) {
        case 'FIRST_PERIOD':
          period = '1st Period';
          break;
        case 'MIDDLE_PERIOD':
          period = 'Middle Period';
          break;
        case 'LAST_PERIOD':
          period = 'Last Period';
          break;
        default:
          period = 'Period';
      }
      
      return `${period} - ${cutoff.cutoffCode || 'N/A'}`;
    };

    const formatDate = (dateStr: string | undefined) => {
      if (!dateStr) return 'N/A';
      return date.formatDate(dateStr, 'MMM D, YYYY');
    };

    const calculateDaysRemaining = (processingDateStr: string | undefined) => {
      if (!processingDateStr) return 0;
      
      const processingDate = new Date(processingDateStr);
      const today = new Date();
      const diffTime = processingDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return Math.max(0, diffDays);
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Current':
          return 'green';
        case 'On Process':
          return 'orange';
        case 'Past Due':
          return 'grey';
        default:
          return 'grey';
      }
    };

    // Initial load on mount if dialog is already open
    onMounted(async () => {
      if (props.modelValue) {
        loading.value = true;
        error.value = '';
        
        try {
          if (!isDateRangeLoaded.value) {
            await timekeepingStore.loadTimekeepingDateRange();
          }
        } catch (err: any) {
          error.value = err.message || 'Failed to load cutoff dates';
        } finally {
          loading.value = false;
        }
      }
    });

    return {
      dialogModel,
      statusTab,
      loading,
      error,
      activeCutoffs,
      filteredCutoffs,
      formatCutoffTitle,
      formatDate,
      calculateDaysRemaining,
      getStatusColor,
    };
  },
});
</script>

<style scoped lang="scss">
.cutoff-dates-dialog {
  max-width: 800px;
  width: 100%;
  margin: auto;
  height: 80vh;
  border-radius: 16px;
  background-color: var(--q-surface-container-high, #F6F2F6);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  background-color: var(--q-surface-container-high, #F6F2F6);
  padding: 16px 24px;
}

.dialog-content {
  flex: 1;
  overflow: hidden;
  background-color: var(--q-surface, #FFFBFF);
  display: flex;
  flex-direction: column;
}

// MD3 Tabs styling
.md3-tabs {
  :deep(.q-tab) {
    border-radius: 100px;
    margin: 0 4px;
    min-height: 40px;
    
    &.q-tab--active {
      background-color: var(--q-primary-container, #EADDFF);
      color: var(--q-on-primary-container, #21005D);
    }
  }

  :deep(.q-tab__indicator) {
    display: none;
  }
}

// Loading and empty states
.loading-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--q-surface, #FFFBFF);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-state-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

// Cutoff list styling
.cutoff-list {
  padding: 16px;
  overflow-y: auto;
  flex: 1;

  &::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #d9d9d9;
    border-radius: 50px;
  }

  &::-webkit-scrollbar-track {
    background-color: #f4f4f4;
    border-radius: 50px;
  }
}

.cutoff-card {
  background-color: var(--q-surface-container, #F3EDF7);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid var(--q-outline-variant, #F0F0F0);
  transition: all 200ms ease;

  &:hover {
    background-color: var(--q-surface-container-low, #F7F2FA);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.cutoff-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.cutoff-info {
  flex: 1;
}

.cutoff-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--q-on-surface, #1C1B1F);
  margin-bottom: 4px;
}

.cutoff-subtitle {
  font-size: 0.875rem;
  color: var(--q-on-surface-variant, #49454E);
}

.cutoff-status {
  margin-left: 16px;
}

.cutoff-dates {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.date-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  
  &.days-remaining {
    background-color: var(--q-primary-container, #EADDFF);
    border-radius: 12px;
    padding: 12px 16px;
    margin-top: 8px;
  }
  
  &.processing {
    background-color: var(--q-tertiary-container, #FFD8E4);
    border-radius: 12px;
    padding: 12px 16px;
    margin-top: 8px;
  }
}

.date-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--q-on-surface-variant, #49454E);
  min-width: 140px;
  flex-shrink: 0;
}

.date-value {
  font-size: 0.875rem;
  color: var(--q-on-surface, #1C1B1F);
  display: flex;
  align-items: center;
  
  .days-remaining & {
    color: var(--q-on-primary-container, #21005D);
    font-weight: 500;
  }
  
  .processing & {
    color: var(--q-on-tertiary-container, #31111D);
    font-weight: 500;
  }
}

// MD3 typography classes
.text-headline-small {
  font-size: 1.5rem;
  font-weight: 400;
  line-height: 2rem;
}

.text-title-medium {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5rem;
}

.text-body-medium {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
}

.text-body-small {
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1rem;
}

.text-label-medium {
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1rem;
  letter-spacing: 0.5px;
}

// MD3 Color classes
.text-on-surface {
  color: var(--q-on-surface, #1C1B1F);
}

.text-on-surface-variant {
  color: var(--q-on-surface-variant, #49454E);
}

.text-primary {
  color: var(--q-primary, #6750A4);
}

.text-orange {
  color: #FF8A50;
}
</style>
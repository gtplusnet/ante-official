<template>
  <q-dialog
    v-model="dialogModel"
    persistent
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="md3-dialog-dense" style="width: 800px; max-width: 90vw;">
      <q-card-section class="md3-dialog-header">
        <div class="text-h6">Time History</div>
        <q-space />
        <q-btn 
          icon="close" 
          flat 
          round 
          dense 
          @click="dialogModel = false" 
        />
      </q-card-section>

      <q-card-section class="md3-dialog-content q-pt-none">
        <!-- Filters -->
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-12 col-sm-4">
            <q-input
              v-model="filters.startDate"
              dense
              outlined
              label="Start Date"
              type="date"
            />
          </div>
          <div class="col-12 col-sm-4">
            <q-input
              v-model="filters.endDate"
              dense
              outlined
              label="End Date"
              type="date"
            />
          </div>
          <div class="col-12 col-sm-4">
            <q-select
              v-model="filters.source"
              dense
              outlined
              label="Source"
              :options="sourceOptions"
              clearable
              emit-value
              map-options
            />
          </div>
        </div>

        <!-- Apply Filters Button -->
        <div class="row q-mb-md">
          <q-btn
            unelevated
            color="primary"
            label="Apply Filters"
            size="sm"
            @click="fetchHistory"
          />
          <q-btn
            flat
            color="grey"
            label="Clear"
            size="sm"
            class="q-ml-sm"
            @click="clearFilters"
          />
        </div>

        <!-- Daily Summary -->
        <q-card flat bordered class="q-mb-md daily-summary">
          <q-card-section class="q-pa-sm">
            <div class="row items-center">
              <div class="col">
                <div class="text-caption text-grey">Today's Total</div>
                <div class="text-h6">{{ formatDuration(dailySummary.totalMinutes * 60) }}</div>
              </div>
              <div class="col-auto">
                <q-icon name="schedule" size="24px" color="primary" />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Loading State -->
        <div v-if="isLoading" class="q-pa-md text-center">
          <q-spinner-dots size="40px" />
          <div class="q-mt-sm text-grey">Loading history...</div>
        </div>

        <!-- No History -->
        <div v-else-if="history.length === 0" class="q-pa-md text-center text-grey">
          <q-icon name="history" size="48px" class="q-mb-sm" />
          <div>No time entries found</div>
        </div>

        <!-- History List -->
        <q-list v-else separator class="history-list">
          <q-item
            v-for="entry in history"
            :key="entry.id"
            class="history-item"
          >
            <q-item-section avatar>
              <q-icon 
                :name="getSourceIcon(entry.source)" 
                :color="getSourceColor(entry.source)"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-body-medium">
                {{ entry.taskTitle || entry.task?.title || 'Quick Task' }}
              </q-item-label>

              <!-- TIME-IN Info -->
              <q-item-label caption class="q-mt-xs">
                <div class="row items-center q-gutter-x-xs">
                  <q-icon name="login" size="12px" color="positive" />
                  <span class="text-weight-medium">Time In:</span>
                  <span>{{ formatDate(entry.timeIn) }} • {{ formatTime(entry.timeIn) }}</span>
                  <span v-if="entry.project || entry.task?.project"> • {{ entry.project?.name || entry.task?.project?.name }}</span>
                </div>
                <div class="row items-center q-gutter-x-xs q-mt-xs location-row">
                  <q-icon name="location_on" size="12px" class="location-icon" />
                  <span>{{ entry.timeInLocation || 'N/A' }}</span>
                  <span class="q-ml-sm">IP: {{ entry.timeInIpAddress || 'N/A' }}</span>
                </div>
              </q-item-label>

              <!-- TIME-OUT Info -->
              <q-item-label caption class="q-mt-sm">
                <div class="row items-center q-gutter-x-xs">
                  <q-icon name="logout" size="12px" color="negative" />
                  <span class="text-weight-medium">Time Out:</span>
                  <span>{{ formatDate(entry.timeOut) }} • {{ formatTime(entry.timeOut) }}</span>
                </div>
                <div class="row items-center q-gutter-x-xs q-mt-xs location-row">
                  <q-icon name="location_on" size="12px" class="location-icon" />
                  <span>{{ entry.timeOutLocation || 'N/A' }}</span>
                  <span class="q-ml-sm">IP: {{ entry.timeOutIpAddress || 'N/A' }}</span>
                </div>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="text-right">
                <div class="text-body-medium">
                  {{ formatDuration(entry.timeSpan * 60) }}
                </div>
                <q-badge 
                  :color="getSourceColor(entry.source)"
                  :label="entry.source"
                  class="q-mt-xs"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="q-mt-md flex justify-center">
          <q-pagination
            v-model="currentPage"
            :max="totalPages"
            :max-pages="5"
            boundary-numbers
            direction-links
            @update:model-value="fetchHistory"
            unelevated
            color="primary"
            active-color="primary"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.md3-dialog-dense {
  .md3-dialog-header {
    display: flex;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid var(--md3-sys-color-outline-variant);
  }
  
  .md3-dialog-content {
    padding: 16px 24px;
    max-height: 70vh;
    overflow-y: auto;
  }
  
  .daily-summary {
    background: var(--md3-sys-color-primary-container);
    border-color: var(--md3-sys-color-primary);
  }
  
  .history-list {
    max-height: 400px;
    overflow-y: auto;
  }
  
  .history-item {
    border: 1px solid var(--md3-sys-color-outline-variant);
    margin-bottom: 12px;
    border-radius: 8px;
    padding: 12px;
  }

  .location-row {
    color: var(--md3-sys-color-on-surface-variant);
    font-size: 11px;

    .location-icon {
      color: var(--md3-sys-color-primary);
    }
  }
}
</style>

<script lang="ts">
import { defineComponent, ref, computed, watch, getCurrentInstance } from 'vue';
import { date } from 'quasar';

interface TimeEntry {
  id: number;
  timeIn: string;
  timeOut: string;
  timeSpan: number;
  source: string;
  taskId: number | null;
  taskTitle: string | null;
  projectId: number | null;
  // TIME-IN GEOLOCATION
  timeInLatitude?: number | null;
  timeInLongitude?: number | null;
  timeInLocation?: string | null;
  timeInIpAddress?: string | null;
  timeInGeolocationEnabled?: boolean | null;
  // TIME-OUT GEOLOCATION
  timeOutLatitude?: number | null;
  timeOutLongitude?: number | null;
  timeOutLocation?: string | null;
  timeOutIpAddress?: string | null;
  timeOutGeolocationEnabled?: boolean | null;
  task?: {
    id: number;
    title: string;
    project?: {
      id: number;
      name: string;
    };
  };
  project?: {
    id: number;
    name: string;
  };
}

interface DailySummary {
  date: string;
  totalMinutes: number;
  entries: TimeEntry[];
}

export default defineComponent({
  name: 'TimeHistoryDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const instance = getCurrentInstance();
    const api = instance?.proxy?.$api;
    
    // State
    const isLoading = ref(false);
    const history = ref<TimeEntry[]>([]);
    const dailySummary = ref<DailySummary>({
      date: new Date().toISOString(),
      totalMinutes: 0,
      entries: []
    });
    const currentPage = ref(1);
    const totalPages = ref(1);
    const filters = ref({
      startDate: '',
      endDate: '',
      source: null as string | null
    });
    
    // Source options
    const sourceOptions = [
      { label: 'Timer', value: 'TIMER' },
      { label: 'Manual', value: 'MANUAL' },
      { label: 'Import', value: 'IMPORT' },
      { label: 'System', value: 'SYSTEM' }
    ];
    
    // Computed
    const dialogModel = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val)
    });
    
    // Methods
    const fetchHistory = async () => {
      isLoading.value = true;
      try {
        const params: any = {
          page: currentPage.value,
          limit: 10
        };
        
        if (filters.value.startDate) {
          params.startDate = filters.value.startDate;
        }
        if (filters.value.endDate) {
          params.endDate = filters.value.endDate;
        }
        if (filters.value.source) {
          params.source = filters.value.source;
        }
        
        const response = await api.get('/time-tracking/history', { params });
        history.value = response.data.items || [];
        totalPages.value = response.data.totalPages || 1;
      } catch (error) {
        console.error('Failed to fetch history:', error);
        history.value = [];
      } finally {
        isLoading.value = false;
      }
    };
    
    const fetchDailySummary = async () => {
      try {
        const response = await api.get('/time-tracking/daily-summary');
        dailySummary.value = response.data || {
          date: new Date().toISOString(),
          totalMinutes: 0,
          entries: []
        };
      } catch (error) {
        console.error('Failed to fetch daily summary:', error);
      }
    };
    
    const clearFilters = () => {
      filters.value = {
        startDate: '',
        endDate: '',
        source: null
      };
      currentPage.value = 1;
      fetchHistory();
    };
    
    const formatDuration = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    };
    
    const formatDate = (dateStr: string) => {
      return date.formatDate(dateStr, 'MMM DD, YYYY');
    };

    const formatTime = (dateStr: string) => {
      return date.formatDate(dateStr, 'h:mm A');
    };

    const formatTimeRange = (timeIn: string, timeOut: string) => {
      const start = date.formatDate(timeIn, 'h:mm A');
      const end = date.formatDate(timeOut, 'h:mm A');
      return `${start} - ${end}`;
    };
    
    const getSourceIcon = (source: string) => {
      const icons: Record<string, string> = {
        'TIMER': 'timer',
        'MANUAL': 'edit',
        'IMPORT': 'upload',
        'SYSTEM': 'settings'
      };
      return icons[source] || 'schedule';
    };
    
    const getSourceColor = (source: string) => {
      const colors: Record<string, string> = {
        'TIMER': 'primary',
        'MANUAL': 'orange',
        'IMPORT': 'purple',
        'SYSTEM': 'grey'
      };
      return colors[source] || 'grey';
    };
    
    // Watch for dialog open
    watch(() => props.modelValue, (newVal) => {
      if (newVal) {
        currentPage.value = 1;
        fetchHistory();
        fetchDailySummary();
      }
    });
    
    return {
      dialogModel,
      isLoading,
      history,
      dailySummary,
      currentPage,
      totalPages,
      filters,
      sourceOptions,
      fetchHistory,
      clearFilters,
      formatDuration,
      formatDate,
      formatTime,
      formatTimeRange,
      getSourceIcon,
      getSourceColor
    };
  }
});
</script>
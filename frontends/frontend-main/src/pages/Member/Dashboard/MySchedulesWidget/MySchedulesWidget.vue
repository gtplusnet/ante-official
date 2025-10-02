<template>
  <div>
    <GlobalWidgetCard>
      <!-- Title -->
      <template #title>My Schedules</template>

      <!-- Title More Actions -->
      <template #more-actions>
        <div class="row items-center">
          <q-select
            v-model="filterType"
            :options="filterOptions"
            dense
            outlined
            rounded
            style="min-width: 150px"
            @update:modelValue="loadSchedules"
            class="schedule-widget-filter"
          />

          <q-btn
            flat
            round
            dense
            icon="add"
            color="grey-6"
            size="md"
            @click="openCreateScheduleDialog"
          />
        </div>
      </template>

      <!-- Actions -->
      <template #actions>
        <div class="schedule-widget-actions">
          <!-- Filter dropdown -->
          <q-select
            v-model="filterType"
            :options="filterOptions"
            dense
            outlined
            rounded
            class="schedule-widget-filter"
            style="min-width: 150px"
            @update:modelValue="loadSchedules"
          />

          <!-- Add button for desktop -->
          <q-btn
            flat
            round
            dense
            icon="add"
            color="grey-6"
            size="sm"
            @click="openCreateScheduleDialog"
          />
        </div>
      </template>

      <!-- Content -->
      <template #content>
        <div class="schedule-content">
          <!-- Schedule list -->
          <div class="schedule-list">
            <template v-if="isLoading">
              <GlobalLoader />
            </template>
            <template v-else-if="paginatedSchedules.length > 0">
              <ScheduleCard
                v-for="schedule in paginatedSchedules"
                :key="schedule.id"
                :schedule="schedule"
                @click="showScheduleDetails(schedule)"
              />
            </template>
            <template v-else>
              <div class="q-pa-xl text-center text-label-medium text-grey">No schedules found</div>
            </template>
          </div>
        </div>
      </template>

      <!-- Footer -->
      <template #footer>
        <GlobalWidgetPagination
          :pagination="{
            currentPage: pagination.page,
            totalItems: schedules.length,
            itemsPerPage: pagination.rowsPerPage,
          }"
          @update:page="handlePageChange"
        />
      </template>
    </GlobalWidgetCard>

    <!-- Schedule Details Dialog -->
    <q-dialog v-model="showDetailsDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Schedule Details</div>
        </q-card-section>

        <q-card-section v-if="selectedSchedule">
          <div class="column q-gutter-sm">
            <div><strong>Title:</strong> {{ selectedSchedule.title }}</div>
            <div><strong>Date:</strong> {{ selectedSchedule.date }}</div>
            <div><strong>Time:</strong> {{ selectedSchedule.timeRange }}</div>
            <div v-if="selectedSchedule.location">
              <strong>Location:</strong> {{ selectedSchedule.location }}
            </div>
            <div v-if="selectedSchedule.description">
              <strong>Description:</strong> {{ selectedSchedule.description }}
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped src="./MySchedulesWidget.scss"></style>

<script lang="ts">
import { defineComponent, ref, reactive, computed, onMounted } from 'vue';
import GlobalWidgetCard from '../../../../components/shared/global/GlobalWidgetCard.vue';
import GlobalWidgetPagination from '../../../../components/shared/global/GlobalWidgetPagination.vue';
import GlobalLoader from '../../../../components/shared/common/GlobalLoader.vue';
import ScheduleCard from './Partial/cards/ScheduleCard.vue';
import { useQuasar } from 'quasar';

interface Schedule {
  id: number;
  title: string;
  date: string;
  timeRange: string;
  location?: string;
  description?: string;
  type: 'meeting' | 'event' | 'task' | 'site-visit';
  isPinned: boolean;
  color: string;
  icon: string;
}

export default defineComponent({
  name: 'MySchedulesWidget',
  components: {
    GlobalWidgetCard,
    GlobalWidgetPagination,
    GlobalLoader,
    ScheduleCard,
  },
  setup() {
    const $q = useQuasar();

    // Reactive state
    const isLoading = ref(false);
    const schedules = ref<Schedule[]>([]);
    const selectedSchedule = ref<Schedule | null>(null);
    const showDetailsDialog = ref(false);
    const filterType = ref('All');
    const dateFrom = ref('');
    const dateTo = ref('');

    const pagination = reactive({
      page: 1,
      rowsPerPage: 10,
    });

    // Filter options
    const filterOptions = ['All', 'Today', 'This Week', 'This Month'];

    // Dummy data for schedules
    const dummySchedules: Schedule[] = [
      {
        id: 1,
        title: 'Ante Meeting',
        date: 'Jul 29, 2025',
        timeRange: '11:00 AM - 12:00 PM',
        type: 'meeting',
        isPinned: true,
        color: '#1E88E5',
        icon: 'card_travel',
        location: 'Conference Room A',
        description: 'Monthly ante meeting with stakeholders',
      },
      {
        id: 2,
        title: 'Management Huddle Meeting',
        date: 'Jul 29, 2025',
        timeRange: '1:00 PM - 2:00 PM',
        type: 'meeting',
        isPinned: true,
        color: '#1E88E5',
        icon: 'card_travel',
        location: 'Board Room',
        description: 'Weekly management sync-up',
      },
      {
        id: 3,
        title: 'Dev Team Scrum',
        date: 'Jul 29, 2025',
        timeRange: '2:45 PM - 3:00 PM',
        type: 'meeting',
        isPinned: true,
        color: '#1E88E5',
        icon: 'card_travel',
        location: 'Virtual - Teams',
        description: 'Daily stand-up meeting',
      },
      {
        id: 4,
        title: 'Site Visitation',
        date: 'Jul 29, 2025',
        timeRange: '8:00 AM',
        type: 'site-visit',
        isPinned: false,
        color: '#00897B',
        icon: 'location_on',
        location: 'Construction Site B',
        description: 'Monthly site inspection',
      },
      {
        id: 5,
        title: 'HQ Meeting',
        date: 'Jul 29, 2025',
        timeRange: '9:00 AM - 5:00 PM',
        type: 'meeting',
        isPinned: false,
        color: '#1E88E5',
        icon: 'card_travel',
        location: 'Headquarters',
        description: 'Quarterly business review',
      },
    ];

    // Methods
    const loadSchedules = async () => {
      isLoading.value = true;

      // Simulate API call
      setTimeout(() => {
        schedules.value = dummySchedules;
        isLoading.value = false;
      }, 500);
    };

    const showScheduleDetails = (schedule: Schedule) => {
      selectedSchedule.value = schedule;
      showDetailsDialog.value = true;
    };

    const openCreateScheduleDialog = () => {
      $q.notify({
        type: 'info',
        message: 'Create schedule dialog would open here',
      });
    };

    const handlePageChange = (newPage: number) => {
      pagination.page = newPage;
    };

    // Computed properties
    const paginatedSchedules = computed(() => {
      const start = (pagination.page - 1) * pagination.rowsPerPage;
      const end = start + pagination.rowsPerPage;
      return schedules.value.slice(start, end);
    });

    // Lifecycle
    onMounted(() => {
      loadSchedules();
    });

    return {
      // State
      isLoading,
      schedules,
      selectedSchedule,
      showDetailsDialog,
      filterType,
      dateFrom,
      dateTo,
      pagination,
      filterOptions,

      // Computed
      paginatedSchedules,

      // Methods
      loadSchedules,
      showScheduleDetails,
      openCreateScheduleDialog,
      handlePageChange,
    };
  },
});
</script>

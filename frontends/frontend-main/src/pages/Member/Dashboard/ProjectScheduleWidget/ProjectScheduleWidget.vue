<template>
  <div>
    <!-- Wrapped version with card -->
    <q-card v-if="!hideWrapper" class="card">
      <q-card-section>
        <div class="row items-center no-wrap">
          <!-- title -->
          <div class="col">
            <div class="text-title-large">Progress Schedule</div>
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <!-- task loading -->
        <q-scroll-area class="task-content" :style="getHeight()">
          <template v-if="isLoading">
            <GlobalLoader />
          </template>
          <template v-else>
            <!-- no task loaded -->
            <div class="task-empty" v-if="projectScheduleReport.length == 0">
              No projects yet
            </div>
            <div v-else>
              <s-curve-partial :chart-height="props.chartHeight" />
            </div>
          </template>
        </q-scroll-area>
      </q-card-section>
    </q-card>

    <!-- Unwrapped version for embedding -->
    <div v-else class="schedule-content">
      <template v-if="isLoading">
        <GlobalLoader />
      </template>
      <template v-else>
        <!-- no task loaded -->
        <div class="task-empty" v-if="projectScheduleReport.length == 0">
          No projects yet
        </div>
        <div v-else>
          <s-curve-partial :chart-height="props.chartHeight" />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped src="./ProjectScheduleWidget.scss"></style>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import GlobalLoader from "../../../../components/shared/common/GlobalLoader.vue";
import SCurvePartial from './Partials/SCurvePartial/SCurvePartial.vue';

// Import shared interfaces
import type { ProjectDataResponse } from "@shared/response";

// Define props with TypeScript
interface Props {
  chartHeight?: number;
  hideWrapper?: boolean; // Hide card wrapper when used inside another card
}

const props = withDefaults(defineProps<Props>(), {
  chartHeight: 500,
  hideWrapper: false,
});

// Define types for the schedule data
interface ScheduleItem {
  id: number;
  taskId: number;
  startDate: string;
  estimatedEndDate: string;
  progressPercentage: number;
}

interface ProjectScheduleItem {
  id: number;
  projectName: string;
  schedule: ScheduleItem[];
  project?: ProjectDataResponse;
}

// Route for dynamic height calculation
const route = useRoute();

// Reactive state
const isLoading = ref<boolean>(false);

// Sample data with proper typing
const dummyData: ProjectScheduleItem[] = [
  {
    id: 1,
    projectName: 'Project A',
    schedule: [
      {
        id: 1,
        taskId: 1,
        startDate: '2024-05-01',
        estimatedEndDate: '2024-08-01',
        progressPercentage: 10,
      },
    ],
  },
];

const projectScheduleReport = ref<ProjectScheduleItem[]>(dummyData);

// Computed properties and methods
const getHeight = (): string => {
  const routePath = route.path.split('/');
  return `height: ${routePath.length > 2 && routePath[2] === 'project' ? '190px' : '500px'}`;
};

// Lifecycle hooks
onMounted(() => {
  try {
    // Initialize component or load data
    // loadProjectScheduleData();
  } catch (error) {
    console.warn('Error during component initialization:', error);
  }
});

// Method to load project schedule data (commented out as it's not implemented in the original)
/*
const loadProjectScheduleData = async () => {
  try {
    isLoading.value = true;
    // API call would go here
    // const response = await api.get('/projects/schedule');
    // projectScheduleReport.value = response.data.items;
  } catch (error) {
    console.warn('Failed to load project schedule data:', error);
  } finally {
    isLoading.value = false;
  }
};
*/
</script>

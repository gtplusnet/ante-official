<template>
  <q-card flat bordered class="project-info-card">
    <q-card-section class="q-pa-md">
      <div class="row items-start justify-between">
        <!-- Left Section: Project Details -->
        <div class="col-12 col-md-8">
          <div class="row items-center q-mb-sm">
            <q-icon name="folder_special" size="28px" color="primary" class="q-mr-sm" />
            <div>
              <div class="text-h6 text-weight-medium">{{ projectData?.name || 'Project Name' }}</div>
              <div class="text-caption text-grey-7">
                Code: {{ projectData?.code || 'N/A' }}
                <span v-if="projectData?.client" class="q-mx-sm">•</span>
                <span v-if="projectData?.client">Client: {{ projectData.client.name }}</span>
              </div>
            </div>
          </div>

          <!-- Project Description -->
          <div v-if="projectData?.description" class="text-body2 text-grey-8 q-mb-md">
            {{ projectData.description }}
          </div>

          <!-- Timeline Bar -->
          <div class="timeline-section q-mb-md">
            <div class="row items-center q-mb-xs">
              <q-icon name="schedule" size="16px" class="q-mr-xs text-grey-7" />
              <span class="text-caption text-grey-7">Project Timeline</span>
            </div>
            <div class="timeline-bar">
              <q-linear-progress
                :value="timelineProgress"
                size="8px"
                :color="timelineColor"
                track-color="grey-3"
                rounded
              />
            </div>
            <div class="row justify-between text-caption q-mt-xs">
              <span>{{ formatDate(projectData?.startDate) }}</span>
              <span class="text-weight-medium">{{ daysRemaining }}</span>
              <span>{{ formatDate(projectData?.endDate) }}</span>
            </div>
          </div>

          <!-- Budget Progress -->
          <div class="row items-center q-gutter-md">
            <div class="budget-info">
              <div class="text-caption text-grey-7">Budget</div>
              <div class="text-body1 text-weight-medium">
                {{ formatCurrency(projectData?.budget) }}
              </div>
            </div>
            <q-separator vertical />
            <div class="collection-info">
              <div class="text-caption text-grey-7">Collected</div>
              <div class="text-body1 text-weight-medium text-positive">
                {{ formatCurrency(projectData?.totalCollected) }}
              </div>
            </div>
            <q-separator vertical />
            <div class="balance-info">
              <div class="text-caption text-grey-7">Balance</div>
              <div class="text-body1 text-weight-medium">
                {{ formatCurrency((projectData?.budget || 0) - (projectData?.totalCollected || 0)) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Right Section: Progress & Stage -->
        <div class="col-12 col-md-4 text-center q-mt-md q-md-mt-none">
          <!-- Progress Circle -->
          <div class="q-mb-md">
            <q-circular-progress
              :value="projectData?.progressPercentage || 0"
              size="120px"
              :thickness="0.15"
              color="primary"
              track-color="grey-3"
              show-value
              class="text-weight-bold"
            >
              {{ Math.round(projectData?.progressPercentage || 0) }}%
            </q-circular-progress>
            <div class="text-caption text-grey-7 q-mt-sm">Overall Progress</div>
          </div>

          <!-- Board Stage Badge -->
          <q-chip
            square
            class="board-stage-chip q-px-md"
            :style="{
              backgroundColor: stageColors?.bg || '#F8F8F8',
              color: stageColors?.text || '#616161',
              border: `1px solid ${stageColors?.border || '#E0E0E0'}`
            }"
          >
            <q-icon
              :name="stageIcon"
              size="18px"
              class="q-mr-xs"
            />
            {{ stageName }}
          </q-chip>

          <!-- Location Info -->
          <div v-if="projectData?.location" class="q-mt-md text-left">
            <div class="row items-center">
              <q-icon name="place" size="16px" class="q-mr-xs text-grey-7" />
              <span class="text-caption text-grey-7">Location</span>
            </div>
            <div class="text-body2">{{ projectData.location.name }}</div>
            <div v-if="projectData.location.street" class="text-caption text-grey-6">
              {{ projectData.location.street }}
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { ProjectDataResponse } from '@shared/response';
import {
  getBoardStage,
  getProjectBoardColumn,
  BOARD_STAGE_COLORS
} from '../../../../../reference/board-stages.reference';

export default defineComponent({
  name: 'ProjectInfoCard',
  props: {
    projectData: {
      type: Object as PropType<ProjectDataResponse | null>,
      default: null
    }
  },
  setup(props) {
    const formatDate = (date: string | Date | undefined) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    const formatCurrency = (amount: number | undefined) => {
      if (!amount) return '₱0';
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0
      }).format(amount);
    };

    const timelineProgress = computed(() => {
      if (!props.projectData?.startDate || !props.projectData?.endDate) return 0;

      const start = new Date(props.projectData.startDate).getTime();
      const end = new Date(props.projectData.endDate).getTime();
      const now = new Date().getTime();

      if (now < start) return 0;
      if (now > end) return 100;

      return ((now - start) / (end - start)) * 100;
    });

    const timelineColor = computed(() => {
      const progress = timelineProgress.value;
      const projectProgress = props.projectData?.progressPercentage || 0;

      // If project progress is behind timeline, show warning
      if (projectProgress < progress - 10) return 'warning';
      if (progress > 90) return 'negative';
      return 'primary';
    });

    const daysRemaining = computed(() => {
      if (!props.projectData?.endDate) return 'N/A';

      const end = new Date(props.projectData.endDate);
      const now = new Date();
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diff < 0) return `${Math.abs(diff)} days overdue`;
      if (diff === 0) return 'Due today';
      if (diff === 1) return '1 day remaining';
      return `${diff} days remaining`;
    });

    const stageName = computed(() => {
      const stage = getBoardStage(props.projectData?.projectBoardStage || 'planning');
      return stage?.boardName || 'Planning';
    });

    const stageIcon = computed(() => {
      const column = getProjectBoardColumn(props.projectData?.projectBoardStage || 'planning');
      return column?.icon || 'architecture';
    });

    const stageColors = computed(() => {
      return BOARD_STAGE_COLORS[props.projectData?.projectBoardStage || 'planning'];
    });

    return {
      formatDate,
      formatCurrency,
      timelineProgress,
      timelineColor,
      daysRemaining,
      stageName,
      stageIcon,
      stageColors
    };
  }
});
</script>

<style scoped lang="scss">
.project-info-card {
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 8px;

  .timeline-bar {
    width: 100%;
    background: var(--md-sys-color-surface-variant);
    border-radius: 4px;
    overflow: hidden;
  }

  .board-stage-chip {
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
  }

  .budget-info,
  .collection-info,
  .balance-info {
    min-width: 100px;
  }
}
</style>
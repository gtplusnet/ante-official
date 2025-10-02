<template>
  <div class="project-progress-card-content">
    <div class="progress-content">
        <q-circular-progress
          :value="progressValue"
          size="100px"
          :thickness="0.12"
          :color="progressColor"
          track-color="grey-3"
          show-value
          class="q-ma-sm"
        >
          <div class="progress-text">
            <div class="text-h6 text-weight-bold">{{ Math.round(progressValue) }}%</div>
            <div class="text-caption text-grey-6">Complete</div>
          </div>
        </q-circular-progress>

        <div class="progress-status q-mt-sm">
          <q-chip
            dense
            square
            size="sm"
            :color="statusColor"
            text-color="white"
            class="status-chip"
          >
            {{ progressStatus }}
          </q-chip>
        </div>

        <div class="progress-comparison q-mt-sm text-caption">
          <div v-if="comparisonText" :class="comparisonClass">
            <q-icon :name="comparisonIcon" size="14px" class="q-mr-xs" />
            {{ comparisonText }}
          </div>
        </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { ProjectDataResponse } from '@shared/response';

export default defineComponent({
  name: 'ProjectProgressCard',
  props: {
    projectData: {
      type: Object as PropType<ProjectDataResponse | null>,
      default: null
    }
  },
  setup(props) {
    const progressValue = computed(() => {
      return props.projectData?.progressPercentage || 0;
    });

    const progressColor = computed(() => {
      const value = progressValue.value;
      if (value >= 100) return 'positive';
      if (value >= 75) return 'primary';
      if (value >= 50) return 'info';
      if (value >= 25) return 'warning';
      return 'grey';
    });

    const progressStatus = computed(() => {
      const value = progressValue.value;
      const timelineProgress = getTimelineProgress();

      if (value >= 100) return 'Completed';
      if (value >= timelineProgress - 5) return 'On Schedule';
      if (value >= timelineProgress - 15) return 'Slightly Behind';
      return 'Behind Schedule';
    });

    const statusColor = computed(() => {
      const status = progressStatus.value;
      switch (status) {
        case 'Completed': return 'positive';
        case 'On Schedule': return 'primary';
        case 'Slightly Behind': return 'warning';
        case 'Behind Schedule': return 'negative';
        default: return 'grey';
      }
    });

    const getTimelineProgress = () => {
      if (!props.projectData?.startDate || !props.projectData?.endDate) return 0;

      const start = new Date(props.projectData.startDate).getTime();
      const end = new Date(props.projectData.endDate).getTime();
      const now = new Date().getTime();

      if (now < start) return 0;
      if (now > end) return 100;

      return ((now - start) / (end - start)) * 100;
    };

    const comparisonText = computed(() => {
      const projectProgress = progressValue.value;
      const timelineProgress = getTimelineProgress();
      const difference = projectProgress - timelineProgress;

      if (Math.abs(difference) < 5) return 'Aligned with timeline';
      if (difference > 0) return `${Math.round(difference)}% ahead of schedule`;
      return `${Math.round(Math.abs(difference))}% behind schedule`;
    });

    const comparisonClass = computed(() => {
      const projectProgress = progressValue.value;
      const timelineProgress = getTimelineProgress();
      const difference = projectProgress - timelineProgress;

      if (difference > 5) return 'text-positive';
      if (difference < -5) return 'text-negative';
      return 'text-grey-7';
    });

    const comparisonIcon = computed(() => {
      const projectProgress = progressValue.value;
      const timelineProgress = getTimelineProgress();
      const difference = projectProgress - timelineProgress;

      if (difference > 5) return 'trending_up';
      if (difference < -5) return 'trending_down';
      return 'trending_flat';
    });

    return {
      progressValue,
      progressColor,
      progressStatus,
      statusColor,
      comparisonText,
      comparisonClass,
      comparisonIcon
    };
  }
});
</script>

<style scoped lang="scss">
.project-progress-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;

  .progress-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    .progress-text {
      line-height: 1.1;
    }

    .status-chip {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .progress-comparison {
      min-height: 20px;
    }
  }
}
</style>
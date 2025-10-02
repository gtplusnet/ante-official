<template>
  <div class="project-timeline-card-content">
    <div class="timeline-header row items-center justify-between q-mb-sm">
      <q-chip
        dense
        square
        size="sm"
        :color="statusColor"
        text-color="white"
        class="status-chip"
      >
        {{ projectStatus }}
      </q-chip>
    </div>

    <div class="timeline-content">
      <div class="timeline-bar q-mb-xs">
        <q-linear-progress
          :value="timelineProgress / 100"
          size="8px"
          :color="timelineColor"
          track-color="grey-3"
          rounded
        />
      </div>

      <div class="timeline-dates">
        <div class="date-item date-start">
          <div class="date-label text-caption text-grey-6">Start</div>
          <div class="date-value text-body2 text-weight-medium">{{ formatDate(projectData?.startDate) }}</div>
        </div>
        <div class="date-item days-remaining">
          <div class="days-count text-h5 text-weight-bold" :class="daysRemainingClass">
            {{ daysCount }}
          </div>
          <div class="days-label text-caption text-grey-6">{{ daysLabel }}</div>
        </div>
        <div class="date-item date-end">
          <div class="date-label text-caption text-grey-6 text-right">End</div>
          <div class="date-value text-body2 text-weight-medium">{{ formatDate(projectData?.endDate) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { ProjectDataResponse } from '@shared/response';

export default defineComponent({
  name: 'ProjectTimelineCard',
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

      if (projectProgress < progress - 20) return 'negative';
      if (projectProgress < progress - 10) return 'warning';
      if (progress > 90) return 'warning';
      return 'primary';
    });

    const daysRemaining = computed(() => {
      if (!props.projectData?.endDate) return null;

      const end = new Date(props.projectData.endDate);
      const now = new Date();
      return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    });

    const daysCount = computed(() => {
      const days = daysRemaining.value;
      if (days === null) return 'N/A';
      return Math.abs(days).toString();
    });

    const daysLabel = computed(() => {
      const days = daysRemaining.value;
      if (days === null) return '';
      if (days < 0) return 'days overdue';
      if (days === 0) return 'Due today';
      if (days === 1) return 'day left';
      return 'days left';
    });

    const daysRemainingClass = computed(() => {
      const days = daysRemaining.value;
      if (days === null) return '';
      if (days < 0) return 'text-negative';
      if (days <= 7) return 'text-warning';
      return 'text-positive';
    });

    const projectStatus = computed(() => {
      const days = daysRemaining.value;
      if (days === null) return 'Not Started';
      if (days < 0) return 'Overdue';

      const progress = props.projectData?.progressPercentage || 0;
      if (progress === 100) return 'Completed';
      if (progress > 0) return 'On Track';
      return 'Not Started';
    });

    const statusColor = computed(() => {
      const status = projectStatus.value;
      switch (status) {
        case 'Completed': return 'positive';
        case 'On Track': return 'primary';
        case 'Overdue': return 'negative';
        default: return 'grey';
      }
    });

    return {
      formatDate,
      timelineProgress,
      timelineColor,
      daysCount,
      daysLabel,
      daysRemainingClass,
      projectStatus,
      statusColor
    };
  }
});
</script>

<style scoped lang="scss">
.project-timeline-card-content {
  min-height: 140px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  .status-chip {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .timeline-content {
    .timeline-bar {
      width: 100%;
      background: var(--md-sys-color-surface-variant);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 16px;
    }

    .timeline-dates {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;

      .date-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

        &.date-start {
          align-items: flex-start;
          min-width: 100px;
        }

        &.days-remaining {
          align-items: center;
          flex: 1;

          .days-count {
            line-height: 1;
          }
        }

        &.date-end {
          align-items: flex-end;
          min-width: 100px;
        }

        .date-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .date-value {
          font-size: 13px;
        }
      }
    }
  }
}
</style>
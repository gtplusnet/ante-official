<template>
  <global-widget-card-box class="schedule-card" @click="$emit('click', schedule)">
    <div class="row items-center justify-between">
      <!-- Icon and title -->
      <global-widget-card-box-title
        :icon="schedule.icon"
        :icon-color="schedule.color"
        :title="schedule.title"
      />
      <!-- Pinned badge -->
      <div v-if="schedule.isPinned" class="pinned-badge text-label-small text-secondary">Pinned</div>
    </div>

    <!-- Content -->
    <div class="schedule-details">
      <div class="schedule-time text-caption text-grey">
        {{ schedule.date }} • {{ schedule.timeRange }}
      </div>
    </div>
  </global-widget-card-box>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import GlobalWidgetCardBox from 'src/components/shared/global/GlobalWidgetCardBox.vue';
import GlobalWidgetCardBoxTitle from 'src/components/shared/global/GlobalWidgetCardBoxTitle.vue';

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
  name: 'ScheduleCard',
  components: {
    GlobalWidgetCardBox,
    GlobalWidgetCardBoxTitle,
  },
  props: {
    schedule: {
      type: Object as PropType<Schedule>,
      required: true,
    },
  },
  emits: ['click'],
});
</script>

<style scoped lang="scss">
.schedule-card {
  .schedule-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f7ff;
    border-radius: 8px;
  }

  .schedule-details {
    flex: 1;
    min-width: 0;

    .schedule-title {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .schedule-time {
      color: #666;
      font-size: 12px;
    }
  }

  .pinned-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(47, 64, 196, 0.12);
    border-radius: 6px;
    padding: 1px 6px;
  }
}

@media (max-width: 768px) {
  .schedule-card {
    padding: 10px 12px;

    .schedule-card-content {
      .schedule-icon {
        width: 36px;
        height: 36px;
      }

      .pinned-badge {
        position: static;
        transform: none;
        margin-left: auto;
      }
    }
  }
}
</style>

<template>
  <div class="task-item" :class="task.tags?.[2].label === 'Done' ? 'approved' : ''" @click="$emit('click', task)">
    <div class="task-page-card-header">
      <div class="text-title-small text-dark task-title">
        {{ task.title || 'Untitled Task' }}
      </div>
      <div class="text-label-medium task-assignee">
        <q-tooltip>Assigned by:</q-tooltip>
        <span v-if="task.createdBy">
          {{ task.createdBy?.firstName || '' }}
          {{ task.createdBy?.lastName || '' }}
        </span>
        <span v-else>Unknown</span>
      </div>
    </div>
    <div class="task-page-card-footer">
      <div class="chip-container">
        <div class="chip-tag text-label-small" style="background-color: #80CBC4; color: #110848;">
          <q-icon name="o_folder" size="14px" class="q-mr-xs text-dark"/>
          {{ task.project?.name || 'No Project' }}
        </div>
        <div
          v-for="(tag, idx) in getFilteredTags(task.tags)"
          :key="tag?.id || idx"
          class="chip-tag text-label-small"
          :style="getTagStyle(tag)"
        >
          {{ tag?.label || 'Unknown' }}
        </div>
        <div
          v-if="task.dueDate"
          class="chip-tag text-label-small"
          :style="getDueDateStyle(task.dueDate)"
        >
          <q-icon :name="getDueDateIcon(task.dueDate)" size="14px" class="q-mr-xs"/>
          {{ formatDueDate(task.dueDate) }}
        </div>
      </div>
      <div class="task-date text-label-small">{{ task.createdAt?.timeAgo || '-' }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { CombinedTaskResponseInterface } from 'src/shared/interfaces/task.interfaces';

export default defineComponent({
  name: 'NormalTaskCard',
  props: {
    task: {
      type: Object as PropType<CombinedTaskResponseInterface>,
      required: true,
    },
  },
  emits: ['click'],
  methods: {
    getFilteredTags(tags: any[]) {
      if (!tags || tags.length === 0) return [];
      // Show status (index 2) first, then priority (index 0), hide difficulty (index 1)
      const filteredTags = [];
      if (tags[2]) filteredTags.push(tags[2]); // Status
      if (tags[0]) filteredTags.push(tags[0]); // Priority
      return filteredTags;
    },
    getTagStyle(tag: any) {
      // Check if this is a status tag
      if (tag?.label === 'Pending') {
        return {
          backgroundColor: '#FFF59D',
          color: '#110848'
        };
      } else if (tag?.label === 'Done') {
        return {
          backgroundColor: '#A5D6A7',
          color: '#110848'
        };
      } else if (tag?.label === 'In Progress') {
        return {
          backgroundColor: '#D0F2FF',
          color: '#110848'
        };
      }
      // Default to tag's own colors
      return {
        backgroundColor: tag?.color || 'grey',
        color: tag?.textColor || 'white'
      };
    },
    formatDueDate(dueDate: any) {
      if (!dueDate?.dateStandard) return '';
      const date = new Date(dueDate.dateStandard + 'T00:00:00');
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    },
    isDueSoon(dueDate: any) {
      if (!dueDate?.dateStandard) return false;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const due = new Date(dueDate.dateStandard + 'T00:00:00');
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

      // Warning triggers on same day or 1 day before
      const diffTime = dueDay.getTime() - today.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 1;
    },
    isOverdue(dueDate: any) {
      if (!dueDate?.dateStandard) return false;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const due = new Date(dueDate.dateStandard + 'T00:00:00');
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      return today > dueDay;
    },
    getDueDateIcon(dueDate: any) {
      if (this.isOverdue(dueDate)) return 'error';
      return 'o_schedule';
    },
    getDueDateStyle(dueDate: any) {
      if (this.isOverdue(dueDate)) {
        return {
          backgroundColor: '#EF5350',
          color: 'white'
        };
      } else if (this.isDueSoon(dueDate)) {
        return {
          backgroundColor: '#FFB74D',
          color: 'black'
        };
      } else {
        return {
          backgroundColor: '#DDE1F0',
          color: 'black'
        };
      }
    }
  }
});
</script>

<style src="../../TaskWidget.scss" scoped></style>

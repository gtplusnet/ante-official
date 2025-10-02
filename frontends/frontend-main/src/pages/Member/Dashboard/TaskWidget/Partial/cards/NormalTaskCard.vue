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
        <div class="chip-tag text-label-small" style="background-color: #80CBC4; color: #181d36;">
          <q-icon name="o_assignment_returned" size="14px" class="q-mr-xs text-dark"/>
          Task
        </div>
        <div
          v-for="(tag, idx) in (task.tags || []).slice(1)"
          :key="tag?.id || idx"
          class="chip-tag text-label-small"
          :style="getTagStyle(tag)"
        >
          {{ tag?.label || 'Unknown' }}
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
      }
      // Default to tag's own colors
      return {
        backgroundColor: tag?.color || 'grey',
        color: tag?.textColor || 'white'
      };
    }
  }
});
</script>

<style src="../../TaskWidget.scss" scoped></style>

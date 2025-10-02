<template>
  <component :is="taskComponent" v-bind="$props" />
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import NormalTaskCard from './NormalTaskCard.vue';
import ApprovalTaskCard from './ApprovalTaskCard.vue';
import { CombinedTaskResponseInterface } from 'src/shared/interfaces/task.interfaces';

export default defineComponent({
  name: 'TaskCard',
  components: {
    NormalTaskCard,
    ApprovalTaskCard,
  },
  props: {
    task: {
      type: Object as PropType<CombinedTaskResponseInterface>,
      required: true,
    },
  },
  setup(props) {
    const taskComponent = computed(() => {
      // Map task types to components
      const componentMap: Record<string, typeof NormalTaskCard | typeof ApprovalTaskCard> = {
        NORMAL: NormalTaskCard,
        APPROVAL: ApprovalTaskCard,
        // Future task types can be added here
        // REVIEW: ReviewTaskCard,
        // NOTIFICATION: NotificationTaskCard,
      };

      const taskType = props.task.taskType || 'NORMAL';
      return componentMap[taskType] || NormalTaskCard;
    });

    return {
      taskComponent,
    };
  },
});
</script>
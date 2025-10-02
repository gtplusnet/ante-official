<template>
  <div class="task-item" @click="$emit('click', task)">
    <div class="task-page-card-header">
      <div class="text-title-small text-dark task-title">
        {{ formatTitle(task.title) }}
      </div>
      <div class="text-label-medium task-assignee">
        <q-tooltip>Requested by:</q-tooltip>
        <span v-if="task.createdBy">{{ formatWord(task.createdBy?.firstName) }} {{ formatWord(task.createdBy?.lastName) }}</span>
        <span v-else>Unknown</span>
      </div>
    </div>
    <div class="row justify-between items-center">
      <!-- Approval-specific metadata -->
      <div v-if="approvalData" class="chip-container">
        <div class="chip-filing text-dark text-label-small">
          <q-icon name="o_source" size="14px" />
          {{ formatSourceModule(approvalData.sourceModule) }}
        </div>
        <div class="chip-level text-dark text-label-small">
          <q-icon name="o_layers" size="14px" />
          Level {{ approvalData.approvalLevel }} of {{ approvalData.maxApprovalLevel }}
        </div>
        <div
          class="chip-status text-dark text-label-small"
          :class="{
            pending: task.approvalMetadata?.sourceData?.status === 'PENDING',
            approved: task.approvalMetadata?.sourceData?.status === 'APPROVED',
            rejected: task.approvalMetadata?.sourceData?.status === 'REJECTED',
            cancelled: task.approvalMetadata?.sourceData?.status === 'CANCELLED',
          }"
        >
          {{ formatWord(typeof task.approvalMetadata?.sourceData?.status === 'string' ? task.approvalMetadata.sourceData.status : '') }}
        </div>
      </div>
      <div class="task-date text-label-small">{{ task.createdAt?.timeAgo || '-' }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { CombinedTaskResponseInterface } from 'src/shared/interfaces/task.interfaces';
import { formatWord } from 'src/utility/formatter';

export default defineComponent({
  name: 'ApprovalTaskCard',
  props: {
    task: {
      type: Object as PropType<CombinedTaskResponseInterface>,
      required: true,
    },
  },
  emits: ['click'],
  setup(props) {
    const approvalData = computed(() => {
      return props.task.approvalMetadata || null;
    });

    const formatTitle = (title: string | undefined) => {
      if (!title) return 'Untitled';

      // Remove everything after 'request' (case insensitive)
      const fromIndex = title.toLowerCase().indexOf(' request');
      if (fromIndex !== -1) {
        return title.substring(0, fromIndex);
      }

      // If no 'from' found, return the full title
      return title;
    };

    const formatSourceModule = (module: string | undefined | null) => {
      if (!module) return 'Unknown';

      const moduleLabels: Record<string, string> = {
        HR_FILING: 'HR Filing',
        PAYROLL_PROCESSING: 'Payroll Processing',
        PURCHASE_ORDER: 'Purchase Order',
        LEAVE_REQUEST: 'Leave Request',
        petty_cash_liquidation: 'Petty Cash Liquidation',
      };
      return moduleLabels[module] || module;
    };

    return {
      approvalData,
      formatSourceModule,
      formatTitle,
      formatWord,
    };
  },
});
</script>

<style src="../../TaskWidget.scss" scoped></style>

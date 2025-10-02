<template>
  <div class="project-budget-card-content">
    <div class="budget-header row items-center justify-between q-mb-sm">
      <q-chip
        dense
        square
        size="sm"
        :color="budgetHealthColor"
        text-color="white"
        class="health-chip"
      >
        {{ budgetHealthPercentage }}% left
      </q-chip>
    </div>

    <div class="budget-content">
      <!-- Progress Bar -->
      <div class="budget-progress q-mb-sm">
        <q-linear-progress
          :value="collectionProgress"
          size="6px"
          :color="progressColor"
          track-color="grey-3"
          rounded
        />
      </div>

      <!-- Budget Metrics -->
      <div class="budget-metrics">
        <div class="metric-item">
          <div class="metric-label text-caption text-grey-6">Total Budget</div>
          <div class="metric-value text-body1 text-weight-bold">
            {{ formatCurrency(projectData?.budget) }}
          </div>
        </div>

        <div class="metric-item">
          <div class="metric-label text-caption text-grey-6">Collected</div>
          <div class="metric-value text-body1 text-weight-bold text-positive">
            {{ formatCurrency(projectData?.totalCollected) }}
          </div>
        </div>

        <div class="metric-item">
          <div class="metric-label text-caption text-grey-6">Remaining</div>
          <div class="metric-value text-body1 text-weight-bold" :class="remainingClass">
            {{ formatCurrency(remainingBudget) }}
          </div>
        </div>
      </div>

      <!-- Additional Financial Info -->
      <div v-if="hasAdditionalInfo" class="additional-info q-mt-sm q-pt-sm">
        <div class="row q-gutter-sm text-caption">
          <div v-if="projectData?.downpaymentAmount" class="col">
            <span class="text-grey-6">Downpayment:</span>
            <span class="text-weight-medium q-ml-xs">
              {{ formatCurrency(projectData.downpaymentAmount) }}
            </span>
          </div>
          <div v-if="projectData?.retentionAmount" class="col">
            <span class="text-grey-6">Retention:</span>
            <span class="text-weight-medium q-ml-xs">
              {{ formatCurrency(projectData.retentionAmount) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { ProjectDataResponse } from '@shared/response';

export default defineComponent({
  name: 'ProjectBudgetCard',
  props: {
    projectData: {
      type: Object as PropType<ProjectDataResponse | null>,
      default: null
    }
  },
  setup(props) {
    const formatCurrency = (amount: number | undefined) => {
      if (!amount) return '₱0';
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    const remainingBudget = computed(() => {
      const budget = props.projectData?.budget || 0;
      const collected = props.projectData?.totalCollected || 0;
      return budget - collected;
    });

    const collectionProgress = computed(() => {
      const budget = props.projectData?.budget || 0;
      const collected = props.projectData?.totalCollected || 0;

      if (budget === 0) return 0;
      const progress = collected / budget;
      return Math.min(progress, 1); // Cap at 100%
    });

    const budgetHealthPercentage = computed(() => {
      const budget = props.projectData?.budget || 0;
      const remaining = remainingBudget.value;

      if (budget === 0) return 0;
      const percentage = (remaining / budget) * 100;
      return Math.max(0, Math.round(percentage));
    });

    const budgetHealthColor = computed(() => {
      const percentage = budgetHealthPercentage.value;
      if (percentage <= 10) return 'negative';
      if (percentage <= 25) return 'warning';
      return 'positive';
    });

    const progressColor = computed(() => {
      const progress = collectionProgress.value;
      if (progress >= 1) return 'positive';
      if (progress >= 0.75) return 'primary';
      if (progress >= 0.5) return 'info';
      return 'warning';
    });

    const remainingClass = computed(() => {
      if (remainingBudget.value < 0) return 'text-negative';
      if (remainingBudget.value === 0) return 'text-positive';
      return '';
    });

    const hasAdditionalInfo = computed(() => {
      return props.projectData?.downpaymentAmount || props.projectData?.retentionAmount;
    });

    return {
      formatCurrency,
      remainingBudget,
      collectionProgress,
      budgetHealthPercentage,
      budgetHealthColor,
      progressColor,
      remainingClass,
      hasAdditionalInfo
    };
  }
});
</script>

<style scoped lang="scss">
.project-budget-card-content {
  min-height: 140px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  .health-chip {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .budget-content {
    .budget-progress {
      width: 100%;
      background: var(--md-sys-color-surface-variant);
      border-radius: 3px;
      overflow: hidden;
    }

    .budget-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding: 12px 0;

      .metric-item {
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 6px;

        .metric-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.7;
        }

        .metric-value {
          line-height: 1;
          font-size: 14px;
        }
      }
    }

    .additional-info {
      border-top: 1px solid var(--md-sys-color-outline-variant);
    }
  }
}
</style>
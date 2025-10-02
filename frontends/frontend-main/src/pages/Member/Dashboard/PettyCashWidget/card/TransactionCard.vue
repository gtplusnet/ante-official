<template>
  <div class="transaction-item">
    <div class="transaction-icon" :class="iconClass">
      <q-icon :name="icon" size="20px" />
    </div>
    <div class="details-container">
      <div class="transaction-details">
        <div class="text-label-medium text-dark row items-center justify-between">
          <span>{{ title }}</span>
          <div v-if="type === 'return'" class="row items-center label-background">
            <q-icon name="o_account_balance" size="10px" />
            <div class="text-body-small-f-[10px]">Returned to Fund Account</div>
          </div>
        </div>
        <div class="text-label-small text-grey-light">{{ description }}</div>
        <div class="text-body-small-f-[10px] text-grey-light">{{ date }}</div>
      </div>
      <div class="transaction-amount">
        <div class="amount text-label-small" :class="amountClass">{{ amount }}</div>
        <div v-if="transaction" class="text-label-small-f-[10px] text-grey-light">
          <span class="q-mr-xs">Balance:</span>
          <span>{{ balanceBefore || balance }}</span>
          <q-icon name="arrow_forward" size="14px" class="q-mx-xs" />
          <span>{{ balance }}</span>
        </div>
        <div v-if="!transaction && status" class="text-label-small-f-[10px]">
          <!-- Use workflow status badge if workflow stage is available -->
          <WorkflowStatusBadge
            v-if="workflowStage"
            :stage="workflowStage"
            size="sm"
            :show-tooltip="false"
          />
          <!-- Fallback to basic status chip -->
          <q-chip 
            v-else
            :color="getStatusColor(status)" 
            text-color="white" 
            size="sm" 
            dense
          >
            {{ statusLabel || status }}
          </q-chip>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import WorkflowStatusBadge from 'src/components/workflow/WorkflowStatusBadge.vue';

export default defineComponent({
  name: 'TransactionCard',
  components: {
    WorkflowStatusBadge,
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
      default: '',
    },
    amount: {
      type: String,
      required: true,
      default: '₱ 0.00',
    },
    balance: {
      type: String,
      required: false,
      default: '',
    },
    balanceBefore: {
      type: String,
      required: false,
      default: '',
    },
    icon: {
      type: String,
      required: true,
    },
    transaction: {
      type: Boolean,
      required: true,
    },
    type: {
      type: String,
      default: 'transfer',
      validator: (value: string) =>
        ['transfer', 'return', 'deduction', 'refill', 'assignment', 'liquidation'].includes(value)
    },
    status: {
      type: String,
      required: false,
      default: '',
    },
    statusLabel: {
      type: String,
      required: false,
      default: '',
    },
    workflowStage: {
      type: Object,
      required: false,
      default: null,
    },
  },
  setup(props) {
    const amountClass = computed(() => {
      return props.amount.includes('+') ? 'positive' : 'negative';
    });

    const iconClass = computed(() => {
      return props.type || 'transfer';
    });

    const getStatusColor = (status: string) => {
      const statusColors: Record<string, string> = {
        'PENDING': 'orange',
        'APPROVED': 'green',
        'REJECTED': 'red',
        'CANCELLED': 'grey',
        'PROCESSING': 'blue',
        'COMPLETED': 'teal',
      };
      return statusColors[status.toUpperCase()] || 'grey';
    };

    return {
      amountClass,
      iconClass,
      getStatusColor,
    };
  },
});
</script>

<style scoped lang="scss">
.transaction-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background-color: var(--q-extra-lighter);

  .transaction-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.transfer {
      background-color: #f3e5f5;
      color: #9c27b0;
    }

    &.return {
      background-color: #E8F5E9;
      color: #66BB6A;
    }

    &.deduction {
      background-color: #FBE9E7;
      color: #FF7043;
    }

    &.refill {
      background-color: #E3F2FD;
      color: #42A5F5;
    }

    &.assignment {
      background-color: #E0F2F1;
      color: #4DB6AC;
    }

    &.liquidation {
      background-color: #615FF61F;
      color: var(--q-secondary);
    }
  }

  .details-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .label-background {
      background-color: #E8F5E9;
      color: #66BB6A;
      border-radius: 50px;
      margin-left: 8px;
      padding: 1px 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .transaction-amount {
      display: flex;
      flex-direction: column;
      justify-content: end;
      align-items: end;
      gap: 16px;

      .amount {
        width: 80px;
        height: 18px;
        border-radius: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 500;

        &.positive {
          background-color: #e8f5e9;
          color: #2e7d32;
        }

        &.negative {
          background-color: #ffebee;
          color: #c62828;
        }
      }
    }
  }
}
</style>

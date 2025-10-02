<template>
  <div>
    <summary-group
      class="text-left"
      description="Late"
      :amount="-timekeepingData.summary.deductions.late"
      :indention="0"
    />

    <summary-group
      class="text-left"
      description="Undertime"
      :amount="-timekeepingData.summary.deductions.undertime"
      :indention="0"
    />

    <summary-group
      class="text-left"
      description="Absent"
      :amount="-timekeepingData.summary.deductions.absent"
      :indention="0"  
    />

    <!-- Salary Adjustment Deductions -->
    <template v-for="(adjustment, index) in deductionAdjustments" :key="`deduction-adj-${index}`">
      <summary-group
        class="text-left"
        :description="adjustment.title + ' (Adjustment)'"
        :amount="-Number(adjustment.amount)"
        :indention="0"
      />
    </template>
  </div>
</template>

<style scoped src="../PayrollSalaryComputation.scss"></style>

<script lang="ts">
import { PayrollProcessingResponse } from "@shared/response";
import SummaryGroup from './SummaryGroup.vue';
import { api } from 'src/boot/axios';
import { onMounted, ref, computed } from 'vue';

export default {
  name: 'PayrollSalaryAdditionalDeductionsSummary',
  components: {
    SummaryGroup,
  },
  props: {
    timekeepingData: {
      type: Object as () => PayrollProcessingResponse,
      default: null,
    },
    accountId: {
      type: String,
      required: true,
    },
    cutoffDateRangeId: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    interface SalaryAdjustment {
      id: number;
      configurationId: number;
      title: string;
      amount: number;
      adjustmentType: 'ALLOWANCE' | 'DEDUCTION';
      taxBasis?: 'TAXABLE' | 'NON_TAXABLE';
    }

    const salaryAdjustments = ref<SalaryAdjustment[]>([]);

    const deductionAdjustments = computed(() => {
      return salaryAdjustments.value.filter(
        adj => adj.adjustmentType === 'DEDUCTION'
      );
    });

    const fetchSalaryAdjustments = async () => {
      if (!props.accountId || !props.cutoffDateRangeId) return;
      
      try {
        const response = await api.get(`/hr-processing/employee-salary-adjustments/employee/${props.accountId}/cutoff/${props.cutoffDateRangeId}`);
        if (response.data) {
          salaryAdjustments.value = response.data.deductions || [];
        }
      } catch (error) {
        console.error('Error fetching salary adjustments:', error);
      }
    };

    onMounted(async () => {
      await fetchSalaryAdjustments();
    });

    return {
      deductionAdjustments,
    };
  },
};
</script>

<template>
  <div v-if="salaryAdjustments.length > 0">
    <!-- Individual Salary Adjustments -->
    <template v-for="(adjustment, index) in salaryAdjustments" :key="`salary-adj-${index}`">
      <summary-group
        class="text-left"
        :description="adjustment.title"
        :amount="Number(adjustment.amount)"
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
import { onMounted, ref } from 'vue';

interface SalaryAdjustment {
  title: string;
  amount: number | string;
  adjustmentType: string;
}

export default {
  name: 'PayrollSalaryAdjustmentSummary',
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
    const salaryAdjustments = ref<SalaryAdjustment[]>([]);

    const fetchSalaryAdjustments = async () => {
      if (!props.accountId || !props.cutoffDateRangeId) return;
      
      try {
        const response = await api.get(
          `/hr-processing/employee-salary-adjustments/employee/${props.accountId}/cutoff/${props.cutoffDateRangeId}`
        );
        
        if (response.data) {
          // Use the salaryAdjustments array from the response
          salaryAdjustments.value = response.data.salaryAdjustments || [];
        }
      } catch (error) {
        console.error('Error fetching salary adjustments:', error);
      }
    };

    onMounted(() => {
      fetchSalaryAdjustments();
    });

    return {
      salaryAdjustments,
    };
  },
};
</script>
<template>
  <div>
    <summary-group
      class="text-left"
      description="Basic Salary"
      :amount="timekeepingData.summary.basicSalary"
      :indention="0"
    />
  </div>
</template>

<style scoped src="../PayrollSalaryComputation.scss"></style>

<script lang="ts">
import { PayrollProcessingResponse } from "@shared/response";
import SummaryGroup from './SummaryGroup.vue';

export default {
  name: 'PayrollSalaryBasicSalarySummary',
  components: {
    SummaryGroup,
  },
  props: {
    timekeepingData: {
      type: Object as () => PayrollProcessingResponse,
      default: null,
    },
  },
};
</script>

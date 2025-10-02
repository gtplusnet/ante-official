<template>
  <div>
    <summary-group
      description="SSS"
      :amount="-timekeepingData.summary.contributions.sss"
      :indention="0"
    />

    <summary-group
      description="Philhealth"
      :amount="-timekeepingData.summary.contributions.philhealth"
      :indention="0"
    />

    <summary-group
      description="Pagibig"
      :amount="-timekeepingData.summary.contributions.pagibig"
      :indention="0"
    />

    <summary-group
      description="Tax"
      :amount="-timekeepingData.summary.contributions.withholdingTax"
      :indention="0"
    />
  </div>
</template>

<style scoped src="../PayrollSalaryComputation.scss"></style>

<script lang="ts">
import { PayrollProcessingResponse } from "@shared/response";
import SummaryGroup from './SummaryGroup.vue';

export default {
  name: 'PayrollSalaryGovernmentContributionsSummary',
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

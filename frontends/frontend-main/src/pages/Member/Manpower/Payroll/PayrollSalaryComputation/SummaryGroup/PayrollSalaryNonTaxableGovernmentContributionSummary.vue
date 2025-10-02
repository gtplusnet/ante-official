<template>
  <div>
    <summary-group
      class="text-left"
      description="SSS"
      :amount="-timekeepingData.summary.contributions.sss"
      :indention="0"
    />

    <summary-group
      class="text-left"
      description="Philhealth"
      :amount="-timekeepingData.summary.contributions.philhealth"
      :indention="0"
    />

    <summary-group
      class="text-left"
      description="Pagibig"
      :amount="-timekeepingData.summary.contributions.pagibig"
      :indention="0"
    />
  </div>
</template>

<style scoped src="../PayrollSalaryComputation.scss"></style>

<script lang="ts">
import { PayrollProcessingResponse } from "@shared/response";
import SummaryGroup from './SummaryGroup.vue';

export default {
  name: 'PayrollSalaryNonTaxableGovernmentContributionsSummary',
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

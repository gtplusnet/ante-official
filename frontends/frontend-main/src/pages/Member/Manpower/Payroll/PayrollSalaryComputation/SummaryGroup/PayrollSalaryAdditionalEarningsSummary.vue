<template>
  <div>
    <summary-group
      description="Overtime Pay"
      :amount="timekeepingData.summary.additionalEarnings.overtime"
      :indention="0"
    />

    <summary-group
      description="Rest Day Pay"
      :amount="timekeepingData.summary.additionalEarnings.restDay"
      :indention="0"
    />

    <summary-group
      description="Night Differential"
      :amount="timekeepingData.summary.additionalEarnings.nightDifferential"
      :indention="0"
    />

    <summary-group
      description="Night Differential Overtime"
      :amount="
        timekeepingData.summary.additionalEarnings.nightDifferentialOvertime
      "
      :indention="0"
    />

    <summary-group description="Holiday" :indention="0" />

    <summary-group
      description="Special Holiday"
      :amount="timekeepingData.summary.additionalEarnings.specialHoliday"
      :indention="1"
    />

    <summary-group
      description="Regular Holiday"
      :amount="timekeepingData.summary.additionalEarnings.regularHoliday"
      :indention="1"
    />
  </div>
</template>

<style scoped src="../PayrollSalaryComputation.scss"></style>

<script lang="ts">
import { PayrollProcessingResponse } from "@shared/response";
import SummaryGroup from './SummaryGroup.vue';

export default {
  name: 'PayrollSalaryAdditionalEarningsSummary',
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

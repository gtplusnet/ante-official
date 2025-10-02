<template>
  <div class="left-panel">
    <!-- Dashboard Counters -->
    <DashboardCounters />

    <!-- Sales Stages -->
    <SalesStagesWidget />

    <!-- Deal Types -->
    <DealTypesWidget />

    <!-- Closing Dates -->
    <ClosingDatesWidget />

    <!-- Sales Probability -->
    <SalesProbabilityWidget />

    <!-- Average Days in Stage -->
    <AverageDaysStageWidget />

    <!-- Action Center -->

    <!-- Attendance Conflicts -->

    <!-- Payroll Summary -->
  </div>
  <div class="right-panel">
    <!-- Total Confirmations -->
    <TotalConfirmationsWidget />
    
    <!-- Lead Updates -->
    <LeadUpdatesWidget />
  </div>
</template>

<style scoped src="./LeadsDashboard.scss" lang="scss"></style>

<script lang="ts">
import { defineComponent } from "vue";
import TotalConfirmationsWidget from "./DashboardWidget/TotalConfirmationsWidget.vue";
import DashboardCounters from "./DashboardWidget/DashboardCounters.vue";
import SalesStagesWidget from "./DashboardWidget/SalesStagesWidget.vue";
import DealTypesWidget from "./DashboardWidget/DealTypesWidget.vue";
import ClosingDatesWidget from "./DashboardWidget/ClosingDatesWidget.vue";
import SalesProbabilityWidget from "./DashboardWidget/SalesProbabilityWidget.vue";
import AverageDaysStageWidget from "./DashboardWidget/AverageDaysStageWidget.vue";
import LeadUpdatesWidget from "./DashboardWidget/LeadUpdatesWidget.vue";

export default defineComponent({
  name: "LeadsDashboard",
  components: {
    TotalConfirmationsWidget,
    DashboardCounters,
    SalesStagesWidget,
    DealTypesWidget,
    ClosingDatesWidget,
    SalesProbabilityWidget,
    AverageDaysStageWidget,
    LeadUpdatesWidget,
  },
});
</script>

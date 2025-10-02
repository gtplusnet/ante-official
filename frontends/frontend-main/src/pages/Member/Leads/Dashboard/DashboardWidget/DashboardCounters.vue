<template>
  <div class="leads-dashboard-counters">
    <GlobalWidgetCounter
      icon="diversity_3"
      icon-color="var(--q-primary)"
      value="54"
      label="Active Deals in Pipeline"
      card-class="dashboard-card-1"
    />
    <GlobalWidgetCounter
      icon="o_business_center"
      icon-color="var(--q-secondary)"
      value="73"
      label="Total Opportunities"
      card-class="dashboard-card-2"
    />
    <GlobalWidgetCounter
      icon="signal_cellular_alt"
      icon-color="var(--q-accent)"
      value="₱3,133,000.00"
      label="MMR Opportunity"
      card-class="dashboard-card-3"
    />
    <GlobalWidgetCounter
      icon="commit"
      icon-color="var(--q-hero)"
      value="₱15,070,000.00"
      label="Initial Cost Opportunity"
      card-class="ico-card"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import GlobalWidgetCounter from "src/components/shared/global/GlobalWidgetCounter.vue";

export default defineComponent({
  name: "DashboardCounters",
  components: {
    GlobalWidgetCounter,
  },
});
</script>

<style scoped lang="scss">
.leads-dashboard-counters {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
}

.ico-card {
  background-image: url('assets/img/card1.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #DEF0FF;
}

// Custom font size for specific counters
.dashboard-card-1 :deep(.counter-label) {
  font-size: 12px !important;
}

.ico-card :deep(.counter-label) {
  font-size: 12px !important;
}
</style>

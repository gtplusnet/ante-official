<template>
  <expanded-nav-page-container variant="transparent">
    <div class="left-panel">
      <!-- Dashboard Counters -->
      <CMSDashboardCounters />

      <!-- Media Stats -->
      <CMSMediaStats />

      <!-- API Usage -->
      <CMSAPIUsage />
    </div>
    <div class="right-panel">
      <!-- Recent Activity -->
      <CMSRecentActivity />
    </div>
  </expanded-nav-page-container>
</template>

<style scoped src="./CMSDashboard.scss" lang="scss"></style>

<script lang="ts">
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import CMSDashboardCounters from './DashboardWidget/CMSDashboardCounters.vue';
import CMSMediaStats from './DashboardWidget/CMSMediaStats.vue';
import CMSAPIUsage from './DashboardWidget/CMSAPIUsage.vue';
import CMSRecentActivity from './DashboardWidget/CMSRecentActivity.vue';

export default {
  name: 'CMSDashboard',
  components: {
    ExpandedNavPageContainer,
    CMSDashboardCounters,
    CMSMediaStats,
    CMSAPIUsage,
    CMSRecentActivity,
  },
};
</script>
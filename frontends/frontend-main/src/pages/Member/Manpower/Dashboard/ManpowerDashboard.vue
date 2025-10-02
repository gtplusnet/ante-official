<template>
  <expanded-nav-page-container variant="transparent">
    <div class="left-panel">
      <!-- Dashboard Counters -->
      <ManpowerDashboardCounters />

      <!-- Task Panel -->
      <ManpowerManageRequest />

      <!-- Action Center -->
      <ManpowerActionCenter />

      <!-- Attendance Conflicts -->
      <ManpowerAttendanceConflicts />

      <!-- Payroll Summary -->
      <ManpowerPayrollSummary />
    </div>
    <div class="right-panel">
      <!-- Announcement -->
      <ManpowerAnnouncement />

      <!-- Daily Attendance -->
      <ManpowerDailyAttendance />
    </div>
  </expanded-nav-page-container>
</template>

<style scoped src="./ManpowerDashboard.scss" lang="scss"></style>

<script lang="ts">
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import ManpowerDashboardCounters from './DashboardWidget/ManpowerDashboardCounters.vue';
import ManpowerAnnouncement from './DashboardWidget/ManpowerAnnouncement.vue';
import ManpowerManageRequest from './DashboardWidget/ManpowerManageRequest.vue';
import ManpowerActionCenter from './DashboardWidget/ManpowerActionCenter.vue';
import ManpowerAttendanceConflicts from './DashboardWidget/ManpowerAttendanceConflicts.vue';
import ManpowerPayrollSummary from './DashboardWidget/ManpowerPayrollSummary.vue';
import ManpowerDailyAttendance from './DashboardWidget/ManpowerDailyAttendance.vue';

export default {
  name: 'ManpowerDashboard',
  components: {
    ExpandedNavPageContainer,
    ManpowerDashboardCounters,
    ManpowerAnnouncement,
    ManpowerManageRequest,
    ManpowerActionCenter,
    ManpowerAttendanceConflicts,
    ManpowerPayrollSummary,
    ManpowerDailyAttendance,
  },
};
</script>

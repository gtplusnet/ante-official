<template>
  <div class="main-dashboard-container">
    <!-- Left Side -->
    <div class="left-side">
      <!-- Dashboard Counter  -->
      <DashboardCounters />

      <!-- Petty Cash Widget - Mobile/Tablet Only -->
      <PettyCashWidget v-if="showPettyCashWidgetMobile" class="petty-cash-widget-mobile"/>

      <!-- Task List and Updates Widget -->
      <div class="widget-container">
        <!-- Task Widget -->
        <TaskWidget class="task-widget"/>

        <!-- Updates Widget -->
        <UpdateWidget class="updates-widget"/>

        <!-- Request Panel Widget -->
        <RequestPanelWidget class="request-panel-widget"/>

        <!-- Announcements -->
        <ManpowerAnnouncement class="announcements-widget"/>

        <!-- Payslip Summary Widget -->
        <PayslipSummaryWidget class="payslip-summary-widget"/>

        <!-- My Attendance Widget -->
        <MyAttendanceWidget class="my-attendance-widget"/>

        <!-- My Employment Information Widget -->
        <MyEmploymentInformationWidget class="my-employment-information-widget"/>
      </div>
    </div>

    <!-- Right Side -->
    <div class="right-side">
      <!-- Timer Widget -->
      <TimerWidget class="timer-widget"/>

      <!-- Petty Cash Widget -->
      <PettyCashWidget v-if="showPettyCashWidgetDesktop" class="petty-cash-widget"/>

      <!-- Calendar Widget -->
      <CalendarWidget class="calendar-widget"/>

      <!-- My Schedules Widget -->
      <MySchedulesWidget class="my-schedules-widget"/>
    </div>
  </div>
</template>

<style scoped src="./Dashboard.scss"></style>

<script>
import { defineComponent, ref, computed, onMounted, getCurrentInstance } from 'vue';
import { useAuthStore } from '../../../stores/auth';
import { useSocketStore } from '../../../stores/socketStore';
import { usePettyCashCacheStore } from '../../../stores/pettyCashCache';
import { APIRequests } from '../../../utility/api.handler';
import DashboardCounters from './DashboardCounter/DashboardCounters.vue';
import ManpowerAnnouncement from '../Manpower/Dashboard/DashboardWidget/ManpowerAnnouncement.vue';
import TaskWidget from './TaskWidget/TaskWidget.vue';
import UpdateWidget from './NotificationWidget/NotificationWidget.vue';
import RequestPanelWidget from './RequestPanelWidget/RequestPanelWidget.vue';
import PayslipSummaryWidget from './PayslipSummaryWidget/PayslipSummaryWidget.vue';
import MyAttendanceWidget from './MyAttendanceWidget/MyAttendanceWidget.vue';
import MyEmploymentInformationWidget from './MyEmploymentInformationWidget/MyEmploymentInformationWidget.vue';
import CalendarWidget from './CalendarWidget/CalendarWidget.vue';
import MySchedulesWidget from './MySchedulesWidget/MySchedulesWidget.vue';
import PettyCashWidget from './PettyCashWidget/PettyCashWidget.vue';
import TimerWidget from './TimerWidget/TimerWidget.vue';
// import QuestWidget from './QuestWidget/QuestWidget.vue';

// import NotificationWidget from './../../../components/sidebar/Notification.vue';

export default defineComponent({
  name: 'MemberDashboard',
  components: {
    DashboardCounters,
    ManpowerAnnouncement,
    TaskWidget,
    UpdateWidget,
    RequestPanelWidget,
    PayslipSummaryWidget,
    MyAttendanceWidget,
    MyEmploymentInformationWidget,
    CalendarWidget,
    MySchedulesWidget,
    PettyCashWidget,
    TimerWidget,
  },

  setup() {
    const authStore = useAuthStore();
    const socketStore = useSocketStore();
    const pettyCashCacheStore = usePettyCashCacheStore();
    const instance = getCurrentInstance();
    const $q = instance?.proxy?.$q;

    const hasPettyCash = ref(false);
    const isMobileOrTablet = ref(false);

    const showPettyCashWidget = computed(() => {
      return hasPettyCash.value || (pettyCashCacheStore.data?.isActive ?? false);
    });

    const showPettyCashWidgetMobile = computed(() => {
      return showPettyCashWidget.value && isMobileOrTablet.value;
    });

    const showPettyCashWidgetDesktop = computed(() => {
      return showPettyCashWidget.value && !isMobileOrTablet.value;
    });

    const checkPettyCashStatus = async () => {
      try {
        const response = await APIRequests.getCurrentUserPettyCash($q);
        if (response && response.isActive) {
          hasPettyCash.value = true;
          pettyCashCacheStore.setCacheData(response);
        } else {
          hasPettyCash.value = false;
        }
      } catch (error) {
        // If 404 or any error, user doesn't have petty cash
        hasPettyCash.value = false;
      }
    };

    onMounted(async () => {
      await checkPettyCashStatus();

      // Check if mobile or tablet
      const checkMediaQuery = () => {
        isMobileOrTablet.value = window.matchMedia('(max-width: 768px)').matches;
      };

      checkMediaQuery();
      window.addEventListener('resize', checkMediaQuery);

      // Listen for petty cash updates
      socketStore.socket?.on('petty-cash-updated', async (data) => {
        if (data.accountId === authStore.accountInformation?.id) {
          await checkPettyCashStatus();
        }
      });
    });

    return {
      authStore,
      socketStore,
      showPettyCashWidget,
      showPettyCashWidgetMobile,
      showPettyCashWidgetDesktop,
    };
  },

  data: () => ({
    form: {},
  }),

  mounted() {},
});
</script>


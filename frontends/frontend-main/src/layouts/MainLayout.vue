<template>
  <q-layout class="main-layout" :class="whitelabel" :style="mainLayoutStyle" view="lHh Lpr lff">
    <!-- header -->
    <q-header class="main-header" :class="{ 'main-layout--expanded': isExpandedNav }">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
          class="mobile-menu-toggle"
        />
        <q-toolbar-title>
          <div class="row items-center" :class="{ 'main-header--expanded': isExpandedNav }">
            <svg
              class="icon-sunny"
              version="1.0"
              xmlns="http://www.w3.org/2000/svg"
              width="18pt"
              height="18pt"
              viewBox="0 0 126.000000 141.000000"
              preserveAspectRatio="xMidYMid meet"
            >
              <g transform="translate(0.000000,141.000000) scale(0.100000,-0.100000)" fill="#2F40C4" stroke="none">
                <path d="M560 954 l0 -65 38 3 c36 3 37 4 43 53 7 60 -2 75 -47 75 l-34 0 0 -66z" />
                <path d="M336 905 c-17 -26 -21 -45 -8 -45 4 0 22 -14 41 -30 49 -43 81 -37 81 16 0 19 -65 84 -84 84 -7 0 -21 -11 -30 -25z" />
                <path d="M789 890 c-39 -38 -41 -42 -29 -65 16 -31 39 -32 71 -4 13 12 33 27 44 35 19 13 19 15 3 42 -24 40 -42 38 -89 -8z" />
                <path
                  d="M520 833 c-26 -10 -109 -103 -112 -126 -2 -13 -11 -23 -23 -25 -48 -7 -62 -13 -90 -39 -34 -31 -65 -92 -65 -126 0 -43 34 -103 75 -135 l42 -32 130 0 c145 0 155 4 188 83 8 20 19 37 23 37 12 0 82 66 82 77 0 6 7 16 15 23 11 9 15 32 15 80 0 48 -4 71 -15 80 -8 7 -15 17 -15 23 0 14 -60 67 -88 78 -25 10 -138 11 -162 2z m166 -83 c53 -39 70 -112 37 -160 -18 -26 -51 -60 -57 -60 -19 0 -196 138 -196 153 0 21 63 87 83 87 12 0 28 4 35 9 15 9 66 -6 98 -29z m-224 -153 c15 -12 31 -34 37 -49 8 -23 17 -28 42 -28 35 0 69 -24 69 -48 0 -9 -10 -26 -22 -39 -19 -20 -31 -23 -106 -23 -134 0 -180 34 -169 124 10 76 91 111 149 63z"
                />
                <path d="M890 681 c-50 -6 -55 -8 -55 -31 0 -24 4 -25 64 -30 62 -5 91 5 91 30 0 11 -29 41 -38 38 -4 -1 -32 -4 -62 -7z" />
                <path d="M760 475 c-12 -23 -11 -27 28 -65 22 -22 47 -40 55 -40 14 0 47 41 47 57 -1 12 -87 73 -103 73 -7 0 -20 -11 -27 -25z" />
              </g>
            </svg>
            <span class="text-dark company-name">Welcome, {{ authStore.accountInformation?.fullName }}!</span>
          </div>
        </q-toolbar-title>

        <!-- Action Buttons Container -->
        <div class="action-buttons-container">
          <!-- Email Button -->
          <q-btn @click="openEmailClient()" class="btn-email" dense round icon="mail_outline" flat>
            <q-badge v-if="unreadEmailCount" rounded color="red" floating>{{ unreadEmailCount }}</q-badge>
          </q-btn>

          <!-- Quest Button -->
          <q-btn @click="isQuestDialogOpen = true" class="btn-quest" dense round flat icon="o_lightbulb"> </q-btn>

          <!-- Notification Button -->
          <q-btn @click="openNotificationPanel()" class="btn-notif" dense round icon="o_notifications" flat>
            <q-badge v-if="unreadNotification" rounded color="red" floating>{{ unreadNotification }}</q-badge>
          </q-btn>

          <!-- Announcement Button -->
          <q-btn @click="openAnnouncementPanel()" class="btn-announcement" dense round icon="o_campaign" flat>
            <!-- <q-badge v-if="unreadNotification" rounded color="red" floating>{{ unreadNotification }}</q-badge> -->
          </q-btn>
        </div>

        <!-- Header Account -->
        <HeaderAccount class="header-account"/>
      </q-toolbar>
    </q-header>
    <!-- navigation drawer - left -->
    <NavLeft v-model="leftDrawerOpen" :class="{ 'main-navigation--expanded': isExpandedNav }"></NavLeft>
    <!-- notification drawer - right -->
    <Notification v-model="isNotificationOpen"></Notification>
    <!-- announcement drawer - right -->
    <AnnouncementPanel v-model="isAnnouncementPanelOpen"></AnnouncementPanel>
    <!-- main content -->
    <q-page-container class="main-content" :class="{ 'email-page-content': isEmailPage }">
      <!-- email verification banner -->
      <div class="email-verification-container q-pa-md">
        <EmailVerificationBanner />
      </div>
      <div class="mobile-content-wrapper">
        <Suspense v-if="!forceRerender">
          <template #default>
            <router-view :key="$route.fullPath" />
          </template>
          <template #fallback>
            <div class="flex flex-center q-pa-xl">
              <q-spinner-dots color="primary" size="40px" />
            </div>
          </template>
        </Suspense>
      </div>
    </q-page-container>


    <!-- Ai Button -->
    <q-page-sticky position="bottom-right" :offset="aiButtonOffset">
      <q-btn fab icon="o_smart_toy" :color="aiButtonColor" @click="isAiChatDialogOpen = true" :padding="aiButtonPadding">
        <!-- <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="18pt" height="18pt" viewBox="0 0 225.000000 225.000000" preserveAspectRatio="xMidYMid meet">
          <g transform="translate(-43.000000,250.000000) scale(0.100000,-0.100000)" fill="#fff" stroke="none">
            <path d="M763 2681 c-42 -26 -63 -69 -63 -126 0 -37 6 -52 33 -82 29 -31 41 -37 88 -40 66 -5 107 17 132 70 30 62 18 115 -37 166 -36 33 -110 39 -153 12z" />
            <path d="M2120 2693 c-43 -16 -90 -82 -90 -128 0 -41 30 -95 64 -117 24 -15 44 -18 85 -15 47 3 59 9 88 40 28 31 33 44 33 84 0 57 -26 105 -69 128 -30 15 -82 19 -111 8z" />
            <path d="M921 2393 c-24 -12 -48 -24 -53 -25 -8 -3 60 -129 88 -166 1 -2 18 1 36 6 18 6 45 13 60 16 l27 6 -55 93 c-31 50 -57 92 -58 92 0 1 -21 -9 -45 -22z" />
            <path d="M1977 2323 l-56 -93 27 -6 c15 -3 42 -10 60 -16 18 -5 35 -8 36 -6 31 40 95 163 87 166 -6 2 -30 14 -55 26 l-43 22 -56 -93z" />
            <path
              d="M1105 2173 c-152 -23 -281 -88 -391 -197 -90 -91 -140 -171 -176 -286 -19 -61 -23 -97 -23 -195 0 -98 4 -134 23 -195 77 -246 279 -428 530 -476 105 -20 759 -20 864 0 251 48 453 230 530 476 19 61 23 97 23 195 0 138 -21 224 -82 335 -53 96 -178 216 -278 267 -147 75 -151 76 -595 79 -217 1 -408 0 -425 -3z m857 -183 c242 -75 401 -331 358 -578 -18 -110 -75 -216 -155 -291 -71 -66 -128 -99 -220 -128 -54 -16 -100 -18 -445 -18 -345 0 -391 2 -445 18 -92 29 -149 62 -220 128 -80 75 -137 181 -155 291 -42 245 109 493 350 575 63 22 78 22 466 23 373 0 407 -1 466 -20z"
            />
            <path
              d="M1125 1950 c-210 -34 -369 -202 -391 -412 -24 -236 150 -461 386 -498 84 -13 676 -13 760 0 195 31 352 190 383 389 33 213 -97 426 -305 502 -61 22 -77 23 -423 25 -198 1 -382 -1 -410 -6z m75 -193 c131 -87 74 -281 -82 -281 -149 0 -204 206 -76 284 46 28 115 26 158 -3z m768 3 c53 -32 74 -75 69 -143 -3 -49 -8 -62 -37 -92 -97 -100 -260 -39 -262 99 -2 119 130 197 230 136z m-587 -506 c26 -10 75 -16 119 -16 44 0 93 6 119 16 64 23 89 21 97 -9 10 -41 -1 -53 -72 -74 -88 -28 -200 -28 -288 0 -71 21 -82 33 -72 74 8 30 33 32 97 9z"
            />
            <path
              d="M2454 1130 c-6 -14 -32 -52 -57 -85 l-45 -60 -4 -115 c-4 -133 -21 -181 -91 -250 -75 -76 -153 -100 -318 -100 l-100 0 3 -57 3 -58 130 0 c155 1 214 16 305 77 79 52 143 138 170 227 18 58 20 89 18 256 -2 149 -5 184 -14 165z"
            />
            <path
              d="M1294 611 c-53 -33 -64 -57 -64 -144 0 -90 15 -129 60 -152 42 -22 388 -22 430 0 45 23 60 62 60 155 0 78 -1 82 -34 118 l-34 37 -194 3 c-177 2 -196 1 -224 -17z"
            />
          </g>
        </svg> -->
      </q-btn>
      <q-tooltip anchor="top middle" self="top middle">AI Chat</q-tooltip>
    </q-page-sticky>

    <!-- floating buttons -->
    <q-page-sticky position="bottom-right" :offset="[40, 95]" class="floating-button">
      <q-fab icon="add" vertical-actions-align="right" direction="up" color="primary">
        <q-fab-action label-position="right" label="Request Filing" color="primary" icon="o_work_history" @click="isRequestFilingDialogOpen = true" />
        <q-fab-action label-position="right" label="Announcement" color="primary" icon="o_upcoming" />
        <q-fab-action label-position="right" label="Calendar Schedule" color="primary" icon="edit_calendar" />
        <q-fab-action label-position="right" label="New Liquidation" @click="openLiquidationDialog = true" color="primary" icon="money" />
        <q-fab-action label-position="right" label="New Task" @click="isTaskCreateDialogOpen = true" color="primary" icon="o_task" />
        <q-fab-action label-position="right" label="New Project" @click="isProjectCreateDialogOpen = true" color="primary" icon="o_folder" />
      </q-fab>
    </q-page-sticky>
    <!-- project create dialog -->
    <ProjectCreateDialog v-model="isProjectCreateDialogOpen"></ProjectCreateDialog>
    <!-- task create dialog -->
    <TaskCreateDialog v-model="isTaskCreateDialogOpen"></TaskCreateDialog>
    <!-- liquidation Dialog -->
    <LiquidationFormDialog v-model="openLiquidationDialog" />
    <!-- AI Chat Dialog -->
    <AiChatDialog v-model="isAiChatDialogOpen" />
    <!-- global layout dialog -->
    <GlobalLayoutDialog></GlobalLayoutDialog>
    <!-- Quest Dialog -->
    <QuestDialog v-model="isQuestDialogOpen" />
    <!-- Bottom Navigation for Mobile/Tablet -->
    <BottomNavigation
      :unread-count="unreadNotification"
      @open-notifications="openNotificationPanel"
      @open-task-dialog="isTaskCreateDialogOpen = true"
      @open-project-dialog="isProjectCreateDialogOpen = true"
      @open-liquidation-dialog="openLiquidationDialog = true"
    />
    <!-- Request Filing Dialog -->
    <RequestFilingDialog
      v-model="isRequestFilingDialogOpen"
      @open-leave="isLeaveFormDialogOpen = true"
      @open-overtime="isOvertimeApplicationFormDialogOpen = true"
      @open-official-business="openOBandCADialog('OFFICIAL_BUSINESS_FORM')"
      @open-certificate-attendance="openOBandCADialog('CERTIFICATE_OF_ATTENDANCE')"
      @open-schedule-adjustment="isAddViewScheduleAdjustmentDialogOpen = true"
    />
    <!-- Leave Form Dialog -->
    <AddViewLeaveFormDialog
      v-model="isLeaveFormDialogOpen"
      @save-done="handleRequestFilingSave"
    />
    <!-- Overtime Application Form Dialog -->
    <AddViewOvertimeApplicationFormDialog
      v-model="isOvertimeApplicationFormDialogOpen"
      @save-done="handleRequestFilingSave"
    />
    <!-- Official Business Form Dialog and Certificate of Attendance Form Dialog -->
    <AddViewOfficialBusinessAndCertificateOfAttendanceDialog
      :officialBusinessAndCertificateOfAttendanceData="officialBusinessAndCertificateOfAttendanceData"
      v-model="isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen"
      @save-done="handleRequestFilingSave"
    />
    <!-- Add View Schedule Adjustment Dialog -->
    <AddViewScheduleAdjustmentDialog
      v-model="isAddViewScheduleAdjustmentDialogOpen"
      @save-done="handleRequestFilingSave"
    />
  </q-layout>
</template>
<style src="./MainLayout.scss" lang="scss"></style>
<style v-if="whitelabel === 'geer'" src="./MainLayout.geer.scss" lang="scss"></style>
<script>
import { api } from 'src/boot/axios';
import { APIRequests } from '../utility/api.handler';
import { useSocketStore } from '../stores/socketStore';
import { useAuthStore } from '../stores/auth';
import { initializeGlobalStores } from '../boot/global-stores';
import bus from 'src/bus';
import { defineAsyncComponent } from 'vue';

import HeaderAccount from '../components/header/HeaderAccount.vue';
import NavLeft from '../components/sidebar/NavLeft.vue';
import Notification from '../components/sidebar/Notification.vue';
import AnnouncementPanel from '../components/sidebar/AnnouncementPanel.vue';
import { whitelabel } from 'src/boot/axios';
import EmailVerificationBanner from '../components/shared/EmailVerificationBanner.vue';
import BottomNavigation from './BottomNavigation.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TaskCreateDialog = defineAsyncComponent(() =>
  import('../components/dialog/TaskCreateDialog/TaskCreateDialog.vue')
);
const ProjectCreateDialog = defineAsyncComponent(() =>
  import('../components/dialog/ProjectCreateDialog.vue')
);
const GlobalLayoutDialog = defineAsyncComponent(() =>
  import('../layouts/GlobalLayoutDialog.vue')
);
const AiChatDialog = defineAsyncComponent(() =>
  import('../components/dialog/AiChatDialog.vue')
);
const QuestDialog = defineAsyncComponent(() =>
  import('../components/dialog/QuestDialog.vue')
);
const RequestFilingDialog = defineAsyncComponent(() =>
  import('../components/dialog/RequestFilingDialog.vue')
);
const LiquidationFormDialog = defineAsyncComponent(() =>
  import('../pages/Member/Treasury/dialogs/TreasuryLiquidationFormDialog.vue')
);
const AddViewLeaveFormDialog = defineAsyncComponent(() =>
  import('../pages/Member/Manpower/dialogs/ManpowerRequestPanelAddViewLeaveFormDialog.vue')
);
const AddViewOvertimeApplicationFormDialog = defineAsyncComponent(() =>
  import('../pages/Member/Manpower/dialogs/ManpowerRequestPanelAddViewOvertimeApplicationFormDialog.vue')
);
const AddViewOfficialBusinessAndCertificateOfAttendanceDialog = defineAsyncComponent(() =>
  import('../pages/Member/Manpower/dialogs/ManpowerRequestPanelAddViewOfficialBusinessAndCertificateOfAttendanceDialog.vue')
);
const AddViewScheduleAdjustmentDialog = defineAsyncComponent(() =>
  import('../pages/Member/Manpower/dialogs/ManpowerRequestPanelAddViewScheduleAdjustmentDialog.vue')
);

export default {
  components: {
    HeaderAccount,
    TaskCreateDialog,
    ProjectCreateDialog,
    Notification,
    AnnouncementPanel,
    NavLeft,
    GlobalLayoutDialog,
    LiquidationFormDialog,
    AiChatDialog,
    QuestDialog,
    EmailVerificationBanner,
    BottomNavigation,
    RequestFilingDialog,
    AddViewLeaveFormDialog,
    AddViewOvertimeApplicationFormDialog,
    AddViewOfficialBusinessAndCertificateOfAttendanceDialog,
    AddViewScheduleAdjustmentDialog,
  },
  data: () => ({
    form: {},
    isSidebarOpen: true,
    leftDrawerOpen: false, // Start with drawer closed
    isNotificationOpen: false,
    isAnnouncementPanelOpen: false,
    isTaskCreateDialogOpen: false,
    isProjectCreateDialogOpen: false,
    openLiquidationDialog: false,
    isQuestDialogOpen: false,
    unreadNotification: 0,
    whitelabel: whitelabel,
    isAiChatDialogOpen: false,
    hasEmailConfiguration: false,
    unreadEmailCount: 0,
    forceRerender: false,
    // Request Filing dialogs
    isRequestFilingDialogOpen: false,
    isLeaveFormDialogOpen: false,
    isOvertimeApplicationFormDialogOpen: false,
    isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen: false,
    isAddViewScheduleAdjustmentDialogOpen: false,
    officialBusinessAndCertificateOfAttendanceData: '',
  }),
  async mounted() {
    // Theme is now set globally in boot file - no need to call here

    // Set initial drawer state based on device type
    // On desktop, drawer should be open by default
    // On mobile, drawer should be closed by default
    this.leftDrawerOpen = !this.$q.platform.is.mobile;

    // NOTE: Global stores (Project, Assignee) are initialized in boot/global-stores.ts
    // No need to initialize here - boot file handles it on app start
    // For login and account switch, see boot/global-stores.ts

    this.initializeSocketConnection();
    this.watchSocketEvent();
    this.getPendingNotificationCount();
    this.watchAccountAndRoleEvents();

    // Check email configuration
    await this.checkEmailConfiguration();
    if (this.hasEmailConfiguration) {
      this.getUnreadEmailCount();
      this.watchEmailEvents();
    }
  },
  methods: {
    initializeSocketConnection() {
      // Always try to initialize socket if not connected
      // The initSocket method will handle duplicate prevention
      if (!this.socketPiniaStore.isConnected || !this.socketPiniaStore.socket) {
        this.socketPiniaStore.initSocket();
      }
    },
    openNotificationPanel() {
      this.isNotificationOpen = !this.isNotificationOpen;
    },
    openAnnouncementPanel() {
      this.isAnnouncementPanelOpen = !this.isAnnouncementPanelOpen;
    },
    sideBarToggle() {
      this.isSidebarOpen = !this.isSidebarOpen;
    },
    toggleLeftDrawer() {
      this.leftDrawerOpen = !this.leftDrawerOpen;
    },
    async getPendingNotificationCount() {
      try {
        const response = await api.get('/notification/pending-count');
        this.unreadNotification = response.data;
      } catch (error) {
        console.error('Error getting pending notification count:', error);
      }
    },
    watchSocketEvent() {
      if (this.socketPiniaStore.socket) {
        this.socketPiniaStore.socket.on('notification', () => {
          this.getPendingNotificationCount();
        });
      } else {
        setTimeout(() => {
          this.watchSocketEvent();
        }, 1000);
      }
    },
    async checkEmailConfiguration() {
      try {
        const response = await api.get('/email-config');
        this.hasEmailConfiguration = !!response.data && response.data.isActive;
      } catch (error) {
        this.hasEmailConfiguration = false;
      }
    },
    async getUnreadEmailCount() {
      try {
        const response = await APIRequests.getUnreadEmailCount(this.$q);
        this.unreadEmailCount = response.count || 0;
      } catch (error) {
        console.error('Error getting unread email count:', error);
        this.unreadEmailCount = 0;
      }
    },
    watchEmailEvents() {
      if (this.socketPiniaStore.socket) {
        this.socketPiniaStore.socket.on('new-email', () => {
          this.getUnreadEmailCount();
        });
        this.socketPiniaStore.socket.on('email-configured', () => {
          this.checkEmailConfiguration();
        });
      }
    },
    watchAccountAndRoleEvents() {
      // Listen for email verified event
      bus.on('email-verified', async () => {
        console.log('Email verified event received in MainLayout, refreshing account information');
        const refreshed = await this.authMainStore.refreshAccountInformation();
        console.log('MainLayout: Account refreshed after email verification:', refreshed);
      });

      // Listen for account switch event and reload global stores
      bus.on('account-switched', async (data) => {
        console.log('Account switched in MainLayout, reloading global stores', data);
        try {
          await initializeGlobalStores();
          console.log('Global stores reloaded successfully after account switch');
        } catch (error) {
          console.error('Failed to reload global stores after account switch:', error);
        }
      });

      // Listen for role updates via event bus
      bus.on('role-updated', (data) => {
        if (data.role) {
          this.authMainStore.updateRoleFromSocket(data);
          this.$q.notify({
            type: 'info',
            message: 'Your role permissions have been updated',
            position: 'top-right',
            timeout: 3000,
          });
        }
      });

      // Listen for password change events
      bus.on('password-changed', (data) => {
        this.$q.notify({
          type: 'warning',
          message: data.message || 'Your password has been changed',
          position: 'top-right',
          timeout: 5000,
          actions: [{ label: 'OK', color: 'white' }],
        });

        // If password was changed by admin, we might want to force re-authentication
        if (data.changedBy === 'admin') {
          // Optional: Add logic to prompt user to re-login or acknowledge the change
          console.log('Password changed by administrator:', data);
        }
      });

      // Listen for account deactivation events
      bus.on('account-deactivated', (data) => {
        this.$q.notify({
          type: 'negative',
          message: data.message || 'Your account has been deactivated',
          position: 'top-right',
          timeout: 5000,
          actions: [{ label: 'OK', color: 'white' }],
        });

        // Force logout after a short delay to allow the user to see the notification
        setTimeout(() => {
          // Clear auth data
          this.authMainStore.clearLoginData();
          // Disconnect socket
          this.socketPiniaStore.disconnect();
          // Redirect to login
          this.$router.push('/auth/sign-in');
        }, 3000);
      });
    },
    async openEmailClient() {
      // Force complete re-render when navigating to email
      const currentPath = this.$route.path;
      console.log('Navigating to email from:', currentPath);

      if (currentPath === '/member/dashboard') {
        // Force unmount and remount for dashboard → email navigation
        this.forceRerender = true;
        await this.$nextTick();
        this.forceRerender = false;
        await this.$nextTick();
      }

      // Navigate to email page
      this.$router.push('/member/email');
    },
    openOBandCADialog(type) {
      this.officialBusinessAndCertificateOfAttendanceData = type;
      this.isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen = true;
    },
    handleRequestFilingSave() {
      // Refresh notification count or handle any post-save logic
      this.getPendingNotificationCount();
    },
  },
  computed: {
    isExpandedNav() {
      const path = this.$route.path.toLowerCase();
      return path.includes('/manpower') || path.includes('/settings') || path.includes('/school') || path.includes('/developer') || path.includes('/asset') || path.includes('/treasury') || path.includes('/leads') || path.includes('/cms') || path.includes('/task') || path.includes('/project');
    },
    isEmailPage() {
      return this.$route && (this.$route.name === 'EmailPage' || this.$route.path === '/member/email');
    },
    socketPiniaStore() {
      return useSocketStore();
    },
    authMainStore() {
      return useAuthStore();
    },
    aiButtonOffset() {
      // Check if mobile or screen width is 768px or below
      const isMobile = this.$q.platform.is.mobile || window.innerWidth <= 768;
      return isMobile ? [10, 65] : [40, 30];
    },
    aiButtonPadding() {
      // Check if mobile or screen width is 768px or below
      const isMobile = this.$q.platform.is.mobile || window.innerWidth <= 768;
      return isMobile ? 'sm' : '';
    },
    aiButtonColor() {
      // Check if mobile or screen width is 768px or below
      const isMobile = this.$q.platform.is.mobile || window.innerWidth <= 768;
      return isMobile ? 'secondary' : 'primary';
    },
    mainLayoutStyle() {
      // Check if mobile
      const isMobile = this.$q.platform.is.mobile || window.innerWidth <= 768;

      // Return mobile padding if on mobile - let CSS handle it
      if (isMobile) {
        return {
          padding: '0',
          overflow: 'hidden',
        };
      }

      // Desktop padding logic
      const isEmailPage = this.$route && (this.$route.name === 'EmailPage' || this.$route.path === '/member/email');
      const isProjectPage = this.$route && (this.$route.name === 'member_project' || this.$route.path === '/member/project');
      const isCalendarPage = this.$route && (this.$route.name === 'member_calendar' || this.$route.path === '/member/calendar');
      const isLeadsPage = this.$route && (this.$route.name === 'member_leads' || this.$route.path === '/member/leads');
      const isTreasuryPage = this.$route && (this.$route.name === 'member_treasury' || this.$route.path === '/member/treasury');

      let padding = '1px 1px 1px 42px'; // default

      // Check if this is an expanded nav page (with submenu)
      if (this.isExpandedNav) {
        padding = '18px 18px 18px 18px';
      } else if (isEmailPage) {
        padding = '20px';
      } else if (isProjectPage) {
        padding = '25px 25px 25px 68px';
      } else if (isCalendarPage) {
        padding = '25px 25px 25px 68px';
      } else if (isLeadsPage) {
        padding = '40px 25px 0px 68px';
      } else if (isTreasuryPage) {
        padding = '25px 25px 0px 68px';
      }

      return {
        padding,
      };
    },
  },
  beforeUnmount() {
    // Remove event listeners when the component is unmounted
    if (this.socketPiniaStore.socket) {
      this.socketPiniaStore.socket.off('notification');
      this.socketPiniaStore.socket.off('new-email');
      this.socketPiniaStore.socket.off('email-configured');
    }

    // Remove bus event listeners
    bus.off('account-updated');
    bus.off('role-updated');
    bus.off('password-changed');
    bus.off('account-deactivated');
    bus.off('email-verified');
  },
};
</script>

<style scoped>
.email-verification-container {
  position: relative;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
}

@media (min-width: 769px) {
  .email-verification-container {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2000;
    max-width: 600px;
    width: calc(100% - 40px);
  }
}
</style>

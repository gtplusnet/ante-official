<template>
  <div class="bottom-navigation" v-if="isTabletOrMobile">
    <div class="bottom-nav-container">
      <!-- Dashboard -->
      <div
        class="nav-item"
        :class="{ active: isActive('dashboard') }"
        @click="navigateTo('member_dashboard')"
      >
        <q-icon :name="isActive('dashboard') ? 'space_dashboard' : 'o_space_dashboard'" size="18px" />
        <span class="nav-label">Dashboard</span>
      </div>

      <!-- Schedule -->
      <div
        class="nav-item"
        :class="{ active: isActive('calendar') }"
        @click="navigateTo('member_calendar')"
      >
        <q-icon :name="isActive('calendar') ? 'event' : 'o_event'" size="18px" />
        <span class="nav-label">Schedule</span>
      </div>

      <!-- Add (Center button) -->
      <div class="nav-item nav-item-center" @click="showAddMenu = true">
        <div class="add-button">
          <q-icon name="add" size="18px" />
        </div>
        <span class="nav-label">Add</span>
      </div>

      <!-- Me -->
      <div
        class="nav-item"
        :class="{ active: isActive('profile') }"

        @click="navigateTo('member_profile')"
      >
        <q-icon :name="isActive('profile') ? 'person' : 'o_person'" size="18px" />
        <span class="nav-label">Me</span>
      </div>

      <!-- Updates -->
      <div
        class="nav-item"
        :class="{ active: isActive('notifications') }"
        @click="openNotifications"
      >
        <q-icon :name="isActive('notifications') ? 'notifications' : 'o_notifications'" size="18px" />
        <span class="nav-label">Updates</span>
        <q-badge
          v-if="unreadCount > 0"
          color="red"
          floating
          :label="unreadCount"
          class="notification-badge"
        />
      </div>
    </div>

    <!-- Add Menu Dialog -->
    <GlobalMoreActionMobileDialog
      v-model="showAddMenu"
      :actions="addMenuActions"
      title="Add"
    />

    <!-- Request Filing Dialog -->
    <GlobalMoreActionMobileDialog
      v-model="showRequestFilingDialog"
      :actions="requestFilingActions"
      title="Request Filing"
      :show-back-icon="true"
      @back-clicked="handleRequestFilingBackClick"
    />

    <!-- Filing Form Dialogs -->
    <!-- Overtime Application Form Dialog -->
    <AddViewOvertimeApplicationFormDialog v-model="isOvertimeApplicationFormDialogOpen" :filing="null" @save-done="handleFilingSaved" @hide="handleDialogHide" />
    <!-- Official Business Form Dialog and Certificate of Attendance Form Dialog -->
    <AddViewOfficialBusinessAndCertificateOfAttendanceDialog :officialBusinessAndCertificateOfAttendanceData="officialBusinessAndCertificateOfAttendanceData" :filing="null" v-model="isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen" @save-done="handleFilingSaved" @hide="handleDialogHide" />
    <!-- Leave Form Dialog -->
    <AddViewLeaveFormDialog v-model="isLeaveFormDialogOpen" :filing="null" @save-done="handleFilingSaved" @hide="handleDialogHide" />
    <!-- Add View Schedule Adjustment Dialog -->
    <AddViewScheduleAdjustmentDialog v-model="isAddViewScheduleAdjustmentDialogOpen" :filing="null" @save-done="handleFilingSaved" @hide="handleDialogHide" />
  </div>
</template>

<style scoped src="./BottomNavigation.scss"></style>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import GlobalMoreActionMobileDialog, { type ActionItem } from 'src/components/shared/global/GlobalMoreActionMobileDialog.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddViewOvertimeApplicationFormDialog = defineAsyncComponent(() =>
  import('src/pages/Member/Manpower/dialogs/ManpowerRequestPanelAddViewOvertimeApplicationFormDialog.vue')
);
const AddViewOfficialBusinessAndCertificateOfAttendanceDialog = defineAsyncComponent(() =>
  import('src/pages/Member/Manpower/dialogs/ManpowerRequestPanelAddViewOfficialBusinessAndCertificateOfAttendanceDialog.vue')
);
const AddViewLeaveFormDialog = defineAsyncComponent(() =>
  import('src/pages/Member/Manpower/dialogs/ManpowerRequestPanelAddViewLeaveFormDialog.vue')
);
const AddViewScheduleAdjustmentDialog = defineAsyncComponent(() =>
  import('src/pages/Member/Manpower/dialogs/ManpowerRequestPanelAddViewScheduleAdjustmentDialog.vue')
);

// Props
interface Props {
  unreadCount?: number;
}

withDefaults(defineProps<Props>(), {
  unreadCount: 0,
});

// Emits
const emit = defineEmits<{
  openNotifications: [];
  openTaskDialog: [];
  openProjectDialog: [];
  openLiquidationDialog: [];
}>();

// Composables
const route = useRoute();
const router = useRouter();
const $q = useQuasar();

// State
const showAddMenu = ref(false);
const showRequestFilingDialog = ref(false);
const isLeaveFormDialogOpen = ref(false);
const isOvertimeApplicationFormDialogOpen = ref(false);
const isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen = ref(false);
const isAddViewScheduleAdjustmentDialogOpen = ref(false);
const officialBusinessAndCertificateOfAttendanceData = ref('');

// Computed
const isTabletOrMobile = computed(() => {
  return $q.platform.is.mobile || window.innerWidth <= 768;
});

// Methods
const isActive = (section: string): boolean => {
  const routeName = route.name?.toString() || '';
  const routePath = route.path || '';

  switch (section) {
    case 'dashboard':
      return routeName === 'member_dashboard' || routePath.includes('/dashboard');
    case 'calendar':
      return routeName === 'member_calendar' || routePath.includes('/calendar');
    case 'profile':
      return routeName === 'member_profile' || routeName === 'user_profile' || routePath.includes('/profile');
    case 'notifications':
      return false; // Notifications don't have a route
    default:
      return false;
  }
};

const navigateTo = (routeName: string) => {
  router.push({ name: routeName });
};

const openNotifications = () => {
  emit('openNotifications');
};

const createFilingRequest = () => {
  showAddMenu.value = false;
  showRequestFilingDialog.value = true;
};

const openOBandCADialog = (type: string) => {
  officialBusinessAndCertificateOfAttendanceData.value = type;
  isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen.value = true;
};

const handleFilingSaved = () => {
  // Filing was saved successfully
  $q.notify({
    type: 'positive',
    message: 'Request filed successfully',
    position: 'top',
  });
};

const handleDialogHide = () => {
  // Reset filing data when dialogs are hidden
  officialBusinessAndCertificateOfAttendanceData.value = '';
};

const handleRequestFilingBackClick = () => {
  // Close request filing dialog and open Add dialog
  showRequestFilingDialog.value = false;
  showAddMenu.value = true;
};

const createAnnouncement = () => {
  showAddMenu.value = false;
  // TODO: Implement announcement creation
  $q.notify({
    type: 'info',
    message: 'Announcement feature coming soon',
    position: 'top',
  });
};

const createCalendarSchedule = () => {
  showAddMenu.value = false;
  // TODO: Implement calendar schedule creation
  $q.notify({
    type: 'info',
    message: 'Calendar schedule feature coming soon',
    position: 'top',
  });
};

const createLiquidation = () => {
  showAddMenu.value = false;
  emit('openLiquidationDialog');
};

const createTask = () => {
  showAddMenu.value = false;
  emit('openTaskDialog');
};

const createProject = () => {
  showAddMenu.value = false;
  emit('openProjectDialog');
};

// Request filing actions (matching RequestPanelWidget)
const requestFilingActions = computed<ActionItem[]>(() => [
  {
    icon: 'event_busy',
    label: 'Leave',
    color: '#00897B',
    onClick: () => {
      showRequestFilingDialog.value = false;
      isLeaveFormDialogOpen.value = true;
    }
  },
  {
    icon: 'alarm_add',
    label: 'Overtime',
    color: '#FB8C00',
    onClick: () => {
      showRequestFilingDialog.value = false;
      isOvertimeApplicationFormDialogOpen.value = true;
    }
  },
  {
    icon: 'work_history',
    label: 'Official Business',
    color: '#1E88E5',
    onClick: () => {
      showRequestFilingDialog.value = false;
      openOBandCADialog('OFFICIAL_BUSINESS_FORM');
    }
  },
  {
    icon: 'event_available',
    label: 'Certificate of Attendance',
    color: '#43A047',
    onClick: () => {
      showRequestFilingDialog.value = false;
      openOBandCADialog('CERTIFICATE_OF_ATTENDANCE');
    }
  },
  {
    icon: 'brightness_6',
    label: 'Schedule Adjustment',
    color: '#8E24AA',
    onClick: () => {
      showRequestFilingDialog.value = false;
      isAddViewScheduleAdjustmentDialogOpen.value = true;
    }
  }
]);

// Add menu actions
const addMenuActions = computed<ActionItem[]>(() => [
  {
    icon: 'o_work_history',
    label: 'Request Filing',
    onClick: createFilingRequest,
  },
  {
    icon: 'o_upcoming',
    label: 'Announcement',
    onClick: createAnnouncement,
  },
  {
    icon: 'edit_calendar',
    label: 'Calendar Schedule',
    onClick: createCalendarSchedule,
  },
  {
    icon: 'money',
    label: 'New Liquidation',
    onClick: createLiquidation,
  },
  {
    icon: 'o_task',
    label: 'New Task',
    onClick: createTask,
  },
  {
    icon: 'o_folder',
    label: 'New Project',
    onClick: createProject,
  },
]);
</script>

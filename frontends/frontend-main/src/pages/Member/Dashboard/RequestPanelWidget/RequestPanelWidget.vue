<template>
  <div>
    <GlobalWidgetCard>
      <!-- Title -->
      <template #title>Request Panel</template>

      <template #more-actions>
        <q-btn flat round dense icon="add" color="grey-7" size="sm" @click="isMobileMoreActionsDialogOpen = true" class="task-menu-button" />
      </template>

      <!-- Actions -->
      <template #actions>
        <div class="request-widget-actions">
          <!-- tabs -->
          <GlobalWidgetTab :tabs="tabList" v-model="activeTab" @update:modelValue="setActiveTab" />
          <!-- more -->
          <div class="col-auto request-menu-wrapper">
            <q-btn color="primary" size="sm" round flat class="request-menu-button q-ml-xs">
              <q-icon name="add" size="20px" />
              <q-menu auto-close anchor="bottom end" self="top end">
                <q-list>
                  <div class="q-item cursor-pointer" clickable @click="isLeaveFormDialogOpen = true">
                    <div class="row items-center">
                      <q-icon name="event_busy" :style="{ color: '#00897B', fontSize: '20px' }" />
                      <div class="q-ml-sm text-label-medium">Leave</div>
                    </div>
                  </div>
                  <div class="q-item cursor-pointer" clickable @click="isOvertimeApplicationFormDialogOpen = true">
                    <div class="row items-center">
                      <q-icon name="alarm_add" :style="{ color: '#FB8C00', fontSize: '20px' }" />
                      <div class="q-ml-sm text-label-medium">Overtime</div>
                    </div>
                  </div>
                  <div class="q-item cursor-pointer" clickable @click="openOBandCADialog('OFFICIAL_BUSINESS_FORM')">
                    <div class="row items-center">
                      <q-icon name="work_history" :style="{ color: '#1E88E5', fontSize: '20px' }" />
                      <div class="q-ml-sm text-label-medium">Official Business</div>
                    </div>
                  </div>
                  <div class="q-item cursor-pointer" clickable @click="openOBandCADialog('CERTIFICATE_OF_ATTENDANCE')">
                    <div class="row items-center">
                      <q-icon name="event_available" :style="{ color: '#43A047', fontSize: '20px' }" />
                      <div class="q-ml-sm text-label-medium">Certificate of Attendance</div>
                    </div>
                  </div>
                  <div class="q-item cursor-pointer" clickable @click="isAddViewScheduleAdjustmentDialogOpen = true">
                    <div class="row items-center">
                      <q-icon name="brightness_6" :style="{ color: '#8E24AA', fontSize: '20px' }" />
                      <div class="q-ml-sm text-label-medium">Schedule Adjustment</div>
                    </div>
                  </div>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </template>

      <!-- Content -->
      <template #content>
        <div class="request-content">
          <!-- pending tab -->
          <RequestPanelPendingTab v-if="activeTab == 'pending'" :key="`pending-${tabRefreshKey}`" :page="pagination.page" :rows-per-page="pagination.rowsPerPage" @update:total="updateMaxPages" @open-dialog="handleOpenDialog" />
          <!-- approved tab -->
          <RequestPanelApprovedTab v-if="activeTab == 'approved'" :key="`approved-${tabRefreshKey}`" :page="pagination.page" :rows-per-page="pagination.rowsPerPage" @update:total="updateMaxPages" @open-dialog="handleOpenDialog" />
          <!-- rejected tab -->
          <RequestPanelRejectedTab v-if="activeTab == 'rejected'" :key="`rejected-${tabRefreshKey}`" :page="pagination.page" :rows-per-page="pagination.rowsPerPage" @update:total="updateMaxPages" @open-dialog="handleOpenDialog" />
        </div>
      </template>

      <!-- Footer -->
      <template #footer>
        <GlobalWidgetPagination
          :pagination="{
            currentPage: pagination.page,
            totalItems: totalItems,
            itemsPerPage: pagination.rowsPerPage
          }"
          @update:page="handlePageChange"
        />
      </template>
    </GlobalWidgetCard>

    <!-- Overtime Application Form Dialog -->
    <AddViewOvertimeApplicationFormDialog v-model="isOvertimeApplicationFormDialogOpen" :filing="currentSelectedFiling" @save-done="refreshCurrentTab" @hide="currentSelectedFiling = null" />
    <!-- Official Business Form Dialog and Certificate of Attendance Form Dialog -->
    <AddViewOfficialBusinessAndCertificateOfAttendanceDialog :officialBusinessAndCertificateOfAttendanceData="officialBusinessAndCertificateOfAttendanceData" :filing="currentSelectedFiling" v-model="isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen" @save-done="refreshCurrentTab" @hide="currentSelectedFiling = null" />
    <!-- Leave Form Dialog -->
    <AddViewLeaveFormDialog v-model="isLeaveFormDialogOpen" :filing="currentSelectedFiling" @save-done="refreshCurrentTab" @hide="currentSelectedFiling = null" />
    <!-- Add View Schedule Adjustment Dialog -->
    <AddViewScheduleAdjustmentDialog v-model="isAddViewScheduleAdjustmentDialogOpen" :filing="currentSelectedFiling" @save-done="refreshCurrentTab" @hide="currentSelectedFiling = null" />

    <!-- Mobile More Actions Dialog -->
    <GlobalMoreActionMobileDialog
      v-model="isMobileMoreActionsDialogOpen"
      :actions="mobileActionItems"
      title="Request Filing"
    />
  </div>
</template>

<style scoped src="./RequestPanelWidget.scss"></style>

<script lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue';
import bus from 'src/bus';
import RequestPanelPendingTab from './Partial/RequestPanelPendingTab.vue';
import RequestPanelApprovedTab from './Partial/RequestPanelApprovedTab.vue';
import RequestPanelRejectedTab from './Partial/RequestPanelRejectedTab.vue';
import AddViewOvertimeApplicationFormDialog from '../../../../pages/Member/Manpower/dialogs/ManpowerRequestPanelAddViewOvertimeApplicationFormDialog.vue';
import AddViewOfficialBusinessAndCertificateOfAttendanceDialog from '../../../../pages/Member/Manpower/dialogs/ManpowerRequestPanelAddViewOfficialBusinessAndCertificateOfAttendanceDialog.vue';
import AddViewLeaveFormDialog from '../../../../pages/Member/Manpower/dialogs/ManpowerRequestPanelAddViewLeaveFormDialog.vue';
import AddViewScheduleAdjustmentDialog from '../../../../pages/Member/Manpower/dialogs/ManpowerRequestPanelAddViewScheduleAdjustmentDialog.vue';
import GlobalWidgetCard from '../../../../components/shared/global/GlobalWidgetCard.vue';
import GlobalWidgetTab from '../../../../components/shared/global/GlobalWidgetTab.vue';
import GlobalWidgetPagination from '../../../../components/shared/global/GlobalWidgetPagination.vue';
import GlobalMoreActionMobileDialog from '../../../../components/shared/global/GlobalMoreActionMobileDialog.vue';
import type { Filing } from './types/filing.types';

export default {
  name: 'RequestPanelWidget',
  components: {
    GlobalWidgetCard,
    GlobalWidgetTab,
    GlobalWidgetPagination,
    GlobalMoreActionMobileDialog,
    RequestPanelPendingTab,
    RequestPanelApprovedTab,
    RequestPanelRejectedTab,
    AddViewLeaveFormDialog,
    AddViewOvertimeApplicationFormDialog,
    AddViewOfficialBusinessAndCertificateOfAttendanceDialog,
    AddViewScheduleAdjustmentDialog,
  },
  setup() {
    const isLeaveFormDialogOpen = ref(false);
    const isOvertimeApplicationFormDialogOpen = ref(false);
    const isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen = ref(false);
    const isAddViewScheduleAdjustmentDialogOpen = ref(false);
    const isMobileMoreActionsDialogOpen = ref(false);
    const officialBusinessAndCertificateOfAttendanceData = ref('');
    const activeTab = ref('pending');
    const isUpdatesListLoading = ref(true);
    const tabList = [
      {
        key: 'pending',
        title: 'Pending',
      },
      {
        key: 'approved',
        title: 'Approved',
      },
      {
        key: 'rejected',
        title: 'Rejected',
      },
    ];

    const mobileActionItems = [
      {
        icon: 'event_busy',
        label: 'Leave',
        color: '#00897B',
        onClick: () => {
          isLeaveFormDialogOpen.value = true;
        }
      },
      {
        icon: 'alarm_add',
        label: 'Overtime',
        color: '#FB8C00',
        onClick: () => {
          isOvertimeApplicationFormDialogOpen.value = true;
        }
      },
      {
        icon: 'work_history',
        label: 'Official Business',
        color: '#1E88E5',
        onClick: () => {
          openOBandCADialog('OFFICIAL_BUSINESS_FORM');
        }
      },
      {
        icon: 'event_available',
        label: 'Certificate of Attendance',
        color: '#43A047',
        onClick: () => {
          openOBandCADialog('CERTIFICATE_OF_ATTENDANCE');
        }
      },
      {
        icon: 'brightness_6',
        label: 'Schedule Adjustment',
        color: '#8E24AA',
        onClick: () => {
          isAddViewScheduleAdjustmentDialogOpen.value = true;
        }
      }
    ];

    const windowWidth = ref(window.innerWidth);

    const updateWindowWidth = () => {
      windowWidth.value = window.innerWidth;
    };

    const getRowsPerPage = computed(() => {
      // 5 rows for screens 768px and below, 4 for larger screens
      return windowWidth.value <= 768 ? 5 : 4;
    });

    const pagination = reactive({
      page: 1,
      rowsPerPage: getRowsPerPage.value,
    });
    const maxPages = ref(1);
    const totalItems = ref(0);

    const setActiveTab = (tabKey: string) => {
      activeTab.value = tabKey;
      pagination.page = 1;
      // Set rowsPerPage based on tab and screen size
      if (tabKey === 'rejected') {
        pagination.rowsPerPage = 3;
      } else {
        pagination.rowsPerPage = getRowsPerPage.value;
      }
    };

    const openOBandCADialog = (type: string) => {
      officialBusinessAndCertificateOfAttendanceData.value = type;
      isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen.value = true;
    };

    const updateMaxPages = (total: number) => {
      totalItems.value = total;
      maxPages.value = Math.ceil(total / pagination.rowsPerPage) || 1;
    };

    const handlePageChange = (newPage: number) => {
      pagination.page = newPage;
    };

    const currentSelectedFiling = ref<Filing | null>(null);
    const tabRefreshKey = ref(0);

    const refreshCurrentTab = () => {
      // Force refresh by changing key
      tabRefreshKey.value++;
      // Alternatively, emit a refresh event to the active tab
    };

    const handleOpenDialog = (filing: Filing) => {
      console.log('handleOpenDialog', filing);
      currentSelectedFiling.value = filing;

      // Open appropriate dialog based on filing type
      switch (filing.filingType.key) {
        case 'OVERTIME':
          isOvertimeApplicationFormDialogOpen.value = true;
          break;
        case 'OFFICIAL_BUSINESS_FORM':
          officialBusinessAndCertificateOfAttendanceData.value = 'OFFICIAL_BUSINESS_FORM';
          isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen.value = true;
          break;
        case 'CERTIFICATE_OF_ATTENDANCE':
          officialBusinessAndCertificateOfAttendanceData.value = 'CERTIFICATE_OF_ATTENDANCE';
          isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen.value = true;
          break;
        case 'SCHEDULE_ADJUSTMENT':
          isAddViewScheduleAdjustmentDialogOpen.value = true;
          break;
        case 'LEAVE':
          isLeaveFormDialogOpen.value = true;
          break;
      }
    };

    // Socket event handlers
    const handleFilingUpdated = (data: unknown) => {
      console.log('[RequestPanelWidget] Received filing-updated event:', data);
      refreshCurrentTab();
    };

    const handleFilingCreated = (data: unknown) => {
      console.log('[RequestPanelWidget] Received filing-created event:', data);
      refreshCurrentTab();
    };

    const handleFilingApproved = (data: unknown) => {
      console.log('[RequestPanelWidget] Received filing-approved event:', data);
      refreshCurrentTab();
    };

    const handleFilingRejected = (data: unknown) => {
      console.log('[RequestPanelWidget] Received filing-rejected event:', data);
      refreshCurrentTab();
    };

    // Listen for task-related events that might affect filings
    const handleTaskChanged = (data: unknown) => {
      console.log('[RequestPanelWidget] Received task-changed event:', data);
      // Refresh in case the task change affects filing approvals
      refreshCurrentTab();
    };

    const handleApprovalProcessed = (data: unknown) => {
      console.log('[RequestPanelWidget] Received approval-processed event:', data);
      // This directly affects filings, so refresh
      refreshCurrentTab();
    };

    // Watch for changes in getRowsPerPage and update pagination
    watch(getRowsPerPage, (newValue) => {
      if (activeTab.value !== 'rejected') {
        pagination.rowsPerPage = newValue;
      }
    });

    // Set up event listeners
    onMounted(() => {
      // Add window resize listener
      window.addEventListener('resize', updateWindowWidth);

      // Filing-specific events
      bus.on('filing-updated', handleFilingUpdated);
      bus.on('filing-created', handleFilingCreated);
      bus.on('filing-approved', handleFilingApproved);
      bus.on('filing-rejected', handleFilingRejected);

      // Task-related events that might affect filings
      bus.on('task-changed', handleTaskChanged);
      bus.on('approval-processed', handleApprovalProcessed);

      // Generic reload event
      bus.on('reloadRequestPanel', refreshCurrentTab);
    });

    // Clean up event listeners
    onUnmounted(() => {
      // Remove window resize listener
      window.removeEventListener('resize', updateWindowWidth);

      bus.off('filing-updated', handleFilingUpdated);
      bus.off('filing-created', handleFilingCreated);
      bus.off('filing-approved', handleFilingApproved);
      bus.off('filing-rejected', handleFilingRejected);
      bus.off('task-changed', handleTaskChanged);
      bus.off('approval-processed', handleApprovalProcessed);
      bus.off('reloadRequestPanel', refreshCurrentTab);
    });

    return {
      activeTab,
      isUpdatesListLoading,
      tabList,
      pagination,
      maxPages,
      totalItems,
      isLeaveFormDialogOpen,
      isOvertimeApplicationFormDialogOpen,
      isOfficialBusinessAndCertificateOfAttendanceFormDialogOpen,
      isAddViewScheduleAdjustmentDialogOpen,
      isMobileMoreActionsDialogOpen,
      mobileActionItems,
      officialBusinessAndCertificateOfAttendanceData,
      setActiveTab,
      openOBandCADialog,
      updateMaxPages,
      refreshCurrentTab,
      handleOpenDialog,
      currentSelectedFiling,
      tabRefreshKey,
      handlePageChange,
    };
  },
};
</script>

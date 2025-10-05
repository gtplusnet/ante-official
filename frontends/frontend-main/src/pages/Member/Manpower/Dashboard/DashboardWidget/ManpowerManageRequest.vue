<template>
  <GlobalWidgetCard>
    <!-- Title -->
    <template #title> Manage Request </template>

    <!-- actions -->
    <template #actions>
      <div class="row items-center q-gutter-sm">
        <!-- Tab -->
        <global-widget-tab :tabs="tabList" :modelValue="activeTab" @update:modelValue="setActiveTab" />
      </div>
    </template>

    <!-- Content -->
    <template #content>
      <!-- Loading State with Skeleton Cards -->
      <div v-if="loading" class="request-item">
        <div v-for="n in pageSize" :key="`skeleton-${n}`" class="skeleton-card">
          <div class="row items-center justify-between q-mb-sm">
            <div class="row items-center q-gutter-sm">
              <q-skeleton type="QAvatar" size="24px" />
              <q-skeleton type="text" width="120px" />
            </div>
            <q-skeleton type="text" width="100px" />
          </div>
          <div class="row items-center justify-between">
            <div class="column">
              <q-skeleton type="text" width="70px" height="12px" class="q-mb-xs" />
              <q-skeleton type="text" width="100px" height="14px" />
            </div>
            <q-skeleton type="text" width="70px" height="12px" />
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center q-pa-lg">
        <q-icon name="error_outline" size="64px" color="negative" />
        <div class="text-body-medium text-dark q-mt-md">{{ error }}</div>
      </div>

      <!-- Content -->
      <div v-else class="request-item">
        <!-- Cards -->
        <template v-if="paginatedRequests.length > 0">
          <global-widget-card-box v-for="request in paginatedRequests" :key="request.id" @click="handleRequestClick(request)">
            <div class="row items-center justify-between q-mb-sm">
              <global-widget-card-box-title :title="request.type" :icon="request.icon" :iconColor="request.iconColor" />
              <span class="text-body-medium text-dark">{{ request.employeeName }}</span>
            </div>
            <div class="row items-center justify-between">
              <global-widget-card-box-subtitle :label="getApproverLabel()" :value="getApproverValue(request)" />
              <span class="text-body-small text-grey">{{ request.timeAgo }}</span>
            </div>
          </global-widget-card-box>
        </template>
        <!-- Empty State -->
        <div v-else class="empty-state-container">
          <div class="text-grey">No requests found</div>
        </div>
      </div>
    </template>

    <!-- Footer -->
    <template #footer>
      <global-widget-pagination
        :pagination="{
          currentPage: currentPage,
          totalItems: totalFilings,
          itemsPerPage: pageSize,
        }"
        @update:page="handlePageChange"
      />
    </template>
  </GlobalWidgetCard>

  <!-- Filing Approval Dialog -->
  <FilingApprovalDialog
    v-model="showApprovalDialog"
    :filing="selectedFiling"
    @approved="onFilingApproved"
    @rejected="onFilingRejected"
    @cancelled="onFilingCancelled"
  />
</template>

<script lang="ts">
import { defineAsyncComponent, ref, computed, watch, onMounted, getCurrentInstance } from 'vue';
import { useQuasar, date } from 'quasar';
import GlobalWidgetCard from 'src/components/shared/global/GlobalWidgetCard.vue';
import GlobalWidgetCardBox from 'src/components/shared/global/GlobalWidgetCardBox.vue';
import GlobalWidgetCardBoxTitle from 'src/components/shared/global/GlobalWidgetCardBoxTitle.vue';
import GlobalWidgetPagination from 'src/components/shared/global/GlobalWidgetPagination.vue';
import GlobalWidgetTab from 'src/components/shared/global/GlobalWidgetTab.vue';
import GlobalWidgetCardBoxSubtitle from 'src/components/shared/global/GlobalWidgetCardBoxSubtitle.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const FilingApprovalDialog = defineAsyncComponent(() =>
  import('../../../../../components/dialog/FilingApprovalDialog/FilingApprovalDialog.vue')
);

interface Request {
  id: number;
  type: string;
  icon: string;
  iconColor: string;
  employeeName: string;
  duration: string;
  timeAgo: string;
  status: string;
  hours: string;
  filingType?: string;
  filingTypeLabel?: string;
  account?: any;
  accountId?: number;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  createdAt?: string;
  timeIn?: string;
  timeOut?: string;
  remarks?: string;
  rejectReason?: string;
  file?: any;
  fileId?: number;
  shiftId?: number;
  leaveData?: any;
  shiftData?: any;
  purpose?: string;
  destination?: string;
  approvedBy?: any;
  approvedAt?: string;
}

export default {
  name: 'ManpowerManageRequest',
  components: {
    GlobalWidgetCard,
    GlobalWidgetCardBox,
    GlobalWidgetCardBoxTitle,
    GlobalWidgetPagination,
    GlobalWidgetTab,
    GlobalWidgetCardBoxSubtitle,
    FilingApprovalDialog,
  },

  setup() {
    const $q = useQuasar();
    const app = getCurrentInstance();
    const $api = app?.appContext.config.globalProperties.$api;

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
    const activeTab = ref('pending');
    const loading = ref(false);
    const error = ref<string>('');
    const search = ref('');
    const showApprovalDialog = ref(false);
    const selectedFiling = ref<any>(null);
    // Pagination state
    const currentPage = ref(1);
    const pageSize = 6;
    const meta = ref<any>({
      total: 0,
      page: 1,
      limit: pageSize,
      totalPages: 0,
    });

    // Dynamic data from API
    const allRequests = ref<Request[]>([]);

    // Filtered requests based on active tab and search
    const filteredRequests = computed(() => {
      return allRequests.value;
    });

    // Total items for pagination
    const totalFilings = computed(() => meta.value.total);

    // Paginated requests - data is already paginated from server
    const paginatedRequests = computed(() => {
      return filteredRequests.value;
    });

    const setActiveTab = (tabKey: string) => {
      activeTab.value = tabKey;
      currentPage.value = 1;
      loadFilings();
    };

    const handlePageChange = (newPage: number) => {
      currentPage.value = newPage;
      loadFilings();
    };

    const handleRequestClick = (request: Request) => {
      console.log('Request clicked:', request);
      // Map the request data to the format expected by FilingApprovalDialog
      const mappedFiling = {
        id: request.id,
        filingType: {
          label: request.type || ''
        },
        account: request.account,
        accountId: request.accountId,
        date: request.date,
        timeIn: request.timeIn,
        timeOut: request.timeOut,
        hours: request.hours,
        remarks: request.remarks,
        rejectReason: request.rejectReason,
        file: request.file,
        fileId: request.fileId,
        status: request.status?.toUpperCase() || 'PENDING',
        createdAt: request.createdAt,
        shiftId: request.shiftId,
        // Leave specific
        leaveData: request.leaveData,
        // Schedule adjustment specific
        shiftData: request.shiftData,
        // Official business/COA specific
        purpose: request.purpose,
        destination: request.destination,
        // Approval info
        approvedBy: request.approvedBy,
        approvedAt: request.approvedAt,
      };
      
      selectedFiling.value = mappedFiling;
      showApprovalDialog.value = true;
    };

    // Dialog event handlers
    const onFilingApproved = () => {
      loadFilings();
      $q.notify({
        type: 'positive',
        message: 'Filing approved successfully',
      });
    };

    const onFilingRejected = () => {
      loadFilings();
      $q.notify({
        type: 'positive',
        message: 'Filing rejected',
      });
    };

    const onFilingCancelled = () => {
      loadFilings();
      $q.notify({
        type: 'positive',
        message: 'Filing cancelled',
      });
    };

    // API Functions
    const loadFilings = async () => {
      if (!$api) {
        error.value = 'API not available';
        return;
      }

      loading.value = true;
      error.value = '';

      try {
        const params: any = {
          page: currentPage.value,
          limit: pageSize,
        };
        
        // Add status filter
        if (activeTab.value && activeTab.value !== 'all') {
          params.status = activeTab.value;
        }
        
        
        const response = await $api.get('/hr-filing/all-filings', {
          params,
        });


        if (response.data && response.data.data) {
          // Transform API data to match card format
          allRequests.value = response.data.data.map((filing: any) => {
            return {
              id: filing.id,
              type: getTypeLabel(filing.filingType),
              icon: getTypeIcon(filing.filingType),
              iconColor: getTypeIconColor(filing.filingType),
              employeeName: formatFullName(filing.account),
              duration: formatDate(filing.date || filing.dateFrom || filing.createdAt),
              timeAgo: getTimeAgo(filing.createdAt),
              status: filing.status?.toLowerCase() || 'pending',
              hours: getHoursDisplay(filing),
              ...filing // Keep original data for reference
            };
          });
          
          meta.value = response.data.meta;
        } else {
          allRequests.value = [];
          meta.value = {
            total: 0,
            page: 1,
            limit: pageSize,
            totalPages: 0,
          };
        }
      } catch (err: any) {
        console.error('Error loading filings:', err);
        error.value = err.response?.data?.message || 'Failed to load requests';
        $q.notify({
          type: 'negative',
          message: error.value,
        });
      } finally {
        loading.value = false;
      }
    };

    // Helper functions
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      return date.formatDate(dateStr, 'MMM D, YYYY');
    };

    const formatFullName = (account: any) => {
      if (!account) return 'Unknown';
      const lastName = account.lastName || '';
      const firstName = account.firstName || '';
      const middleName = account.middleName || '';
      
      if (!lastName && !firstName) return 'Unknown';
      
      return middleName 
        ? `${firstName} ${middleName} ${lastName}`
        : `${firstName} ${lastName}`;
    };

    const getTypeLabel = (filingType: string) => {
      switch (filingType) {
        case 'OVERTIME':
          return 'Overtime';
        case 'LEAVE':
          return 'Leave';
        case 'SCHEDULE_ADJUSTMENT':
          return 'Schedule Adjustment';
        case 'OFFICIAL_BUSINESS_FORM':
          return 'Official Business';
        case 'CERTIFICATE_OF_ATTENDANCE':
          return 'Certificate of Attendance';
        default:
          return filingType || 'Unknown';
      }
    };

    const getTypeIcon = (filingType: string) => {
      switch (filingType) {
        case 'OVERTIME':
          return 'alarm_add';
        case 'LEAVE':
          return 'event_busy';
        case 'SCHEDULE_ADJUSTMENT':
          return 'brightness_6';
        case 'OFFICIAL_BUSINESS_FORM':
          return 'work_history';
        case 'CERTIFICATE_OF_ATTENDANCE':
          return 'event_available';
        default:
          return 'description';
      }
    };

    const getTypeIconColor = (filingType: string) => {
      switch (filingType) {
        case 'OVERTIME':
          return '#FB8C00';
        case 'LEAVE':
          return '#00897B';
        case 'SCHEDULE_ADJUSTMENT':
          return '#8E24AA';
        case 'OFFICIAL_BUSINESS_FORM':
          return '#1E88E5';
        case 'CERTIFICATE_OF_ATTENDANCE':
          return '#43A047';
        default:
          return '#9E9E9E';
      }
    };

    const getHoursDisplay = (filing: any) => {
      if (filing.hours) return filing.hours.toString();
      if (filing.timeIn && filing.timeOut) {
        return `${filing.timeIn}-${filing.timeOut}`;
      }
      return '8';
    };

    const getTimeAgo = (dateStr: string) => {
      if (!dateStr) return '';
      const now = new Date();
      const createdAt = new Date(dateStr);
      const diffMs = now.getTime() - createdAt.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
    };

    // Watch for tab changes
    watch(activeTab, () => {
      currentPage.value = 1;
      loadFilings();
    });

    // Load data on mount
    onMounted(() => {
      loadFilings();
    });

    // Helper functions for dynamic labels based on tab
    const getApproverLabel = () => {
      switch (activeTab.value) {
        case 'pending':
          return 'Approver';
        case 'approved':
          return 'Approved By';
        case 'rejected':
          return 'Rejected By';
        default:
          return 'Approver';
      }
    };

    const getApproverValue = (request: Request) => {
      switch (activeTab.value) {
        case 'pending':
          // Show the approver (parent) for pending requests
          return request.account?.parent ? formatFullName(request.account.parent) : 'Unassigned';
        case 'approved':
          // Show who approved it
          return request.approvedBy ? formatFullName(request.approvedBy) : 'Unknown';
        case 'rejected':
          // Show who rejected it (using approvedBy field as it contains the action taker)
          return request.approvedBy ? formatFullName(request.approvedBy) : 'Unknown';
        default:
          return request.account?.parent ? formatFullName(request.account.parent) : 'Unassigned';
      }
    };

    return {
      tabList,
      search,
      activeTab,
      loading,
      error,
      showApprovalDialog,
      selectedFiling,
      setActiveTab,
      currentPage,
      pageSize,
      totalFilings,
      handlePageChange,
      paginatedRequests,
      handleRequestClick,
      loadFilings,
      onFilingApproved,
      onFilingRejected,
      onFilingCancelled,
      getApproverLabel,
      getApproverValue,
    };
  },
};
</script>

<style scoped lang="scss">
.select-filter {
  width: 150px;
}

.q-menu {
  .q-list {
    min-width: 200px;
  }

  .q-item {
    padding: 10px 8px;
    min-height: 32px;

    &:hover {
      background-color: #f6f8fb;
    }
  }
}

.tab {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-right: 5px;

  .tab-button {
    padding: 8px 18px;
    background-color: #dde1f053;
    border-radius: 50px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &.active {
      background-color: #dde1f0;
      font-weight: 500;
    }
  }
}

.skeleton-card {
  cursor: default;
  margin: 0 5px 10px 5px;
  background-color: #f6f8fb;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.request-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 475px;
  overflow: hidden;

  .manage-card {
    cursor: pointer;
    margin: 0 5px 10px 5px;
    background-color: #f6f8fb;
    padding: 12px;
    border-radius: 8px;
    transition: transform 0.2s ease-in-out;

    &:hover {
      transform: translateX(2px);
      box-shadow: -2px 3px 3px rgba(0, 0, 0, 0.1);
    }
  }
}

.empty-state-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 16px;
}
</style>

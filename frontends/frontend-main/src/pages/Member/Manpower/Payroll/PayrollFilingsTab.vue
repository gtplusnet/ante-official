<template>
  <div class="payroll-filings-tab">
    <q-tabs
      v-model="statusTab"
      dense
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
      class="q-mb-md"
    >
      <q-tab name="all" label="All" />
      <q-tab name="pending" label="Pending" />
      <q-tab name="approved" label="Approved" />
      <q-tab name="rejected" label="Rejected" />
    </q-tabs>

    <q-separator class="q-mb-md" />

    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner-dots size="50px" color="primary" />
      <div class="q-mt-md">Loading filings...</div>
    </div>

    <div v-else-if="error" class="text-center q-pa-lg text-negative">
      <q-icon name="error" size="50px" />
      <div class="q-mt-md">{{ error }}</div>
    </div>

    <div v-else class="filings-container">
      <!-- Overtime Section -->
      <div class="filing-section q-mb-lg">
        <div class="section-header q-mb-md">
          <q-icon name="schedule" size="24px" color="primary" class="q-mr-sm" />
          <span class="text-h6">Overtime Filings</span>
          <q-badge color="grey" class="q-ml-sm">{{ overtimeFilings.length }}</q-badge>
        </div>
        <div v-if="overtimeFilings.length === 0" class="no-data q-pa-md text-grey-6">
          No overtime filings found
        </div>
        <q-list v-else bordered separator class="rounded-borders">
          <q-item v-for="filing in overtimeFilings" :key="filing.id" clickable>
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white" size="40px">
                <q-icon name="schedule" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ formatDate(filing.date) }}
              </q-item-label>
              <q-item-label caption lines="2">
                <span class="text-weight-medium">Time:</span> {{ formatTime(filing.timeIn) }} - {{ formatTime(filing.timeOut) }}
              </q-item-label>
              <q-item-label caption>
                <span class="text-weight-medium">Hours:</span> {{ filing.hours || 0 }} regular hours
                <span v-if="filing.nightDifferentialHours"> + {{ filing.nightDifferentialHours }} ND hours</span>
              </q-item-label>
              <q-item-label caption v-if="filing.remarks || filing.reason" lines="2">
                <span class="text-weight-medium">Reason:</span> {{ filing.remarks || filing.reason }}
              </q-item-label>
              <q-item-label caption v-if="filing.approvedBy">
                <span class="text-weight-medium">Approved by:</span> {{ filing.approvedBy.firstName }} {{ filing.approvedBy.lastName }}
              </q-item-label>
              <q-item-label caption v-if="filing.approvedAt">
                <span class="text-weight-medium">Approved on:</span> {{ formatDate(filing.approvedAt) }}
              </q-item-label>
              <q-item-label caption v-if="filing.rejectReason">
                <span class="text-weight-medium text-negative">Reject reason:</span> {{ filing.rejectReason }}
              </q-item-label>
            </q-item-section>
            <q-item-section side top>
              <div class="text-right">
                <q-badge :color="getStatusColor(filing.status?.key || filing.status)" :label="filing.status?.label || filing.status" />
                <div class="text-caption text-grey-6 q-mt-xs">{{ filing.timeAgo }}</div>
                <q-icon v-if="filing.fileId" name="attach_file" size="18px" color="grey-6" class="q-mt-xs">
                  <q-tooltip>Has attachment</q-tooltip>
                </q-icon>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Leave Section -->
      <div class="filing-section q-mb-lg">
        <div class="section-header q-mb-md">
          <q-icon name="event_busy" size="24px" color="orange" class="q-mr-sm" />
          <span class="text-h6">Leave Filings</span>
          <q-badge color="grey" class="q-ml-sm">{{ leaveFilings.length }}</q-badge>
        </div>
        <div v-if="leaveFilings.length === 0" class="no-data q-pa-md text-grey-6">
          No leave filings found
        </div>
        <q-list v-else bordered separator class="rounded-borders">
          <q-item v-for="filing in leaveFilings" :key="filing.id" clickable>
            <q-item-section avatar>
              <q-avatar color="orange" text-color="white" size="40px">
                <q-icon name="event_busy" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ filing.leaveData?.leaveType || 'Leave' }}
              </q-item-label>
              <q-item-label caption v-if="filing.timeIn">
                <span class="text-weight-medium">From Date:</span> {{ formatDate(filing.timeIn) }}
              </q-item-label>
              <q-item-label caption v-if="filing.timeOut">
                <span class="text-weight-medium">To Date:</span> {{ formatDate(filing.timeOut) }}
              </q-item-label>
              <q-item-label caption v-if="!filing.timeIn && !filing.timeOut && filing.date">
                <span class="text-weight-medium">Date:</span> {{ formatDate(filing.date) }}
              </q-item-label>
              <q-item-label caption>
                <span class="text-weight-medium">Type:</span> 
                {{ filing.leaveData?.compensationType === 'WITH_PAY' ? 'With Pay' : filing.leaveData?.compensationType === 'WITHOUT_PAY' ? 'Without Pay' : filing.leaveData?.compensationType }}
              </q-item-label>
              <q-item-label caption v-if="filing.leaveData?.days">
                <span class="text-weight-medium">Days:</span> {{ filing.leaveData.days }}
              </q-item-label>
              <q-item-label caption v-if="filing.remarks || filing.reason" lines="2">
                <span class="text-weight-medium">Reason:</span> {{ filing.remarks || filing.reason }}
              </q-item-label>
              <q-item-label caption v-if="filing.approvedBy">
                <span class="text-weight-medium">Approved by:</span> {{ filing.approvedBy.firstName }} {{ filing.approvedBy.lastName }}
              </q-item-label>
              <q-item-label caption v-if="filing.approvedAt">
                <span class="text-weight-medium">Approved on:</span> {{ formatDate(filing.approvedAt) }}
              </q-item-label>
              <q-item-label caption v-if="filing.rejectReason">
                <span class="text-weight-medium text-negative">Reject reason:</span> {{ filing.rejectReason }}
              </q-item-label>
            </q-item-section>
            <q-item-section side top>
              <div class="text-right">
                <q-badge :color="getStatusColor(filing.status?.key || filing.status)" :label="filing.status?.label || filing.status" />
                <div class="text-caption text-grey-6 q-mt-xs">{{ filing.timeAgo }}</div>
                <q-icon v-if="filing.fileId" name="attach_file" size="18px" color="grey-6" class="q-mt-xs">
                  <q-tooltip>Has attachment</q-tooltip>
                </q-icon>
                <div v-if="canApproveFiling(filing)" class="q-mt-sm q-gutter-xs">
                  <q-btn
                    size="sm"
                    dense
                    no-caps
                    unelevated
                    color="positive"
                    icon="check"
                    label="Approve"
                    @click.stop="approveFiling(filing)"
                  />
                  <q-btn
                    size="sm"
                    dense
                    no-caps
                    unelevated
                    color="negative"
                    icon="close"
                    label="Reject"
                    @click.stop="rejectFiling(filing)"
                  />
                </div>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Schedule Adjustment Section -->
      <div class="filing-section q-mb-lg">
        <div class="section-header q-mb-md">
          <q-icon name="swap_horiz" size="24px" color="teal" class="q-mr-sm" />
          <span class="text-h6">Schedule Adjustments</span>
          <q-badge color="grey" class="q-ml-sm">{{ scheduleFilings.length }}</q-badge>
        </div>
        <div v-if="scheduleFilings.length === 0" class="no-data q-pa-md text-grey-6">
          No schedule adjustments found
        </div>
        <q-list v-else bordered separator class="rounded-borders">
          <q-item v-for="filing in scheduleFilings" :key="filing.id" clickable>
            <q-item-section avatar>
              <q-avatar color="teal" text-color="white" size="40px">
                <q-icon name="swap_horiz" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ filing.shiftData?.shiftCode || 'Schedule Adjustment' }}
              </q-item-label>
              <q-item-label caption>
                <span class="text-weight-medium">Date:</span> {{ formatDate(filing.date) }}
              </q-item-label>
              <q-item-label caption v-if="filing.shiftData?.shiftType">
                <span class="text-weight-medium">Shift Type:</span> {{ filing.shiftData.shiftType }}
              </q-item-label>
              <q-item-label caption v-if="filing.shiftData?.targetHours">
                <span class="text-weight-medium">Target Hours:</span> {{ filing.shiftData.targetHours }} hours
              </q-item-label>
              <q-item-label caption v-if="filing.shiftData?.totalBreakHours">
                <span class="text-weight-medium">Break Hours:</span> {{ filing.shiftData.totalBreakHours }} hours
              </q-item-label>
              <q-item-label caption v-if="filing.shiftData?.workingHours && filing.shiftData.workingHours.length > 0">
                <span class="text-weight-medium">Working Hours:</span>
                <span v-for="(wh, index) in filing.shiftData.workingHours" :key="index">
                  {{ formatTimeOnly(wh.startTime) }}-{{ formatTimeOnly(wh.endTime) }}{{ wh.isBreakTime ? ' (Break)' : '' }}{{ index < filing.shiftData.workingHours.length - 1 ? ', ' : '' }}
                </span>
              </q-item-label>
              <q-item-label caption v-if="filing.remarks || filing.reason" lines="2">
                <span class="text-weight-medium">Reason:</span> {{ filing.remarks || filing.reason }}
              </q-item-label>
              <q-item-label caption v-if="filing.approvedBy">
                <span class="text-weight-medium">Approved by:</span> {{ filing.approvedBy.firstName }} {{ filing.approvedBy.lastName }}
              </q-item-label>
              <q-item-label caption v-if="filing.approvedAt">
                <span class="text-weight-medium">Approved on:</span> {{ formatDate(filing.approvedAt) }}
              </q-item-label>
              <q-item-label caption v-if="filing.rejectReason">
                <span class="text-weight-medium text-negative">Reject reason:</span> {{ filing.rejectReason }}
              </q-item-label>
            </q-item-section>
            <q-item-section side top>
              <div class="text-right">
                <q-badge :color="getStatusColor(filing.status?.key || filing.status)" :label="filing.status?.label || filing.status" />
                <div class="text-caption text-grey-6 q-mt-xs">{{ filing.timeAgo }}</div>
                <q-icon v-if="filing.fileId" name="attach_file" size="18px" color="grey-6" class="q-mt-xs">
                  <q-tooltip>Has attachment</q-tooltip>
                </q-icon>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Official Business Section -->
      <div class="filing-section q-mb-lg">
        <div class="section-header q-mb-md">
          <q-icon name="business_center" size="24px" color="blue" class="q-mr-sm" />
          <span class="text-h6">Official Business</span>
          <q-badge color="grey" class="q-ml-sm">{{ businessFilings.length }}</q-badge>
        </div>
        <div v-if="businessFilings.length === 0" class="no-data q-pa-md text-grey-6">
          No official business filings found
        </div>
        <q-list v-else bordered separator class="rounded-borders">
          <q-item v-for="filing in businessFilings" :key="filing.id" clickable>
            <q-item-section avatar>
              <q-avatar color="blue" text-color="white" size="40px">
                <q-icon name="business_center" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">
                Official Business
              </q-item-label>
              <q-item-label caption>
                <span class="text-weight-medium">Date:</span> {{ formatDate(filing.date || filing.timeIn) }}
              </q-item-label>
              <q-item-label caption v-if="filing.timeIn && filing.timeOut">
                <span class="text-weight-medium">Time:</span> {{ formatTime(filing.timeIn) }} - {{ formatTime(filing.timeOut) }}
              </q-item-label>
              <q-item-label caption v-if="filing.hours">
                <span class="text-weight-medium">Hours:</span> {{ filing.hours }} hours
              </q-item-label>
              <q-item-label caption v-if="filing.remarks || filing.reason" lines="2">
                <span class="text-weight-medium">Purpose/Destination:</span> {{ filing.remarks || filing.reason }}
              </q-item-label>
              <q-item-label caption v-if="filing.approvedBy">
                <span class="text-weight-medium">Approved by:</span> {{ filing.approvedBy.firstName }} {{ filing.approvedBy.lastName }}
              </q-item-label>
              <q-item-label caption v-if="filing.approvedAt">
                <span class="text-weight-medium">Approved on:</span> {{ formatDate(filing.approvedAt) }}
              </q-item-label>
              <q-item-label caption v-if="filing.rejectReason">
                <span class="text-weight-medium text-negative">Reject reason:</span> {{ filing.rejectReason }}
              </q-item-label>
            </q-item-section>
            <q-item-section side top>
              <div class="text-right">
                <q-badge :color="getStatusColor(filing.status?.key || filing.status)" :label="filing.status?.label || filing.status" />
                <div class="text-caption text-grey-6 q-mt-xs">{{ filing.timeAgo }}</div>
                <q-icon v-if="filing.fileId" name="attach_file" size="18px" color="grey-6" class="q-mt-xs">
                  <q-tooltip>Has attachment</q-tooltip>
                </q-icon>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <!-- Certificate of Attendance Section -->
      <div class="filing-section">
        <div class="section-header q-mb-md">
          <q-icon name="verified" size="24px" color="green" class="q-mr-sm" />
          <span class="text-h6">Certificate of Attendance</span>
          <q-badge color="grey" class="q-ml-sm">{{ attendanceFilings.length }}</q-badge>
        </div>
        <div v-if="attendanceFilings.length === 0" class="no-data q-pa-md text-grey-6">
          No certificate of attendance filings found
        </div>
        <q-list v-else bordered separator class="rounded-borders">
          <q-item v-for="filing in attendanceFilings" :key="filing.id" clickable>
            <q-item-section avatar>
              <q-avatar color="green" text-color="white" size="40px">
                <q-icon name="verified" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">
                Certificate of Attendance
              </q-item-label>
              <q-item-label caption>
                <span class="text-weight-medium">Date:</span> {{ formatDate(filing.date || filing.timeIn) }}
              </q-item-label>
              <q-item-label caption v-if="filing.timeIn && filing.timeOut">
                <span class="text-weight-medium">Time:</span> {{ formatTime(filing.timeIn) }} - {{ formatTime(filing.timeOut) }}
              </q-item-label>
              <q-item-label caption v-if="filing.hours">
                <span class="text-weight-medium">Hours:</span> {{ filing.hours }} hours
              </q-item-label>
              <q-item-label caption v-if="filing.remarks || filing.reason" lines="2">
                <span class="text-weight-medium">Purpose/Event:</span> {{ filing.remarks || filing.reason }}
              </q-item-label>
              <q-item-label caption v-if="filing.approvedBy">
                <span class="text-weight-medium">Approved by:</span> {{ filing.approvedBy.firstName }} {{ filing.approvedBy.lastName }}
              </q-item-label>
              <q-item-label caption v-if="filing.approvedAt">
                <span class="text-weight-medium">Approved on:</span> {{ formatDate(filing.approvedAt) }}
              </q-item-label>
              <q-item-label caption v-if="filing.rejectReason">
                <span class="text-weight-medium text-negative">Reject reason:</span> {{ filing.rejectReason }}
              </q-item-label>
            </q-item-section>
            <q-item-section side top>
              <div class="text-right">
                <q-badge :color="getStatusColor(filing.status?.key || filing.status)" :label="filing.status?.label || filing.status" />
                <div class="text-caption text-grey-6 q-mt-xs">{{ filing.timeAgo }}</div>
                <q-icon v-if="filing.fileId" name="attach_file" size="18px" color="grey-6" class="q-mt-xs">
                  <q-tooltip>Has attachment</q-tooltip>
                </q-icon>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { CutoffDateRangeResponse } from '@shared/response';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';

export default defineComponent({
  name: 'PayrollFilingsTab',
  props: {
    employeeAccountId: {
      type: String,
      required: true,
    },
    cutoffDateRange: {
      type: Object as () => CutoffDateRangeResponse,
      required: true,
    },
  },
  setup(props) {
    const $q = useQuasar();
    const authStore = useAuthStore();
    
    const statusTab = ref('all');
    const loading = ref(false);
    const error = ref<string | null>(null);
    const currentUserId = computed(() => authStore.accountInformation.id);
    
    // Filing data by type
    const overtimeFilings = ref([]);
    const leaveFilings = ref([]);
    const scheduleFilings = ref([]);
    const businessFilings = ref([]);
    const attendanceFilings = ref([]);

    // Computed filtered filings
    const filteredOvertimeFilings = computed(() => filterByStatus(overtimeFilings.value));
    const filteredLeaveFilings = computed(() => filterByStatus(leaveFilings.value));
    const filteredScheduleFilings = computed(() => filterByStatus(scheduleFilings.value));
    const filteredBusinessFilings = computed(() => filterByStatus(businessFilings.value));
    const filteredAttendanceFilings = computed(() => filterByStatus(attendanceFilings.value));

    const filterByStatus = (filings: any[]) => {
      if (statusTab.value === 'all') return filings;
      return filings.filter(f => {
        const statusKey = f.status?.key || f.status;
        return statusKey && statusKey.toLowerCase() === statusTab.value;
      });
    };

    // Convert MM/DD/YYYY to YYYY-MM-DD format
    const convertToISODate = (dateStr: string): string => {
      if (!dateStr) return '';
      // Handle MM/DD/YYYY format
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [month, day, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      // Return as-is if already in correct format or unrecognized
      return dateStr;
    };

    const loadFilings = async () => {
      loading.value = true;
      error.value = null;

      try {
        // Convert date format from MM/DD/YYYY to YYYY-MM-DD for ISO 8601 compliance
        const dateFrom = convertToISODate(props.cutoffDateRange.startDate.date);
        const dateTo = convertToISODate(props.cutoffDateRange.endDate.date);
        const params = {
          accountId: props.employeeAccountId,
          dateFrom,
          dateTo,
          limit: 100,
        };

        // Load all filing types in parallel
        const [overtime, leave, schedule, business, attendance] = await Promise.all([
          api.get('/hr-filing/overtime', { params }),
          api.get('/hr-filing/leave', { params }),
          api.get('/hr-filing/schedule', { params }),
          api.get('/hr-filing/business', { params }),
          api.get('/hr-filing/attendance', { params }),
        ]);

        overtimeFilings.value = overtime.data.data || [];
        leaveFilings.value = leave.data.data || [];
        scheduleFilings.value = schedule.data.data || [];
        businessFilings.value = business.data.data || [];
        attendanceFilings.value = attendance.data.data || [];
      } catch (err) {
        console.error('Error loading filings:', err);
        error.value = 'Failed to load filings. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (date: string | Date) => {
      if (!date) return 'N/A';
      const d = new Date(date);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getDate().toString().padStart(2, '0')}, ${d.getFullYear()}`;
    };

    const formatTime = (time: string | Date) => {
      if (!time) return 'N/A';
      const d = new Date(time);
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    const formatTimeOnly = (time: string) => {
      if (!time) return 'N/A';
      // Handle time strings like "HH:MM" or "HH:MM:SS"
      const parts = time.split(':');
      if (parts.length >= 2) {
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      }
      return time;
    };

    const getStatusColor = (status: string | undefined) => {
      if (!status || typeof status !== 'string') {
        return 'grey';
      }
      const statusKey = status.toUpperCase();
      switch (statusKey) {
        case 'APPROVED':
          return 'positive';
        case 'REJECTED':
          return 'negative';
        case 'PENDING':
          return 'warning';
        default:
          return 'grey';
      }
    };

    // Check if current user can approve a filing
    const canApproveFiling = (filing: any) => {
      return filing.status?.key === 'PENDING' && 
             filing.accountId !== currentUserId.value;
    };

    // Approve filing
    const approveFiling = async (filing: any) => {
      $q.dialog({
        title: 'Approve Leave Request',
        message: `Approve ${filing.leaveData?.days || ''} day(s) ${filing.leaveData?.leaveType || 'leave'} request from ${formatDate(filing.timeIn)} to ${formatDate(filing.timeOut)}?`,
        ok: { 
          label: 'Approve', 
          color: 'positive', 
          unelevated: true 
        },
        cancel: { 
          label: 'Cancel', 
          color: 'grey', 
          outline: true 
        }
      }).onOk(async () => {
        $q.loading.show({ message: 'Approving filing...' });
        try {
          await api.post('/hr-filing/filing/approve', {
            id: filing.id,
            remarks: 'Approved via payroll timekeeping'
          });
          $q.notify({ 
            type: 'positive', 
            message: 'Leave request approved successfully',
            position: 'top'
          });
          await loadFilings();
        } catch (error) {
          console.error('Error approving filing:', error);
          $q.notify({ 
            type: 'negative', 
            message: 'Failed to approve filing',
            position: 'top'
          });
        } finally {
          $q.loading.hide();
        }
      });
    };

    // Reject filing
    const rejectFiling = async (filing: any) => {
      $q.dialog({
        title: 'Reject Leave Request',
        message: 'Please provide a reason for rejection:',
        prompt: { 
          model: '', 
          type: 'textarea',
          filled: true,
          autogrow: true
        },
        ok: { 
          label: 'Reject', 
          color: 'negative', 
          unelevated: true 
        },
        cancel: { 
          label: 'Cancel', 
          color: 'grey', 
          outline: true 
        },
        persistent: true
      }).onOk(async (reason: string) => {
        if (!reason?.trim()) {
          $q.notify({ 
            type: 'warning', 
            message: 'Rejection reason is required',
            position: 'top'
          });
          return;
        }
        $q.loading.show({ message: 'Rejecting filing...' });
        try {
          await api.post('/hr-filing/filing/reject', {
            id: filing.id,
            remarks: reason
          });
          $q.notify({ 
            type: 'positive', 
            message: 'Leave request rejected',
            position: 'top'
          });
          await loadFilings();
        } catch (error) {
          console.error('Error rejecting filing:', error);
          $q.notify({ 
            type: 'negative', 
            message: 'Failed to reject filing',
            position: 'top'
          });
        } finally {
          $q.loading.hide();
        }
      });
    };

    onMounted(() => {
      loadFilings();
    });

    watch(() => props.cutoffDateRange, () => {
      loadFilings();
    });

    return {
      statusTab,
      loading,
      error,
      overtimeFilings: filteredOvertimeFilings,
      leaveFilings: filteredLeaveFilings,
      scheduleFilings: filteredScheduleFilings,
      businessFilings: filteredBusinessFilings,
      attendanceFilings: filteredAttendanceFilings,
      formatDate,
      formatTime,
      formatTimeOnly,
      getStatusColor,
      canApproveFiling,
      approveFiling,
      rejectFiling,
    };
  },
});
</script>

<style scoped lang="scss">
.payroll-filings-tab {

  .filing-section {
    .section-header {
      display: flex;
      align-items: center;
      font-weight: 500;
    }

    .no-data {
      text-align: center;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
  }

  .q-item {
    padding: 16px;
    min-height: 80px;
    
    &:hover {
      background-color: #f5f5f5;
    }

    .q-item-label {
      margin-bottom: 4px;
      
      &.text-weight-medium {
        font-size: 16px;
        margin-bottom: 8px;
      }
      
      span.text-weight-medium {
        color: #616161;
      }
    }
    
    .q-avatar {
      margin-right: 12px;
    }
  }
  
  .text-caption {
    font-size: 12px;
  }
  
  .q-badge {
    padding: 4px 8px;
    font-weight: 500;
  }
  
  .q-btn {
    &.q-btn--dense {
      min-height: 28px;
    }
  }
}
</style>
<template>
  <div class="leave-filing-display">
    <!-- Header Section -->
    <div class="filing-header">
      <div class="row items-center q-gutter-sm">
        <q-icon name="event_busy" size="24px" style="color: #00897B" />
        <div class="text-h6">Leave Request</div>
      </div>
    </div>

    <!-- Basic Information Section -->
    <div class="info-section">
      <div class="section-header">Basic Information</div>
      
      <div class="info-row row items-center">
        <div class="info-label">Employee</div>
        <div class="info-value">
          {{ (filing.account?.firstName ? formatWord(filing.account?.firstName) : '') + ' ' + (filing.account?.lastName ? formatWord(filing.account?.lastName) : '') || 'N/A' }}
        </div>
      </div>
      
      <div class="info-row row items-center">
        <div class="info-label">Status</div>
        <div class="info-value">
          <q-chip 
            :class="`status-chip status-${(String(getStatusKey() || '')).toLowerCase()}`"
            size="sm"
            dense
          >
            {{ formatWord(getStatusLabel()) }}
          </q-chip>
        </div>
      </div>
      
      <div class="info-row row items-center">
        <div class="info-label">Leave Type</div>
        <div class="info-value">
          <q-chip 
            :color="getLeaveTypeColor()" 
            text-color="white" 
            size="sm"
            dense
          >
            <q-icon :name="getLeaveTypeIcon()" size="14px" class="q-mr-xs" />
            {{ getLeaveTypeName() }}
          </q-chip>
        </div>
      </div>
      
      <div class="info-row row items-center">
        <div class="info-label">Compensation</div>
        <div class="info-value">
          <span :class="getCompensationType() === 'WITH_PAY' ? 'text-positive' : 'text-warning'">
            {{ getCompensationType() === 'WITH_PAY' ? 'With Pay' : getCompensationType() === 'WITHOUT_PAY' ? 'Without Pay' : 'Not Specified' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Leave Period Section -->
    <div class="info-section">
      <div class="section-header">Leave Period</div>
      
      <div class="info-row row items-center">
        <div class="info-label">From</div>
        <div class="info-value">{{ formatDate(filing.timeIn || filing.date) }}</div>
      </div>
      
      <div class="info-row row items-center">
        <div class="info-label">To</div>
        <div class="info-value">{{ formatDate(filing.timeOut || filing.date) }}</div>
      </div>
      
      <div class="info-row row items-center">
        <div class="info-label">Duration</div>
        <div class="info-value">
          <strong class="text-primary">{{ calculateDays() }} {{ calculateDays() === 1 ? 'day' : 'days' }}</strong>
        </div>
      </div>
    </div>

    <!-- Administrative Information -->
    <div class="info-section" v-if="filing.createdAt || filing.approvedAt || filing.approvedBy">
      <div class="section-header">Administrative Details</div>
      
      <div class="info-row row items-center" v-if="filing.createdAt">
        <div class="info-label">Filed On</div>
        <div class="info-value">{{ formatDateTime(filing.createdAt) }}</div>
      </div>
      
      <div class="info-row row items-center" v-if="filing.approvedAt">
        <div class="info-label">Processed On</div>
        <div class="info-value">{{ formatDateTime(filing.approvedAt) }}</div>
      </div>
      
      <div class="info-row row items-center" v-if="filing.approvedBy">
        <div class="info-label">{{ getStatusKey() === 'APPROVED' ? 'Approved By' : getStatusKey() === 'REJECTED' ? 'Rejected By' : 'Processed By' }}</div>
        <div class="info-value">
          {{ filing.approvedBy.firstName }} {{ filing.approvedBy.lastName }}
        </div>
      </div>
    </div>

    <!-- Leave Credits Information (if available) -->
    <div class="info-section" v-if="getLeaveCreditsInfo()">
      <div class="section-header">Leave Credits</div>
      
      <div class="info-row row items-center">
        <div class="info-label">Before Filing</div>
        <div class="info-value"><strong>{{ getLeaveCreditsInfo()?.before || 'N/A' }}</strong> days</div>
      </div>
      
      <div class="info-row row items-center">
        <div class="info-label">After {{ getStatusKey() === 'APPROVED' ? 'Approval' : 'Filing' }}</div>
        <div class="info-value"><strong>{{ getLeaveCreditsInfo()?.after || 'N/A' }}</strong> days</div>
      </div>
    </div>

    <!-- Reason for Filing Section -->
    <div v-if="filing.remarks" class="content-section remarks-section">
      <div class="section-header">Reason for Filing</div>
      <div class="text-body2 text-grey-9" style="white-space: pre-wrap;">{{ filing.remarks }}</div>
    </div>

    <!-- Rejection Reason -->
    <div v-if="filing.rejectReason" class="content-section rejection-section">
      <div class="row items-center q-gutter-sm q-mb-sm">
        <q-icon name="o_cancel" size="18px" color="negative" />
        <div class="text-subtitle2 text-negative">Rejection Reason</div>
      </div>
      <div class="text-body2 text-grey-9" style="white-space: pre-wrap;">{{ filing.rejectReason }}</div>
    </div>

    <!-- Attachment -->
    <div v-if="filing.file || filing.fileId">
      <div class="divider"></div>
      <div class="attachment-row" @click="openFile(filing.fileId || filing.file?.id)">
        <q-icon name="o_attach_file" size="24px" class="attachment-icon" />
        <div class="attachment-info">
          <div class="attachment-name">{{ filing.file?.name || filing.fileName || 'Attachment' }}</div>
          <div class="attachment-hint">Click to view</div>
        </div>
        <q-btn
          flat
          round
          icon="o_download"
          size="sm"
          color="primary"
          @click.stop="openFile(filing.fileId || filing.file?.id)"
        >
          <q-tooltip>Download</q-tooltip>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import './filing-display.scss';

.leave-filing-display {
  @extend .filing-display;
}
</style>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { FilingDisplayData } from 'src/interfaces/filing-notification.interface';
import { formatWord } from 'src/utility/formatter';
import { FileService } from 'src/services/file.service';
import { useQuasar } from 'quasar';

export default defineComponent({
  name: 'LeaveFilingDisplay',
  props: {
    filing: {
      type: Object as PropType<FilingDisplayData>,
      required: true
    }
  },
  setup(props) {
    const $q = useQuasar();

    const getStatusKey = () => {
      if (typeof props.filing.status === 'object' && props.filing.status?.key) {
        return props.filing.status.key;
      }
      return props.filing.status || '';
    };

    const getStatusLabel = (): string => {
      if (typeof props.filing.status === 'object' && props.filing.status?.label) {
        return props.filing.status.label;
      }
      return typeof props.filing.status === 'string' ? props.filing.status : '';
    };

    const getStatusColor = () => {
      const key = getStatusKey();
      switch (key) {
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

    const getStatusTextColor = () => {
      const key = getStatusKey();
      switch (key) {
        case 'APPROVED':
        case 'REJECTED':
          return 'white';
        case 'PENDING':
          return 'black';
        default:
          return 'white';
      }
    };

    const formatDate = (date: string | Date | undefined) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatDateTime = (date: string | Date | undefined) => {
      if (!date) return 'N/A';
      const dateObj = new Date(date);
      return `${dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })} at ${dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}`;
    };

    const formatTime = (time: string | Date | undefined) => {
      if (!time) return 'N/A';
      return new Date(time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    const calculateDays = () => {
      const startDate = props.filing.timeIn || props.filing.date;
      const endDate = props.filing.timeOut || props.filing.date;
      if (!startDate || !endDate) return 1;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    };

    const getLeaveTypeName = () => {
      // Try to extract leave type from filing data
      const filingData = props.filing as any;
      if (filingData.leaveData?.leaveType) {
        const leaveTypes: Record<string, string> = {
          'VACATION': 'Vacation Leave',
          'SICK': 'Sick Leave',
          'EMERGENCY': 'Emergency Leave',
          'MATERNITY_PATERNITY': 'Maternity/Paternity Leave',
          'BEREAVEMENT': 'Bereavement Leave',
          'SERVICE_INCENTIVE': 'Service Incentive Leave',
          'SOLO_PARENT': 'Solo Parent Leave',
          'STUDY': 'Study Leave',
          'SPECIAL': 'Special Leave'
        };
        return leaveTypes[filingData.leaveData.leaveType] || filingData.leaveData.leaveType;
      }
      return props.filing.filingType?.label || 'Leave';
    };

    const getLeaveTypeIcon = () => {
      const filingData = props.filing as any;
      const leaveType = filingData.leaveData?.leaveType || '';
      const icons: Record<string, string> = {
        'VACATION': 'o_beach_access',
        'SICK': 'o_local_hospital',
        'EMERGENCY': 'o_warning',
        'MATERNITY_PATERNITY': 'o_child_care',
        'BEREAVEMENT': 'o_sentiment_very_dissatisfied',
        'SERVICE_INCENTIVE': 'o_card_giftcard',
        'SOLO_PARENT': 'o_family_restroom',
        'STUDY': 'o_school',
        'SPECIAL': 'o_star'
      };
      return icons[leaveType] || 'o_event_busy';
    };

    const getLeaveTypeColor = () => {
      const filingData = props.filing as any;
      const leaveType = filingData.leaveData?.leaveType || '';
      const colors: Record<string, string> = {
        'VACATION': 'blue',
        'SICK': 'red',
        'EMERGENCY': 'orange',
        'MATERNITY_PATERNITY': 'pink',
        'BEREAVEMENT': 'grey',
        'SERVICE_INCENTIVE': 'green',
        'SOLO_PARENT': 'purple',
        'STUDY': 'indigo',
        'SPECIAL': 'amber'
      };
      return colors[leaveType] || 'primary';
    };

    const getCompensationType = () => {
      const filingData = props.filing as any;
      return filingData.leaveData?.compensationType || '';
    };

    const getLeaveCreditsInfo = () => {
      const filingData = props.filing as any;
      if (!filingData.leaveData) return null;
      
      // This is a simplified calculation - in real implementation, 
      // you might want to fetch actual credit balance from backend
      const before = filingData.leaveData.creditsBefore || 'N/A';
      const after = filingData.leaveData.creditsAfter || 'N/A';
      
      // If we don't have actual values, return null
      if (before === 'N/A' && after === 'N/A') return null;
      
      return { before, after };
    };

    const openFile = (fileId: number | string | undefined) => {
      if (!fileId) return;

      try {
        // Convert fileId to number if it's a string
        const numericFileId = typeof fileId === 'string' ? Number(fileId) : fileId;
        FileService.getFileInfo(numericFileId).then((fileInfo) => {
          if (fileInfo && fileInfo.url) {
            FileService.viewFile(fileInfo.url);
          } else {
            $q.notify({
              type: 'negative',
              message: 'Unable to retrieve file information',
            });
          }
        });
      } catch (error) {
        console.error('Error viewing file:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to view file',
        });
      }
    };

    return {
      $q,
      formatDate,
      formatDateTime,
      formatTime,
      formatWord,
      openFile,
      getStatusKey,
      getStatusLabel,
      getStatusColor,
      getStatusTextColor,
      calculateDays,
      getLeaveTypeName,
      getLeaveTypeIcon,
      getLeaveTypeColor,
      getCompensationType,
      getLeaveCreditsInfo,
    };
  }
});
</script>
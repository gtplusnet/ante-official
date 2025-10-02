<template>
  <div class="schedule-adjustment-filing-display">
    <!-- Header Section -->
    <div class="filing-header">
      <div class="row items-center q-gutter-sm">
        <q-icon name="brightness_6" size="24px" style="color: #8E24AA" />
        <div class="text-h6">Schedule Adjustment Request</div>
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
        <div class="info-label">Date</div>
        <div class="info-value">{{ formatDate(filing.date) }}</div>
      </div>
    </div>

    <!-- Shift Details Section -->
    <div v-if="shiftDetails" class="info-section">
      <div class="section-header">Shift Details</div>
      
      <div v-if="loadingShiftDetails" class="row items-center justify-center q-py-md">
        <q-spinner color="primary" size="30px" />
        <span class="q-ml-sm text-grey-7">Loading shift details...</span>
      </div>
      
      <template v-else>
        <div class="info-row row items-center">
          <div class="info-label">Shift Type</div>
          <div class="info-value">{{ shiftDetails.shiftType?.label || shiftDetails.shiftType?.key || 'N/A' }}</div>
        </div>
        
        <div class="info-row row items-center">
          <div class="info-label">Shift Code</div>
          <div class="info-value">{{ shiftDetails.shiftCode || 'N/A' }}</div>
        </div>
        
        <div class="info-row row items-center">
          <div class="info-label">Total Work Hours</div>
          <div class="info-value">{{ shiftDetails.totalWorkHours?.hours || '0' }} hours</div>
        </div>
        
        <div class="info-row row items-center">
          <div class="info-label">Break Hours</div>
          <div class="info-value">{{ shiftDetails.breakHours?.hours || '0' }} hours</div>
        </div>
        
        <div class="info-row row items-center">
          <div class="info-label">Target Hours</div>
          <div class="info-value">{{ shiftDetails.targetHours?.hours || '0' }} hours</div>
        </div>
      </template>
    </div>

    <!-- Time Schedule for Time Bound shifts -->
    <div v-if="shiftDetails?.shiftType?.key === 'TIME_BOUND' && shiftDetails.shiftTime && shiftDetails.shiftTime.length > 0" class="info-section">
      <div class="section-header">Working Hours Schedule</div>
      
      <div v-for="(time, index) in shiftDetails.shiftTime" :key="index" class="info-row row items-center">
        <div class="info-label">
          <q-icon :name="time.isBreakTime ? 'o_coffee' : 'o_schedule'" size="16px" class="q-mr-xs" />
          {{ time.isBreakTime ? 'Break Time' : 'Work Time' }}
        </div>
        <div class="info-value">
          {{ formatTimeDisplay(time.startTime) }} - {{ formatTimeDisplay(time.endTime) }}
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

.schedule-adjustment-filing-display {
  @extend .filing-display;
}
</style>

<script lang="ts">
import { defineComponent, PropType, ref, onMounted } from 'vue';
import { api } from 'src/boot/axios';
import { FilingDisplayData } from 'src/interfaces/filing-notification.interface';
import { AxiosError } from 'axios';
import { formatWord } from 'src/utility/formatter';
import { FileService } from 'src/services/file.service';
import { useQuasar } from 'quasar';

interface TimeFormat {
  time?: string;
  raw?: string;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

interface ShiftTimeData {
  startTime: string | TimeFormat;
  endTime: string | TimeFormat;
  isBreakTime: boolean;
}

interface ShiftDetailsData {
  shiftCode: string;
  shiftType?: { key: string; label: string };
  totalWorkHours?: { hours: string };
  breakHours?: { hours: string };
  targetHours?: { hours: string };
  shiftTime?: ShiftTimeData[];
}

export default defineComponent({
  name: 'ScheduleAdjustmentFilingDisplay',
  props: {
    filing: {
      type: Object as PropType<FilingDisplayData>,
      required: true,
    },
  },
  setup(props) {
    const $q = useQuasar();
    const loadingShiftDetails = ref(false);
    const shiftDetails = ref<ShiftDetailsData | null>(null);

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

    const formatDate = (date: string | Date | undefined) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatDateTime = (date: string | Date | undefined) => {
      if (!date) return 'N/A';
      const d = new Date(date);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const formatTime = (time: string | Date | undefined) => {
      if (!time) return 'N/A';
      return new Date(time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    const formatTimeDisplay = (time: string | TimeFormat) => {
      if (!time) return '';

      // Handle if time is a TimeFormat object
      if (typeof time === 'object' && 'raw' in time) {
        // Use the raw property which should be in HH:MM format
        const timeStr = time.raw || time.time || '';
        if (!timeStr) return '';

        const parts = timeStr.split(':');
        if (parts.length >= 2) {
          const hour = parseInt(parts[0]);
          const minutes = parts[1];
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          return `${displayHour}:${minutes} ${ampm}`;
        }
        return timeStr;
      }

      // Handle if time is a string
      if (typeof time === 'string') {
        const parts = time.split(':');
        if (parts.length >= 2) {
          const hour = parseInt(parts[0]);
          const minutes = parts[1];
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          return `${displayHour}:${minutes} ${ampm}`;
        }
      }

      return String(time);
    };

    const loadShiftDetails = async () => {
      if (!props.filing.shiftId) {
        return;
      }

      loadingShiftDetails.value = true;

      try {
        const response = await api.get(`/hr-configuration/shift/info?id=${props.filing.shiftId}`);

        if (response.data) {
          shiftDetails.value = response.data;
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          console.error('Failed to load shift details:', error.message);
        } else if (error instanceof Error) {
          console.error('Error loading shift details:', error.message);
        }
      } finally {
        loadingShiftDetails.value = false;
      }
    };

    onMounted(() => {
      // Add a small delay to ensure the component is fully mounted
      setTimeout(() => {
        loadShiftDetails();
      }, 100);
    });

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
      loadingShiftDetails,
      shiftDetails,
      formatDate,
      formatDateTime,
      formatTime,
      formatTimeDisplay,
      formatWord,
      openFile,
      getStatusKey,
      getStatusLabel,
    };
  },
});
</script>

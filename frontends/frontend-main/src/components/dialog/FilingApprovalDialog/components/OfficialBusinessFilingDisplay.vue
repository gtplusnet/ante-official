<template>
  <div class="official-business-filing-display">
    <!-- Header Section -->
    <div class="filing-header">
      <div class="row items-center q-gutter-sm">
        <q-icon name="work_history" size="24px" style="color: #1E88E5" />
        <div class="text-h6">Official Business Request</div>
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

    <!-- Time Information Section -->
    <div class="info-section">
      <div class="section-header">Time Details</div>
      
      <div class="info-row row items-center">
        <div class="info-label">Period</div>
        <div class="info-value">
          {{ formatDate(filing.timeIn || filing.date) }} to {{ formatDate(filing.timeOut || filing.date) }}
        </div>
      </div>
      
      <div class="info-row row items-center" v-if="filing.timeIn">
        <div class="info-label">Time Out</div>
        <div class="info-value">{{ formatTime(filing.timeIn) }}</div>
      </div>
      
      <div class="info-row row items-center" v-if="filing.timeOut">
        <div class="info-label">Time In</div>
        <div class="info-value">{{ formatTime(filing.timeOut) }}</div>
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

    <!-- Purpose/Remarks Section -->
    <div v-if="filing.remarks" class="content-section remarks-section">
      <div class="section-header">Purpose of Official Business</div>
      <div class="text-body2 text-grey-9" style="white-space: pre-wrap;">{{ filing.remarks }}</div>
    </div>

    <!-- Location (if available) -->
    <div v-if="(filing as any).location" class="info-section">
      <div class="info-row row items-center">
        <div class="info-label">Location</div>
        <div class="info-value">{{ (filing as any).location }}</div>
      </div>
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
      <div class="attachment-row" @click="viewAttachment()">
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
          @click.stop="downloadAttachment()"
          :loading="loadingFile"
        >
          <q-tooltip>Download</q-tooltip>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import './filing-display.scss';

.official-business-filing-display {
  @extend .filing-display;
}
</style>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { FilingDisplayData } from 'src/interfaces/filing-notification.interface';
import { formatWord } from 'src/utility/formatter';
import { FileService } from 'src/services/file.service';
import { useQuasar } from 'quasar';

export default defineComponent({
  name: 'OfficialBusinessFilingDisplay',
  props: {
    filing: {
      type: Object as PropType<FilingDisplayData>,
      required: true,
    },
  },
  setup(props) {
    const $q = useQuasar();
    const loadingFile = ref(false);

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
        day: 'numeric',
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

    const formatDateTime = (date: string | Date | undefined) => {
      if (!date) return 'N/A';
      const dateObj = new Date(date);
      return `${dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })} at ${dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })}`;
    };

    const viewAttachment = async () => {
      if (!props.filing?.file && !props.filing?.fileId) return;

      loadingFile.value = true;
      try {
        if (props.filing.file?.url) {
          FileService.viewFile(props.filing.file.url);
        } else if (props.filing.file?.id || props.filing.fileId) {
          const fileId = props.filing.file?.id || props.filing.fileId;
          const fileInfo = await FileService.getFileInfo(fileId!);
          if (fileInfo && fileInfo.url) {
            FileService.viewFile(fileInfo.url);
          } else {
            $q.notify({
              type: 'negative',
              message: 'Unable to retrieve file information',
            });
          }
        }
      } catch (error) {
        console.error('Error viewing attachment:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to view attachment',
        });
      } finally {
        loadingFile.value = false;
      }
    };

    const downloadAttachment = async () => {
      if (!props.filing?.file && !props.filing?.fileId) return;

      loadingFile.value = true;
      try {
        if (props.filing.file?.url) {
          FileService.downloadFile(props.filing.file.url, props.filing.file.name);
        } else if (props.filing.file?.id || props.filing.fileId) {
          const fileId = props.filing.file?.id || props.filing.fileId;
          const fileInfo = await FileService.getFileInfo(fileId!);
          if (fileInfo && fileInfo.url) {
            FileService.downloadFile(fileInfo.url, fileInfo.name);
          } else {
            $q.notify({
              type: 'negative',
              message: 'Unable to retrieve file information',
            });
          }
        }
      } catch (error) {
        console.error('Error downloading attachment:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to download attachment',
        });
      } finally {
        loadingFile.value = false;
      }
    };

    return {
      formatDate,
      formatTime,
      formatDateTime,
      formatWord,
      getStatusKey,
      getStatusLabel,
      getStatusColor,
      getStatusTextColor,
      viewAttachment,
      downloadAttachment,
      loadingFile,
    };
  },
});
</script>
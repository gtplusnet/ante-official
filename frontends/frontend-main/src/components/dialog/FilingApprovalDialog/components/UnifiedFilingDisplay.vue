<template>
  <div class="unified-filing-display">
    <!-- Header Section -->
    <div class="filing-header q-mb-lg">
      <div class="row items-center q-gutter-sm">
        <q-icon :name="getFilingIcon()" size="32px" color="primary" />
        <div class="text-h5 text-grey-9">{{ getFilingTitle() }}</div>
      </div>
    </div>

    <!-- Primary Info Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <!-- Employee Card -->
      <div class="col-12 col-sm-6" v-if="filing.account">
        <q-card flat bordered class="info-card">
          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-icon name="o_person" size="20px" color="grey-7" />
              <div class="text-caption text-grey-7">Employee</div>
            </div>
            <div class="text-body1 text-grey-9 q-mt-xs">
              {{ formatEmployeeName() }}
            </div>
          </q-card-section>
        </q-card>
      </div>
      
      <!-- Status Card -->
      <div class="col-12 col-sm-6">
        <q-card flat bordered class="info-card">
          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-icon name="o_info" size="20px" color="grey-7" />
              <div class="text-caption text-grey-7">Status</div>
            </div>
            <q-chip 
              :color="getStatusColor()" 
              :text-color="getStatusTextColor()"
              class="q-mt-xs"
              square
            >
              {{ formatWord(getStatusLabel()) }}
            </q-chip>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dynamic Fields based on filing data -->
    <div class="row q-col-gutter-md q-mb-lg">
      <!-- Date/Time Fields -->
      <div class="col-12 col-sm-6" v-if="filing.date">
        <q-card flat bordered class="info-card">
          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-icon name="o_calendar_today" size="20px" color="grey-7" />
              <div class="text-caption text-grey-7">Date</div>
            </div>
            <div class="text-body1 text-grey-9 q-mt-xs">{{ formatDate(filing.date) }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Hours (for overtime) -->
      <div class="col-12 col-sm-6" v-if="filing.hours !== undefined">
        <q-card flat bordered class="info-card">
          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-icon name="o_access_time" size="20px" color="grey-7" />
              <div class="text-caption text-grey-7">Hours</div>
            </div>
            <div class="text-h6 text-primary q-mt-xs">{{ filing.hours }} hours</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Time In/Out -->
      <div class="col-12 col-sm-6" v-if="filing.timeIn">
        <q-card flat bordered class="info-card">
          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-icon name="o_login" size="20px" color="grey-7" />
              <div class="text-caption text-grey-7">Time In</div>
            </div>
            <div class="text-body1 text-grey-9 q-mt-xs">{{ formatTime(filing.timeIn) }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6" v-if="filing.timeOut">
        <q-card flat bordered class="info-card">
          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-icon name="o_logout" size="20px" color="grey-7" />
              <div class="text-caption text-grey-7">Time Out</div>
            </div>
            <div class="text-body1 text-grey-9 q-mt-xs">{{ formatTime(filing.timeOut) }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Metadata Section -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6" v-if="filing.createdAt">
        <q-card flat bordered class="info-card">
          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-icon name="o_edit_calendar" size="20px" color="grey-7" />
              <div class="text-caption text-grey-7">Filed On</div>
            </div>
            <div class="text-body2 text-grey-9 q-mt-xs">{{ formatDateTime(filing.createdAt) }}</div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12 col-sm-6" v-if="filing.approvedAt">
        <q-card flat bordered class="info-card">
          <q-card-section>
            <div class="row items-center q-gutter-sm">
              <q-icon name="o_check_circle" size="20px" color="grey-7" />
              <div class="text-caption text-grey-7">Processed On</div>
            </div>
            <div class="text-body2 text-grey-9 q-mt-xs">{{ formatDateTime(filing.approvedAt) }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Approver Information -->
    <div class="q-mb-lg" v-if="filing.approvedBy">
      <q-card flat bordered class="info-card">
        <q-card-section>
          <div class="row items-center q-gutter-sm">
            <q-icon name="o_supervisor_account" size="20px" color="grey-7" />
            <div class="text-caption text-grey-7">{{ getApproverLabel() }}</div>
          </div>
          <div class="text-body1 text-grey-9 q-mt-xs">
            {{ filing.approvedBy.firstName }} {{ filing.approvedBy.lastName }}
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Remarks Section -->
    <div v-if="filing.remarks" class="q-mb-lg">
      <q-card flat bordered class="remarks-card">
        <q-card-section>
          <div class="row items-center q-gutter-sm q-mb-sm">
            <q-icon name="o_description" size="20px" color="primary" />
            <div class="text-subtitle2 text-grey-8">Reason for Filing</div>
          </div>
          <div class="text-body2 text-grey-9" style="white-space: pre-wrap;">{{ filing.remarks }}</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Additional Details (if any) -->
    <div v-if="hasAdditionalDetails()" class="q-mb-lg">
      <q-card flat bordered class="info-card">
        <q-card-section>
          <div class="row items-center q-gutter-sm q-mb-sm">
            <q-icon name="o_info" size="20px" color="grey-7" />
            <div class="text-subtitle2 text-grey-8">Additional Information</div>
          </div>
          <div class="row q-col-gutter-sm">
            <div class="col-12" v-for="(value, key) in getAdditionalDetails()" :key="key">
              <div class="text-caption text-grey-7">{{ formatLabel(key) }}</div>
              <div class="text-body2 text-grey-9">{{ formatValue(value) }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Rejection Reason -->
    <div v-if="filing.rejectReason">
      <q-card flat class="rejection-card">
        <q-card-section>
          <div class="row items-center q-gutter-sm q-mb-sm">
            <q-icon name="o_cancel" size="20px" color="negative" />
            <div class="text-subtitle2 text-negative">Rejection Reason</div>
          </div>
          <div class="text-body2 text-grey-9" style="white-space: pre-wrap;">{{ filing.rejectReason }}</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Attachment -->
    <div class="q-mb-lg" v-if="filing.file || filing.fileId">
      <q-card flat bordered class="attachment-card" @click="viewAttachment()">
        <q-card-section>
          <div class="row items-center q-gutter-md">
            <q-icon name="o_attach_file" size="32px" color="primary" class="attachment-icon" />
            <div class="col">
              <div class="text-subtitle2">{{ filing.file?.name || filing.fileName || 'Attachment' }}</div>
              <div class="text-caption text-grey-6">Click to view</div>
            </div>
            <q-btn
              flat
              round
              icon="o_download"
              color="primary"
              @click.stop="downloadAttachment()"
              :loading="loadingFile"
            >
              <q-tooltip>Download</q-tooltip>
            </q-btn>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import './filing-display.scss';

.unified-filing-display {
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
  name: 'UnifiedFilingDisplay',
  props: {
    filing: {
      type: Object as PropType<FilingDisplayData>,
      required: true,
    },
  },
  setup(props) {
    const $q = useQuasar();
    const loadingFile = ref(false);

    const getFilingIcon = () => {
      const type = props.filing.filingType?.label?.toLowerCase() || '';
      if (type.includes('overtime')) return 'o_schedule';
      if (type.includes('leave')) return 'o_event_busy';
      if (type.includes('official') || type.includes('business')) return 'o_business';
      if (type.includes('certificate')) return 'o_card_membership';
      if (type.includes('schedule')) return 'o_event_note';
      return 'o_description';
    };

    const getFilingTitle = () => {
      return props.filing.filingType?.label || 'Filing Request';
    };

    const formatEmployeeName = () => {
      const firstName = props.filing.account?.firstName ? formatWord(props.filing.account.firstName) : '';
      const lastName = props.filing.account?.lastName ? formatWord(props.filing.account.lastName) : '';
      return `${firstName} ${lastName}`.trim() || 'N/A';
    };

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

    const getApproverLabel = () => {
      const key = getStatusKey();
      if (key === 'APPROVED') return 'Approved By';
      if (key === 'REJECTED') return 'Rejected By';
      return 'Processed By';
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

    const hasAdditionalDetails = () => {
      // Check for any additional fields that aren't already displayed
      const standardFields = ['id', 'status', 'filingType', 'account', 'accountId', 'date', 'hours', 
                             'timeIn', 'timeOut', 'remarks', 'rejectReason', 'createdAt', 'approvedAt', 
                             'approvedBy', 'file', 'fileId', 'fileName'];
      
      return Object.keys(props.filing).some(key => !standardFields.includes(key) && props.filing[key as keyof FilingDisplayData]);
    };

    const getAdditionalDetails = () => {
      const standardFields = ['id', 'status', 'filingType', 'account', 'accountId', 'date', 'hours', 
                             'timeIn', 'timeOut', 'remarks', 'rejectReason', 'createdAt', 'approvedAt', 
                             'approvedBy', 'file', 'fileId', 'fileName'];
      
      const additional: Record<string, any> = {};
      Object.keys(props.filing).forEach(key => {
        if (!standardFields.includes(key) && props.filing[key as keyof FilingDisplayData]) {
          additional[key] = props.filing[key as keyof FilingDisplayData];
        }
      });
      return additional;
    };

    const formatLabel = (key: string) => {
      // Convert camelCase to Title Case
      return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    const formatValue = (value: any) => {
      if (value === null || value === undefined) return 'N/A';
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (value instanceof Date) return formatDate(value);
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
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
      loadingFile,
      getFilingIcon,
      getFilingTitle,
      formatEmployeeName,
      getStatusKey,
      getStatusLabel,
      getStatusColor,
      getStatusTextColor,
      getApproverLabel,
      formatDate,
      formatTime,
      formatDateTime,
      formatWord,
      hasAdditionalDetails,
      getAdditionalDetails,
      formatLabel,
      formatValue,
      viewAttachment,
      downloadAttachment,
    };
  },
});
</script>
<template>
  <q-dialog 
    :modelValue="modelValue" 
    @update:modelValue="$emit('update:modelValue', $event)"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="bg-black column no-wrap full-height">
      <q-bar class="bg-black text-white">
        <q-space />
        <q-btn 
          dense 
          flat 
          :icon="showDetails ? 'image' : 'info'" 
          @click="showDetails = !showDetails"
        >
          <q-tooltip>{{ showDetails ? 'View Image' : 'View Details' }}</q-tooltip>
        </q-btn>
        <q-btn dense flat icon="download" @click="downloadImage">
          <q-tooltip>Download</q-tooltip>
        </q-btn>
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Close</q-tooltip>
        </q-btn>
      </q-bar>
      
      <!-- Image View -->
      <div v-if="!showDetails" class="col row justify-center items-center overflow-hidden">
        <q-img
          :src="attachmentUrl"
          fit="contain"
          style="max-height: 100%; max-width: 100%;"
        />
      </div>
      
      <!-- Details View -->
      <div v-else class="col overflow-auto bg-grey-10 q-pa-md">
        <div class="details-container">
          <!-- Receipt Information -->
          <div class="detail-section">
            <div class="section-title text-white q-mb-sm">
              <q-icon name="receipt" class="q-mr-sm" />
              Receipt Information
            </div>
            <div class="detail-row">
              <span class="detail-label">Receipt Number:</span>
              <span class="detail-value">{{ liquidationData.receiptNumber || '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Receipt Date:</span>
              <span class="detail-value">{{ formatDate(liquidationData.receiptDate) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount:</span>
              <span class="detail-value text-primary text-weight-bold">{{ formatAmount(liquidationData.amount) }}</span>
            </div>
            <div class="detail-row" v-if="liquidationData.expenseCategory">
              <span class="detail-label">Category:</span>
              <span class="detail-value">{{ liquidationData.expenseCategory }}</span>
            </div>
          </div>

          <!-- Vendor Information -->
          <div class="detail-section q-mt-md">
            <div class="section-title text-white q-mb-sm">
              <q-icon name="store" class="q-mr-sm" />
              Vendor Information
            </div>
            <div class="detail-row">
              <span class="detail-label">Vendor Name:</span>
              <span class="detail-value">{{ liquidationData.vendorName || '-' }}</span>
            </div>
            <div class="detail-row" v-if="liquidationData.vendorTin">
              <span class="detail-label">TIN:</span>
              <span class="detail-value">{{ liquidationData.vendorTin }}</span>
            </div>
            <div class="detail-row" v-if="liquidationData.vendorAddress">
              <span class="detail-label">Address:</span>
              <span class="detail-value">{{ liquidationData.vendorAddress }}</span>
            </div>
          </div>

          <!-- Business Purpose -->
          <div class="detail-section q-mt-md" v-if="liquidationData.businessPurpose || liquidationData.description">
            <div class="section-title text-white q-mb-sm">
              <q-icon name="description" class="q-mr-sm" />
              Purpose & Description
            </div>
            <div class="detail-row" v-if="liquidationData.businessPurpose">
              <span class="detail-label">Business Purpose:</span>
              <span class="detail-value">{{ liquidationData.businessPurpose }}</span>
            </div>
            <div class="detail-row" v-if="liquidationData.description">
              <span class="detail-label">Description:</span>
              <span class="detail-value">{{ liquidationData.description }}</span>
            </div>
          </div>

          <!-- Requester Information -->
          <div class="detail-section q-mt-md" v-if="liquidationData.requestedBy">
            <div class="section-title text-white q-mb-sm">
              <q-icon name="person" class="q-mr-sm" />
              Requested By
            </div>
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">{{ formatName(liquidationData.requestedBy) }}</span>
            </div>
            <div class="detail-row" v-if="liquidationData.requestedBy.email">
              <span class="detail-label">Email:</span>
              <span class="detail-value">{{ liquidationData.requestedBy.email }}</span>
            </div>
          </div>

          <!-- Status Information -->
          <div class="detail-section q-mt-md">
            <div class="section-title text-white q-mb-sm">
              <q-icon name="info" class="q-mr-sm" />
              Status & Metadata
            </div>
            <div class="detail-row" v-if="liquidationData.isAiExtracted">
              <span class="detail-label">AI Extracted:</span>
              <q-chip color="blue" text-color="white" size="sm" dense class="q-ml-sm">
                <q-icon name="smart_toy" size="xs" class="q-mr-xs" />
                Yes
              </q-chip>
            </div>
            <div class="detail-row" v-if="liquidationData.createdAt">
              <span class="detail-label">Created:</span>
              <span class="detail-value">{{ formatDate(liquidationData.createdAt) }}</span>
            </div>
            <div class="detail-row" v-if="liquidationData.status">
              <span class="detail-label">Status:</span>
              <span class="detail-value">{{ liquidationData.status.text || 'Pending' }}</span>
            </div>
          </div>

          <!-- File Information -->
          <div class="detail-section q-mt-md" v-if="liquidationData.attachmentProof">
            <div class="section-title text-white q-mb-sm">
              <q-icon name="attach_file" class="q-mr-sm" />
              Attachment Details
            </div>
            <div class="detail-row">
              <span class="detail-label">File Name:</span>
              <span class="detail-value">{{ liquidationData.attachmentProof.originalName || liquidationData.attachmentProof.name || 'Receipt' }}</span>
            </div>
            <div class="detail-row" v-if="liquidationData.attachmentProof.size">
              <span class="detail-label">Size:</span>
              <span class="detail-value">{{ formatFileSize(liquidationData.attachmentProof.size) }}</span>
            </div>
          </div>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script>
export default {
  name: 'ReceiptImageViewerDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    liquidationData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      showDetails: false
    };
  },
  computed: {
    attachmentUrl() {
      return this.liquidationData?.attachmentProof?.url || '';
    }
  },
  watch: {
    modelValue(newVal) {
      if (!newVal) {
        // Reset to image view when dialog closes
        this.showDetails = false;
      }
    }
  },
  methods: {
    downloadImage() {
      if (this.attachmentUrl) {
        window.open(this.attachmentUrl, '_blank');
      }
    },
    formatDate(dateObj) {
      if (!dateObj) return '-';
      if (dateObj.dateTime) return dateObj.dateTime;
      if (dateObj.date) return dateObj.date;
      return dateObj;
    },
    formatAmount(amountObj) {
      if (!amountObj) return '-';
      if (amountObj.formatCurrency) return amountObj.formatCurrency;
      return `₱${Number(amountObj).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    formatName(person) {
      if (!person) return '-';
      return `${person.firstName || ''} ${person.lastName || ''}`.trim() || '-';
    },
    formatFileSize(bytes) {
      if (!bytes) return '-';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  }
};
</script>

<style scoped>
.full-height {
  height: 100vh;
}

.details-container {
  max-width: 800px;
  margin: 0 auto;
}

.detail-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  color: #e0e0e0;
}

.detail-label {
  font-weight: 500;
  color: #9e9e9e;
  min-width: 150px;
  margin-right: 16px;
}

.detail-value {
  flex: 1;
  color: #ffffff;
}

/* Smooth transition between views */
.col {
  transition: opacity 0.3s ease;
}
</style>
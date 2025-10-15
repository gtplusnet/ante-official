<template>
  <div class="bir-form-2316-pdf">
    <!-- Control buttons -->
    <div class="form-controls q-pa-md">
      <div class="row items-center">
        <div class="text-title-medium text-dark">BIR Form 2316 - Certificate of Compensation Payment/Tax Withheld</div>
        <q-space />
        <GButton
          round
          icon="print"
          size="md"
          dense
          variant="tonal"
          icon-size="md"
          @click="printPDF"
          class="q-mr-sm"
        >
          <q-tooltip class="text-body-small">Print</q-tooltip>
        </GButton>

        <GButton
          round
          icon="table_view"
          size="md"
          dense
          variant="tonal"
          icon-size="md"
          @click="downloadPDF"
        >
          <q-tooltip class="text-body-small">Export to pdf</q-tooltip>
        </GButton>
      </div>
    </div>

    <q-separator />

    <!-- PDF Preview Section -->
    <div class="pdf-preview-section">
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-dots size="40px" color="primary" />
        <div class="text-body2 q-mt-md">Generating BIR Form 2316...</div>
      </div>

      <div v-else-if="pdfUrl" class="pdf-container">
        <iframe
          :src="pdfUrl"
          width="100%"
          height="800"
          type="application/pdf"
          frameborder="0"
          class="pdf-iframe"
        />
      </div>

      <div v-else class="text-center q-pa-xl">
        <q-icon name="o_description" size="64px" color="on-surface-variant" />
        <div class="text-h6 q-mt-md">BIR Form 2316</div>
        <div class="text-body2 text-on-surface-variant">
          Click "View PDF" to generate and display the filled BIR Form 2316
        </div>
      </div>
    </div>

    <!-- Information Panel -->
    <div class="info-panel q-pa-md q-mt-md surface-variant rounded-borders">
      <div class="text-subtitle2 text-weight-medium q-mb-sm">Form Information</div>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <div class="text-caption text-on-surface-variant">Employee</div>
          <div class="text-body2">{{ data.employeeName }}</div>
        </div>
        <div class="col-12 col-md-4">
          <div class="text-caption text-on-surface-variant">TIN</div>
          <div class="text-body2">{{ formatTIN(data.tin) }}</div>
        </div>
        <div class="col-12 col-md-4">
          <div class="text-caption text-on-surface-variant">Year Covered</div>
          <div class="text-body2">{{ data.yearCovered }}</div>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mt-xs">
        <div class="col-12 col-md-4">
          <div class="text-caption text-on-surface-variant">Gross Compensation</div>
          <div class="text-body2 text-weight-medium">{{ formatCurrency(data.incomeSummary.grossCompensationIncome) }}</div>
        </div>
        <div class="col-12 col-md-4">
          <div class="text-caption text-on-surface-variant">Tax Withheld</div>
          <div class="text-body2 text-weight-medium">{{ formatCurrency(data.taxComputation.taxWithheldJanDec) }}</div>
        </div>
        <div class="col-12 col-md-4">
          <div class="text-caption text-on-surface-variant">Tax Due/Refundable</div>
          <div class="text-body2 text-weight-medium"
               :class="data.taxComputation.taxPayableRefundable >= 0 ? 'text-negative' : 'text-positive'">
            {{ data.taxComputation.taxPayableRefundable >= 0 ? '' : '(' }}{{ formatCurrency(Math.abs(data.taxComputation.taxPayableRefundable)) }}{{ data.taxComputation.taxPayableRefundable >= 0 ? '' : ')' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import GButton from 'src/components/shared/buttons/GButton.vue';
import { BIRForm2316Service } from '../../../../../utils/birForm2316Service';
import type { AnnualizationData } from '../AnnualizationReport.vue';

interface Props {
  data: AnnualizationData;
}

const props = defineProps<Props>();
const $q = useQuasar();

const loading = ref(false);
const pdfBytes = ref<Uint8Array | null>(null);
const pdfUrl = ref<string | null>(null);

const formatTIN = (tin: string) => {
  if (tin && tin.length === 12) {
    return `${tin.substr(0, 3)}-${tin.substr(3, 3)}-${tin.substr(6, 3)}-${tin.substr(9, 3)}`;
  }
  return tin;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const generatePDF = async () => {
  loading.value = true;
  try {
    // Generate the filled PDF
    const bytes = await BIRForm2316Service.fillForm(props.data);
    pdfBytes.value = bytes;

    // Create blob URL for display
    const blob = new Blob([bytes], { type: 'application/pdf' });
    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
    }
    pdfUrl.value = URL.createObjectURL(blob);

    return bytes;
  } catch (error) {
    console.error('Error generating PDF:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to generate BIR Form 2316',
      position: 'top'
    });
    throw error;
  } finally {
    loading.value = false;
  }
};


const downloadPDF = async () => {
  loading.value = true;
  try {
    let bytes = pdfBytes.value;
    if (!bytes) {
      bytes = await generatePDF();
    }

    const filename = `BIR-Form-2316-${props.data.employeeName.replace(/\s+/g, '-')}-${props.data.yearCovered}.pdf`;
    BIRForm2316Service.downloadPDF(bytes, filename);

    $q.notify({
      type: 'positive',
      message: 'BIR Form 2316 downloaded successfully',
      position: 'top'
    });
  } catch (error) {
    console.error('Error downloading PDF:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to download PDF',
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
};

const printPDF = async () => {
  loading.value = true;
  try {
    let bytes = pdfBytes.value;
    if (!bytes) {
      bytes = await generatePDF();
    }

    // Open in new tab for printing
    BIRForm2316Service.displayPDF(bytes);

    $q.notify({
      type: 'info',
      message: 'Opening print dialog in new tab',
      position: 'top'
    });
  } catch (error) {
    console.error('Error printing PDF:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to print PDF',
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
};

// Clean up blob URL when component unmounts
onUnmounted(() => {
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
  }
});

// Auto-generate on mount
onMounted(() => {
  // Auto-generate PDF on component mount
  generatePDF();
});
</script>

<style scoped lang="scss">
.bir-form-2316-pdf {
  width: 100%;
}

.form-controls {
  background-color: var(--q-surface);
  border-bottom: 1px solid var(--q-border);
}

.pdf-preview-section {
  min-height: 400px;
  background-color: var(--q-surface);
}

.pdf-container {
  padding: 20px;
  background-color: #f5f5f5;
}

.pdf-iframe {
  border: 1px solid var(--q-border);
  border-radius: 4px;
  background-color: white;
}

.info-panel {
  background-color: var(--q-surface-variant, #F2F2F7);
  border: 1px solid var(--q-border);
}

.surface-variant {
  background-color: var(--q-surface-variant, #F2F2F7);
}

.rounded-borders {
  border-radius: 8px;
}

@media (max-width: $breakpoint-sm-max) {
  .pdf-container {
    padding: 10px;
  }

  .pdf-iframe {
    height: 600px;
  }
}

@media print {
  .form-controls,
  .info-panel {
    display: none !important;
  }
}
</style>
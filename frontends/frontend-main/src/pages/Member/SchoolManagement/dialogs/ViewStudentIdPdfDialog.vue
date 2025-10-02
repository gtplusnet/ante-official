<template>
  <q-dialog v-model="model" persistent>
    <template-dialog max-width="800px" icon="o_picture_as_pdf" icon-color="primary" :scrollable="false">
      <template #DialogTitle>Student ID Card PDF Preview</template>

      <template #DialogContent>
        <div class="pdf-preview-container">
          <div v-if="isLoading" class="flex flex-center q-pa-xl">
            <q-spinner-dots size="50px" color="primary" />
            <div class="q-ml-md text-h6">Generating PDF...</div>
          </div>

          <div v-else-if="pdfDataUrl" class="pdf-viewer">
            <iframe
              :src="pdfDataUrl"
              type="application/pdf"
              class="pdf-iframe"
              frameborder="0"
            ></iframe>
          </div>

          <div v-else class="flex flex-center q-pa-xl">
            <q-icon name="error" size="50px" color="negative" />
            <div class="q-ml-md text-h6">Failed to generate PDF</div>
          </div>
        </div>
      </template>

      <template #DialogSubmitActions>
        <g-button
          @click="close"
          label="Close"
          variant="outline"
          color="primary"
          v-close-popup
        />
        <g-button
          v-if="pdfDataUrl"
          @click="handlePrint"
          label="Print"
          icon="print"
          variant="outline"
          color="primary"
        />
        <g-button
          v-if="pdfDataUrl"
          @click="handleDownload"
          label="Download"
          icon="download"
          variant="filled"
          color="primary"
        />
      </template>
    </template-dialog>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, computed, watch } from "vue";
import TemplateDialog from "src/components/dialog/TemplateDialog.vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import type { StudentResponse } from "@shared/response";

export default defineComponent({
  name: "ViewStudentIdPdfDialog",
  components: {
    TemplateDialog,
    GButton,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    pdfDataUrl: {
      type: String,
      default: '',
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    studentData: {
      type: Object as () => StudentResponse | null,
      default: null,
    },
  },
  emits: ["update:modelValue", "close", "download", "print"],
  setup(props, { emit }) {
    const model = computed({
      get: () => props.modelValue,
      set: (value: boolean) => emit("update:modelValue", value),
    });

    const close = () => {
      emit("close");
    };

    const handleDownload = () => {
      if (props.pdfDataUrl && props.studentData) {
        emit("download", props.pdfDataUrl, props.studentData);
      }
    };

    const handlePrint = () => {
      if (props.pdfDataUrl) {
        emit("print", props.pdfDataUrl);
      }
    };

    // Auto-close dialog if there's an error (no PDF and not loading)
    watch(() => [props.pdfDataUrl, props.isLoading], ([pdfUrl, loading]) => {
      if (!loading && !pdfUrl && props.modelValue) {
        // Auto-close after 3 seconds if there's an error
        setTimeout(() => {
          if (!props.pdfDataUrl && !props.isLoading) {
            close();
          }
        }, 3000);
      }
    });

    return {
      model,
      close,
      handleDownload,
      handlePrint,
    };
  },
});
</script>

<style lang="scss" scoped>
.pdf-preview-container {
  width: 100%;
  height: 70vh;
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

.pdf-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: 1px solid var(--md3-outline-variant);
  border-radius: 8px;
  background: #f5f5f5;
}

// Responsive adjustments
@media (max-width: 600px) {
  .pdf-preview-container {
    height: 60vh;
    min-height: 400px;
  }
}
</style>
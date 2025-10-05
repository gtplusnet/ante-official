<template>
  <q-dialog v-model="model" persistent>
    <template-dialog max-width="1000px" icon="o_school" icon-color="primary">
      <template #DialogTitle>Student ID</template>

      <template #DialogContent>
        <div class="student-id-content">
          <student-id-card
            v-if="studentData?.data"
            ref="studentIdCardRef"
            :student-data="studentData.data"
            class="student-id-card"
          />
        </div>
      </template>

      <template #DialogSubmitActions>
        <g-button @click="close" label="Close" variant="outline" color="primary" v-close-popup />
    </template>
    </template-dialog>
  </q-dialog>

  <!-- PDF Preview Dialog -->
  <ViewStudentIdPdfDialog
    v-model="showPdfDialog"
    :pdf-data-url="pdfDataUrl"
    :is-loading="isGeneratingPdf"
    :student-data="studentData?.data || null"
    @close="closePdfDialog"
    @download="handlePdfDownload"
    @print="handlePdfPrint"
  />
</template>

<script lang="ts">
import { defineComponent, computed, ref, defineAsyncComponent } from "vue";
import GButton from "src/components/shared/buttons/GButton.vue";
import StudentIdCard from "./StudentIdCard.vue";
import { useStudentIdPdf } from "src/composables/useStudentIdPdf";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);
import type { StudentResponse } from "@shared/response";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ViewStudentIdPdfDialog = defineAsyncComponent(() =>
  import("./ViewStudentIdPdfDialog.vue")
);

export default defineComponent({
  name: "ViewStudentIdDialog",
  components: {
    TemplateDialog,
    GButton,
    ViewStudentIdPdfDialog,
    StudentIdCard,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    studentData: {
      type: Object as () => { data: StudentResponse } | null,
      default: null,
    },
  },
  emits: ["update:modelValue", "close", "edit"],
  setup(props, { emit }) {
    const model = computed({
      get: () => props.modelValue,
      set: (value: boolean) => emit("update:modelValue", value),
    });

    // PDF generation
    const { isGenerating: isGeneratingPdf, pdfDataUrl, downloadPdf, printPdf } = useStudentIdPdf();
    const studentIdCardRef = ref<any>();
    const showPdfDialog = ref(false);

    const close = () => {
      emit("close");
    };

    const editStudent = () => {
      if (props.studentData) {
        emit("edit", props.studentData);
      }
    };

    const handlePdfDownload = (pdfDataUri: string, studentData: StudentResponse) => {
      downloadPdf(pdfDataUri, studentData);
      showPdfDialog.value = false;
    };

    const handlePdfPrint = (pdfDataUri: string) => {
      printPdf(pdfDataUri);
    };

    const closePdfDialog = () => {
      showPdfDialog.value = false;
    };

    return {
      model,
      close,
      editStudent,
      // PDF generation
      studentIdCardRef,
      isGeneratingPdf,
      pdfDataUrl,
      showPdfDialog,
      handlePdfDownload,
      handlePdfPrint,
      closePdfDialog,
    };
  },
});
</script>

<style lang="scss" src="./ViewStudentIdDialog.scss" scoped></style>

<template>
  <expanded-nav-page-container>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="text-title-large">Time Importation</div>
          <div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Manpower" :to="{ name: 'member_manpower' }" />
              <q-breadcrumbs-el label="Timekeeping Logs" />
              <q-breadcrumbs-el label="Time Importation" />
            </q-breadcrumbs>
          </div>
        </div>
      </div>
    </div>
    <!-- Import Method Selection -->
    <div v-if="!selectedImportMethod" class="flex justify-center q-pa-lg">
      <div style="max-width: 800px; width: 100%;">
        <ImportMethodSelector @method-selected="onMethodSelected" />
      </div>
    </div>

    <!-- File Upload Section -->
    <div v-else class="flex justify-center items-center q-pa-lg">
      <!-- Back button -->
      <div class="full-width q-mb-md" v-if="!imageTableData.length">
        <q-btn
          flat
          icon="arrow_back"
          label="Back to method selection"
          class="text-label-large"
          @click="resetToMethodSelection"
        />
      </div>

      <div v-if="!imageTableData.length" class="image-upload-zone column items-center q-pa-lg bg-grey-2 rounded-borders shadow-1 full-width"
           @dragover.prevent="isDragging = true"
           @dragleave.prevent="isDragging = false"
           @drop.prevent="onDrop"
           :class="{ 'dragging': isDragging }"
           style="min-width: 350px; min-height: 220px; width: 100%;">
        <q-icon name="cloud_upload" size="48px" color="grey-6" />
        <div class="text-grey-7 q-mt-sm text-label-large">Drag & drop files here or click to select</div>
        <div class="text-grey-6 q-mt-xs text-body-small">{{ getCurrentMethodFormatText() }}</div>
        <q-file
          v-model="images"
          multiple
          :accept="getCurrentMethodAcceptedFormats()"
          @update:model-value="onFilesAdded"
          style="display: none"
          ref="fileInput"
        />
        <q-btn flat color="primary" label="Choose Files" class="q-mt-md text-label-large" @click="openFileDialog" />
      </div>
      <div v-else class="full-width column q-pa-lg">
        <q-table
          class="full-width"
          :rows="imageTableData"
          :columns="tableColumns"
          row-key="id"
          flat
          bordered
          no-data-label="No images selected"
          :pagination="{ rowsPerPage: 0 }"
          :hide-bottom="true"
        >
          <template v-slot:body-cell-thumbnail="props">
            <q-td :props="props">
              <q-img
                v-if="props.row.fileType === 'image'"
                :src="props.row.url"
                :alt="props.row.name"
                style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;"
              />
              <q-icon
                v-else
                :name="getFileIcon(props.row.fileType)"
                size="48px"
                :color="getFileIconColor(props.row.fileType)"
              />
            </q-td>
          </template>
          <template v-slot:body-cell-name="props">
            <q-td :props="props">
              <span :title="props.row.name">
                {{ props.row.name.length > 10 ? props.row.name.slice(0, 10) + '...' : props.row.name }}
              </span>
            </q-td>
          </template>
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip
                :color="getStatusColor(props.row.status)"
                text-color="white"
                :label="props.row.status"
                size="sm"
              />
            </q-td>
          </template>
          <template v-slot:body-cell-remarks="props">
            <q-td :props="props">
              <q-input
                v-model="props.row.remarks"
                type="textarea"
                dense
                filled
                autogrow
                placeholder="Enter remarks..."
                style="width: 250px;"
              />
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                color="negative"
                icon="delete"
                size="sm"
                @click="removeImage(props.row.id)"
              />
            </q-td>
          </template>
        </q-table>

        <!-- Single Logs Table Section: Show below the main table if any logs exist -->
        <div class="q-mt-xl">
          <div class="text-title-medium q-mb-sm">Extracted Logs</div>

          <!-- Validation Errors Banner -->
          <q-banner
            v-if="validationErrors.length > 0"
            class="bg-red-1 text-red-9 q-mb-md"
            rounded
          >
            <template v-slot:avatar>
              <q-icon name="error" color="red" />
            </template>
            <div class="text-title-small">Employee Validation Errors</div>
            <div class="text-body-small">The following employee IDs were not found in the system:</div>
            <div class="q-mt-sm">
              <q-chip
                v-for="error in validationErrors"
                :key="error.employeeId"
                color="red"
                text-color="white"
                size="sm"
                class="q-mr-xs"
              >
                {{ error.employeeId }}
              </q-chip>
            </div>
          </q-banner>

          <q-table
            :rows="allLogs"
            :columns="logTableColumns"
            row-key="employeeId"
            dense
            flat
            bordered
            hide-bottom
            class="q-mb-lg"
            no-data-label="No logs yet"
            :pagination="{ rowsPerPage: 0 }"
            style="min-height: 120px;"
            :row-class="getLogRowClass"
          >
            <template v-slot:no-data>
              <div class="q-pa-md text-body-small text-center text-grey">No logs yet</div>
            </template>
            <template v-slot:body-cell-employeeId="props">
              <q-td :props="props">
                <div class="row items-center no-wrap">
                  <span>{{ props.row.employeeId }}</span>
                  <q-icon
                    v-if="props.row.isValid === false"
                    name="error"
                    color="red"
                    size="xs"
                    class="q-ml-xs"
                  >
                    <q-tooltip>{{ props.row.validationError }}</q-tooltip>
                  </q-icon>
                </div>
              </q-td>
            </template>
          </q-table>
        </div>

        <q-btn color="primary" label="Submit for Importation" class="q-mt-lg text-label-large" @click="submitForImportation" />
      </div>
    </div>
  </expanded-nav-page-container>

  <!-- Timekeeping Import History Dialog -->
  <TimekeepingImportHistoryDialog ref="timekeepingImportHistoryDialog" />
</template>

<script lang="ts">
import { defineAsyncComponent, ref, computed } from 'vue';
import ExpandedNavPageContainer from '../../../../components/shared/ExpandedNavPageContainer.vue';
import ImportMethodSelector from './components/ImportMethodSelector.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const TimekeepingImportHistoryDialog = defineAsyncComponent(() =>
  import('./dialogs/TimekeepingImportHistoryDialog.vue')
);
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';
import { handleAxiosError } from "../../../../utility/axios.error.handler";
import { ImportTimeFromImageGeminiLog, ValidationError } from '../../../../shared/response/import-time-from-image.response';
import { BiometricModel, BiometricModelInfo } from '../../../../shared/enums/biometric-model.enum';

export default {
  name: 'TimeImportationMenuPage',
  props: {},
  components: {
    ExpandedNavPageContainer,
    ImportMethodSelector,
    TimekeepingImportHistoryDialog,
  },
  setup() {
    const images = ref<File[]>([]);
    const imageTableData = ref<Array<{id: number, file: File, name: string, url: string, status: string, remarks?: string, logs?: ImportTimeFromImageGeminiLog[], fileType?: string}>>([]);
    const isDragging = ref(false);
    const fileInput = ref();
    const $q = useQuasar();
    const selectedImportMethod = ref<BiometricModel | null>(null);
    const validationErrors = ref<ValidationError[]>([]);
    const timekeepingImportHistoryDialog = ref();

    const tableColumns = [
      {
        name: 'thumbnail',
        label: 'Preview',
        field: 'thumbnail',
        align: 'left' as const,
        style: 'width: 80px'
      },
      {
        name: 'name',
        label: 'File Name',
        field: 'name',
        align: 'left' as const
      },
      {
        name: 'status',
        label: 'Status',
        field: 'status',
        align: 'center' as const,
        style: 'width: 120px'
      },
      {
        name: 'remarks',
        label: 'Remarks',
        field: 'remarks',
        align: 'left' as const,
        style: 'width: 200px; max-width: 220px; min-width: 180px;'
      },
      {
        name: 'actions',
        label: 'Actions',
        field: 'actions',
        align: 'center' as const,
        style: 'width: 150px'
      }
    ];

    const logTableColumns = [
      { name: 'employeeId', label: 'Employee ID', field: 'employeeId', align: 'left' as const },
      { name: 'timeIn', label: 'Time In', field: 'timeIn', align: 'left' as const, format: (val: string) => val ? new Date(val).toLocaleString() : '' },
      { name: 'timeOut', label: 'Time Out', field: 'timeOut', align: 'left' as const, format: (val: string) => val ? new Date(val).toLocaleString() : '' },
      { name: 'remarks', label: 'Remarks', field: 'remarks', align: 'left' as const },
    ];

    function onFilesAdded(files: File[] = []) {
      // Only add files that are not already in imageTableData
      const existingNames = new Set(imageTableData.value.map(item => item.name));
      files.forEach((file: File) => {
        if (!existingNames.has(file.name)) {
          const id = Date.now() + Math.random();
          const fileType = getFileType(file);
          imageTableData.value.push({
            id,
            file,
            name: file.name,
            url: fileType === 'image' ? URL.createObjectURL(file) : '',
            status: 'Pending',
            remarks: '',
            fileType
          });
        }
      });
      images.value = files;
    }

    function onDrop(e: DragEvent) {
      isDragging.value = false;
      const droppedFiles = Array.from(e.dataTransfer?.files || []).filter((f: File) => {
        return isFileAccepted(f);
      });
      if (droppedFiles.length) {
        onFilesAdded(droppedFiles);
      }
    }

    function isFileAccepted(file: File): boolean {
      const type = file.type.toLowerCase();
      const name = file.name.toLowerCase();

      if (selectedImportMethod.value === BiometricModel.ZKTECO_AVIGNON) {
        // Only accept Excel files for ZKTeco
        return type.includes('excel') ||
               type.includes('spreadsheet') ||
               name.endsWith('.xlsx') ||
               name.endsWith('.xls');
      }

      // For AI Smart Import, accept all formats
      return type.startsWith('image/') ||
             type.includes('excel') ||
             type.includes('spreadsheet') ||
             name.endsWith('.xlsx') ||
             name.endsWith('.xls') ||
             type === 'text/csv' ||
             name.endsWith('.csv') ||
             type === 'application/pdf' ||
             name.endsWith('.pdf');
    }

    function getImageUrl(file: File) {
      return URL.createObjectURL(file);
    }

    function getStatusColor(status: string) {
      switch (status) {
        case 'Pending': return 'grey';
        case 'Processing': return 'orange';
        case 'Complete': return 'green';
        case 'Error': return 'red';
        default: return 'grey';
      }
    }

    function processImage(row: {id: number, file: File, name: string, url: string, status: string}) {
      row.status = 'Processing';
      // Simulate processing
      setTimeout(() => {
        row.status = Math.random() > 0.2 ? 'Complete' : 'Error';
      }, 2000);
    }

    function removeImage(id: number) {
      const index = imageTableData.value.findIndex(item => item.id === id);
      if (index > -1) {
        // Revoke the object URL to free memory if it's an image
        if (imageTableData.value[index].fileType === 'image') {
          URL.revokeObjectURL(imageTableData.value[index].url);
        }
        imageTableData.value.splice(index, 1);
        images.value.splice(index, 1);
      }
    }

    function openFileDialog() {
      if (fileInput.value && typeof fileInput.value.pickFiles === 'function') {
        fileInput.value.pickFiles();
      }
    }

    function submitForImportation() {
      // Check if there are any validation errors
      if (validationErrors.value.length > 0) {
        $q.dialog({
          title: 'Validation Error',
          message: 'Cannot submit for importation. Some employee IDs were not found in the system. Please fix the errors and try again.',
          persistent: true,
        });
        return;
      }

      // Check if all logs are valid
      const hasInvalidLogs = allLogs.value.some(log => log.isValid === false);
      if (hasInvalidLogs) {
        $q.dialog({
          title: 'Invalid Employee IDs',
          message: 'Cannot submit for importation. Some employee IDs are invalid. Please fix the errors and try again.',
          persistent: true,
        });
        return;
      }

      // Clear previous validation errors
      validationErrors.value = [];

      imageTableData.value.forEach((row) => {
        row.status = 'Processing';
        const reader = new FileReader();
        reader.onload = () => {
          const imageData = (reader.result as string).split(',')[1];
          const payload = {
            fileName: row.name,
            remarks: row.remarks || '',
            imageData,
            importMethod: selectedImportMethod.value || BiometricModel.AI_SMART,
          };
          api.post('/hr-time-importation/image', payload)
            .then((response) => {
              row.status = response.data.status || 'Complete';
              row.remarks = response.data.remarks || row.remarks;
              row.logs = response.data.logs || [];

              // Check for validation errors
              if (response.data.validationErrors && response.data.validationErrors.length > 0) {
                validationErrors.value = [...validationErrors.value, ...response.data.validationErrors];
                row.status = 'Validation Error';
              }
            })
            .catch((error) => {
              row.status = 'Error';
              handleAxiosError($q, error);
            });
        };
        reader.onerror = () => {
          row.status = 'Error';
          $q.dialog({
            title: 'Error',
            message: 'Failed to read file as base64',
            persistent: true,
          });
        };
        reader.readAsDataURL(row.file);
      });
    }

    const allLogs = computed(() => imageTableData.value.flatMap(row => row.logs || []));

    function getFileType(file: File): string {
      const type = file.type.toLowerCase();
      const name = file.name.toLowerCase();

      if (type.startsWith('image/')) return 'image';
      if (type.includes('excel') || type.includes('spreadsheet') || name.endsWith('.xlsx') || name.endsWith('.xls')) return 'excel';
      if (type === 'text/csv' || name.endsWith('.csv')) return 'csv';
      if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
      return 'unknown';
    }

    function getFileIcon(fileType: string): string {
      switch (fileType) {
        case 'excel': return 'description';
        case 'csv': return 'table_chart';
        case 'pdf': return 'picture_as_pdf';
        default: return 'insert_drive_file';
      }
    }

    function getFileIconColor(fileType: string): string {
      switch (fileType) {
        case 'excel': return 'green-7';
        case 'csv': return 'blue-7';
        case 'pdf': return 'red-7';
        default: return 'grey-7';
      }
    }

    function onMethodSelected(method: BiometricModel) {
      selectedImportMethod.value = method;
      
      // If DEFAULT_LOG is selected, show the import history dialog instead of file upload section
      if (method === BiometricModel.DEFAULT_LOG) {
        timekeepingImportHistoryDialog.value?.show();
        // Reset the selection to stay on method selection screen
        selectedImportMethod.value = null;
      }
    }

    function resetToMethodSelection() {
      selectedImportMethod.value = null;
      imageTableData.value = [];
      images.value = [];
    }

    function getCurrentMethodFormatText(): string {
      if (!selectedImportMethod.value) return '';
      return `Supported formats: ${BiometricModelInfo[selectedImportMethod.value].formatText}`;
    }

    function getCurrentMethodAcceptedFormats(): string {
      if (!selectedImportMethod.value) return '*';
      return BiometricModelInfo[selectedImportMethod.value].acceptedFormats;
    }

    function getLogRowClass(row: ImportTimeFromImageGeminiLog) {
      return row.isValid === false ? 'bg-red-1' : '';
    }

    return {
      images,
      imageTableData,
      isDragging,
      fileInput,
      tableColumns,
      logTableColumns,
      onFilesAdded,
      onDrop,
      getImageUrl,
      getStatusColor,
      processImage,
      removeImage,
      openFileDialog,
      submitForImportation,
      allLogs,
      getFileType,
      getFileIcon,
      getFileIconColor,
      selectedImportMethod,
      onMethodSelected,
      resetToMethodSelection,
      getCurrentMethodFormatText,
      getCurrentMethodAcceptedFormats,
      validationErrors,
      getLogRowClass,
      timekeepingImportHistoryDialog
    };
  },
};
</script>

<style scoped>
.image-upload-zone {
  border: 2px dashed #ccc;
  transition: border-color 0.3s, background 0.3s;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
}
.image-upload-zone.dragging {
  border-color: #1976d2;
  background: rgba(25, 118, 210, 0.08);
}
</style>

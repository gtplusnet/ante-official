<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card class="import-dialog md3-dialog-dense">
      <!-- Header -->
      <q-card-section class="dialog-header">
        <div class="text-h6">Import Calendar</div>
        <q-btn flat round dense icon="close" @click="handleClose" />
      </q-card-section>

      <q-separator />

      <!-- Content -->
      <q-card-section class="dialog-content">
        <!-- File Upload -->
        <div v-if="!selectedFile" class="upload-area" @click="triggerFileInput">
          <q-icon name="cloud_upload" size="48px" color="primary" />
          <div class="text-subtitle1 q-mt-md">Upload Calendar File</div>
          <div class="text-caption text-grey-6">Click to select .ics file or drag and drop</div>
          <input
            ref="fileInput"
            type="file"
            accept=".ics"
            hidden
            @change="handleFileSelect"
          />
        </div>

        <!-- File Selected -->
        <div v-else class="file-selected">
          <div class="file-info">
            <q-icon name="insert_drive_file" size="24px" color="primary" />
            <div class="file-details">
              <div class="file-name">{{ selectedFile.name }}</div>
              <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
            </div>
            <q-btn flat round dense icon="close" @click="clearFile" />
          </div>

          <!-- Validation Result -->
          <div v-if="validationResult" class="validation-result">
            <q-banner
              v-if="!validationResult.valid"
              class="text-white bg-negative"
              dense
            >
              <template v-slot:avatar>
                <q-icon name="error" />
              </template>
              <div class="text-subtitle2">Validation Failed</div>
              <ul class="q-pl-md q-mt-sm">
                <li v-for="(error, index) in validationResult.errors" :key="index">
                  {{ error }}
                </li>
              </ul>
            </q-banner>

            <q-banner
              v-else
              class="text-white bg-positive"
              dense
            >
              <template v-slot:avatar>
                <q-icon name="check_circle" />
              </template>
              <div class="text-subtitle2">
                Valid Calendar File
              </div>
              <div class="q-mt-xs">
                Found {{ validationResult.eventCount }} event(s)
              </div>
            </q-banner>
          </div>

          <!-- Event Preview -->
          <div v-if="validationResult?.valid && validationResult.preview.length > 0" class="event-preview">
            <div class="text-subtitle2 q-mb-sm">Preview (first 10 events)</div>
            <q-list bordered separator dense>
              <q-item v-for="(event, index) in validationResult.preview" :key="index">
                <q-item-section>
                  <q-item-label>{{ event.title }}</q-item-label>
                  <q-item-label caption>
                    {{ formatPreviewDate(event.startDate) }}
                    <span v-if="event.location"> • {{ event.location }}</span>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Import Options -->
          <div v-if="validationResult?.valid" class="import-options q-mt-md">
            <div class="text-subtitle2 q-mb-sm">Import Options</div>

            <!-- Skip Duplicates -->
            <q-checkbox
              v-model="importOptions.skipDuplicates"
              label="Skip duplicate events"
              dense
            />

            <!-- Category Selection -->
            <q-select
              v-model="importOptions.categoryId"
              :options="categoryOptions"
              label="Assign to category (optional)"
              outlined
              dense
              clearable
              class="q-mt-sm"
            />

            <!-- Visibility -->
            <q-select
              v-model="importOptions.defaultVisibility"
              :options="visibilityOptions"
              label="Default visibility"
              outlined
              dense
              class="q-mt-sm"
            />
          </div>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="right" class="dialog-actions">
        <q-btn flat label="Cancel" @click="handleClose" />
        <q-btn
          v-if="!selectedFile"
          unelevated
          color="primary"
          label="Select File"
          @click="triggerFileInput"
        />
        <q-btn
          v-else-if="!validationResult"
          unelevated
          color="primary"
          label="Validate"
          :loading="isValidating"
          @click="handleValidate"
        />
        <q-btn
          v-else-if="validationResult.valid"
          unelevated
          color="primary"
          label="Import"
          :loading="isImporting"
          @click="handleImport"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { date as qDate } from 'quasar';
import { useCalendarImport, type ImportOptions, type ValidationResult } from 'src/composables/calendar/useCalendarImport';
import { useCalendarCategories } from 'src/composables/calendar/useCalendarCategories';

// Props
interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'imported': [];
}>();

// Composables
const { isImporting, isValidating, validateIcsFile, importIcsFile } = useCalendarImport();
const { categories, loadCategories } = useCalendarCategories();

// State
const showDialog = ref(props.modelValue);
const fileInput = ref<HTMLInputElement>();
const selectedFile = ref<File | null>(null);
const validationResult = ref<ValidationResult | null>(null);

const importOptions = ref<ImportOptions>({
  skipDuplicates: true,
  categoryId: undefined,
  defaultVisibility: 'private',
});

// Category options
const categoryOptions = computed(() => {
  return categories.value.map(cat => ({
    label: cat.name,
    value: cat.id,
  }));
});

// Visibility options
const visibilityOptions = [
  { label: 'Private', value: 'private' },
  { label: 'Public', value: 'public' },
  { label: 'Company', value: 'company' },
];

// Methods
const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    selectedFile.value = file;
    validationResult.value = null;
  }
};

const clearFile = () => {
  selectedFile.value = null;
  validationResult.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const handleValidate = async () => {
  if (!selectedFile.value) return;

  try {
    const result = await validateIcsFile(selectedFile.value);
    validationResult.value = result;
  } catch (error) {
    console.error('Validation error:', error);
  }
};

const handleImport = async () => {
  if (!selectedFile.value || !validationResult.value?.valid) return;

  try {
    await importIcsFile(selectedFile.value, importOptions.value);
    emit('imported');
    handleClose();
  } catch (error) {
    console.error('Import error:', error);
  }
};

const handleClose = () => {
  clearFile();
  showDialog.value = false;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatPreviewDate = (date: Date | string | null): string => {
  if (!date) return 'No date';
  const d = typeof date === 'string' ? new Date(date) : date;
  return qDate.formatDate(d, 'MMM D, YYYY h:mm A');
};

// Watchers
watch(() => props.modelValue, (val) => {
  showDialog.value = val;
});

watch(showDialog, (val) => {
  emit('update:modelValue', val);
});

// Load categories on mount
onMounted(() => {
  loadCategories();
});
</script>

<style lang="scss" scoped>
.import-dialog {
  width: 100%;
  max-width: 600px;

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
  }

  .dialog-content {
    padding: 20px;
    min-height: 300px;

    .upload-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      border: 2px dashed rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(0, 0, 0, 0.02);
        border-color: rgba(0, 0, 0, 0.24);
      }
    }

    .file-selected {
      .file-info {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(0, 0, 0, 0.02);
        border-radius: 8px;

        .file-details {
          flex: 1;

          .file-name {
            font-weight: 500;
            color: rgba(0, 0, 0, 0.87);
          }

          .file-size {
            font-size: 0.75rem;
            color: rgba(0, 0, 0, 0.6);
            margin-top: 2px;
          }
        }
      }

      .validation-result {
        margin-top: 16px;

        .q-banner {
          border-radius: 8px;

          ul {
            margin: 0;
            padding-left: 20px;
            list-style-type: disc;
          }
        }
      }

      .event-preview {
        margin-top: 16px;

        .q-list {
          max-height: 300px;
          overflow-y: auto;
          border-radius: 8px;
        }
      }

      .import-options {
        padding: 16px;
        background: rgba(0, 0, 0, 0.02);
        border-radius: 8px;
      }
    }
  }

  .dialog-actions {
    padding: 12px 20px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
}

// Mobile responsiveness
@media (max-width: 768px) {
  .import-dialog {
    .dialog-content {
      padding: 16px;

      .upload-area {
        padding: 32px 16px;
      }
    }
  }
}
</style>

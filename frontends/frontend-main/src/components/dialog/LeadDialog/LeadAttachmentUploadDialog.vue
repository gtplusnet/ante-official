<template>
  <q-dialog ref="dialog" persistent>
    <TemplateDialog min-width="600px" max-width="800px">
      <template #DialogIcon>
        <q-icon name="attach_file" size="24px" />
      </template>
      <template #DialogTitle>
        <div>Upload Attachments</div>
      </template>
      <template #DialogContent>
        <section class="q-pa-md">
          <!-- Upload Zone -->
          <div
            class="upload-zone q-pa-lg flex flex-center column items-center"
            :class="{ 'drag-over': isDragOver, 'disabled': isUploading }"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onDrop"
            @click="triggerFileInput"
          >
            <q-icon
              :name="isUploading ? 'hourglass_empty' : 'cloud_upload'"
              size="4rem"
              :color="isDragOver ? 'primary' : 'grey-6'"
            />
            <div
              class="text-title-small q-mt-md"
              :class="isDragOver ? 'text-primary' : 'text-grey-7'"
            >
              {{
                isDragOver
                  ? 'Drop files here'
                  : 'Drag & drop files or click to browse'
              }}
            </div>
            <div class="text-body-small text-grey-6 q-mt-xs">
              Maximum file size: 10MB per file
            </div>
            <input
              type="file"
              ref="hiddenInput"
              multiple
              style="display: none"
              @change="onFileSelected"
              :disabled="isUploading"
            />
          </div>

          <!-- Selected Files List -->
          <div v-if="selectedFiles.length > 0" class="q-mt-md">
            <div class="text-title-small q-mb-sm">
              Selected Files ({{ selectedFiles.length }})
            </div>
            <q-list bordered separator class="rounded-borders">
              <q-item
                v-for="fileItem in selectedFiles"
                :key="fileItem.id"
                class="file-item"
              >
                <q-item-section avatar>
                  <q-icon name="description" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-label-large">{{
                    fileItem.name
                  }}</q-item-label>
                  <q-item-label caption>{{ fileItem.size }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    flat
                    dense
                    round
                    icon="close"
                    color="negative"
                    size="sm"
                    @click="removeFile(fileItem.id)"
                    :disable="isUploading"
                  >
                    <q-tooltip>Remove</q-tooltip>
                  </q-btn>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Upload Progress -->
          <div v-if="isUploading" class="q-mt-md text-center">
            <q-linear-progress
              :value="uploadProgress"
              color="primary"
              class="q-mb-sm"
            />
            <div class="text-body-medium text-grey-7">
              {{ uploadStatusText }}
            </div>
          </div>
        </section>
      </template>
      <template #DialogSubmitActions>
        <GButton
          variant="outline"
          color="primary"
          label="Cancel"
          @click="handleCancel"
          :disable="isUploading"
        />
        <GButton
          variant="filled"
          color="primary"
          label="Upload Files"
          icon="cloud_upload"
          :disable="selectedFiles.length === 0 || isUploading"
          :loading="isUploading"
          @click="uploadFiles"
        />
      </template>
    </TemplateDialog>
  </q-dialog>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { APIRequests } from 'src/utility/api.handler';
import GButton from 'src/components/shared/buttons/GButton.vue';

const TemplateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/TemplateDialog.vue')
);

export default {
  name: 'LeadAttachmentUploadDialog',
  components: {
    TemplateDialog,
    GButton,
  },
  props: {
    leadId: {
      type: Number,
      required: true,
    },
  },
  emits: ['uploaded', 'close'],
  data: () => ({
    selectedFiles: [],
    isDragOver: false,
    isUploading: false,
    uploadProgress: 0,
    uploadStatusText: '',
  }),
  methods: {
    show() {
      this.resetDialog();
      this.$refs.dialog.show();
    },

    hide() {
      if (!this.isUploading) {
        this.$refs.dialog.hide();
        this.$emit('close');
      }
    },

    resetDialog() {
      this.selectedFiles = [];
      this.isDragOver = false;
      this.isUploading = false;
      this.uploadProgress = 0;
      this.uploadStatusText = '';
    },

    onDragOver(e) {
      this.isDragOver = true;
    },

    onDragLeave(e) {
      this.isDragOver = false;
    },

    onDrop(e) {
      this.isDragOver = false;
      const files = e.dataTransfer.files;
      if (files && files.length) {
        this.addFiles(files);
      }
    },

    triggerFileInput() {
      if (!this.isUploading) {
        this.$refs.hiddenInput.click();
      }
    },

    onFileSelected(e) {
      const files = e.target.files;
      if (files && files.length) {
        this.addFiles(files);
      }
      // Clear the input so the same file can be selected again
      e.target.value = '';
    },

    addFiles(files) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const newFiles = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file size
        if (file.size > maxSize) {
          this.$q.notify({
            type: 'warning',
            message: `File "${file.name}" exceeds 10MB and was not added`,
            position: 'top',
          });
          continue;
        }

        // Check for duplicates
        const isDuplicate = this.selectedFiles.some(
          (f) => f.name === file.name && f.size === this.formatFileSize(file.size)
        );

        if (isDuplicate) {
          this.$q.notify({
            type: 'warning',
            message: `File "${file.name}" is already in the list`,
            position: 'top',
          });
          continue;
        }

        newFiles.push({
          id: `${Date.now()}-${i}`,
          file: file,
          name: file.name,
          size: this.formatFileSize(file.size),
        });
      }

      this.selectedFiles.push(...newFiles);

      if (newFiles.length > 0) {
        this.$q.notify({
          type: 'positive',
          message: `${newFiles.length} file(s) added`,
          position: 'top',
        });
      }
    },

    removeFile(fileId) {
      this.selectedFiles = this.selectedFiles.filter((f) => f.id !== fileId);
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    },

    async uploadFiles() {
      if (this.selectedFiles.length === 0) return;

      this.isUploading = true;
      this.uploadProgress = 0;

      const totalFiles = this.selectedFiles.length;
      let uploadedCount = 0;
      let failedCount = 0;
      const failedFiles = [];

      for (let i = 0; i < this.selectedFiles.length; i++) {
        const fileItem = this.selectedFiles[i];
        this.uploadStatusText = `Uploading ${i + 1} of ${totalFiles}: ${fileItem.name}`;

        try {
          await APIRequests.uploadLeadAttachment(
            this.$q,
            this.leadId.toString(),
            fileItem.file
          );
          uploadedCount++;
        } catch (error) {
          console.error('Failed to upload file:', fileItem.name, error);
          failedCount++;
          failedFiles.push(fileItem.name);
        }

        this.uploadProgress = (i + 1) / totalFiles;
      }

      this.isUploading = false;

      // Show summary notification
      if (failedCount === 0) {
        this.$q.notify({
          type: 'positive',
          message: `Successfully uploaded ${uploadedCount} file(s)`,
          icon: 'check_circle',
          position: 'top',
        });
      } else if (uploadedCount > 0) {
        this.$q.notify({
          type: 'warning',
          message: `Uploaded ${uploadedCount} file(s), ${failedCount} failed: ${failedFiles.join(', ')}`,
          position: 'top',
          timeout: 5000,
        });
      } else {
        this.$q.notify({
          type: 'negative',
          message: `Failed to upload all files`,
          icon: 'error',
          position: 'top',
        });
      }

      // Emit uploaded event to refresh the attachments list
      if (uploadedCount > 0) {
        this.$emit('uploaded');
      }

      // Close dialog if all files uploaded successfully
      if (failedCount === 0) {
        this.hide();
      } else {
        // Remove successfully uploaded files from the list
        this.selectedFiles = this.selectedFiles.filter((f) =>
          failedFiles.includes(f.name)
        );
      }
    },

    handleCancel() {
      if (this.selectedFiles.length > 0 && !this.isUploading) {
        this.$q
          .dialog({
            title: 'Discard Changes',
            message: 'Are you sure you want to cancel? All selected files will be discarded.',
            cancel: {
              label: 'No, Keep Files',
              color: 'grey',
            },
            ok: {
              label: 'Yes, Discard',
              color: 'negative',
            },
            persistent: true,
          })
          .onOk(() => {
            this.hide();
          });
      } else {
        this.hide();
      }
    },
  },
};
</script>

<style scoped>
.upload-zone {
  border: 2px dashed var(--q-grey-4);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 200px;
  background: var(--q-surface-container-lowest);
}

.upload-zone:hover:not(.disabled) {
  border-color: var(--q-primary);
  background: var(--q-primary-container);
}

.upload-zone.drag-over {
  border-color: var(--q-primary);
  background: var(--q-primary-container);
  border-width: 3px;
}

.upload-zone.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.file-item {
  transition: background-color 0.2s ease;
}

.file-item:hover {
  background: var(--q-surface-container-high);
}
</style>

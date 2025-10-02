<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
    <q-card style="min-width: 500px; max-width: 600px">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Media</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="close" />
      </q-card-section>

      <!-- Media Preview -->
      <q-card-section v-if="media" class="q-pt-md">
        <div class="media-preview-container">
          <div class="media-preview">
            <img v-if="media.type === 'image'" :src="media.thumbnail || media.url" :alt="media.name" />
            <div v-else class="file-type-icon">
              <q-icon :name="getFileIcon(media.type)" size="64px" color="grey-6" />
            </div>
          </div>
          <div class="media-info">
            <div class="info-row">
              <span class="info-label">Type:</span>
              <span class="info-value">{{ media.type.toUpperCase() }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Size:</span>
              <span class="info-value">{{ media.size }}</span>
            </div>
            <div v-if="media.dimensions" class="info-row">
              <span class="info-label">Dimensions:</span>
              <span class="info-value">{{ media.dimensions }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Uploaded:</span>
              <span class="info-value">{{ media.uploadedAt || 'Unknown' }}</span>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Edit Form -->
      <q-card-section v-if="media">
        <q-form @submit="saveChanges" class="q-gutter-md">
          <q-input
            v-model="editForm.name"
            label="File Name"
            outlined
            dense
            :rules="[val => !!val || 'File name is required']"
          >
            <template v-slot:prepend>
              <q-icon name="o_label" />
            </template>
          </q-input>

          <q-input
            v-model="editForm.altText"
            label="Alternative Text"
            outlined
            dense
            hint="Describe the image for accessibility"
          >
            <template v-slot:prepend>
              <q-icon name="o_alt_route" />
            </template>
          </q-input>

          <q-input
            v-model="editForm.caption"
            label="Caption"
            outlined
            dense
            type="textarea"
            rows="3"
            hint="Optional caption or description"
          >
            <template v-slot:prepend>
              <q-icon name="o_description" />
            </template>
          </q-input>

          <q-select
            v-model="editForm.folder"
            :options="availableFolders"
            label="Folder"
            outlined
            dense
            emit-value
            map-options
          >
            <template v-slot:prepend>
              <q-icon name="o_folder" />
            </template>
          </q-select>

          <q-input
            v-model="editForm.url"
            label="URL"
            outlined
            dense
            readonly
            @click="copyUrl"
          >
            <template v-slot:prepend>
              <q-icon name="o_link" />
            </template>
            <template v-slot:append>
              <q-btn
                flat
                round
                dense
                icon="o_content_copy"
                size="sm"
                @click.stop="copyUrl"
              >
                <q-tooltip>Copy URL</q-tooltip>
              </q-btn>
            </template>
          </q-input>
        </q-form>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="right" class="q-pt-none">
        <q-btn
          flat
          label="Delete"
          color="negative"
          icon="o_delete"
          @click="confirmDelete"
          class="q-mr-auto"
        />
        <q-btn flat label="Cancel" @click="close" />
        <q-btn
          unelevated
          label="Save Changes"
          color="primary"
          icon="o_save"
          @click="saveChanges"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, watch } from 'vue';
import { useQuasar } from 'quasar';

export interface MediaItem {
  id: number | string;
  name: string;
  type: string;
  size: string;
  url?: string;
  thumbnail?: string;
  altText?: string;
  caption?: string;
  folder: string;
  dimensions?: string | null;
  uploadedAt?: string;
  selected?: boolean;
}

export default defineComponent({
  name: 'EditMediaDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    media: {
      type: Object as PropType<MediaItem>,
      default: null,
    },
    folders: {
      type: Array as PropType<Array<{ id: number; name: string }>>,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'save', 'delete'],
  setup(props, { emit }) {
    const $q = useQuasar();
    
    const editForm = ref({
      name: '',
      altText: '',
      caption: '',
      folder: '',
      url: '',
    });

    const availableFolders = computed(() => [
      { label: 'Root', value: 'root' },
      ...props.folders.map(f => ({ label: f.name, value: f.name })),
    ]);

    // Watch for media changes
    watch(() => props.media, (newMedia) => {
      if (newMedia) {
        editForm.value = {
          name: newMedia.name || '',
          altText: newMedia.altText || '',
          caption: newMedia.caption || '',
          folder: newMedia.folder || 'root',
          url: newMedia.url || newMedia.thumbnail || '',
        };
      }
    }, { immediate: true });

    const getFileIcon = (type: string) => {
      const icons: Record<string, string> = {
        video: 'o_movie',
        document: 'o_description',
        pdf: 'o_picture_as_pdf',
        audio: 'o_audio_file',
        archive: 'o_folder_zip',
      };
      return icons[type] || 'o_insert_drive_file';
    };

    const close = () => {
      emit('update:modelValue', false);
    };

    const saveChanges = () => {
      if (!editForm.value.name) {
        $q.notify({
          type: 'warning',
          message: 'File name is required',
        });
        return;
      }

      const updatedMedia = {
        ...props.media,
        ...editForm.value,
      };

      emit('save', updatedMedia);
      close();
      
      $q.notify({
        type: 'positive',
        message: 'Media updated successfully',
      });
    };

    const confirmDelete = () => {
      $q.dialog({
        title: 'Delete Media',
        message: `Are you sure you want to delete "${props.media?.name}"? This action cannot be undone.`,
        cancel: true,
        persistent: true,
        ok: {
          label: 'Delete',
          color: 'negative',
        },
      }).onOk(() => {
        emit('delete', props.media);
        close();
        
        $q.notify({
          type: 'positive',
          message: 'Media deleted successfully',
        });
      });
    };

    const copyUrl = () => {
      if (editForm.value.url) {
        navigator.clipboard.writeText(editForm.value.url);
        $q.notify({
          type: 'positive',
          message: 'URL copied to clipboard',
          timeout: 1000,
        });
      }
    };

    return {
      editForm,
      availableFolders,
      getFileIcon,
      close,
      saveChanges,
      confirmDelete,
      copyUrl,
    };
  },
});
</script>

<style scoped lang="scss">
.media-preview-container {
  display: flex;
  gap: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;

  .media-preview {
    width: 120px;
    height: 120px;
    background: white;
    border: 1px solid #e8eaed;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .file-type-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
  }

  .media-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;

    .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;

      .info-label {
        color: #5f6368;
        min-width: 80px;
      }

      .info-value {
        color: #202124;
        font-weight: 500;
      }
    }
  }
}

.q-form {
  :deep(.q-field__prepend) {
    color: #5f6368;
  }
}
</style>
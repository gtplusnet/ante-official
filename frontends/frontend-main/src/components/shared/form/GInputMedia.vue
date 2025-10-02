<template>
  <div class="g-field">
    <div class="label text-label-large">{{ label }}</div>
    <div class="field">
      <!-- file upload -->
      <div class="file-upload q-mb-md">
        <input :accept="accept" class="hidden" ref="fileUpload" type="file" @change="fileUploadTrigger" />
        <div class="file-name">
          <a v-if="textProp && textProp.url" class="file-path" :href="textProp.url" target="_blank">{{ textProp.originalName || textProp.name || 'File' }}</a>
          <div v-else class="file-path text-grey-6 user-select-none text-body-medium">Select a file</div>
        </div>
        <div class="row q-gutter-sm">
          <q-btn flat @click="triggerUpload" class="button" color="accent" outline :loading="uploading">
            <q-icon size="16px" :name="textProp ? 'sync' : 'file_upload'"></q-icon>
            <q-tooltip class="text-label-small">{{ textProp ? 'Change file' : 'Upload file' }}</q-tooltip>
          </q-btn>
          <q-btn v-if="textProp" flat @click="removeFile" class="button" color="negative" outline>
            <q-icon size="16px" name="delete"></q-icon>
            <q-tooltip class="text-label-small">Remove file</q-tooltip>
          </q-btn>
        </div>
        
        <!-- Upload Progress -->
        <div v-if="uploading" class="upload-progress q-mt-sm">
          <q-linear-progress 
            :value="uploadProgress / 100" 
            size="4px" 
            color="primary" 
            stripe 
            animation-speed="1000" 
          />
          <div class="text-caption text-grey-6 q-mt-xs">Uploading... {{ Math.round(uploadProgress) }}%</div>
        </div>
      </div>
    </div>
    
    <!-- Hint text -->
    <div v-if="hint" class="text-caption text-grey-6 q-mt-xs">{{ hint }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { useMediaStore } from 'src/stores/media.store';
import { ModuleType } from 'src/types/media.types';

export default defineComponent({
  name: 'GInputMedia',
  props: {
    modelValue: {
      type: [Object, null],
      default: null,
    },
    label: {
      type: String,
      required: true,
    },
    accept: {
      type: String,
      default: 'image/*',
    },
    hint: {
      type: String,
      default: '',
    },
    module: {
      type: String,
      default: ModuleType.CMS,
      validator: (value: string) => Object.values(ModuleType).includes(value as ModuleType),
    },
    folderName: {
      type: String,
      default: '',
    },
    folderId: {
      type: Number,
      default: undefined,
    },
    alternativeText: {
      type: String,
      default: '',
    },
    caption: {
      type: String,
      default: '',
    },
    tags: {
      type: Array as () => string[],
      default: () => [],
    },
    rules: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const mediaStore = useMediaStore();
    const fileUpload = ref<HTMLInputElement>();
    const textProp = ref(props.modelValue);
    const uploading = ref(false);
    const uploadProgress = ref(0);

    // Watch for external changes to modelValue
    watch(() => props.modelValue, (newValue) => {
      textProp.value = newValue;
    });

    // Watch textProp and emit changes
    watch(textProp, (newValue) => {
      emit('update:modelValue', newValue);
    }, { deep: true });

    const triggerUpload = () => {
      fileUpload.value?.click();
    };

    const removeFile = () => {
      textProp.value = null;
      // Reset the file input
      if (fileUpload.value) {
        fileUpload.value.value = '';
      }
    };

    const fileUploadTrigger = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (!file) return;

      uploading.value = true;
      uploadProgress.value = 0;

      try {
        const uploadOptions = {
          module: props.module as ModuleType,
          folderId: props.folderId,
          folderName: props.folderName,
          alternativeText: props.alternativeText,
          caption: props.caption,
          tags: props.tags,
          processInBackground: false,
        };

        // Monitor upload progress
        const progressInterval = setInterval(() => {
          const progress = mediaStore.uploadProgress;
          if (progress.length > 0) {
            const latestProgress = progress[progress.length - 1];
            if (latestProgress.fileName === file.name) {
              uploadProgress.value = latestProgress.progress;
            }
          }
        }, 100);

        const result = await mediaStore.uploadMediaFile(file, uploadOptions);
        
        clearInterval(progressInterval);
        
        // The media store should return the uploaded file data
        textProp.value = result;
        
      } catch (error) {
        console.error('Media upload failed:', error);
        
        // Reset the file input
        if (fileUpload.value) {
          fileUpload.value.value = '';
        }
      } finally {
        uploading.value = false;
        uploadProgress.value = 0;
      }
    };


    return {
      fileUpload,
      textProp,
      uploading,
      uploadProgress,
      triggerUpload,
      removeFile,
      fileUploadTrigger,
    };
  },
});
</script>

<style scoped lang="scss">
// Import the base GInput styles to maintain consistency
@import './GInput.scss';

// Override specific styles for media upload functionality
.g-field {
  .file-upload {
    // Ensure the grid layout spans properly for progress
    .upload-progress {
      grid-column: 1 / -1; // Span across both columns
      margin-top: 8px;
    }
    
    // Remove the margin-bottom from file-name since it's inherited
    .file-name {
      margin-bottom: 0;
    }
  }
}

.hidden {
  display: none !important;
}
</style>
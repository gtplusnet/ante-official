<template>
  <div class="profile-picture-section">
    <!-- Header -->
    <div class="text-center q-mb-lg">
      <div class="md3-title-medium">Update Profile Photo</div>
      <div class="md3-subtitle-medium1">Click on your photo to change it</div>
    </div>
    
    <!-- Profile Photo Display -->
    <div class="column items-center q-gutter-y-md">
      <div 
        class="profile-photo-container cursor-pointer"
        :class="{ 'uploading': loading, 'drag-over': isDragOver }"
        role="button"
        tabindex="0"
        :aria-label="'Current profile picture. Click to change or drag and drop a new photo. Supported formats: JPG, PNG, GIF. Maximum size: 2MB'"
        @click="triggerFileInput"
        @keydown="onKeyDown"
        @dragenter="onDragEnter"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <q-avatar 
          size="180px" 
          class="profile-avatar q-elevation-4"
          role="img"
          :aria-label="currentImage ? 'Current profile picture' : 'No profile picture set'"
        >
          <img 
            v-if="currentImage" 
            :src="currentImage"
            alt="Current profile picture"
            class="fit"
          >
          <div v-else class="column items-center justify-center full-height bg-grey-2">
            <q-icon name="person" size="64px" color="grey-5" aria-hidden="true" />
            <div class="text-body-small text-grey-6 q-mt-sm">No photo</div>
          </div>
        </q-avatar>
        
        <!-- Upload Overlay -->
        <div class="upload-overlay">
          <div class="upload-overlay-content">
            <q-icon 
              :name="loading ? 'hourglass_empty' : 'camera_alt'" 
              size="32px" 
              color="white" 
              :class="{ 'rotating': loading }"
            />
            <div class="text-body-medium text-white q-mt-xs">
              {{ loading ? 'Uploading...' : 'Change Photo' }}
            </div>
          </div>
        </div>
        
        <!-- Loading Overlay -->
        <div v-if="loading" class="loading-overlay">
          <q-circular-progress
            indeterminate
            size="40px"
            color="white"
            class="q-ma-md"
          />
        </div>
      </div>

      <div class="md3-subtitle-medium2">Click on your photo to change it</div>
      
      <!-- Action Buttons -->
      <div class="md3-form-actions">
        <GButton
          class="md3-button"
          variant="filled"
          color="primary"
          icon="add_photo_alternate"
          label="Choose Photo"
          :loading="loading"
          @click="triggerFileInput"
        />
        
        <GButton
          v-if="currentImage"
          class="md3-button"
          variant="outline"
          color="primary"
          icon="delete"
          label="Remove Photo"
          :loading="loading"
          @click="confirmRemove = true"
        />
      </div>
      
      <!-- File Requirements -->
      <div class="file-requirements q-pa-sm">
        <div class="text-body-small text-grey-7 text-center">
          <q-icon name="info" size="16px" class="q-mr-xs" aria-hidden="true" />
          <span aria-label="File requirements">Supported: JPG, PNG, GIF • Max: 2MB</span>
        </div>
      </div>
      
      <!-- Hidden File Input -->
      <input 
        type="file" 
        ref="fileInput"
        accept="image/*"
        class="hidden"
        aria-hidden="true"
        tabindex="-1"
        @change="onFileChange"
      >
    </div>
    
    <!-- Confirmation Dialog -->
    <q-dialog v-model="confirmRemove" persistent>
      <q-card class="q-elevation-8" style="min-width: 400px">
        <q-card-section class="q-pa-lg">
          <div class="row items-center q-gutter-md">
            <q-avatar icon="warning" color="warning" text-color="white" size="48px" />
            <div>
              <div class="text-body-large text-weight-medium q-mb-xs">Remove profile picture?</div>
              <div class="text-body-medium text-grey-7">This action cannot be undone.</div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions class="q-pa-lg q-pt-none" align="right">
          <GButton
            variant="outline"
            color="primary"
            label="Cancel"
            v-close-popup
          />
          <GButton
            variant="filled"
            color="negative"
            label="Remove"
            icon="delete"
            :loading="loading"
            v-close-popup
            @click="removeImage"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useQuasar } from 'quasar';
import GButton from '../shared/buttons/GButton.vue';

export default defineComponent({
  name: 'ProfilePictureUpload',
  components: {
    GButton,
  },
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    currentImage: {
      type: String,
      default: ''
    }
  },
  
  emits: ['upload', 'remove'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const fileInput = ref<HTMLInputElement | null>(null);
    const confirmRemove = ref(false);
    const isDragOver = ref(false);


    // File validation helper
    const validateFile = (file: File): string | null => {
      const maxSize = 2 * 1024 * 1024; // 2MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      
      if (!allowedTypes.includes(file.type)) {
        return 'Please select a valid image file (JPG, PNG, or GIF)';
      }
      
      if (file.size > maxSize) {
        return 'File size must be less than 2MB';
      }
      
      return null;
    };
    
    const processFile = (file: File) => {
      const error = validateFile(file);
      if (error) {
        $q.notify({
          type: 'negative',
          message: error,
          position: 'top',
          timeout: 3000,
        });
        return;
      }
      
      // Auto-submit the file immediately
      emit('upload', file);
      
      // Clear the file input
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    };
    
    const onFileChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        processFile(target.files[0]);
      }
    };

    // Removed saveImage and cancelUpload since we auto-submit

    const removeImage = () => {
      emit('remove');
    };
    
    // Drag and drop handlers
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDragOver.value = true;
    };
    
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only set to false if leaving the drop zone completely
      const currentTarget = e.currentTarget as HTMLElement;
      const relatedTarget = e.relatedTarget as Node;
      if (currentTarget && !currentTarget.contains(relatedTarget)) {
        isDragOver.value = false;
      }
    };
    
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDragOver.value = false;
      
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    };
    
    const triggerFileInput = () => {
      fileInput.value?.click();
    };
    
    // Keyboard navigation support
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerFileInput();
      }
    };

    return {
      fileInput,
      confirmRemove,
      isDragOver,
      onFileChange,
      removeImage,
      onDragEnter,
      onDragOver,
      onDragLeave,
      onDrop,
      triggerFileInput,
      onKeyDown,
    };
  }
});
</script>

<style lang="scss" scoped>
.md3-title-medium {
  font-size: 28px;
  font-weight: 500;

  @media (max-width: 599px) {
    font-size: 16px;
    line-height: 24px;
    font-weight: 500;
    letter-spacing: 0.15px;
    text-align: left;
  }
}

.md3-subtitle-medium1 {
  font-size: 14px;
  font-weight: 400;
  color: var(--q-gray-light);

  @media (max-width: 599px) {
    display: none;
  }
}

.md3-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;

  @media (max-width: 599px) {
    padding: 0;
    gap: 12px;
  }

  .md3-button {
    min-width: 170px;
  }
}

.md3-subtitle-medium2 {
  font-size: 14px;
  font-weight: 400;
  color: var(--q-gray-light);
  margin-top: 16px;
  display: none;

  @media (max-width: 599px) {
    display: block;
  }
}

.profile-picture-section {
  max-width: 400px;
  margin: 0 auto;
  text-align: center;

  @media (max-width: 599px) {
    padding: 10px 16px;
  }
}

.profile-photo-container {
  position: relative;
  display: inline-block;
  transition: all 0.3s ease;
  border-radius: 50%;
  
  &:hover {
    transform: scale(1.02);
    
    .upload-overlay {
      opacity: 1;
    }
  }
  
  &.drag-over {
    transform: scale(1.05);
    
    .upload-overlay {
      opacity: 1;
      background: rgba(25, 118, 210, 0.9);
    }
    
    .profile-avatar {
      border-color: var(--q-primary);
      box-shadow: 0 0 0 4px var(--q-primary-container);
    }
  }
  
  &.uploading {
    .upload-overlay {
      opacity: 1;
      background: rgba(0, 0, 0, 0.7);
    }
  }
}

.profile-avatar {
  border-radius: 50%;
  transition: all 0.3s ease;
  border: 4px solid var(--q-surface-variant);
  position: relative;
  overflow: hidden;
  
  img {
    border-radius: 50%;
    object-fit: cover;
  }
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-overlay-content {
  text-align: center;
  color: white;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-requirements {
  background: var(--q-surface-container-highest);
  border-radius: 8px;
  max-width: 300px;
  margin: 0 auto;
}

.hidden {
  display: none;
}

// Rotating animation for loading icon
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotating {
  animation: spin 2s linear infinite;
}

// Responsive design
@media (max-width: 599px) {
  .profile-avatar {
    width: 160px !important;
    height: 160px !important;
  }
  
  .row.q-gutter-md {
    flex-direction: column;
    gap: 8px;
    
    .q-btn {
      width: 100%;
    }
  }

  .upload-overlay {
    width: 160px !important;
    height: 160px !important;
  }
  
  .upload-overlay-content {
    .q-icon {
      font-size: 24px !important;
    }
    
    .text-body-medium {
      font-size: 12px;
    }
  }
}

// Material Design button transitions
.q-btn {
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
  }
}

// Focus states for accessibility
.profile-photo-container:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
  border-radius: 50%;

  @media (max-width: 599px) {
    height: 160px !important;
    width: 160px !important;
  }
}

.profile-photo-container:focus-visible {
  .upload-overlay {
    opacity: 1;
  }
}
</style>

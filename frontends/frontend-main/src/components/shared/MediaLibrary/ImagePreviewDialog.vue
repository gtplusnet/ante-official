<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    @keydown.esc="close"
  >
    <q-card class="image-preview-dialog">
      <!-- Header Toolbar -->
      <q-bar class="preview-toolbar">
        <q-icon name="o_image" size="20px" />
        <div class="toolbar-title">{{ imageTitle }}</div>
        <q-space />
        
        <!-- Zoom Controls -->
        <q-btn
          flat
          round
          dense
          icon="o_zoom_out"
          @click="zoomOut"
          :disable="zoomLevel <= minZoom"
        >
          <q-tooltip>Zoom Out</q-tooltip>
        </q-btn>
        
        <div class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</div>
        
        <q-btn
          flat
          round
          dense
          icon="o_zoom_in"
          @click="zoomIn"
          :disable="zoomLevel >= maxZoom"
        >
          <q-tooltip>Zoom In</q-tooltip>
        </q-btn>
        
        <q-btn
          flat
          round
          dense
          icon="o_fit_screen"
          @click="resetZoom"
        >
          <q-tooltip>Fit to Screen</q-tooltip>
        </q-btn>
        
        <q-separator vertical inset class="q-mx-sm" />
        
        <!-- Action Buttons -->
        <q-btn
          flat
          round
          dense
          icon="o_download"
          @click="downloadImage"
        >
          <q-tooltip>Download</q-tooltip>
        </q-btn>
        
        <q-btn
          flat
          round
          dense
          icon="o_open_in_new"
          @click="openInNewTab"
        >
          <q-tooltip>Open in New Tab</q-tooltip>
        </q-btn>
        
        <q-separator vertical inset class="q-mx-sm" />
        
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="close"
        >
          <q-tooltip>Close (ESC)</q-tooltip>
        </q-btn>
      </q-bar>

      <!-- Image Container -->
      <div class="image-container" ref="imageContainer">
        <!-- Loading Spinner -->
        <div v-if="isLoading" class="loading-container">
          <q-spinner-orbit
            color="white"
            size="80px"
          />
          <div class="q-mt-md text-white">Loading image...</div>
        </div>
        
        <!-- Image Wrapper -->
        <div 
          v-show="!isLoading && !loadError"
          class="image-wrapper"
          :style="imageWrapperStyle"
          @wheel="handleWheel"
          @mousedown="startDrag"
          @mousemove="onDrag"
          @mouseup="endDrag"
          @mouseleave="endDrag"
        >
          <img
            v-if="imageUrl"
            :src="imageUrl"
            :alt="imageTitle"
            :style="{
              ...imageStyle,
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'block',
              margin: 'auto'
            }"
            @load="onImageLoad"
            @error="onImageError"
          />
        </div>
        
        <!-- Error State -->
        <div v-if="loadError && !isLoading" class="error-container">
          <q-icon name="o_broken_image" size="64px" color="red-5" />
          <div class="q-mt-md text-red-5">Failed to load image</div>
          <q-btn
            flat
            color="white"
            label="Retry"
            icon="o_refresh"
            class="q-mt-md"
            @click="retryLoad"
          />
        </div>
      </div>

      <!-- Image Info Footer -->
      <q-bar v-if="showInfo" class="preview-footer">
        <div class="image-info">
          <span v-if="image?.name">{{ image.name }}</span>
          <span v-if="image?.dimensions" class="q-mx-sm">•</span>
          <span v-if="image?.dimensions">{{ image.dimensions }}</span>
          <span v-if="image?.size" class="q-mx-sm">•</span>
          <span v-if="image?.size">{{ image.size }}</span>
        </div>
      </q-bar>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, onMounted, onUnmounted, watch } from 'vue';

export interface ImageData {
  id?: string | number;
  url: string;
  name?: string;
  size?: string;
  dimensions?: string;
  type?: string;
}

export default defineComponent({
  name: 'ImagePreviewDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    image: {
      type: Object as PropType<ImageData>,
      default: null,
    },
    title: {
      type: String,
      default: null,
    },
    showInfo: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    // Loading states
    const isLoading = ref(false);
    const loadError = ref(false);
    
    // Zoom controls
    const zoomLevel = ref(1);
    const minZoom = 0.5;
    const maxZoom = 3;
    const zoomStep = 0.25;

    // Drag controls
    const isDragging = ref(false);
    const dragStart = ref({ x: 0, y: 0 });
    const imagePosition = ref({ x: 0, y: 0 });
    const imageContainer = ref<HTMLElement | null>(null);

    // Computed
    const imageUrl = computed(() => props.image?.url || '');
    const imageTitle = computed(() => props.title || props.image?.name || 'Image Preview');

    const imageWrapperStyle = computed(() => ({
      transform: `translate(${imagePosition.value.x}px, ${imagePosition.value.y}px)`,
      cursor: zoomLevel.value > 1 ? (isDragging.value ? 'grabbing' : 'grab') : 'default',
      transition: isDragging.value ? 'none' : 'transform 0.2s',
    }));

    const imageStyle = computed(() => ({
      transform: `scale(${zoomLevel.value})`,
      transition: 'transform 0.2s',
      maxWidth: '100%',
      maxHeight: '100%',
    }));

    // Methods
    const close = () => {
      emit('update:modelValue', false);
      // Reset state when closing
      setTimeout(() => {
        zoomLevel.value = 1;
        imagePosition.value = { x: 0, y: 0 };
        isLoading.value = false;
        loadError.value = false;
      }, 300);
    };

    const zoomIn = () => {
      if (zoomLevel.value < maxZoom) {
        zoomLevel.value = Math.min(zoomLevel.value + zoomStep, maxZoom);
      }
    };

    const zoomOut = () => {
      if (zoomLevel.value > minZoom) {
        zoomLevel.value = Math.max(zoomLevel.value - zoomStep, minZoom);
        // Reset position if zooming out to fit
        if (zoomLevel.value <= 1) {
          imagePosition.value = { x: 0, y: 0 };
        }
      }
    };

    const resetZoom = () => {
      zoomLevel.value = 1;
      imagePosition.value = { x: 0, y: 0 };
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    };

    const startDrag = (event: MouseEvent) => {
      if (zoomLevel.value > 1) {
        isDragging.value = true;
        dragStart.value = {
          x: event.clientX - imagePosition.value.x,
          y: event.clientY - imagePosition.value.y,
        };
      }
    };

    const onDrag = (event: MouseEvent) => {
      if (isDragging.value && zoomLevel.value > 1) {
        imagePosition.value = {
          x: event.clientX - dragStart.value.x,
          y: event.clientY - dragStart.value.y,
        };
      }
    };

    const endDrag = () => {
      isDragging.value = false;
    };

    const downloadImage = () => {
      if (imageUrl.value) {
        const link = document.createElement('a');
        link.href = imageUrl.value;
        link.download = props.image?.name || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };

    const openInNewTab = () => {
      if (imageUrl.value) {
        window.open(imageUrl.value, '_blank');
      }
    };

    const preloadImage = () => {
      if (!imageUrl.value) {
        loadError.value = true;
        isLoading.value = false;
        return;
      }
      
      isLoading.value = true;
      loadError.value = false;
      
      // Create a new image element for preloading
      const img = new Image();
      
      img.onload = () => {
        isLoading.value = false;
        loadError.value = false;
        console.log('Image preloaded successfully:', imageUrl.value);
      };
      
      img.onerror = () => {
        isLoading.value = false;
        loadError.value = true;
        console.error('Failed to preload image:', imageUrl.value);
      };
      
      // Start loading the image
      img.src = imageUrl.value;
    };
    
    const onImageLoad = () => {
      // Image loaded successfully in the DOM
      isLoading.value = false;
      loadError.value = false;
      console.log('Image displayed successfully:', imageUrl.value);
    };
    
    const onImageError = (event: Event) => {
      isLoading.value = false;
      loadError.value = true;
      console.error('Failed to load image:', imageUrl.value, event);
    };
    
    const retryLoad = () => {
      preloadImage();
    };

    // Watch for dialog open
    watch(() => props.modelValue, (newVal) => {
      if (newVal && props.image?.url) {
        console.log('Preview dialog opened with image:', props.image);
        // Reset states
        zoomLevel.value = 1;
        imagePosition.value = { x: 0, y: 0 };
        // Preload the image
        preloadImage();
      }
    });
    
    // Watch for image URL changes
    watch(() => props.image?.url, (newUrl) => {
      if (newUrl && props.modelValue) {
        preloadImage();
      }
    });
    
    // Keyboard shortcuts
    const handleKeyboard = (event: KeyboardEvent) => {
      if (props.modelValue) {
        switch (event.key) {
          case '+':
          case '=':
            zoomIn();
            break;
          case '-':
          case '_':
            zoomOut();
            break;
          case '0':
            resetZoom();
            break;
        }
      }
    };

    onMounted(() => {
      window.addEventListener('keydown', handleKeyboard);
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyboard);
    });

    return {
      // Refs
      isLoading,
      loadError,
      zoomLevel,
      minZoom,
      maxZoom,
      imageContainer,
      isDragging,
      
      // Computed
      imageUrl,
      imageTitle,
      imageWrapperStyle,
      imageStyle,
      
      // Methods
      close,
      zoomIn,
      zoomOut,
      resetZoom,
      handleWheel,
      startDrag,
      onDrag,
      endDrag,
      downloadImage,
      openInNewTab,
      onImageLoad,
      onImageError,
      retryLoad,
      preloadImage,
    };
  },
});
</script>

<style scoped lang="scss">
.image-preview-dialog {
  background: #000;
  display: flex;
  flex-direction: column;
  height: 100vh;

  .preview-toolbar {
    background: rgba(0, 0, 0, 0.9);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    height: 56px;

    .toolbar-title {
      margin-left: 12px;
      font-size: 16px;
      font-weight: 500;
      max-width: 300px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .zoom-level {
      font-size: 14px;
      min-width: 50px;
      text-align: center;
      color: rgba(255, 255, 255, 0.7);
      font-family: monospace;
    }

    .q-btn {
      color: white;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      &:disabled {
        opacity: 0.3;
      }
    }
  }

  .image-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    background: radial-gradient(circle, #1a1a1a 0%, #000000 100%);
    user-select: none;

    .image-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      position: relative;

      img {
        width: auto;
        height: auto;
        max-width: 90vw;
        max-height: calc(100vh - 96px);
        object-fit: contain;
        transform-origin: center;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
      }
      
      .no-image {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
    }
    
    .loading-container,
    .error-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    
    .loading-container {
      color: white;
    }
    
    .error-container {
      .q-btn {
        margin-top: 16px;
      }
    }
  }

  .preview-footer {
    background: rgba(0, 0, 0, 0.9);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    height: 40px;
    font-size: 13px;

    .image-info {
      color: rgba(255, 255, 255, 0.7);
      display: flex;
      align-items: center;
      
      span {
        margin: 0 4px;
      }
    }
  }
}

// Dark scrollbar for the dialog
.image-preview-dialog {
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

// Animation for smooth transitions
.slide-up-enter-active,
.slide-up-leave-active,
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
</style>
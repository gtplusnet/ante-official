<template>
  <div 
    class="smart-image"
    :class="{ 'loading': isLoading, 'error': hasError }"
    :style="{ aspectRatio: computedAspectRatio }"
  >
    <!-- Progressive blur placeholder -->
    <div
      v-if="blurPlaceholder && (isLoading || hasError)"
      class="blur-placeholder"
      :style="{ backgroundImage: `url(${blurPlaceholder})` }"
    />
    
    <!-- Main responsive image -->
    <picture v-if="!hasError" class="image-container">
      <!-- AVIF sources (best compression) -->
      <source 
        v-if="avifSrcset" 
        :srcset="avifSrcset"
        :sizes="sizes"
        type="image/avif"
      />
      
      <!-- WebP sources (good compression, wide support) -->
      <source 
        v-if="webpSrcset" 
        :srcset="webpSrcset"
        :sizes="sizes"
        type="image/webp"
      />
      
      <!-- JPEG fallback -->
      <img
        :src="fallbackSrc"
        :srcset="jpegSrcset"
        :sizes="sizes"
        :alt="alt"
        :loading="lazyLoad ? 'lazy' : 'eager'"
        :width="width"
        :height="height"
        class="responsive-image"
        :class="{ loaded: isLoaded }"
        @load="onImageLoad"
        @error="onImageError"
        @loadstart="onImageLoadStart"
      />
    </picture>
    
    <!-- Processing state -->
    <div v-if="isProcessing" class="processing-placeholder">
      <q-spinner color="primary" size="32px" />
      <div class="processing-text">Processing...</div>
    </div>
    
    <!-- Error fallback -->
    <div v-else-if="hasError" class="error-placeholder">
      <q-icon name="o_broken_image" size="48px" color="grey-5" />
      <div class="error-text">Failed to load image</div>
    </div>
    
    <!-- Loading indicator -->
    <div v-else-if="isLoading && !blurPlaceholder" class="loading-placeholder">
      <q-spinner color="primary" size="32px" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, PropType } from 'vue';
import type { MediaFile } from '@stores/media.store';

interface ImageVariant {
  url: string;
  width: number;
  height: number;
}

interface ImageVariants {
  avif?: ImageVariant;
  webp?: ImageVariant;
  jpg?: ImageVariant;
}

export default defineComponent({
  name: 'SmartImage',
  props: {
    // MediaFile object with all variants
    media: {
      type: Object as PropType<MediaFile>,
      required: false,
    },
    
    // Alternative: Direct URLs for variants
    variants: {
      type: Object as PropType<Record<string, ImageVariants>>,
      required: false,
    },
    
    // Fallback src if no variants available
    src: {
      type: String,
      required: false,
    },
    
    // Alt text for accessibility
    alt: {
      type: String,
      default: '',
    },
    
    // Preferred size variant (thumbnail, small, medium, large, xlarge, etc.)
    size: {
      type: String,
      default: 'medium',
    },
    
    // Custom sizes attribute for responsive loading
    sizes: {
      type: String,
      default: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
    },
    
    // Enable lazy loading
    lazyLoad: {
      type: Boolean,
      default: true,
    },
    
    // Custom aspect ratio (e.g., '16/9', '1/1', 'auto')
    aspectRatio: {
      type: String,
      default: 'auto',
    },
    
    // Enable blur placeholder while loading
    showPlaceholder: {
      type: Boolean,
      default: true,
    },
    
    // Show processing state
    showProcessing: {
      type: Boolean,
      default: false,
    },
    
    // Custom width/height for sizing
    width: {
      type: [Number, String],
      required: false,
    },
    
    height: {
      type: [Number, String],
      required: false,
    },
  },
  
  emits: ['load', 'error', 'loadstart'],
  
  setup(props, { emit }) {
    // Loading states
    const isLoading = ref(true);
    const hasError = ref(false);
    const isLoaded = ref(false);
    
    // Get the appropriate variant for the requested size
    const selectedVariant = computed(() => {
      if (props.media?.variants) {
        return props.media.variants[props.size] || props.media.variants.medium || props.media.variants.small;
      }
      if (props.variants) {
        return props.variants[props.size];
      }
      return null;
    });
    
    // Generate AVIF srcset
    const avifSrcset = computed(() => {
      if (!props.media?.variants) return undefined;
      
      const srcsetParts: string[] = [];
      
      Object.entries(props.media.variants).forEach(([, variants]) => {
        if (variants.avif) {
          srcsetParts.push(`${variants.avif.url} ${variants.avif.width}w`);
        }
      });
      
      return srcsetParts.length > 0 ? srcsetParts.join(', ') : undefined;
    });
    
    // Generate WebP srcset
    const webpSrcset = computed(() => {
      if (!props.media?.variants) return undefined;
      
      const srcsetParts: string[] = [];
      
      Object.entries(props.media.variants).forEach(([, variants]) => {
        if (variants.webp) {
          srcsetParts.push(`${variants.webp.url} ${variants.webp.width}w`);
        }
      });
      
      return srcsetParts.length > 0 ? srcsetParts.join(', ') : undefined;
    });
    
    // Generate JPEG srcset
    const jpegSrcset = computed(() => {
      if (!props.media?.variants) return undefined;
      
      const srcsetParts: string[] = [];
      
      Object.entries(props.media.variants).forEach(([, variants]) => {
        if (variants.jpg) {
          srcsetParts.push(`${variants.jpg.url} ${variants.jpg.width}w`);
        }
      });
      
      return srcsetParts.length > 0 ? srcsetParts.join(', ') : undefined;
    });
    
    // Fallback src (highest priority to lowest)
    const fallbackSrc = computed(() => {
      if (selectedVariant.value) {
        return selectedVariant.value.avif?.url || 
               selectedVariant.value.webp?.url || 
               selectedVariant.value.jpg?.url;
      }
      
      if (props.media) {
        // Try to get any available variant URL as fallback
        const variants = props.media.variants;
        if (variants) {
          // Try common variant sizes in order
          const variantSizes = ['medium', 'small', 'large', 'thumbnail', 'og'];
          for (const size of variantSizes) {
            if (variants[size]) {
              const variant = variants[size];
              const url = variant.avif?.url || variant.webp?.url || variant.jpg?.url;
              if (url) return url;
            }
          }
        }
        
        // Use the original URL as fallback only if it's not empty
        if (props.media.url && props.media.url !== '') {
          return props.media.url;
        }
      }
      
      return props.src || '';
    });
    
    // Blur placeholder
    const blurPlaceholder = computed(() => {
      return props.showPlaceholder && props.media?.blurPlaceholder ? props.media.blurPlaceholder : null;
    });
    
    // Computed aspect ratio
    const computedAspectRatio = computed(() => {
      if (props.aspectRatio !== 'auto') {
        return props.aspectRatio;
      }
      
      if (props.media?.width && props.media?.height) {
        return `${props.media.width}/${props.media.height}`;
      }
      
      if (selectedVariant.value?.avif) {
        return `${selectedVariant.value.avif.width}/${selectedVariant.value.avif.height}`;
      }
      
      if (selectedVariant.value?.webp) {
        return `${selectedVariant.value.webp.width}/${selectedVariant.value.webp.height}`;
      }
      
      if (selectedVariant.value?.jpg) {
        return `${selectedVariant.value.jpg.width}/${selectedVariant.value.jpg.height}`;
      }
      
      return 'auto';
    });
    
    // Processing state
    const isProcessing = computed(() => {
      if (props.showProcessing) return true;
      
      if (props.media) {
        // Check if media is currently being processed
        return props.media.processingStatus === 'PENDING' || 
               props.media.processingStatus === 'PROCESSING' ||
               (!props.media.url && !props.media.variants);
      }
      
      return false;
    });
    
    // Event handlers
    const onImageLoadStart = () => {
      isLoading.value = true;
      hasError.value = false;
      isLoaded.value = false;
      emit('loadstart');
    };
    
    const onImageLoad = (event: Event) => {
      isLoading.value = false;
      hasError.value = false;
      isLoaded.value = true;
      emit('load', event);
    };
    
    const onImageError = (event: Event) => {
      isLoading.value = false;
      hasError.value = true;
      isLoaded.value = false;
      emit('error', event);
    };
    
    // Reset loading state when src changes
    watch(() => fallbackSrc.value, () => {
      if (fallbackSrc.value) {
        isLoading.value = true;
        hasError.value = false;
        isLoaded.value = false;
      }
    });
    
    return {
      isLoading,
      hasError,
      isLoaded,
      isProcessing,
      selectedVariant,
      avifSrcset,
      webpSrcset,
      jpegSrcset,
      fallbackSrc,
      blurPlaceholder,
      computedAspectRatio,
      onImageLoadStart,
      onImageLoad,
      onImageError,
    };
  },
});
</script>

<style scoped lang="scss">
.smart-image {
  position: relative;
  overflow: hidden;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  
  &.loading {
    .blur-placeholder {
      opacity: 1;
    }
  }
  
  &.error {
    background-color: #fafafa;
  }
}

.blur-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(10px);
  transform: scale(1.1); // Prevent blur edges from showing
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.image-container {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 2;
  
  .responsive-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease;
    
    &[loading="lazy"] {
      opacity: 0;
      
      &.loaded {
        opacity: 1;
      }
    }
  }
}

.processing-placeholder,
.error-placeholder,
.loading-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 3;
}

.processing-text {
  font-size: 0.75rem;
  color: var(--q-primary);
  font-weight: 500;
}

.error-text {
  font-size: 14px;
  color: #666;
  text-align: center;
}

// Responsive breakpoints
@media (max-width: 768px) {
  .smart-image {
    border-radius: 4px;
  }
}

@media (min-width: 769px) {
  .smart-image {
    border-radius: 6px;
  }
}

// Animation for loading states
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.responsive-image {
  animation: fadeIn 0.3s ease-in-out;
}

// Support for different aspect ratios
.smart-image[style*="aspect-ratio: 1/1"] {
  .responsive-image {
    object-fit: cover;
  }
}

.smart-image[style*="aspect-ratio: 16/9"] {
  .responsive-image {
    object-fit: cover;
  }
}

.smart-image[style*="aspect-ratio: 4/3"] {
  .responsive-image {
    object-fit: cover;
  }
}
</style>
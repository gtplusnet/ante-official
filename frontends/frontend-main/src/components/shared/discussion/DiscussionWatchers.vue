<template>
  <div class="discussion-watchers" v-if="!loading || watchers.length > 0">
    <div class="watchers-container">
      <!-- Visible watchers with overlapping avatars -->
      <q-avatar 
        v-for="(watcher, index) in visibleWatchers" 
        :key="watcher.id"
        size="32px"
        class="watcher-avatar"
        :style="{ zIndex: maxVisible - index }"
      >
        <img 
          :src="watcher.image || generateFallbackAvatar(watcher)" 
          :alt="watcher.fullName"
          @error="handleImageError"
        />
        <q-tooltip 
          class="watcher-tooltip" 
          anchor="top middle" 
          self="bottom middle"
          :offset="[0, 8]"
        >
          {{ watcher.fullName }}
        </q-tooltip>
      </q-avatar>
      
      <!-- Overflow indicator -->
      <div v-if="overflowCount > 0" class="overflow-indicator">
        <span>+{{ overflowCount }}</span>
        <q-tooltip 
          class="watcher-tooltip"
          anchor="top middle" 
          self="bottom middle"
          :offset="[0, 8]"
        >
          {{ overflowCount }} more watcher{{ overflowCount > 1 ? 's' : '' }}
        </q-tooltip>
      </div>
    </div>
    
    <!-- Loading skeleton -->
    <div v-if="loading && watchers.length === 0" class="watchers-loading">
      <q-skeleton 
        v-for="n in 3" 
        :key="n"
        type="circle" 
        size="32px" 
        class="loading-avatar"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { api } from 'src/boot/axios';

interface DiscussionWatcher {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  image?: string;
}

export default defineComponent({
  name: 'DiscussionWatchers',
  props: {
    discussionId: {
      type: String,
      required: true,
    },
    maxVisible: {
      type: Number,
      default: 4,
    },
  },
  emits: ['watchers-loaded', 'watchers-error'],
  setup(props, { emit }) {
    const watchers = ref<DiscussionWatcher[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);

    // Computed properties
    const visibleWatchers = computed(() => 
      watchers.value.slice(0, props.maxVisible)
    );

    const overflowCount = computed(() => 
      Math.max(0, watchers.value.length - props.maxVisible)
    );

    // Generate fallback avatar with initials
    const generateFallbackAvatar = (watcher: DiscussionWatcher): string => {
      const initials = `${watcher.firstName?.charAt(0) || ''}${watcher.lastName?.charAt(0) || ''}`.toUpperCase();
      const colors = [
        '#1976d2', '#388e3c', '#f57c00', '#7b1fa2', 
        '#d32f2f', '#0288d1', '#689f38', '#fbc02d'
      ];
      const colorIndex = watcher.id.charCodeAt(0) % colors.length;
      const backgroundColor = colors[colorIndex];
      
      // Create a simple SVG data URL
      const svg = `
        <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="${backgroundColor}"/>
          <text x="16" y="20" text-anchor="middle" fill="white" font-family="Roboto, sans-serif" font-size="12" font-weight="500">${initials}</text>
        </svg>
      `;
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    };

    // Handle image load errors
    const handleImageError = (event: Event) => {
      const target = event.target as HTMLImageElement;
      if (target && !target.src.startsWith('data:image/svg+xml')) {
        // Find the watcher for this image and generate fallback
        const avatarElement = target.closest('.watcher-avatar');
        if (avatarElement) {
          const index = Array.from(avatarElement.parentNode?.children || []).indexOf(avatarElement);
          const watcher = visibleWatchers.value[index];
          if (watcher) {
            target.src = generateFallbackAvatar(watcher);
          }
        }
      }
    };

    // Fetch discussion watchers
    const fetchWatchers = async () => {
      if (!props.discussionId) return;
      
      try {
        loading.value = true;
        error.value = null;
        
        const response = await api.get(`/discussion/watchers/${props.discussionId}`);
        watchers.value = response.data || [];
        
        emit('watchers-loaded', watchers.value);
      } catch (err) {
        console.error('Failed to fetch discussion watchers:', err);
        error.value = 'Failed to load watchers';
        emit('watchers-error', err);
      } finally {
        loading.value = false;
      }
    };

    // Watch for discussionId changes
    watch(() => props.discussionId, fetchWatchers, { immediate: true });

    onMounted(() => {
      fetchWatchers();
    });

    return {
      watchers,
      loading,
      error,
      visibleWatchers,
      overflowCount,
      generateFallbackAvatar,
      handleImageError,
      fetchWatchers,
    };
  },
});
</script>

<style scoped lang="scss">
// Material Design 3 Variables (reused from DiscussionDialog)
$md3-surface: #ffffff;
$md3-surface-variant: #f5f5f5;
$md3-on-surface: #1a1a1a;
$md3-on-surface-variant: #6b6b6b;
$md3-primary: #1976d2;
$md3-primary-container: #e3f2fd;
$md3-on-primary: #ffffff;
$md3-secondary-container: #f3e5f5;
$md3-outline: #e0e0e0;
$md3-outline-variant: #f0f0f0;
$md3-error: #ba1a1a;
$md3-surface-tint: rgba(25, 118, 210, 0.05);

// MD3 elevation
$md3-elevation-1: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$md3-elevation-2: 0 2px 4px 0 rgba(0, 0, 0, 0.08);
$md3-elevation-3: 0 4px 8px 0 rgba(0, 0, 0, 0.1);

// MD3 Typography
$md3-body-large: 16px;
$md3-body-medium: 14px;
$md3-body-small: 12px;
$md3-label-large: 14px;
$md3-label-medium: 12px;
$md3-label-small: 11px;

.discussion-watchers {
  display: flex;
  align-items: center;
  margin-right: 8px; // MD3 1-unit spacing
  
  .watchers-container {
    display: flex;
    align-items: center;
    
    .watcher-avatar {
      margin-left: -8px; // MD3 overlap spacing
      border: 2px solid $md3-surface; // Clean separation border
      transition: all 150ms cubic-bezier(0.2, 0, 0, 1); // MD3 standard easing
      cursor: pointer;
      position: relative;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); // Subtle depth
      
      &:first-child {
        margin-left: 0; // No overlap for first avatar
      }
      
      &:hover {
        transform: scale(1.1); // MD3 hover interaction
        box-shadow: $md3-elevation-1; // Subtle elevation on hover
        z-index: 999 !important; // Ensure hover avatar is on top
      }
      
      img {
        border-radius: 50%; // Perfect circle
        object-fit: cover;
        width: 100%;
        height: 100%;
      }
    }
    
    .overflow-indicator {
      margin-left: 4px; // Half-unit spacing
      padding: 4px 8px; // MD3 compact padding
      background: $md3-surface-variant;
      color: $md3-on-surface-variant;
      border-radius: 12px; // MD3 small component radius
      font-size: $md3-label-small; // 11px MD3 scale
      font-weight: 500;
      line-height: 1.2;
      cursor: pointer;
      transition: background-color 150ms cubic-bezier(0.2, 0, 0, 1);
      
      &:hover {
        background: $md3-outline;
      }
      
      span {
        display: block;
      }
    }
  }
  
  .watchers-loading {
    display: flex;
    align-items: center;
    
    .loading-avatar {
      margin-left: -8px;
      border: 2px solid $md3-surface;
      border-radius: 50%;
      
      &:first-child {
        margin-left: 0;
      }
    }
  }
}

// Enhanced tooltip styling
:deep(.watcher-tooltip) {
  background: $md3-surface-variant !important;
  color: $md3-on-surface !important;
  font-size: $md3-label-medium !important; // 12px MD3 scale
  font-weight: 400 !important;
  border-radius: 8px !important; // MD3 tooltip radius
  padding: 6px 8px !important;
  box-shadow: $md3-elevation-2 !important;
  border: none !important;
}

// Responsive adjustments for mobile
@media (max-width: 768px) {
  .discussion-watchers {
    margin-right: 4px;
    
    .watchers-container {
      .watcher-avatar {
        margin-left: -6px; // Smaller overlap on mobile
        
        &:first-child {
          margin-left: 0;
        }
      }
      
      .overflow-indicator {
        margin-left: 2px;
        padding: 2px 6px;
        font-size: 10px;
      }
    }
  }
}
</style>
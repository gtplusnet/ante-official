<template>
  <q-dialog v-model="show" @hide="onHide" persistent transition-show="scale" transition-hide="scale">
    <q-card 
      class="md3-dialog-surface"
      :style="{ 
        width: '560px', 
        maxWidth: '90vw',
        borderRadius: '28px'
      }"
    >
      <!-- Header with Icon -->
      <q-card-section class="q-pb-none">
        <div class="row items-start q-gutter-md">
          <q-avatar 
            :icon="announcement?.icon" 
            :style="{ backgroundColor: announcement?.iconColor, color: 'white' }"
            size="56px"
            font-size="28px"
          />
          <div class="col">
            <div class="text-headline-medium text-on-surface">{{ announcement?.title }}</div>
            <div class="text-body-medium text-on-surface-variant q-mt-xs">
              <span v-if="announcement?.priority === 'URGENT'" class="text-error">
                <q-icon name="priority_high" size="16px" class="q-mr-xs" />
                Urgent
              </span>
              <span v-else-if="announcement?.priority === 'HIGH'" class="text-warning">
                <q-icon name="priority_high" size="16px" class="q-mr-xs" />
                High Priority
              </span>
              <span v-else>
                {{ formatPriority(announcement?.priority) }}
              </span>
              <span class="q-mx-sm">•</span>
              {{ formatDateTime(announcement?.createdAt) }}
            </div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup class="text-on-surface-variant" />
        </div>
      </q-card-section>

      <!-- Content -->
      <q-card-section class="q-pt-md q-px-lg">
        <div class="text-body-medium text-on-surface announcement-content">
          {{ announcement?.content }}
        </div>
      </q-card-section>

      <!-- Author Info -->
      <q-card-section class="q-pt-none q-px-lg">
        <div class="row items-center q-gutter-sm text-body-small text-on-surface-variant">
          <q-icon name="person" size="18px" />
          <span>Posted by {{ getAuthorName() }}</span>
        </div>
      </q-card-section>

      <!-- Divider -->
      <q-separator />

      <!-- Engagement Stats -->
      <q-card-section class="q-px-lg">
        <div class="row items-center justify-between">
          <div class="engagement-stats">
            <div 
              v-if="(announcement?.viewCount || 0) > 0"
              class="stat-item clickable"
              @click="showStatsDialog"
            >
              <q-icon name="visibility" size="20px" color="grey-7" />
              <span class="text-body-medium text-on-surface-variant">
                {{ announcement?.viewCount || 0 }} view{{ (announcement?.viewCount || 0) !== 1 ? 's' : '' }}
              </span>
            </div>
            <div 
              v-if="(announcement?.acknowledgmentCount || 0) > 0"
              class="stat-item clickable"
              @click="showStatsDialog"
            >
              <q-icon name="thumb_up" size="20px" color="primary" />
              <span class="text-body-medium text-on-surface-variant">
                {{ announcement?.acknowledgmentCount || 0 }} like{{ (announcement?.acknowledgmentCount || 0) !== 1 ? 's' : '' }}
              </span>
            </div>
            <div v-if="!announcement?.viewCount && !announcement?.acknowledgmentCount" class="text-body-medium text-on-surface-variant">
              No interactions yet
            </div>
          </div>
          
          <!-- Acknowledge Button -->
          <q-btn
            v-if="!announcement?.isAcknowledged"
            @click="handleAcknowledge"
            unelevated
            no-caps
            color="primary"
            padding="8px 24px"
            class="md3-filled-button"
          >
            <q-icon name="thumb_up_off_alt" size="18px" class="q-mr-xs" />
            Acknowledge
          </q-btn>
          <q-chip
            v-else
            color="primary"
            text-color="white"
            class="text-label-large"
            icon="thumb_up"
          >
            Acknowledged
          </q-chip>
        </div>
      </q-card-section>

    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { computed, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';
import { AxiosError } from 'axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  icon?: string;
  iconColor?: string;
  priority: string;
  isActive?: boolean;
  createdAt: string;
  viewCount: number;
  acknowledgmentCount: number;
  isViewed?: boolean;
  isAcknowledged?: boolean;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
  };
}

export default {
  name: 'ManpowerAnnouncementDetailDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    announcement: {
      type: Object as () => Announcement | null,
      default: null,
    },
  },
  emits: ['update:modelValue', 'hide', 'acknowledged', 'show-stats'],
  setup(props: any, { emit }: any) {
    const instance = getCurrentInstance();
    const $api = instance?.proxy?.$api;
    const q = useQuasar();
    
    const show = computed({
      get: () => props.modelValue,
      set: (value: boolean) => emit('update:modelValue', value),
    });
    
    const formatDateTime = (dateString?: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      }
      if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      }
      if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };
    
    const formatPriority = (priority?: string) => {
      if (!priority) return '';
      return priority.charAt(0) + priority.slice(1).toLowerCase() + ' Priority';
    };
    
    const getAuthorName = () => {
      if (!props.announcement?.createdBy) return 'Unknown';
      const { firstName, lastName, middleName } = props.announcement.createdBy;
      const middle = middleName ? ` ${middleName.charAt(0)}.` : '';
      return `${firstName}${middle} ${lastName}`;
    };
    
    const handleAcknowledge = async () => {
      if (!$api || !props.announcement) return;
      
      try {
        await $api.post(`announcement/${props.announcement.id}/acknowledge`);
        emit('acknowledged');
        q.notify({
          type: 'positive',
          message: 'Announcement acknowledged',
        });
      } catch (error) {
        handleAxiosError(q, error as AxiosError);
      }
    };
    
    const showStatsDialog = () => {
      emit('show-stats', props.announcement);
      show.value = false;
    };
    
    const onHide = () => {
      emit('hide');
    };
    
    return {
      show,
      formatDateTime,
      formatPriority,
      getAuthorName,
      handleAcknowledge,
      showStatsDialog,
      onHide,
    };
  },
};
</script>

<style scoped lang="scss">
// MD3 Dialog surface styling
.md3-dialog-surface {
  background-color: #FEF7FF !important; // MD3 surface color
  box-shadow: 0px 24px 48px -12px rgba(0, 0, 0, 0.18) !important; // MD3 elevation level 5
}

// MD3 Typography
.text-headline-medium {
  font-size: 28px;
  font-weight: 400;
  line-height: 36px;
  letter-spacing: 0;
}

.text-body-large {
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0.5px;
}

.text-body-medium {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.25px;
}

.text-body-small {
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0.4px;
}

.text-label-large {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.1px;
}

// MD3 Colors
.text-on-surface {
  color: var(--q-on-surface, #1C1B1F);
}

.text-on-surface-variant {
  color: var(--q-on-surface-variant, #49454F);
}

.text-error {
  color: var(--q-negative, #BA1A1A);
}

.text-warning {
  color: var(--q-warning, #F57C00);
}

// Content styling
.announcement-content {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
  padding: 12px 16px;
  background-color: var(--q-surface-container-low, #F7F2FA);
  border-radius: 12px;
  line-height: 1.5;
  
  // Custom scrollbar styling for webkit browsers
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
    
    &:hover {
      background: rgba(0, 0, 0, 0.5);
    }
  }
  
  // Fallback for Firefox
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.3) rgba(0, 0, 0, 0.05);
}

// Engagement stats
.engagement-stats {
  display: flex;
  gap: 16px;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  
  &.clickable {
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 16px;
    transition: background-color 0.2s ease;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }
}

// MD3 Button styling
.md3-text-button {
  border-radius: 20px;
  font-weight: 500;
  text-transform: none;
}

.md3-filled-button {
  border-radius: 20px;
  font-weight: 500;
  text-transform: none;
}

// Ensure card sections have correct background
:deep(.q-card__section) {
  background-color: transparent !important;
}
</style>
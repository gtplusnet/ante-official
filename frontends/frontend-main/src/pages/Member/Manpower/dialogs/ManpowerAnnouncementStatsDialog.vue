<template>
  <q-dialog v-model="show" @hide="onHide" persistent transition-show="scale" transition-hide="scale">
    <q-card 
      class="md3-dialog-surface"
      :style="{ 
        width: '600px', 
        maxWidth: '90vw',
        borderRadius: '28px'
      }"
    >
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-headline-small text-on-surface">{{ announcement?.title }} - Statistics</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <!-- Tabs -->
      <q-card-section class="q-pt-sm">
        <q-tabs
          v-model="activeTab"
          dense
          class="text-on-surface-variant"
          active-color="primary"
          indicator-color="primary"
          align="left"
        >
          <q-tab name="views">
            <template v-slot:default>
              <div class="row items-center no-wrap">
                <q-icon name="visibility" size="18px" class="q-mr-xs" />
                <span>Views ({{ stats.totalViews }})</span>
              </div>
            </template>
          </q-tab>
          <q-tab name="acknowledgments">
            <template v-slot:default>
              <div class="row items-center no-wrap">
                <q-icon name="thumb_up" size="18px" class="q-mr-xs" />
                <span>Likes ({{ stats.totalAcknowledgments }})</span>
              </div>
            </template>
          </q-tab>
        </q-tabs>

        <q-separator class="q-mt-sm" />

        <q-tab-panels v-model="activeTab" animated class="q-pt-none">
          <!-- Views Tab -->
          <q-tab-panel name="views" class="q-pa-none">
            <div v-if="isLoading" class="q-pa-lg text-center">
              <q-spinner-dots size="40px" color="primary" />
            </div>
            <div v-else-if="stats.viewDetails.length === 0" class="q-pa-lg text-center text-on-surface-variant">
              <q-icon name="visibility_off" size="48px" class="q-mb-md" />
              <div class="text-body-large">No views yet</div>
            </div>
            <q-list v-else separator>
              <q-item v-for="view in stats.viewDetails" :key="view.viewedBy.id">
                <q-item-section avatar>
                  <q-avatar size="40px">
                    <img v-if="view.viewedBy.image" :src="view.viewedBy.image" />
                    <q-icon v-else name="person" size="24px" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body-large text-on-surface">
                    {{ view.viewedBy.firstName }} {{ view.viewedBy.lastName }}
                  </q-item-label>
                  <q-item-label caption class="text-body-medium text-on-surface-variant">
                    {{ view.viewedBy.email }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label caption class="text-label-small text-on-surface-variant">
                    {{ formatDateTime(view.viewedAt) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <!-- Acknowledgments Tab -->
          <q-tab-panel name="acknowledgments" class="q-pa-none">
            <div v-if="isLoading" class="q-pa-lg text-center">
              <q-spinner-dots size="40px" color="primary" />
            </div>
            <div v-else-if="stats.acknowledgmentDetails.length === 0" class="q-pa-lg text-center text-on-surface-variant">
              <q-icon name="check_circle_outline" size="48px" class="q-mb-md" />
              <div class="text-body-large">No acknowledgments yet</div>
            </div>
            <q-list v-else separator>
              <q-item v-for="ack in stats.acknowledgmentDetails" :key="ack.acknowledgedBy.id">
                <q-item-section avatar>
                  <q-avatar size="40px">
                    <img v-if="ack.acknowledgedBy.image" :src="ack.acknowledgedBy.image" />
                    <q-icon v-else name="person" size="24px" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body-large text-on-surface">
                    {{ ack.acknowledgedBy.firstName }} {{ ack.acknowledgedBy.lastName }}
                  </q-item-label>
                  <q-item-label caption class="text-body-medium text-on-surface-variant">
                    {{ ack.acknowledgedBy.email }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label caption class="text-label-small text-on-surface-variant">
                    {{ formatDateTime(ack.acknowledgedAt) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn 
          label="Close" 
          color="primary" 
          unelevated 
          no-caps
          padding="sm lg"
          v-close-popup 
          class="text-label-large"
          :style="{ borderRadius: '20px' }"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { ref, computed, watch, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';
import { AxiosError } from 'axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';

interface ViewDetail {
  viewedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    image?: string;
  };
  viewedAt: string;
}

interface AcknowledgmentDetail {
  acknowledgedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    image?: string;
  };
  acknowledgedAt: string;
}

interface AnnouncementStats {
  totalViews: number;
  totalAcknowledgments: number;
  viewDetails: ViewDetail[];
  acknowledgmentDetails: AcknowledgmentDetail[];
}

interface Announcement {
  id: number;
  title: string;
}

export default {
  name: 'ManpowerAnnouncementStatsDialog',
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
  emits: ['update:modelValue', 'hide'],
  setup(props: any, { emit }: any) {
    const instance = getCurrentInstance();
    const $api = instance?.proxy?.$api;
    const q = useQuasar();
    
    const show = computed({
      get: () => props.modelValue,
      set: (value: boolean) => emit('update:modelValue', value),
    });
    
    const activeTab = ref('views');
    const isLoading = ref(false);
    const stats = ref<AnnouncementStats>({
      totalViews: 0,
      totalAcknowledgments: 0,
      viewDetails: [],
      acknowledgmentDetails: [],
    });
    
    const loadStats = async () => {
      if (!$api || !props.announcement) return;
      
      isLoading.value = true;
      try {
        const response = await $api.get(`announcement/${props.announcement.id}/stats`);
        stats.value = response.data;
      } catch (error) {
        handleAxiosError(q, error as AxiosError);
      } finally {
        isLoading.value = false;
      }
    };
    
    const formatDateTime = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      // Less than 1 minute
      if (diffInSeconds < 60) return 'just now';
      
      // Less than 1 hour
      if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      }
      
      // Less than 24 hours
      if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      }
      
      // Less than 7 days
      if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
      }
      
      // Format as date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };
    
    const onHide = () => {
      emit('hide');
      // Reset state
      activeTab.value = 'views';
      stats.value = {
        totalViews: 0,
        totalAcknowledgments: 0,
        viewDetails: [],
        acknowledgmentDetails: [],
      };
    };
    
    watch(() => props.modelValue, (newValue) => {
      if (newValue && props.announcement) {
        loadStats();
      }
    });
    
    return {
      show,
      activeTab,
      isLoading,
      stats,
      formatDateTime,
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

:deep(.q-tab) {
  text-transform: none;
  font-weight: 500;
}

:deep(.q-tab__label) {
  font-size: 14px;
}

:deep(.q-item) {
  padding: 12px 16px;
}

:deep(.q-tab-panels) {
  background-color: transparent !important;
  max-height: 400px;
  overflow-y: auto;
}

// Ensure card sections have correct background
:deep(.q-card__section) {
  background-color: transparent !important;
}

// MD3 Typography
.text-headline-small {
  font-size: 24px;
  font-weight: 400;
  line-height: 32px;
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

.text-label-large {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: 0.1px;
}

.text-label-small {
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 0.5px;
}

// MD3 Colors
.text-on-surface {
  color: var(--q-on-surface);
}

.text-on-surface-variant {
  color: var(--q-on-surface-variant);
}
</style>
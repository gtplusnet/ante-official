<template>
  <q-dialog
    ref="drawer"
    :model-value="modelValue"
    @update:model-value="updateDialogValue"
    position="right"
    maximized
    class="announcement-dialog"
  >
    <q-card class="announcement-card">
      <div bordered class="rounded-borders">
        <!-- Header -->
        <q-item-label header class="announcement-header">
          <div class="row items-center">
            <!-- Close button - only visible on mobile/tablet -->
            <q-btn
              v-if="isMobileOrTablet"
              flat
              round
              dense
              icon="close"
              class="q-mr-sm"
              @click="closePanel"
            />
            <span class="text-black text-title-medium">Announcements</span>
          </div>
        </q-item-label>
        <q-separator />

        <div class="announcement-wrapper">
          <!-- Loading State -->
          <template v-if="isLoading">
            <div v-for="i in 3" :key="`skeleton-${i}`" class="announcement-skeleton q-pa-md">
              <div class="skeleton-header row items-center q-mb-sm">
                <q-skeleton type="QAvatar" size="40px" />
                <div class="q-ml-md col">
                  <q-skeleton type="text" width="150px" height="20px" />
                  <q-skeleton type="text" width="80px" height="14px" class="q-mt-xs" />
                </div>
              </div>
              <q-skeleton type="text" class="q-mt-sm" />
              <q-skeleton type="text" width="80%" />
              <div class="skeleton-footer row items-center justify-between q-mt-sm">
                <q-skeleton type="text" width="100px" height="16px" />
                <q-skeleton type="QBtn" size="24px" />
              </div>
            </div>
          </template>

          <!-- Empty State -->
          <template v-else-if="!isLoading && announcements.length === 0">
            <div class="empty-state q-pa-xl text-center">
              <q-icon name="o_campaign" size="64px" color="grey-5" />
              <div class="text-h6 q-mt-md text-grey-7">No Announcements Yet</div>
              <div class="text-body2 text-grey-6 q-mt-sm">
                Stay tuned! Important updates and announcements will appear here once published.
              </div>
            </div>
          </template>

          <!-- Announcements List -->
          <template v-else>
            <global-widget-card-box
              v-for="announcement in paginatedAnnouncements"
              :key="announcement.id"
              @click="handleAnnouncementClick(announcement)"
            >
              <div class="row items-center justify-between q-pb-xs">
                <global-widget-card-box-title
                  :title="announcement.title"
                  :icon="'campaign'"
                  :iconColor="'#615FF6'"
                />
              </div>
              <div class="row align-center justify-between">
                <global-widget-card-box-subtitle :value="announcement.content" :max-length="40" />
                <div class="text-body-small text-grey">
                  {{ formatDate(announcement.createdAt) }}
                </div>
              </div>
            </global-widget-card-box>
          </template>
        </div>
      </div>
    </q-card>

    <!-- Announcement Detail Dialog -->
    <ManpowerAnnouncementDetailDialog
      v-model="isDetailDialogOpen"
      :announcement="selectedAnnouncement"
      @hide="selectedAnnouncement = null"
    />
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';
import { AxiosError } from 'axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';
import ManpowerAnnouncementDetailDialog from 'src/pages/Member/Manpower/dialogs/ManpowerAnnouncementDetailDialog.vue';
import GlobalWidgetCardBoxTitle from 'src/components/shared/global/GlobalWidgetCardBoxTitle.vue';
import GlobalWidgetCardBoxSubtitle from 'src/components/shared/global/GlobalWidgetCardBoxSubtitle.vue';
import GlobalWidgetCardBox from 'src/components/shared/global/GlobalWidgetCardBox.vue';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  priority: string;
  createdAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    fullName?: string;
  };
  viewCount: number;
  acknowledgmentCount: number;
  isViewed?: boolean;
  isAcknowledged?: boolean;
  icon?: string;
  iconColor?: string;
  isActive?: boolean;
}

export default defineComponent({
  name: 'AnnouncementPanel',
  components: {
    ManpowerAnnouncementDetailDialog,
    GlobalWidgetCardBox,
    GlobalWidgetCardBoxTitle,
    GlobalWidgetCardBoxSubtitle,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const instance = getCurrentInstance();
    const $api = instance?.proxy?.$api;
    const $q = useQuasar();
    const announcements = ref<Announcement[]>([]);
    const isLoading = ref(false);
    const totalAnnouncements = ref(0);
    const currentPage = ref(1);
    const isDetailDialogOpen = ref(false);
    const selectedAnnouncement = ref<Announcement | null>(null);

    // Computed
    const isMobileOrTablet = computed(() => {
      return $q.platform.is.mobile || window.innerWidth <= 768;
    });

    const paginatedAnnouncements = computed(() => {
      return announcements.value;
    });

    // Methods
    const updateDialogValue = (value: boolean) => {
      emit('update:modelValue', value);
    };

    const closePanel = () => {
      emit('update:modelValue', false);
    };

    const loadAnnouncements = async () => {
      if (!$api) return;
      isLoading.value = true;
      try {
        const response = await $api.get('announcement', {
          params: {
            page: 1,
            limit: 100, // Load all announcements
            isActive: true,
          },
        });

        console.log('Announcement API Response:', response.data);

        // Handle the response structure properly
        // The backend returns { data: [], total: number } directly
        if (response.data && Array.isArray(response.data.data)) {
          announcements.value = response.data.data;
          totalAnnouncements.value = response.data.total || 0;
        } else if (response.data && Array.isArray(response.data)) {
          // Direct array response
          announcements.value = response.data;
          totalAnnouncements.value = response.data.length;
        } else {
          announcements.value = [];
          totalAnnouncements.value = 0;
        }

        console.log('Total Announcements:', totalAnnouncements.value);
        console.log('Current Page:', currentPage.value);

        // Track views for displayed announcements
        announcements.value.forEach((announcement) => {
          if (!announcement.isViewed) {
            trackView(announcement.id);
          }
        });
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      } finally {
        isLoading.value = false;
      }
    };

    const trackView = async (announcementId: number) => {
      if (!$api) return;
      try {
        await $api.post(`announcement/${announcementId}/view`);
      } catch (error) {
        console.error('Failed to track view:', error);
      }
    };

    const toggleAcknowledgment = async (announcement: Announcement) => {
      if (!$api) return;
      try {
        await $api.post(`announcement/${announcement.id}/acknowledge`);
        await loadAnnouncements();
      } catch (error) {
        handleAxiosError($q, error as AxiosError);
      }
    };

    const handleAnnouncementClick = (announcement: Announcement) => {
      selectedAnnouncement.value = announcement;
      isDetailDialogOpen.value = true;
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60));
          return diffMinutes === 0 ? 'Just now' : `${diffMinutes}m ago`;
        }
        return `${diffHours}h ago`;
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    };

    const truncateContent = (content: string, maxLength = 150) => {
      if (content.length <= maxLength) return content;
      return content.substring(0, maxLength) + '...';
    };

    const getAnnouncementIcon = (type: string) => {
      const iconMap: Record<string, string> = {
        general: 'campaign',
        info: 'info',
        warning: 'warning',
        error: 'error',
        celebration: 'celebration',
        meeting: 'groups',
        deadline: 'event',
        reminder: 'alarm',
        update: 'update',
        policy: 'policy',
      };
      return iconMap[type] || 'campaign';
    };

    const getIconColor = (type: string) => {
      const colorMap: Record<string, string> = {
        general: 'primary',
        info: 'info',
        warning: 'warning',
        error: 'negative',
        celebration: 'positive',
        meeting: 'secondary',
        deadline: 'accent',
        reminder: 'orange',
        update: 'teal',
        policy: 'deep-purple',
      };
      return colorMap[type] || 'primary';
    };

    const getPriorityColor = (priority: string) => {
      const colorMap: Record<string, string> = {
        LOW: 'grey',
        MEDIUM: 'warning',
        HIGH: 'orange',
        URGENT: 'negative',
      };
      return colorMap[priority] || 'grey';
    };

    const getCreatorName = (createdBy: any) => {
      if (!createdBy) return 'System';
      if (createdBy.fullName) return createdBy.fullName;

      const firstName = createdBy.firstName || '';
      const lastName = createdBy.lastName || '';
      const middleName = createdBy.middleName || '';

      if (firstName || lastName) {
        return `${firstName} ${middleName ? middleName[0] + '. ' : ''}${lastName}`.trim();
      }
      return 'System';
    };

    // Watch for dialog open/close
    watch(
      () => props.modelValue,
      (newVal) => {
        if (newVal) {
          loadAnnouncements();
        }
      }
    );

    onMounted(() => {
      if (props.modelValue) {
        loadAnnouncements();
      }
    });

    return {
      announcements,
      isLoading,
      totalAnnouncements,
      paginatedAnnouncements,
      isDetailDialogOpen,
      selectedAnnouncement,
      isMobileOrTablet,
      updateDialogValue,
      closePanel,
      toggleAcknowledgment,
      handleAnnouncementClick,
      formatDate,
      truncateContent,
      getAnnouncementIcon,
      getIconColor,
      getPriorityColor,
      getCreatorName,
    };
  },
});
</script>

<style scoped src="./AnnouncementPanel.scss"></style>

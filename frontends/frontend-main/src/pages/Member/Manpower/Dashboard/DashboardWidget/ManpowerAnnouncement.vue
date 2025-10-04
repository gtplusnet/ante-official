<template>
  <div>
    <GlobalWidgetCard class="announcement-panel-container">
      <!-- Title -->
      <template #title>Announcements</template>
      <!-- Actions -->
      <template #actions v-if="!isMainDashboard">
        <GButton color="light-grey" size="sm" round variant="text" icon="add" icon-size="sm">
          <q-menu auto-close anchor="bottom end" self="top end">
            <q-list>
              <div class="q-item cursor-pointer" clickable @click="handleCreateAnnouncement">
                <div class="row items-center">
                  <q-icon name="campaign" :style="{ color: '#615FF6', fontSize: '20px' }" />
                  <div class="q-ml-sm text-label-medium">Create New Announcement</div>
                </div>
              </div>
              <div class="q-item cursor-pointer" clickable @click="handleViewCalendar">
                <div class="row items-center">
                  <q-icon name="calendar_month" :style="{ color: '#FB8C00', fontSize: '20px' }" />
                  <div class="q-ml-sm text-label-medium">View Calendar</div>
                </div>
              </div>
            </q-list>
          </q-menu>
        </GButton>
      </template>

      <!-- Content -->
      <template #content>
        <div class="announcement-wrapper">
        <!-- Empty Content -->
        <global-widget-card-empty-content v-if="!isLoading && announcements.length === 0" image="/images/empty-content-announcement.webp">
          <template #title>No Announcements Yet.</template>
          <template #description>Stay tuned! Important updates and announcements will appear here once published.</template>
        </global-widget-card-empty-content>

        <!-- Skeleton Loader -->
        <template v-if="isLoading">
          <div v-for="i in pageSize" :key="`skeleton-${i}`" class="announcement-skeleton">
            <div class="skeleton-header">
              <div class="skeleton-icon-title">
                <q-skeleton type="QAvatar" size="40px" />
                <div class="skeleton-title-date">
                  <q-skeleton type="text" width="150px" height="20px" />
                  <q-skeleton type="text" width="80px" height="14px" />
                </div>
              </div>
              <q-skeleton type="QBtn" size="32px" />
            </div>
            <q-skeleton type="text" class="q-mt-sm" />
            <q-skeleton type="text" width="80%" />
            <div class="skeleton-footer">
              <q-skeleton type="text" width="60px" height="16px" />
              <q-skeleton type="QBtn" size="32px" />
            </div>
          </div>
        </template>

        <!-- Announcements -->
        <template v-else-if="announcements.length > 0">
          <global-widget-card-box v-for="announcement in paginatedAnnouncements" :key="announcement.id" class="announcement-box">
            <div class="row items-center justify-between">
              <global-widget-card-box-title :title="announcement.title" :icon="'campaign'" :iconColor="'#615FF6'" />
              <div class="row items-center">
                <!-- More Button -->
                <GButton color="light-grey" size="sm" round variant="text" icon="more_vert" icon-size="sm">
                  <q-menu auto-close anchor="bottom end" self="top end">
                    <q-list>
                      <div class="cursor-pointer" @click="handleEditAnnouncement(announcement)">
                        <div class="q-pa-sm row items-center">
                          <q-icon name="edit" size="18px" class="text-grey" />
                          <div class="q-ml-sm text-label-medium text-grey">Edit</div>
                        </div>
                      </div>
                      <div class="cursor-pointer" @click="handleDeleteAnnouncement(announcement.id)">
                        <div class="q-pa-sm row items-center">
                          <q-icon name="delete" size="18px" class="text-grey" />
                          <div class="q-ml-sm text-label-medium text-grey">Delete</div>
                        </div>
                      </div>
                    </q-list>
                  </q-menu>
                </GButton>
              </div>
            </div>
            <div class="row align-center justify-between">
              <global-widget-card-box-subtitle :value="announcement.content" :max-length="40" />
              <div class="text-body-small text-grey">{{ formatDate(announcement.createdAt) }}</div>
            </div>
            <div class="row items-center justify-between q-mt-xs">
              <div v-if="announcement.viewCount > 0 || announcement.acknowledgmentCount > 0" class="social-interaction-info" @click="showStats(announcement)">
                <span class="text-body-small text-grey">
                  <span v-if="announcement.viewCount > 0">{{ announcement.viewCount }} view{{ announcement.viewCount !== 1 ? 's' : '' }}</span>
                  <span v-if="announcement.viewCount > 0 && announcement.acknowledgmentCount > 0"> · </span>
                  <span v-if="announcement.acknowledgmentCount > 0">{{ announcement.acknowledgmentCount }} like{{ announcement.acknowledgmentCount !== 1 ? 's' : '' }}</span>
                </span>
              </div>

              <!-- Acknowledge Button -->
              <div class="q-mr-xs row align-center justify-end">
                <q-icon v-if="!announcement.isAcknowledged" @click="trackAcknowledgment(announcement.id)" name="thumb_up_off_alt" size="18px" color="grey">
                  <q-tooltip>Acknowledge</q-tooltip>
                </q-icon>
                <q-icon v-else name="thumb_up" size="18px" color="primary" class="acknowledged-icon">
                  <q-tooltip>Acknowledged</q-tooltip>
                </q-icon>
              </div>
            </div>
          </global-widget-card-box>
        </template>
      </div>
    </template>

      <!-- Footer -->
      <template #footer>
        <global-widget-pagination
          :pagination="{
            currentPage: currentPage,
            totalItems: totalAnnouncements,
            itemsPerPage: pageSize,
          }"
          @update:page="handlePageChange"
        />
      </template>
    </GlobalWidgetCard>

    <!-- Create/Edit Announcement Dialog -->
    <ManpowerCreateAnnouncementDialog
      v-model="isCreateAnnouncementDialogOpen"
      :announcement="selectedAnnouncement || undefined"
      @created="loadAnnouncements"
      @updated="loadAnnouncements"
      @hide="selectedAnnouncement = null"
    />

    <!-- Announcement Stats Dialog -->
    <ManpowerAnnouncementStatsDialog v-model="isStatsDialogOpen" :announcement="selectedAnnouncementForStats || undefined" @hide="selectedAnnouncementForStats = null" />
  </div>
</template>

<script lang="ts">
import GlobalWidgetCard from 'src/components/shared/global/GlobalWidgetCard.vue';
import GlobalWidgetCardBox from 'src/components/shared/global/GlobalWidgetCardBox.vue';
import GlobalWidgetCardBoxTitle from 'src/components/shared/global/GlobalWidgetCardBoxTitle.vue';
import GlobalWidgetCardBoxSubtitle from 'src/components/shared/global/GlobalWidgetCardBoxSubtitle.vue';
import GlobalWidgetPagination from 'src/components/shared/global/GlobalWidgetPagination.vue';
import GlobalWidgetCardEmptyContent from 'src/components/shared/global/GlobalWidgetCardEmptyContent.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';
import ManpowerCreateAnnouncementDialog from '../../dialogs/ManpowerCreateAnnouncementDialog.vue';
import ManpowerAnnouncementStatsDialog from '../../dialogs/ManpowerAnnouncementStatsDialog.vue';
import { defineComponent, ref, computed, onMounted, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';
import { AxiosError } from 'axios';
import { handleAxiosError } from 'src/utility/axios.error.handler';

interface Announcement {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  icon: string;
  iconColor: string;
  priority: string;
  viewCount: number;
  acknowledgmentCount: number;
  isViewed: boolean;
  isAcknowledged: boolean;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    middleName: string;
  };
}

export default defineComponent({
  name: 'ManpowerAnnouncement',
  components: {
    GlobalWidgetCard,
    GlobalWidgetCardBox,
    GlobalWidgetCardBoxTitle,
    GlobalWidgetCardBoxSubtitle,
    GlobalWidgetPagination,
    GlobalWidgetCardEmptyContent,
    GButton,
    ManpowerCreateAnnouncementDialog,
    ManpowerAnnouncementStatsDialog,
  },
  setup() {
    const instance = getCurrentInstance();
    const $api = instance?.proxy?.$api;
    const q = useQuasar();

    // Check if we're on the main dashboard
    const isMainDashboard = computed(() => {
      return window.location.hash === '#/member/dashboard' || window.location.hash === '#/dashboard';
    });

    const currentPage = ref(1);
    const pageSize = 3;
    const isLoading = ref(false);
    const isCreateAnnouncementDialogOpen = ref(false);
    const isCalendarDialogOpen = ref(false);
    const isStatsDialogOpen = ref(false);
    const selectedAnnouncement = ref<Announcement | null>(null);
    const selectedAnnouncementForStats = ref<Announcement | null>(null);

    const announcements = ref<Announcement[]>([]);
    const totalAnnouncements = ref(0);

    const paginatedAnnouncements = computed(() => {
      return announcements.value;
    });

    const loadAnnouncements = async () => {
      if (!$api) return;
      isLoading.value = true;
      try {
        const response = await $api.get('announcement', {
          params: {
            page: currentPage.value,
            limit: pageSize,
            isActive: true,
          },
        });

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


        // Track views for displayed announcements
        announcements.value.forEach((announcement) => {
          if (!announcement.isViewed) {
            trackView(announcement.id);
          }
        });
      } catch (error) {
        handleAxiosError(q, error as AxiosError);
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

    const trackAcknowledgment = async (announcementId: number) => {
      if (!$api) return;
      try {
        await $api.post(`announcement/${announcementId}/acknowledge`);
        await loadAnnouncements();
      } catch (error) {
        handleAxiosError(q, error as AxiosError);
      }
    };

    const handlePageChange = (page: number) => {
      currentPage.value = page;
      loadAnnouncements();
    };

    const handleCreateAnnouncement = () => {
      isCreateAnnouncementDialogOpen.value = true;
    };

    const handleViewCalendar = () => {
      isCalendarDialogOpen.value = true;
    };

    const handleEditAnnouncement = (announcement: Announcement) => {
      selectedAnnouncement.value = announcement;
      isCreateAnnouncementDialogOpen.value = true;
    };

    const handleDeleteAnnouncement = async (announcementId: number) => {
      q.dialog({
        title: 'Delete Announcement',
        message: 'Are you sure you want to delete this announcement?',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          if (!$api) return;
          await $api.delete(`announcement/${announcementId}`);
          q.notify({
            type: 'positive',
            message: 'Announcement deleted successfully',
          });
          await loadAnnouncements();
        } catch (error) {
          handleAxiosError(q, error as AxiosError);
        }
      });
    };

    const formatDate = (date: string) => {
      const now = new Date();
      const then = new Date(date);
      const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

      if (diffInSeconds < 60) return 'just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
      return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    };

    const showStats = (announcement: Announcement) => {
      selectedAnnouncementForStats.value = announcement;
      isStatsDialogOpen.value = true;
    };

    const getTotalInteractions = (announcement: Announcement) => {
      const total = announcement.viewCount + announcement.acknowledgmentCount;
      if (total === 0) return '';

      // Format like social media (1.2K, 10K, etc.)
      if (total >= 1000000) {
        return `${(total / 1000000).toFixed(1)}M`;
      } else if (total >= 1000) {
        return `${(total / 1000).toFixed(1)}K`;
      }
      return total.toString();
    };

    onMounted(() => {
      loadAnnouncements();
    });

    return {
      currentPage,
      pageSize,
      totalAnnouncements,
      isLoading,
      announcements,
      paginatedAnnouncements,
      handlePageChange,
      handleCreateAnnouncement,
      handleViewCalendar,
      handleEditAnnouncement,
      handleDeleteAnnouncement,
      trackAcknowledgment,
      formatDate,
      showStats,
      getTotalInteractions,
      isCreateAnnouncementDialogOpen,
      isCalendarDialogOpen,
      isStatsDialogOpen,
      selectedAnnouncement,
      selectedAnnouncementForStats,
      loadAnnouncements,
      isMainDashboard,
    };
  },
});
</script>

<style scoped lang="scss">
.announcement-panel-container {
  // Responsive width to match other dashboard widgets
}

.announcement-wrapper {
  min-height: calc(350px - 37px);
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

// Hover effect for clickable text
.hover-underline {
  transition: all 0.2s ease;

  &:hover {
    text-decoration: underline;
    opacity: 0.8;
  }
}

// Text styling
.text-caption {
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  letter-spacing: 0.4px;
}

// MD3 text colors
.text-on-surface-variant {
  color: var(--q-on-surface-variant, #49454f);
}

.text-primary {
  color: var(--q-primary, #6750a4);
}

// Social media style interactions
.social-interaction-info {
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.7;
    text-decoration: underline;
  }
}

// MD3 surface colors
.q-chip[color='surface-container-highest'] {
  background-color: var(--q-surface-container-highest, #e6e0e9) !important;
  color: var(--q-on-surface-variant, #49454e) !important;
}

// Acknowledged icon disabled state
.acknowledged-icon {
  pointer-events: none;
  cursor: not-allowed;
}

// Skeleton loader styles
.announcement-skeleton {
  .skeleton-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .skeleton-icon-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .skeleton-title-date {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .skeleton-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
  }
}
</style>

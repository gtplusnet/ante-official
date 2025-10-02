<template>
  <div>
    <GlobalWidgetCard>
      <!-- Title -->
      <template #title>Updates</template>

      <!-- Title More Actions -->
      <template #more-actions>
        <q-btn flat round dense icon="more_vert" color="grey-7" size="sm" class="task-menu-button">
          <q-menu auto-close anchor="bottom end" self="top end">
            <q-list class="text-label-medium">
              <q-item clickable @click="markAllAsRead()">
                <q-item-section>Mark all as read</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </template>

      <!-- Actions -->
      <template #actions>
        <div class="update-widget-actions">
          <!-- tabs -->
          <div class="update-tabs-wrapper">
            <GlobalWidgetTab :tabs="tabList" v-model="activeTab" @update:modelValue="loadUpdateTab" />
          </div>
          <!-- more -->
          <div class="update-menu-wrapper q-ml-xs">
            <q-btn flat round dense icon="more_vert" color="grey-7" size="sm" class="task-menu-button">
              <q-menu auto-close anchor="bottom end" self="top end">
                <q-list class="text-label-medium">
                  <q-item clickable @click="markAllAsRead()">
                    <q-item-section>Mark all as read</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </template>

      <!-- Content -->
      <template #content>
        <!-- task loading -->
        <div class="update-content">
          <template v-if="isUpdatesListLoading">
            <GlobalLoader />
          </template>
          <template v-else>
            <!-- no task loaded -->
            <div class="q-pa-xl text-center text-label-medium text-grey" v-if="notifications.length == 0">No Updates</div>
            <!-- task loaded -->
            <!-- to be updated for actual status (notification is read == true) -->
            <div class="task-item" :class="data.hasRead ? '' : 'unread'" @click="notificationClickHandler(data)" v-for="data in paginatedNotifications" :key="data.id">
              <div class="row justify-between">
                <div class="row items-center">
                  <div class="task-title text-title-small">
                    <q-icon name="notifications_active" size="18px" class="notif-icon q-mr-sm" />
                    <span class="name">{{ formatWord(data.notificationSender.firstName) }} {{ formatWord(data.notificationSender.lastName) }}</span>
                  </div>
                  <div class="text-title-small q-ml-xs">{{ data.notificationData.code.message }}</div>
                </div>
                <div class="task-assignee text-label-medium">
                  <q-tooltip>Project Name:</q-tooltip>
                  {{ data.project?.name }}
                </div>
              </div>

              <div class="row justify-between">
                <div class="text-body-small text-grey-6">{{ truncate(data.notificationData.content, 'NOTIFICATION_CONTENT') }}</div>
                <div class="task-date text-label-small">
                  {{ data.notificationData.createdAt.timeAgo }}
                </div>
              </div>
            </div>
          </template>
        </div>
      </template>

      <!-- Footer -->
      <template #footer>
        <GlobalWidgetPagination
          :pagination="{
            currentPage: pagination.page,
            totalItems: notifications.length,
            itemsPerPage: pagination.rowsPerPage,
          }"
          @update:page="handlePageChange"
        />
      </template>
    </GlobalWidgetCard>
  </div>
</template>

<style scoped lang="scss" src="./NotificationWidget.scss"></style>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import GlobalLoader from '../../../../components/shared/common/GlobalLoader.vue';
import GlobalWidgetCard from '../../../../components/shared/global/GlobalWidgetCard.vue';
import GlobalWidgetTab from '../../../../components/shared/global/GlobalWidgetTab.vue';
import GlobalWidgetPagination from '../../../../components/shared/global/GlobalWidgetPagination.vue';
import { useNotifications } from '../../../../composables/useNotifications';
import { formatWord } from 'src/utility/formatter';
import { truncate } from 'src/utility/formatter';

// Define interfaces for our data structures
interface Tab {
  key: string;
  title: string;
}

interface Pagination {
  page: number;
  rowsPerPage: number;
}

export default defineComponent({
  name: 'NotificationWidget',
  components: {
    GlobalLoader,
    GlobalWidgetCard,
    GlobalWidgetTab,
    GlobalWidgetPagination,
  },
  emits: ['update-notification-count'],
  setup(_, { emit }) {
    // Widget-specific state
    const activeTab = ref('all');

    // Methods
    const loadUpdateTab = async (tab: string): Promise<void> => {
      activeTab.value = tab;
      
      // Set filter without API call if notifications are already loaded
      if (allNotifications.value.length > 0) {
        if (tab === 'unread') {
          setFilter('unread');
        } else if (tab === 'read') {
          setFilter('read');
        } else {
          setFilter('all');
        }
        // Reset pagination when switching tabs
        pagination.value.page = 1;
      } else {
        // First load - fetch from API
        const params = tab === 'unread' ? { isRead: false } : tab === 'read' ? { isRead: true } : undefined;
        await getNotifications(params);
        pagination.value.page = 1;
      }
    };

    // Callback to refresh current tab after notification is read
    const refreshCurrentTab = () => {
      // Just update the filter, no need to reload from API
      if (activeTab.value === 'unread') {
        setFilter('unread');
      } else if (activeTab.value === 'read') {
        setFilter('read');
      } else {
        setFilter('all');
      }
      // Reset to first page if current page is now empty
      const totalPages = Math.ceil(notifications.value.length / pagination.value.rowsPerPage);
      if (pagination.value.page > totalPages && totalPages > 0) {
        pagination.value.page = 1;
      }
    };

    // Use the shared composable
    const { notifications, allNotifications, isLoading: isUpdatesListLoading, getNotifications, setFilter, notificationClickHandler, markAllAsRead, watchSocketEvent } = useNotifications(emit, refreshCurrentTab);

    const tabList: Tab[] = [
      {
        key: 'unread',
        title: 'Unread',
      },
      {
        key: 'read',
        title: 'Read',
      },
      {
        key: 'all',
        title: 'All',
      },
    ];

    const pagination = ref<Pagination>({
      page: 1,
      rowsPerPage: 5,
    });

    // Computed properties
    const maxPages = computed(() => {
      return Math.ceil(notifications.value.length / pagination.value.rowsPerPage);
    });

    const paginatedNotifications = computed(() => {
      const start = (pagination.value.page - 1) * pagination.value.rowsPerPage;
      const end = start + pagination.value.rowsPerPage;
      return notifications.value.slice(start, end);
    });

    const handlePageChange = (newPage: number) => {
      pagination.value.page = newPage;
    };

    // Lifecycle hooks
    onMounted(() => {
      loadUpdateTab('all');
      watchSocketEvent();
    });

    return {
      notifications,
      activeTab,
      isUpdatesListLoading,
      tabList,
      pagination,
      maxPages,
      paginatedNotifications,
      loadUpdateTab,
      allNotifications,
      setFilter,
      notificationClickHandler,
      markAllAsRead,
      formatWord,
      truncate,
      handlePageChange,
    };
  },
});
</script>

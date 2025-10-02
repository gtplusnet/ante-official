<template>
  <div>
    <GlobalWidgetCard :no-content-top-padding="true" :no-header-bottom-padding="true">
      <!-- Title -->
      <template #title>Lead Updates</template>

      <template #actions>
        <!-- more -->
        <div class="col-auto">
          <q-btn color="grey-7" size="sm" round flat>
            <q-icon name="more_vert" size="25px" />
            <q-menu auto-close anchor="bottom end" self="top end">
              <q-list class="text-label-medium">
                <q-item clickable @click="markAllAsRead">
                  <q-item-section>Mark All as Read</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </template>

      <!-- Content -->
      <template #content>
        <div class="row items-center no-wrap q-mb-sm">
          <!-- tabs -->
          <div class="tabs">
            <GlobalWidgetTab :tabs="tabList" v-model="activeTab" @update:modelValue="handleTabChange" />
          </div>
        </div>
        
        <div class="lead-updates-content">
          <!-- No updates -->
          <div class="q-pa-xl text-center text-label-medium text-grey" v-if="paginatedUpdateList.length === 0">
            No Lead Updates
          </div>

          <!-- Updates list -->
          <global-widget-card-box v-for="update in paginatedUpdateList" :key="update.id" :class="['update-item', { 'update-item--unread': !update.isRead }]">
            <!-- Header -->
            <div class="row items-center">
              <q-icon
                :name="update.isRead ? 'o_notifications_none' : 'notifications'"
                :color="update.isRead ? 'grey' : 'secondary'"
                size="20px"
              />
              <span :class="['text-title-small q-ml-sm', update.isRead ? 'text-grey' : 'text-dark']">
                {{ update.employeeName }}
              </span>
              <span :class="['text-body-small q-ml-xs', update.isRead ? 'text-grey-light' : 'text-dark']">
                {{ update.action }}
              </span>
            </div>

            <!-- Description and time -->
            <div class="row items-center justify-between">
              <div :class="['text-label-small-w-[400]', update.isRead ? 'text-grey-light' : 'text-dark']">
                {{ truncateDescription(update.description) }}
              </div>
              <div :class="['text-label-small-w-[400]', update.isRead ? 'text-grey-light' : 'text-dark']">
                {{ update.timeAgo }}
              </div>
            </div>
          </global-widget-card-box>
        </div>
      </template>

      <!-- Footer -->
      <template #footer>
        <GlobalWidgetPagination
          :pagination="{
            currentPage: pagination.page,
            totalItems: filteredUpdateList.length,
            itemsPerPage: pagination.rowsPerPage,
          }"
          @update:page="handlePageChange"
        />
      </template>
    </GlobalWidgetCard>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import GlobalWidgetCard from "src/components/shared/global/GlobalWidgetCard.vue";
import GlobalWidgetTab from "src/components/shared/global/GlobalWidgetTab.vue";
import GlobalWidgetPagination from "src/components/shared/global/GlobalWidgetPagination.vue";
import GlobalWidgetCardBox from "src/components/shared/global/GlobalWidgetCardBox.vue";
interface LeadUpdate {
  id: number;
  employeeName: string;
  action: string;
  description: string;
  timeAgo: string;
  isRead: boolean;
}

export default defineComponent({
  name: "LeadUpdatesWidget",
  components: {
    GlobalWidgetCard,
    GlobalWidgetTab,
    GlobalWidgetPagination,
    GlobalWidgetCardBox,
  },
  setup() {
    const activeTab = ref("all");

    const tabList = ref([
      { key: "all", title: "All" },
      { key: "unread", title: "Unread" },
      { key: "read", title: "Read" },
    ]);

    const pagination = ref({
      page: 1,
      rowsPerPage: 5,
    });

    // Mock data
    const updateList = ref<LeadUpdate[]>([
      {
        id: 1,
        employeeName: "Employee Name",
        action: "Sent you a filing approval request",
        description: "Card description goes here Lorem ipsum dolor sit amet consectetur adipiscing elit",
        timeAgo: "6 hours ago",
        isRead: false,
      },
      {
        id: 2,
        employeeName: "Employee Name",
        action: "Sent you a filing approval request",
        description: "Card description goes here Lorem ipsum dolor sit amet consectetur adipiscing elit",
        timeAgo: "6 hours ago",
        isRead: false,
      },
      {
        id: 3,
        employeeName: "Employee Name",
        action: "Sent you a filing approval request",
        description: "Card description goes here Lorem ipsum dolor sit amet consectetur adipiscing elit",
        timeAgo: "6 hours ago",
        isRead: true,
      },
      {
        id: 4,
        employeeName: "Employee Name",
        action: "Sent you a filing approval request",
        description: "Card description goes here Lorem ipsum dolor sit amet consectetur adipiscing elit",
        timeAgo: "6 hours ago",
        isRead: true,
      },
      {
        id: 5,
        employeeName: "Employee Name",
        action: "Sent you a filing approval request",
        description: "Card description goes here Lorem ipsum dolor sit amet consectetur adipiscing elit",
        timeAgo: "6 hours ago",
        isRead: true,
      },
      {
        id: 6,
        employeeName: "John Doe",
        action: "Updated lead status",
        description: "Lead status changed from Prospect to Qualified",
        timeAgo: "8 hours ago",
        isRead: false,
      },
      {
        id: 7,
        employeeName: "Jane Smith",
        action: "Added a new comment",
        description:
          "Customer is interested in premium package options Lorem ipsum dolor sit amet consectetur adipiscing elit",
        timeAgo: "1 day ago",
        isRead: true,
      },
    ]);

    const filteredUpdateList = computed(() => {
      if (activeTab.value === "all") {
        return updateList.value;
      } else if (activeTab.value === "unread") {
        return updateList.value.filter((update) => !update.isRead);
      } else if (activeTab.value === "read") {
        return updateList.value.filter((update) => update.isRead);
      }
      return updateList.value;
    });

    const paginatedUpdateList = computed(() => {
      const start = (pagination.value.page - 1) * pagination.value.rowsPerPage;
      const end = start + pagination.value.rowsPerPage;
      return filteredUpdateList.value.slice(start, end);
    });

    const handleTabChange = (tab: string) => {
      activeTab.value = tab;
      pagination.value.page = 1; // Reset to first page when changing tabs
    };

    const handlePageChange = (page: number) => {
      pagination.value.page = page;
    };

    const markAllAsRead = () => {
      updateList.value.forEach((update) => {
        update.isRead = true;
      });
    };

    const truncateDescription = (description: string) => {
      if (description.length <= 50) {
        return description;
      }
      return description.substring(0, 50) + "...";
    };

    return {
      activeTab,
      tabList,
      pagination,
      updateList,
      filteredUpdateList,
      paginatedUpdateList,
      handleTabChange,
      handlePageChange,
      markAllAsRead,
      truncateDescription,
    };
  },
});
</script>

<style scoped lang="scss">
.lead-updates-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 345px;
  overflow-y: auto;
}

.update-item {
  background-color: var(--q-extra-lighter);
}

.update-item--unread {
  background-color: #DDE1F066;
}
</style>

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
          <!-- Loading skeleton -->
          <div v-if="loading">
            <q-skeleton type="rect" height="60px" class="q-mb-sm" v-for="i in pagination.rowsPerPage" :key="i" />
          </div>

          <!-- No updates -->
          <div v-else-if="paginatedUpdateList.length === 0" class="q-pa-xl text-center text-label-medium text-grey">
            No Lead Updates
          </div>

          <!-- Updates list -->
          <global-widget-card-box v-else v-for="update in paginatedUpdateList" :key="update.id" :class="['update-item', { 'update-item--unread': !update.isRead }]" @click="handleUpdateClick(update)">
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
              <span :class="['text-body-small q-ml-xs text-action', update.isRead ? 'text-grey-light' : 'text-dark']">
                {{ update.action }}
              </span>
            </div>

            <!-- Description and time -->
            <div class="row items-center justify-between">
              <div :class="['text-label-small-w-[400] text-description', update.isRead ? 'text-grey-light' : 'text-dark']">
                {{ update.description }}
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
          v-if="!loading"
          :pagination="{
            currentPage: pagination.page,
            totalItems: totalItems,
            itemsPerPage: pagination.rowsPerPage,
          }"
          @update:page="handlePageChange"
        />
      </template>
    </GlobalWidgetCard>

    <!-- Company Dialog -->
    <LeadCompanyDialog
      v-model="isCompanyDialogOpen"
      :company="editingCompany"
      :loading="companyDialogLoading"
      :view-only="true"
      @submit="handleCompanySubmit"
    />

    <!-- Point of Contact Dialog -->
    <AddEditPointOfContactDialog
      ref="pointOfContactDialogRef"
      :contact-id="editingContactId"
      :view-only="true"
      @updated="handleContactUpdated"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, defineAsyncComponent, getCurrentInstance } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { APIRequests } from "src/utility/api.handler";
import GlobalWidgetCard from "src/components/shared/global/GlobalWidgetCard.vue";
import GlobalWidgetTab from "src/components/shared/global/GlobalWidgetTab.vue";
import GlobalWidgetPagination from "src/components/shared/global/GlobalWidgetPagination.vue";
import GlobalWidgetCardBox from "src/components/shared/global/GlobalWidgetCardBox.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const LeadCompanyDialog = defineAsyncComponent(() =>
  import("../../Companies/LeadCompanyDialog.vue")
);
const AddEditPointOfContactDialog = defineAsyncComponent(() =>
  import("../../People/dialogs/AddEditPointOfContactDialog.vue")
);

interface LeadUpdate {
  id: number;
  employeeName: string;
  action: string;
  description: string;
  timeAgo: string;
  isRead: boolean;
  entityId: number;
  entityType: string;
  activityType: string;
}

export default defineComponent({
  name: "LeadUpdatesWidget",
  components: {
    GlobalWidgetCard,
    GlobalWidgetTab,
    GlobalWidgetPagination,
    GlobalWidgetCardBox,
    LeadCompanyDialog,
    AddEditPointOfContactDialog,
  },
  setup() {
    const $q = useQuasar();
    const router = useRouter();
    const instance = getCurrentInstance();
    const $api = instance?.appContext.config.globalProperties.$api;
    const activeTab = ref("all");
    const loading = ref(false);
    const updateList = ref<LeadUpdate[]>([]);
    const totalItems = ref(0);

    const tabList = ref([
      { key: "all", title: "All" },
      { key: "unread", title: "Unread" },
      { key: "read", title: "Read" },
    ]);

    const pagination = ref({
      page: 1,
      rowsPerPage: 5,
    });

    // Dialog state management
    const isCompanyDialogOpen = ref(false);
    const editingCompanyId = ref<number | undefined>();
    const editingCompany = ref<any>(null);
    const companyDialogLoading = ref(false);
    const pointOfContactDialogRef = ref<any>(null);
    const editingContactId = ref<number | undefined>();

    const formatTimeAgo = (date: Date): string => {
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

      const intervals: { [key: string]: number } = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
      };

      for (const [name, secondsInInterval] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInInterval);
        if (interval >= 1) {
          return interval === 1 ? `1 ${name} ago` : `${interval} ${name}s ago`;
        }
      }

      return 'just now';
    };

    const loadActivities = async () => {
      try {
        loading.value = true;

        const response = await APIRequests.getCRMActivities($q, {
          page: pagination.value.page.toString(),
          limit: pagination.value.rowsPerPage.toString(),
          filter: activeTab.value,
        });

        if (response && response.activities) {
          updateList.value = response.activities.map((activity: any) => ({
            id: activity.id,
            employeeName: activity.performedBy.name,
            action: activity.description,
            description: activity.description,
            timeAgo: formatTimeAgo(new Date(activity.createdAt)),
            isRead: activity.isRead,
            entityId: activity.entityId,
            entityType: activity.entityType,
            activityType: activity.activityType,
          }));

          totalItems.value = response.pagination.total;
        }
      } catch (error) {
        console.error("[LeadUpdatesWidget] Failed to load activities:", error);
        $q.notify({
          type: "negative",
          message: "Failed to load lead updates",
          position: "top",
        });
      } finally {
        loading.value = false;
      }
    };

    const filteredUpdateList = computed(() => {
      return updateList.value;
    });

    const paginatedUpdateList = computed(() => {
      return updateList.value;
    });

    const handleTabChange = async (tab: string) => {
      activeTab.value = tab;
      pagination.value.page = 1;
      await loadActivities();
    };

    const handlePageChange = async (page: number) => {
      pagination.value.page = page;
      await loadActivities();
    };

    const markAllAsRead = async () => {
      try {
        await APIRequests.markAllCRMActivitiesAsRead($q);
        await loadActivities();
        $q.notify({
          type: "positive",
          message: "All activities marked as read",
          position: "top",
        });
      } catch (error) {
        console.error("[LeadUpdatesWidget] Failed to mark all as read:", error);
        $q.notify({
          type: "negative",
          message: "Failed to mark all as read",
          position: "top",
        });
      }
    };

    const openCompanyDialog = async (companyId: number) => {
      if (!$api) return;

      try {
        companyDialogLoading.value = true;
        const response = await $api.get(`/lead-company/${companyId}`);
        if (response?.data) {
          editingCompany.value = response.data;
          editingCompanyId.value = companyId;
          isCompanyDialogOpen.value = true;
        }
      } catch (error) {
        console.error("[LeadUpdatesWidget] Failed to load company:", error);
        $q.notify({
          type: "negative",
          message: "Failed to load company details",
          position: "top",
        });
      } finally {
        companyDialogLoading.value = false;
      }
    };

    const openPointOfContactDialog = (contactId: number) => {
      editingContactId.value = contactId;
      if (pointOfContactDialogRef.value) {
        pointOfContactDialogRef.value.show();
      }
    };

    const handleCompanySubmit = async (companyData: any) => {
      // The company dialog handles the submission
      // Just refresh the activities after the dialog closes
      await loadActivities();
    };

    const handleContactUpdated = async () => {
      // Refresh activities after contact is updated
      await loadActivities();
    };

    const handleUpdateClick = async (update: LeadUpdate) => {
      try {
        // Mark the activity as read
        if (!update.isRead) {
          await APIRequests.markCRMActivityAsRead($q, update.id.toString());

          // Update local state immediately for real-time UI update
          const activityIndex = updateList.value.findIndex((item: LeadUpdate) => item.id === update.id);
          if (activityIndex !== -1) {
            updateList.value[activityIndex].isRead = true;
          }
        }

        // Handle DELETE activity - just refresh
        if (update.activityType === "DELETE" || update.activityType.toUpperCase() === "DELETE") {
          await loadActivities();
          return;
        }

        // Route based on entityType
        switch (update.entityType) {
          case "LEAD_COMPANY":
            // Open company dialog
            await openCompanyDialog(update.entityId);
            break;

          case "POINT_OF_CONTACT":
            // Open point of contact dialog
            openPointOfContactDialog(update.entityId);
            break;

          case "RELATIONSHIP_OWNER":
            // Just mark as read (happens automatically above), no dialog needed
            break;

          case "LEAD_DEAL":
          case "LEAD":
          default:
            // Existing behavior - navigate to deals page for leads
            try {
              const leadInfo = await APIRequests.getLeadInformation($q, { id: update.entityId.toString() });

              // Check if lead is deleted
              if (leadInfo.isDeleted) {
                await loadActivities();
                return;
              }

              // Lead exists and is not deleted, navigate to deals page
              await router.push({
                name: "member_leads_deals",
                query: {
                  leadId: update.entityId.toString(),
                  activityType: update.activityType,
                },
              });
            } catch (leadError: any) {
              // Lead doesn't exist (404 or error), just refresh the list
              await loadActivities();
            }
            break;
        }
      } catch (error) {
        console.error("[LeadUpdatesWidget] Failed to handle update click:", error);
      }
    };

    onMounted(async () => {
      await loadActivities();
    });

    return {
      activeTab,
      tabList,
      pagination,
      loading,
      updateList,
      totalItems,
      filteredUpdateList,
      paginatedUpdateList,
      handleTabChange,
      handlePageChange,
      markAllAsRead,
      handleUpdateClick,
      // Dialog state
      isCompanyDialogOpen,
      editingCompany,
      companyDialogLoading,
      pointOfContactDialogRef,
      editingContactId,
      // Dialog handlers
      handleCompanySubmit,
      handleContactUpdated,
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

.text-action {
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-wrap: nowrap;
}

.text-description {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-wrap: nowrap;
}

.update-item {
  background-color: var(--q-extra-lighter);
  cursor: pointer;
  transition: all 0.2s ease;
}
</style>

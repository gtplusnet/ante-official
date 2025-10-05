<template>
  <div class="leads">
    <template v-if="isLoading == false">
      <div class="lead-grid-view">
        <template v-for="lead in leadList" :key="lead.id">
          <div class="grid-card" @click="openLead(lead.id, lead.id === leadViewId)" :class="{ 'active-card': lead.id === leadViewId }">
            <div class="grid-card-header">
              <div class="lead-name text-title-small">{{ lead.name }}</div>
              <q-btn flat round dense size="sm" icon="more_vert" @click.stop>
                <q-menu anchor="bottom right" self="top right" auto-close>
                  <div class="q-pa-sm">
                    <div clickable @click="editLead(lead)" class="row q-pa-xs cursor-pointer">
                      <div><q-icon name="edit" color="grey" size="20px" /></div>
                      <div class="text-blue q-pa-xs text-label-medium">Edit</div>
                    </div>
                    <div clickable @click="deleteLead(lead)" class="row q-pa-xs cursor-pointer">
                      <div><q-icon name="delete" color="grey" size="20px" /></div>
                      <div class="text-blue q-pa-xs text-label-medium">Delete</div>
                    </div>
                  </div>
                </q-menu>
              </q-btn>
            </div>
            <div class="grid-card-body">
              <div class="text-grey text-label-medium text-italic">{{ formatWord(lead.leadBoardStage || '') }}</div>
              <div class="deal-badge row">
                <div class="deal-type text-label-small">{{ lead.leadType?.label || 'Deal Type' }}</div>
                <div class="deal-status text-label-small">Deal Status</div>
              </div>
              <div class="avatar-container row items-center">
                <q-avatar size="md">
                  <img src="/lead-avatar.png" />
                </q-avatar>
                <div class="text-grey text-label-medium q-ml-sm">{{ lead?.client?.name }}</div>
              </div>
              <div class="row justify-between q-py-xs" v-if="lead.budget">
                <div class="row items-center">
                  <div class="row items-center q-mr-sm" :style="{ color: '#747786' }">
                    <q-icon name="savings" size="18px" />
                    <span class="text-label-medium">ABC</span>
                  </div>
                  <div class="text-bold text-label-medium" :style="{ color: 'var(--q-text-dark)' }">&#x20B1;{{ formatNumber(0) }} (Static)</div>
                </div>
              </div>
              <div class="row justify-between" v-if="lead.budget">
                <div class="row items-center">
                  <div class="row items-center q-mr-sm" :style="{ color: '#747786' }">
                    <q-icon name="bar_chart" size="18px" />
                    <span class="text-label-medium">MMR</span>
                  </div>
                  <div class="text-bold text-label-medium" :style="{ color: 'var(--q-text-dark)' }">&#x20B1;{{ formatNumber(lead.budget.raw) }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <template v-if="!leadList.length">
        <div class="no-projects-container">
          <div class="no-projects-text">No Leads Yet</div>
        </div>
      </template>
    </template>

    <template v-else>
      <div class="no-projects-container">
        <div class="no-projects-text">
          <global-loader></global-loader>
        </div>
      </div>
    </template>

    <!-- Lead Dialog for Create/Edit -->
    <LeadCreateDialog v-model="isLeadCreateDialogOpen" :leadData="leadData" @close="fetchData"> </LeadCreateDialog>

    <!-- View Lead Dialog -->
    <view-lead-dialog v-model="isViewLeadDialogOpen" @close="handleCloseDialog" :leadViewId="leadViewId"></view-lead-dialog>
  </div>
</template>

<style scoped src="../Leads.scss"></style>

<script lang="ts">
import { defineComponent, ref, onMounted, defineAsyncComponent } from 'vue';
import { useQuasar } from 'quasar';
import { APIRequests } from 'src/utility/api.handler';
import GlobalLoader from 'src/components/shared/common/GlobalLoader.vue';
import { LeadDataResponse, ClientDataResponse } from '@shared/response';
import { formatWord } from 'src/utility/formatter';
import { formatNumber } from 'src/utility/formatter';
import type { ProjectStatus } from '@shared/response';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const LeadCreateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/LeadDialog/LeadCreateDialog.vue')
);
const ViewLeadDialog = defineAsyncComponent(() =>
  import('src/components/dialog/LeadDialog/ViewLeadDialog.vue')
);

// Types for table response from API
interface TableResponse<T> {
  list: T[];
  currentPage: number;
  pagination: number[];
}

// Type definition for our internal use that includes partial fields
interface LeadDisplayInterface {
  id: number;
  name: string;
  description: string;
  budget: { formatted: string; raw: number };
  isDeleted: boolean;
  isLead: boolean;
  leadBoardStage?: string;
  startDate: { formatted: string; raw: string | Date };
  endDate: { formatted: string; raw: string | Date };
  status: ProjectStatus;
  client?: ClientDataResponse;
  clientId?: number;
  locationId?: number;
  leadType?: { key: string; label: string };
}

export default defineComponent({
  name: 'LeadsGridView',
  components: {
    LeadCreateDialog,
    ViewLeadDialog,
    GlobalLoader,
  },

  setup() {
    const $q = useQuasar();
    // Reactive state
    const isLoading = ref(true);
    const leadList = ref<LeadDisplayInterface[]>([]);
    const currentPage = ref(1);
    const pagination = ref<number[]>([]);
    const leadData = ref<LeadDataResponse | undefined>(undefined);
    const isLeadCreateDialogOpen = ref(false);
    const isViewLeadDialogOpen = ref(false);
    const leadViewId = ref(0);
    const activeCard = ref(false);

    // Methods
    const fetchData = async (): Promise<void> => {
      try {
        isLoading.value = true;
        // We filter for leads only
        const filters = { deleted: false, lead: true };
        const response = await APIRequests.getLeadTable($q, filters, { perPage: 9999, page: currentPage.value });

        if (response && typeof response === 'object') {
          const typedResponse = response as unknown as TableResponse<LeadDataResponse>;
          currentPage.value = typedResponse.currentPage;
          pagination.value = typedResponse.pagination;

          leadList.value = typedResponse.list.map((item: LeadDataResponse) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            budget: {
              formatted: item.budget.formatCurrency,
              raw: item.budget.raw,
            },
            isDeleted: item.isDeleted,
            isLead: item.isLead,
            leadBoardStage: item.leadBoardStage,
            startDate: {
              formatted: item.startDate.dateFull,
              raw: item.startDate.raw,
            },
            endDate: {
              formatted: item.endDate.dateFull,
              raw: item.endDate.raw,
            },
            status: item.status as unknown as ProjectStatus,
            client: item.client,
          }));
        }
      } catch (error) {
        console.warn('Failed to fetch lead data:', error);
      } finally {
        isLoading.value = false;
      }
    };

    const addLead = (): void => {
      leadData.value = {} as LeadDataResponse;
      isLeadCreateDialogOpen.value = true;
    };

    const openLead = (id: number, active: boolean): void => {
      leadViewId.value = id;
      isViewLeadDialogOpen.value = true;
      activeCard.value = active;
    };

    const handleCloseDialog = (): void => {
      isViewLeadDialogOpen.value = false;
      leadViewId.value = 0;
      activeCard.value = false;
    };

    const editLead = async (lead: LeadDisplayInterface): Promise<void> => {
      try {
        // Fetch the complete lead data
        const response = await APIRequests.getLeadInformation($q, { id: lead.id });
        if (response) {
          leadData.value = response as LeadDataResponse;
          isLeadCreateDialogOpen.value = true;
        }
      } catch (error) {
        console.error('Failed to fetch lead data for editing:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to open lead for editing',
          position: 'top',
        });
      }
    };

    const deleteLead = (lead: LeadDisplayInterface): void => {
      $q.dialog({
        title: 'Confirm',
        message: `Are you sure you want to delete ${lead.name}?`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          await APIRequests.deleteLead($q, lead.id.toString());
          await fetchData();
        } catch (error) {
          console.error('Failed to delete lead:', error);
        }
      });
    };

    // Lifecycle hooks
    onMounted(() => {
      try {
        fetchData();
      } catch (error) {
        console.error('Error during component initialization:', error);
      }
    });

    return {
      // State
      isLoading,
      leadList,
      currentPage,
      pagination,
      leadData,
      isLeadCreateDialogOpen,
      isViewLeadDialogOpen,
      leadViewId,
      activeCard,

      // Methods
      fetchData,
      addLead,
      openLead,
      handleCloseDialog,
      editLead,
      deleteLead,
      formatWord,
      formatNumber,
    };
  },
});
</script>

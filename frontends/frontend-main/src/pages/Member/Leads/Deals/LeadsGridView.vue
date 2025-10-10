<template>
  <div class="leads">
    <template v-if="isLoading == false">
      <div class="lead-grid-view">
        <template v-for="lead in leadList" :key="lead.id">
          <div class="grid-card" @click="openLead(lead.id, lead.id === leadViewId)"
            :class="{ 'active-card': lead.id === leadViewId }">
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
              <div class="deal-badge row">
                <div class="deal-type text-label-small">{{ getLeadTypeLabel(lead) }}</div>
                <div class="deal-status text-label-small" :class="getProbabilityClass(lead)">{{
                  getProbabilityLetter(lead) }}</div>
              </div>
              <div class="avatar-container row items-center">
                <q-avatar size="md">
                  <img src="/lead-avatar.png" />
                </q-avatar>
                <div class="text-grey text-label-medium q-ml-sm">{{ `${formatWord(lead.personInCharge.firstName)}
                  ${formatWord(lead.personInCharge.lastName)}` }}
                </div>
              </div>

              <div class="abc-item row justify-between" v-if="lead.initialCosting">
                <div class="row items-center">
                  <div class="row items-center q-mr-sm" :style="{ color: '#747786' }">
                    <q-icon name="payments" size="18px" />
                    <span class="text-label-medium q-ml-xs">Total Contract:</span>
                  </div>
                  <div class="text-bold text-label-medium" :style="{ color: 'var(--q-text-dark)' }">{{
                    lead.initialCosting.formatCurrency }}</div>
                </div>
              </div>

              <!-- Stage and Time Stage -->
              <div class="row justify-between items-center q-mt-sm">
                <div class="row items-center">
                  <div class="row items-center q-mr-sm" :style="{ color: '#747786' }">
                    <q-icon name="view_kanban" size="18px" />
                    <span class="text-label-medium q-ml-xs">Stage:</span>
                  </div>
                  <div class="text-bold text-label-medium" :style="{ color: 'var(--q-text-dark)' }">{{
                    formatWord(lead.leadBoardStage || '') }}</div>
                </div>
                <pre>{{ lead }}</pre>
                <div class="time-stage row items-center text-label-small text-dark q-mb-xs">
                  <q-icon name="history" size="16px" />
                  <span class="q-ml-xs">{{ calculateTimeInStage(lead) }}</span>
                </div>
              </div>

            </div>
          </div>
        </template>
      </div>

      <template v-if="!leadList.length">
        <div class="text-center q-pa-lg">
          <q-icon name="folder_open" size="64px" color="grey-4" />
          <div class="q-mt-sm text-h6 text-grey-6">No leads found</div>
          <div class="text-body-small text-grey-5 q-mt-xs">
            Click "New Lead" to add your first lead
          </div>
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
    <view-lead-dialog v-model="isViewLeadDialogOpen" @close="handleCloseDialog"
      :leadViewId="leadViewId"></view-lead-dialog>
  </div>
</template>

<style scoped src="../Leads.scss"></style>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, defineAsyncComponent, watch } from 'vue';
import { useQuasar } from 'quasar';
import { APIRequests } from 'src/utility/api.handler';
import GlobalLoader from 'src/components/shared/common/GlobalLoader.vue';
import { LeadDataResponse } from '@shared/response';
import { formatWord } from 'src/utility/formatter';

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

// Use complete LeadDataResponse interface (same as Board View)
type LeadDisplayInterface = LeadDataResponse;

export default defineComponent({
  name: 'LeadsGridView',
  components: {
    LeadCreateDialog,
    ViewLeadDialog,
    GlobalLoader,
  },
  props: {
    filterRelationshipOwner: {
      type: String,
      default: 'all',
    },
    filterDealType: {
      type: String,
      default: 'all',
    },
    filterStage: {
      type: String,
      default: 'all',
    },
  },
  setup(props) {
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
    const currentTime = ref(new Date());
    let timeUpdateInterval: NodeJS.Timeout | null = null;

    // Methods
    const fetchData = async (): Promise<void> => {
      try {
        isLoading.value = true;
        // Build filters based on props
        const filters: any = { deleted: false, lead: true };

        // Add filter by relationship owner
        if (props.filterRelationshipOwner !== 'all') {
          filters.relationshipOwnerId = props.filterRelationshipOwner;
        }

        // Add filter by deal type
        if (props.filterDealType !== 'all') {
          filters.dealTypeId = props.filterDealType;
        }

        // Add filter by stage
        if (props.filterStage !== 'all') {
          filters.leadBoardStage = props.filterStage;
        }

        const response = await APIRequests.getLeadTable($q, filters, { perPage: 9999, page: currentPage.value });

        if (response && typeof response === 'object') {
          const typedResponse = response as unknown as TableResponse<LeadDataResponse>;
          currentPage.value = typedResponse.currentPage;
          pagination.value = typedResponse.pagination;

          // Use complete API response directly (same as Board View)
          leadList.value = typedResponse.list;
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

    const getProbabilityClass = (lead: LeadDisplayInterface) => {
      // Extract numeric value from label (e.g., "50%" -> 50)
      const winProb = lead.winProbability;
      const label = typeof winProb === 'string' ? winProb : winProb?.label;
      if (!label) {
        return 'probability-unknown';
      }

      // Parse percentage from label (remove "%" and convert to number)
      const probability = parseInt(label.replace('%', ''));

      // Return unknown if parsing failed or probability is 0/null
      if (isNaN(probability) || probability === 0) {
        return 'probability-unknown';
      }

      // Map to probability ranges matching Sales Probability Widget
      if (probability >= 90 && probability <= 100) {
        return 'probability-a'; // A: 90-100%
      } else if (probability >= 70 && probability <= 89) {
        return 'probability-b'; // B: 70-89%
      } else if (probability >= 50 && probability <= 69) {
        return 'probability-c'; // C: 50-69%
      } else if (probability >= 30 && probability <= 49) {
        return 'probability-d'; // D: 30-49%
      } else if (probability >= 10 && probability <= 29) {
        return 'probability-e'; // E: 10-29%
      } else if (probability >= 0 && probability <= 9) {
        return 'probability-f'; // F: 0-9%
      }

      return 'probability-unknown';
    };

    const getProbabilityLetter = (lead: LeadDisplayInterface) => {
      // Extract numeric value from label (e.g., "50%" -> 50)
      const winProb = lead.winProbability;
      const label = typeof winProb === 'string' ? winProb : winProb?.label;
      if (!label) {
        return 'Unknown';
      }

      // Parse percentage from label (remove "%" and convert to number)
      const probability = parseInt(label.replace('%', ''));

      // Return unknown if parsing failed or probability is 0/null
      if (isNaN(probability) || probability === 0) {
        return 'Unknown';
      }

      // Map to letter grades matching Sales Probability Widget
      if (probability >= 90 && probability <= 100) {
        return 'A'; // A: 90-100%
      } else if (probability >= 70 && probability <= 89) {
        return 'B'; // B: 70-89%
      } else if (probability >= 50 && probability <= 69) {
        return 'C'; // C: 50-69%
      } else if (probability >= 30 && probability <= 49) {
        return 'D'; // D: 30-49%
      } else if (probability >= 10 && probability <= 29) {
        return 'E'; // E: 10-29%
      } else if (probability >= 0 && probability <= 9) {
        return 'F'; // F: 0-9%
      }

      return 'Unknown';
    };

    const getLeadTypeLabel = (lead: LeadDisplayInterface) => {
      const leadType = lead.leadType;
      if (!leadType) return 'Deal Type';
      return typeof leadType === 'string' ? leadType : leadType.label;
    };

    const calculateTimeInStage = (lead: LeadDisplayInterface) => {
      if (!lead.updatedAt?.raw) {
        return 'Recently added';
      }

      // Reference currentTime.value to make this reactive
      const now = currentTime.value;
      const updatedAt = new Date(lead.updatedAt.raw);
      const diffInMilliseconds = now.getTime() - updatedAt.getTime();
      const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
      const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInHours / 24);
      const diffInWeeks = Math.floor(diffInDays / 7);
      const diffInMonths = Math.floor(diffInDays / 30);

      if (diffInMinutes < 1) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}min${diffInMinutes === 1 ? '' : 's'} ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours}hr${diffInHours === 1 ? '' : 's'} ago`;
      } else if (diffInDays < 7) {
        return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'}`;
      } else if (diffInWeeks < 4) {
        return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'}`;
      } else {
        return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'}`;
      }
    };

    // Watch for filter changes
    watch(
      () => [props.filterRelationshipOwner, props.filterDealType, props.filterStage],
      () => {
        fetchData();
      }
    );

    // Lifecycle hooks
    onMounted(() => {
      try {
        fetchData();

        // Update current time every 30 seconds for real-time time stage updates
        timeUpdateInterval = setInterval(() => {
          currentTime.value = new Date();
        }, 30000); // 30 seconds
      } catch (error) {
        console.error('Error during component initialization:', error);
      }
    });

    onBeforeUnmount(() => {
      // Clean up interval to prevent memory leaks
      if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
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
      getProbabilityClass,
      getProbabilityLetter,
      getLeadTypeLabel,
      calculateTimeInStage,
    };
  },
});
</script>

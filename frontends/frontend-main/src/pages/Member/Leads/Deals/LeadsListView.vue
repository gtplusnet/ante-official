<template>
  <div>
    <div v-if="!isLoading" class="list-view">
      <table class="lead-list-table">
        <thead>
          <tr>
            <th class="text-dark text-label-medium text-left">Deal Name</th>
            <th class="text-dark text-label-medium text-left">Deal Type</th>
            <th class="text-dark text-label-medium text-left">Relationship Owner</th>
            <th class="text-dark text-label-medium text-left">Total Contract</th>
            <th class="text-dark text-label-medium text-left">Stage</th>
            <th class="text-dark text-label-medium text-left">Days in Current Stage</th>
            <th class="text-dark text-label-medium text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lead in leadList" :key="lead.id">
            <td class="text-dark text-label-medium list-name" @click="openLead(lead.id)">{{ lead.name }}</td>
            <td class="text-grey text-label-medium">{{ lead.leadType?.label || 'N/A' }}</td>
            <td>{{ formatWord(lead.personInCharge.firstName) }} {{ formatWord(lead.personInCharge.lastName) }}</td>
            <td class="text-grey text-label-medium">{{ lead.budget.formatCurrency }}</td>
            <td>
              <div class="stage-badge text-label-medium text-grey" :class="getStageClass(lead.leadBoardStage)">
                {{ formatLeadStage(lead.leadBoardStage) }}
              </div>
            </td>
            <td class="text-grey text-label-medium">{{ calculateDaysInStage(lead.updatedAt) }}</td>
            <td class="text-center">
              <q-btn flat round icon="edit" color="grey" class="q-mr-md" @click.stop="editLead(lead)" />
              <q-btn flat round icon="delete" color="grey" @click.stop="deleteLead(lead)" />
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="!leadList.length && !isLoading" class="text-center q-pa-lg">
        <q-icon name="folder_open" size="64px" color="grey-4" />
        <div class="q-mt-sm text-h6 text-grey-6">No leads found</div>
        <div class="text-body-small text-grey-5 q-mt-xs">
          Click "New Lead" to add your first lead
        </div>
      </div>
    </div>

    <div v-else class="no-leads-container">
      <global-loader />
    </div>

    <LeadCreateDialog
      v-model="isLeadCreateDialogOpen"
      :lead-data="leadData"
      @close="fetchData"
    />

    <!-- View Lead Dialog -->
    <ViewLeadDialog
      v-model="isViewLeadDialogOpen"
      :leadViewId="leadViewId"
      @close="handleCloseDialog"
      @stageChanged="handleStageChanged"
    />
  </div>
</template>

<style scoped src="../Leads.scss"></style>
<script lang="ts">
import { defineComponent, ref, onMounted, defineAsyncComponent, watch } from 'vue';
import { useQuasar } from 'quasar';
import { APIRequests } from "src/utility/api.handler";
import GlobalLoader from "src/components/shared/common/GlobalLoader.vue";
import { LeadDataResponse, TableResponse } from "@shared/response";
import { formatLeadStage } from "src/utility/formatter";
import { formatWord } from "src/utility/formatter";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const LeadCreateDialog = defineAsyncComponent(() =>
  import("src/components/dialog/LeadDialog/LeadCreateDialog.vue")
);
const ViewLeadDialog = defineAsyncComponent(() =>
  import("src/components/dialog/LeadDialog/ViewLeadDialog.vue")
);

export default defineComponent({
  name: 'LeadsListView',

  components: {
    LeadCreateDialog,
    GlobalLoader,
    ViewLeadDialog,
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

    // State
    const isLoading = ref(true);
    const leadList = ref<LeadDataResponse[]>([]);
    const leadData = ref<LeadDataResponse>();
    const isLeadCreateDialogOpen = ref(false);
    const leadViewId = ref<number>(0);
    const isViewLeadDialogOpen = ref(false);

    // Helper methods
    const getStageClass = (stage: string | undefined): string => {
      if (!stage) return 'unknown';

      // Convert to lowercase for case-insensitive matching
      const stageLower = stage.toLowerCase();

      // Map stage names to their corresponding CSS classes
      const stageMap: Record<string, string> = {
        'opportunity': 'opportunity',
        'contacted': 'contacted',
        'in-negotiation': 'in-negotiation',
        'proposal': 'proposal',
        'prospect': 'prospect',
        'sent': 'sent',
        'win' : 'win',
        'won' : 'won',
        'for-revision': 'for-revision',
        'lost': 'lost',
        'outstanding': 'outstanding',
        'preparing': 'preparing',
        'design': 'design',
        'finalized': 'finalized'
      };

      // Return the mapped class or 'unknown' if not found
      return stageMap[stageLower] || 'unknown';
    };

    const calculateDaysInStage = (updatedAt: any): string => {
      if (!updatedAt?.raw) {
        return "0 days";
      }
      const updatedAtDate = new Date(updatedAt.raw);
      const now = new Date();
      const diffMs = now.getTime() - updatedAtDate.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const weeks = Math.floor(days / 7);
      const months = Math.floor(days / 30);

      if (days < 7) {
        return days === 1 ? "1 day" : `${days} days`;
      } else if (weeks < 4) {
        return weeks === 1 ? "1 week" : `${weeks} weeks`;
      } else {
        return months === 1 ? "1 month" : `${months} months`;
      }
    };

    const handleCloseDialog = () => {
      isViewLeadDialogOpen.value = false;
      leadViewId.value = 0;
    };

    const handleStageChanged = () => {
      // Refresh the list view to reflect the stage change
      fetchData();
    };

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

        const response = await APIRequests.getLeadTable($q, filters, {
          perPage: 10,
          page: 1
        });

        if (response && typeof response === 'object') {
          const typedResponse = response as unknown as TableResponse<LeadDataResponse>;
          // Use the list directly without transformation (same as Board View)
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

    const editLead = (lead: LeadDataResponse): void => {
      // Use the lead data directly (no transformation needed)
      leadData.value = lead;
      isLeadCreateDialogOpen.value = true;
    };

    const openLead = (id: number) => {
      leadViewId.value = id;
      isViewLeadDialogOpen.value = true;
      // router.push({ name: 'member_lead_page', params: { id } });
    };

    const deleteLead = (lead: LeadDataResponse): void => {
      $q.dialog({
        title: 'Confirm',
        message: `Are you sure you want to delete ${lead.name}?`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        try {
          await APIRequests.deleteLead($q, lead.id.toString());
          await fetchData();
        } catch (error) {
          console.error('Failed to delete lead:', error);
        }
      });
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
      fetchData();
    });

    return {
      // State
      isLoading,
      leadList,
      leadData,
      isLeadCreateDialogOpen,
      isViewLeadDialogOpen,
      leadViewId,

      // Helper methods
      formatLeadStage,
      getStageClass,
      calculateDaysInStage,

      // Methods
      handleCloseDialog,
      handleStageChanged,
      fetchData,
      addLead,
      editLead,
      deleteLead,
      openLead,
      formatWord,
    };
  },
});
</script>

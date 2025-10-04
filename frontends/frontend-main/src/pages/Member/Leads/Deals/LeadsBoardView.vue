<template>
  <div v-if="isLoading" class="flex flex-center" style="height: 400px">
    <q-spinner-dots color="primary" size="40px" />
  </div>

  <template v-else>
    <div class="board-container q-pa-sm" v-dragscroll.x="true">
      <div v-for="column in boardColumns" :key="column.boardKey" class="board-column" :class="{ 'drop-active': dragOverColumn === column.boardKey }" @dragover.prevent="handleDragOver(column.boardKey)" @dragleave="handleDragLeave" @drop="handleDrop($event, column.boardKey)">
        <div class="column-header">
          <div class="column-header-top">
            <h6 class="column-title text-title-large">{{ column.boardName }}</h6>
            <div class="q-badge text-title-small" :class="column.boardProjects?.length === 0 ? 'q-badge-zero' : ''">{{ column.boardProjects?.length || 0 }}</div>
          </div>
          <div class="divider q-my-sm"></div>
          <div class="column-total text-title-medium">
            {{ formatColumnTotal(column.boardProjects) }}
          </div>
        </div>
        <div class="column-content">
          <div v-for="lead in column.boardProjects" :key="lead.id" class="lead-card" draggable="true" @dragstart="handleDragStart($event, lead)" @dragend="handleDragEnd" @click="openLead(lead.id, lead.id === leadViewId)" :class="{ 'active-card': lead.id === leadViewId }">
            <div class="lead-card-header">
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

            <div class="lead-card-body text-label-small">
              <div class="deal-badge row">
                <div class="deal-type">{{ lead.leadType?.key || 'Deal Type' }}</div>
                <div class="deal-status">{{ lead.winProbability?.label || 'N/A' }}</div>
              </div>
              <div class="avatar-container row items-center">
                <q-avatar size="md">
                  <img src="/lead-avatar.png">
                </q-avatar>
                <div class="text-grey text-label-medium q-ml-sm">{{ lead?.client?.name }}</div>
              </div>
              <div class="abc-item row justify-between" v-if="lead.abc">
                <div class="row items-center">
                  <div class="row items-center q-mr-sm" :style="{ color: '#747786' }">
                    <q-icon name="savings" size="18px" />
                    <span class="text-label-medium">ABC</span>
                  </div>
                  <div class="text-bold text-label-medium" :style="{ color: 'var(--q-text-dark)' }">{{ lead.abc.formatCurrency }}</div>
                </div>
              </div>
              <div class="detail-item row justify-between" v-if="lead.mmr">
                <div class="row items-center">
                  <div class="row items-center q-mr-sm" :style="{ color: '#747786' }">
                    <q-icon name="bar_chart" size="18px" />
                    <span class="text-label-medium">MMR</span>
                  </div>
                  <div class="text-bold text-label-medium" :style="{ color: 'var(--q-text-dark)' }">{{ lead.mmr.formatCurrency }}</div>
                </div>
                <div class="dropdown" :class="openDropdowns[lead.id] ? 'active' : ''" @click.stop="toggleDropdown(lead.id, $event)">
                  <q-icon name="keyboard_arrow_down" class="q-icon" :style="{ color: 'var(--q-text-dark)' }" />
                </div>
              </div>

              <div v-if="openDropdowns[lead.id]" class="dropdown-content">
                <q-separator class="q-my-xs" />

                <div class="note-container" @click.stop>
                  <q-input class="text-body-medium" v-model="textareaModel" clearable unelevated standout bg-color="yellow-2" autogrow stack-label input-style="color: var(--q-text-dark);" color="grey-6" label="Notes/Next Steps:" />
                </div>
              </div>
            </div>
          </div>

          <div v-if="!column.boardProjects?.length" class="empty-column">No leads in this stage</div>
        </div>
      </div>
    </div>
  </template>

  <!-- Lead Dialog for Create/Edit -->
  <lead-create-dialog v-model="isLeadDialogOpen" :leadData="leadData" @close="handleLeadSaved" />

  <view-lead-dialog v-model="isViewLeadDialogOpen" @close="handleCloseDialog" :leadViewId="leadViewId"></view-lead-dialog>
</template>

<style scoped src="../Leads.scss"></style>

<script lang="ts">
import { defineComponent, ref, onMounted, defineAsyncComponent } from 'vue';
import { useQuasar } from 'quasar';
import { APIRequests } from 'src/utility/api.handler';
import { LeadDataResponse } from '@shared/response';
import { formatWord } from 'src/utility/formatter';
import { dragscroll } from 'vue-dragscroll';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const LeadCreateDialog = defineAsyncComponent(() =>
  import('src/components/dialog/LeadDialog/LeadCreateDialog.vue')
);
const ViewLeadDialog = defineAsyncComponent(() =>
  import('src/components/dialog/LeadDialog/ViewLeadDialog.vue')
);

interface Lead {
  id: number;
  name: string;
  description: string;
  budget?: { formatCurrency: string; formatNumber: string; raw: number };
  abc?: { formatCurrency: string; formatNumber: string; raw: number };
  mmr?: { formatCurrency: string; formatNumber: string; raw: number };
  client?: { name: string };
  personInCharge?: { firstName: string; lastName: string };
  endDate?: { dateFull: string };
  leadBoardStage: string;
  winProbability: { label: string };
  leadType?: { key: string; label: string };
}

interface BoardColumn {
  boardKey: string;
  boardName: string;
  boardType: string;
  boardOrder: number;
  boardProjects?: Lead[];
}

export default defineComponent({
  name: 'MemberLeadsBoardView',
  components: {
    LeadCreateDialog,
    ViewLeadDialog,
  },
  directives: {
    dragscroll,
  },
  setup() {
    const $q = useQuasar();
    const isLoading = ref(true);
    // const router = useRouter();
    const boardColumns = ref<BoardColumn[]>([]);
    const draggedLead = ref<Lead | null>(null);
    const dragOverColumn = ref<string | null>(null);
    const isLeadDialogOpen = ref(false);
    const leadData = ref<LeadDataResponse | undefined>(undefined);
    const openDropdowns = ref<Record<string | number, boolean>>({});
    const textareaModel = ref('');
    const isViewLeadDialogOpen = ref(false);
    const leadViewId = ref<number>(0);
    const activeCard = ref<boolean>(false);

    const toggleDropdown = (leadId: string | number, event: Event) => {
      event.stopPropagation();
      // Close all other dropdowns first
      const newState: Record<string | number, boolean> = {};
      // Close all dropdowns
      Object.keys(openDropdowns.value).forEach((id) => {
        newState[id] = false;
      });
      // Toggle the clicked dropdown
      newState[leadId] = !openDropdowns.value[leadId];
      openDropdowns.value = newState;
    };

    const fetchBoardData = async () => {
      try {
        isLoading.value = true;
        const response = await APIRequests.getLeadBoard($q);

        if (Array.isArray(response)) {
          boardColumns.value = response.sort((a, b) => a.boardOrder - b.boardOrder);
        }
      } catch (error) {
        console.error('Failed to fetch lead board data:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to load board data',
          icon: 'report_problem',
        });
      } finally {
        isLoading.value = false;
      }
    };

    const handleDragStart = (event: DragEvent, lead: Lead) => {
      draggedLead.value = lead;
      event.dataTransfer!.effectAllowed = 'move';
      event.dataTransfer!.setData('text/plain', lead.id.toString());

      // Add dragging class to the element
      const target = event.target as HTMLElement;
      target.classList.add('dragging');
    };

    const handleDragEnd = (event: DragEvent) => {
      const target = event.target as HTMLElement;
      target.classList.remove('dragging');
      draggedLead.value = null;
      dragOverColumn.value = null;
    };

    const handleDragOver = (columnKey: string) => {
      dragOverColumn.value = columnKey;
    };

    const handleDragLeave = () => {
      dragOverColumn.value = null;
    };

    const handleDrop = async (event: DragEvent, targetColumnKey: string) => {
      event.preventDefault();
      dragOverColumn.value = null;

      if (!draggedLead.value || draggedLead.value.leadBoardStage === targetColumnKey) {
        return;
      }

      // Store the lead data before the API call
      const leadToMove = { ...draggedLead.value };

      try {
        await APIRequests.moveLead($q, leadToMove.id.toString(), targetColumnKey);

        // Update the UI after successful API call
        const sourceColumn = boardColumns.value.find((col) => col.boardProjects?.some((lead) => lead.id === leadToMove.id));
        const targetColumn = boardColumns.value.find((col) => col.boardKey === targetColumnKey);

        if (sourceColumn && targetColumn) {
          // Remove from source
          sourceColumn.boardProjects = sourceColumn.boardProjects?.filter((lead) => lead.id !== leadToMove.id) || [];

          // Update lead stage
          leadToMove.leadBoardStage = targetColumnKey;

          // Add to target
          if (!targetColumn.boardProjects) {
            targetColumn.boardProjects = [];
          }
          targetColumn.boardProjects.push(leadToMove);
        }

        // No notification needed for successful move
      } catch (error) {
        console.error('Failed to move lead:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to move lead',
          icon: 'report_problem',
        });
        // Refresh the board to reset the state
        await fetchBoardData();
      }
    };

    const handleCloseDialog = () => {
      isViewLeadDialogOpen.value = false;
      leadViewId.value = 0;
      activeCard.value = false;
    };

    const openLead = (id: number, active: boolean) => {
      leadViewId.value = id;
      isViewLeadDialogOpen.value = true;
      activeCard.value = active;
      // router.push({ name: 'member_lead_page', params: { id } });
    };

    const editLead = async (lead: Lead) => {
      try {
        // Fetch full lead details
        const response = await APIRequests.getLeadInformation($q, { id: lead.id.toString() });
        leadData.value = response;
        isLeadDialogOpen.value = true;
      } catch (error) {
        console.error('Failed to fetch lead details:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to load lead details',
          icon: 'report_problem',
        });
      }
    };

    const deleteLead = async (lead: Lead) => {
      try {
        await $q
          .dialog({
            title: 'Delete Lead',
            message: `Are you sure you want to delete "${lead.name}"?`,
            cancel: true,
            persistent: true,
          })
          .onOk(async () => {
            await APIRequests.deleteLead($q, lead.id.toString());

            // Remove from UI
            const column = boardColumns.value.find((col) => col.boardProjects?.some((l) => l.id === lead.id));
            if (column) {
              column.boardProjects = column.boardProjects?.filter((l) => l.id !== lead.id) || [];
            }

            $q.notify({
              color: 'positive',
              message: 'Lead deleted successfully',
              icon: 'check',
            });
          });
      } catch (error) {
        console.error('Failed to delete lead:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to delete lead',
          icon: 'report_problem',
        });
      }
    };

    const formatColumnTotal = (projects?: Lead[]) => {
      if (!projects || projects.length === 0) {
        return '₱0.00';
      }

      const total = projects.reduce((sum, lead) => {
        // Use the raw value directly
        const numericValue = lead.budget?.raw || 0;
        return sum + numericValue;
      }, 0);

      // Format as currency
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
      }).format(total);
    };

    const calculateGrandTotal = () => {
      const allLeads = boardColumns.value.flatMap((col) => col.boardProjects || []);
      return formatColumnTotal(allLeads);
    };

    const getTotalLeadsCount = () => {
      return boardColumns.value.reduce((count, col) => count + (col.boardProjects?.length || 0), 0);
    };

    const handleLeadSaved = () => {
      isLeadDialogOpen.value = false;
      leadData.value = undefined;
      // Refresh the board to show updated data
      fetchBoardData();
    };

    const addLead = () => {
      leadData.value = {} as LeadDataResponse;
      isLeadDialogOpen.value = true;
    };

    onMounted(() => {
      fetchBoardData();
    });

    return {
      textareaModel,
      isLoading,
      boardColumns,
      dragOverColumn,
      isViewLeadDialogOpen,
      isLeadDialogOpen,
      leadData,
      openDropdowns,
      leadViewId,
      activeCard,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleCloseDialog,
      openLead,
      editLead,
      deleteLead,
      formatColumnTotal,
      calculateGrandTotal,
      getTotalLeadsCount,
      handleLeadSaved,
      addLead,
      toggleDropdown,
      formatWord,
    };
  },
});
</script>

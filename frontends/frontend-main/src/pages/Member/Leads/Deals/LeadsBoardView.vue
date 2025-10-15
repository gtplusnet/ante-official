<template>
  <div v-if="isLoading" class="flex flex-center" style="height: 400px">
    <q-spinner-dots color="primary" size="40px" />
  </div>

  <template v-else>
    <div class="board-container q-pa-sm" v-dragscroll.x="!isDragging">
      <div
        v-for="column in boardColumns"
        :key="column.boardKey"
        class="board-column"
        :class="{ 'drop-active': dragOverColumn === column.boardKey }"
        @dragover.prevent="handleDragOver(column.boardKey)"
        @dragleave="handleDragLeave"
        @drop="handleDrop($event, column.boardKey)"
      >
        <div class="column-header">
          <div class="column-header-top">
            <h6 class="column-title text-title-small">
              {{ column.boardName }}
            </h6>
            <div
              class="q-badge text-title-small"
              :class="column.boardProjects?.length === 0 ? 'q-badge-zero' : ''"
            >
              {{ column.boardProjects?.length || 0 }}
            </div>
          </div>
          <div class="divider q-my-sm"></div>
          <div class="column-total text-title-small">
            {{ formatColumnTotal(column.boardProjects) }}
          </div>
          <div class="q-mt-sm">
            <g-button
              icon="add"
              icon-size="md"
              class="full-width"
              color="grey"
              label="Add Lead"
              variant="tonal"
              @click="openLeadCreateDialog(column.boardKey)"
            />
          </div>
        </div>
        <div class="column-content">
          <div
            v-for="lead in column.boardProjects"
            :key="lead.id"
            class="lead-card"
            :class="{
              'drag-source': draggedLead?.id === lead.id && isDragging,
              'active-card': lead.id === leadViewId,
            }"
            draggable="true"
            @dragstart="handleDragStart($event, lead)"
            @dragend="handleDragEnd"
            @click="openLead(lead.id, lead.id === leadViewId)"
          >
            <div class="lead-card-header">
              <div class="lead-name text-title-small">{{ lead.name }}</div>
              <q-btn flat round dense size="sm" icon="more_vert" @click.stop>
                <q-menu anchor="bottom right" self="top right" auto-close>
                  <div class="q-pa-sm">
                    <div
                      clickable
                      @click="editLead(lead)"
                      class="row q-pa-xs cursor-pointer"
                    >
                      <div><q-icon name="edit" color="grey" size="20px" /></div>
                      <div class="text-blue q-pa-xs text-label-medium">
                        Edit
                      </div>
                    </div>
                    <div
                      clickable
                      @click="deleteLead(lead)"
                      class="row q-pa-xs cursor-pointer"
                    >
                      <div>
                        <q-icon name="delete" color="grey" size="20px" />
                      </div>
                      <div class="text-blue q-pa-xs text-label-medium">
                        Delete
                      </div>
                    </div>
                  </div>
                </q-menu>
              </q-btn>
            </div>
            <div class="lead-card-body text-label-small">
              <div class="deal-badge row items-center">
                <span class="deal-type row items-center justify-center">{{
                  lead.leadType?.label || "No Deal Type"
                }}</span>
                <span
                  class="deal-status row items-center justify-center"
                  :class="getProbabilityClass(lead)"
                  >{{ getProbabilityLetter(lead) }}</span
                >
                <!-- Proposal Status Badge (only show when in Proposal stage) -->
                <span
                  class="proposal-status row items-center justify-center"
                  :class="getProposalStatusClass(lead.proposalStatus)"
                  v-if="lead.leadBoardStage === 'proposal'"
                  >{{ getProposalStatusLabel(lead.proposalStatus) }}</span
                >
              </div>

              <div class="avatar-container row items-center">
                <q-avatar size="md">
                  <img src="/lead-avatar.png" />
                </q-avatar>
                <div class="text-grey text-label-medium q-ml-sm">
                  {{
                    `${formatWord(lead.personInCharge.firstName)}
                  ${formatWord(lead.personInCharge.lastName)}`
                  }}
                </div>
              </div>
              <div
                class="abc-item row justify-between"
                v-if="lead.initialCosting"
              >
                <div class="row items-center">
                  <div
                    class="row items-center q-mr-sm"
                    :style="{ color: '#747786' }"
                  >
                    <q-icon name="payments" size="18px" />
                    <span class="text-label-medium q-ml-xs"
                      >Total Contract:</span
                    >
                  </div>
                  <div
                    class="text-bold text-label-medium"
                    :style="{ color: 'var(--q-text-dark)' }"
                  >
                    {{ lead.initialCosting.formatCurrency }}
                  </div>
                </div>
              </div>
              <div class="detail-item row justify-between">
                <div
                  class="time-stage row items-center text-label-small text-dark"
                >
                  <q-icon name="history" size="16px" />
                  <span class="q-ml-xs">{{ calculateTimeInStage(lead) }}</span>
                </div>

                <!-- <div class="dropdown" :class="openDropdowns[lead.id] ? 'active' : ''" @click.stop="toggleDropdown(lead.id, $event)">
                  <q-icon name="keyboard_arrow_down" class="q-icon" :style="{ color: 'var(--q-text-dark)' }" />
                </div> -->
              </div>

              <!-- <div v-if="openDropdowns[lead.id]" class="dropdown-content">
                <q-separator class="q-my-xs" />

                <div class="note-container" @click.stop>
                  <q-input class="text-body-medium" v-model="textareaModel" clearable unelevated standout bg-color="yellow-2" autogrow stack-label input-style="color: var(--q-text-dark);" color="grey-6" label="Notes/Next Steps:" />
                </div>
              </div> -->
            </div>
          </div>

          <div v-if="!column.boardProjects?.length" class="empty-column">
            No leads in this stage
          </div>
        </div>
      </div>
    </div>
  </template>

  <!-- Lead Dialog for Create/Edit -->
  <lead-create-dialog
    v-model="isLeadDialogOpen"
    :leadData="leadData"
    @close="handleLeadSaved"
  />

  <view-lead-dialog
    v-model="isViewLeadDialogOpen"
    @close="handleCloseDialog"
    @stageChanged="handleStageChanged"
    @proposalStatusChanged="handleProposalStatusChanged"
    :leadViewId="leadViewId"
  ></view-lead-dialog>
</template>

<style scoped src="../Leads.scss"></style>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  onBeforeUnmount,
  nextTick,
  watch,
} from "vue";
import { useQuasar } from "quasar";
import { useRoute } from "vue-router";
import { APIRequests } from "src/utility/api.handler";
import LeadCreateDialog from "src/components/dialog/LeadDialog/LeadCreateDialog.vue";
import ViewLeadDialog from "src/components/dialog/LeadDialog/ViewLeadDialog.vue";
import { LeadDataResponse } from "@shared/response";
import { formatWord } from "src/utility/formatter";
import { dragscroll } from "vue-dragscroll";
import GButton from "src/components/shared/buttons/GButton.vue";

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
  updatedAt?: { raw: Date; timeAgo: string };
  initialCosting?: {
    formatCurrency: string;
    formatNumber: string;
    raw: number;
  };
  proposalStatus?: string;
}

interface BoardColumn {
  boardKey: string;
  boardName: string;
  boardType: string;
  boardOrder: number;
  boardProjects?: Lead[];
}

export default defineComponent({
  name: "MemberLeadsBoardView",
  components: {
    LeadCreateDialog,
    ViewLeadDialog,
    GButton,
  },
  directives: {
    dragscroll,
  },
  props: {
    filterRelationshipOwner: {
      type: String,
      default: "all",
    },
    filterDealType: {
      type: String,
      default: "all",
    },
    filterStage: {
      type: String,
      default: "all",
    },
  },
  setup(props) {
    const $q = useQuasar();
    const route = useRoute();
    const isLoading = ref(true);
    const boardColumns = ref<BoardColumn[]>([]);
    const draggedLead = ref<Lead | null>(null);
    const dragOverColumn = ref<string | null>(null);
    const isLeadDialogOpen = ref(false);
    const leadData = ref<LeadDataResponse | undefined>(undefined);
    const openDropdowns = ref<Record<string | number, boolean>>({});
    const textareaModel = ref("");
    const isViewLeadDialogOpen = ref(false);
    const leadViewId = ref<number>(0);
    const activeCard = ref<boolean>(false);
    const isDragging = ref<boolean>(false);
    const currentTime = ref(new Date());
    let timeUpdateInterval: NodeJS.Timeout | null = null;

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

        // Prepare filters to send to backend
        const filters = {
          relationshipOwnerId: props.filterRelationshipOwner,
          dealTypeId: props.filterDealType,
          // Note: Stage filter is not applicable for board view
        };

        const response = await APIRequests.getLeadBoard($q, filters);

        if (Array.isArray(response)) {
          boardColumns.value = response.sort(
            (a, b) => a.boardOrder - b.boardOrder
          );
        }
      } catch (error) {
        console.error("Failed to fetch lead board data:", error);
        $q.notify({
          color: "negative",
          message: "Failed to load board data",
          icon: "report_problem",
        });
      } finally {
        isLoading.value = false;

        // Check for query params to highlight and scroll to lead
        await checkAndHighlightLead();
      }
    };

    const checkAndHighlightLead = async () => {
      const leadId = route.query.leadId as string;
      if (leadId) {
        const id = parseInt(leadId, 10);
        leadViewId.value = id;

        // Wait for DOM to update
        await nextTick();

        // Scroll to the highlighted card
        const cardElement = document.querySelector(`.lead-card.active-card`);
        if (cardElement) {
          cardElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
          });
        }
      }
    };

    const handleDragStart = (event: DragEvent, lead: Lead) => {
      draggedLead.value = lead;
      isDragging.value = true;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", lead.id.toString());
        event.dataTransfer.dropEffect = "move";
      }
      // Add dragging class to the element
      const target = event.target as HTMLElement;
      target.classList.add("dragging");
    };

    const handleDragEnd = (event: DragEvent) => {
      const target = event.target as HTMLElement;
      target.classList.remove("dragging");
      draggedLead.value = null;
      dragOverColumn.value = null;
      isDragging.value = false;
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

      if (
        !draggedLead.value ||
        draggedLead.value.leadBoardStage === targetColumnKey
      ) {
        draggedLead.value = null;
        isDragging.value = false;
        return;
      }

      // Store the lead data before the API call
      const leadToMove = { ...draggedLead.value };
      const originalStage = leadToMove.leadBoardStage;
      const originalUpdatedAt = leadToMove.updatedAt;

      // Clear drag state immediately for smooth UX
      draggedLead.value = null;
      isDragging.value = false;

      try {
        // Optimistically update the UI first
        const sourceColumn = boardColumns.value.find((col) =>
          col.boardProjects?.some((lead) => lead.id === leadToMove.id)
        );
        const targetColumn = boardColumns.value.find(
          (col) => col.boardKey === targetColumnKey
        );

        if (sourceColumn && targetColumn) {
          // Remove from source
          sourceColumn.boardProjects =
            sourceColumn.boardProjects?.filter(
              (lead) => lead.id !== leadToMove.id
            ) || [];

          // Update lead stage and timestamp
          leadToMove.leadBoardStage = targetColumnKey;
          leadToMove.updatedAt = {
            raw: new Date(),
            timeAgo: "just now",
          };

          // Add to target
          if (!targetColumn.boardProjects) {
            targetColumn.boardProjects = [];
          }
          targetColumn.boardProjects.push(leadToMove);
        }

        // Then update the database
        await APIRequests.moveLead(
          $q,
          leadToMove.id.toString(),
          targetColumnKey
        );

        // Silent success - no notification needed for smooth UX
      } catch (error) {
        console.error("Failed to move lead:", error);

        // Rollback on error - restore to original state
        const sourceColumn = boardColumns.value.find(
          (col) => col.boardKey === originalStage
        );
        const targetColumn = boardColumns.value.find((col) =>
          col.boardProjects?.some((lead) => lead.id === leadToMove.id)
        );

        if (sourceColumn && targetColumn) {
          // Remove from incorrect target
          targetColumn.boardProjects =
            targetColumn.boardProjects?.filter(
              (lead) => lead.id !== leadToMove.id
            ) || [];

          // Restore to original source and timestamp
          leadToMove.leadBoardStage = originalStage;
          leadToMove.updatedAt = originalUpdatedAt;
          if (!sourceColumn.boardProjects) {
            sourceColumn.boardProjects = [];
          }
          sourceColumn.boardProjects.push(leadToMove);
        }

        $q.notify({
          color: "negative",
          message: "Failed to move lead",
          icon: "report_problem",
        });
      }
    };

    const handleCloseDialog = () => {
      isViewLeadDialogOpen.value = false;
      leadViewId.value = 0;
      activeCard.value = false;
    };

    const handleStageChanged = (event: {
      leadId: number;
      newStage: string;
    }) => {
      // Find the lead in the current board columns
      let leadToMove: Lead | null = null;
      let sourceColumn: BoardColumn | null = null;

      for (const column of boardColumns.value) {
        const lead = column.boardProjects?.find((l) => l.id === event.leadId);
        if (lead) {
          leadToMove = lead;
          sourceColumn = column;
          break;
        }
      }

      if (!leadToMove || !sourceColumn) {
        console.error("Lead not found in board columns");
        return;
      }

      // Don't move if already in the target stage
      if (leadToMove.leadBoardStage === event.newStage) {
        return;
      }

      // Find the target column
      const targetColumn = boardColumns.value.find(
        (col) => col.boardKey === event.newStage
      );
      if (!targetColumn) {
        console.error("Target column not found");
        return;
      }

      // Optimistically update the UI
      // Remove from source column
      sourceColumn.boardProjects =
        sourceColumn.boardProjects?.filter(
          (lead) => lead.id !== event.leadId
        ) || [];

      // Update lead stage and timestamp
      leadToMove.leadBoardStage = event.newStage;
      leadToMove.updatedAt = {
        raw: new Date(),
        timeAgo: "just now",
      };

      // Add to target column
      if (!targetColumn.boardProjects) {
        targetColumn.boardProjects = [];
      }
      targetColumn.boardProjects.push(leadToMove);
    };

    const handleProposalStatusChanged = (event: {
      leadId: number;
      newProposalStatus: string;
    }) => {
      // Find the lead in the current board columns and update its proposal status
      for (const column of boardColumns.value) {
        const lead = column.boardProjects?.find((l) => l.id === event.leadId);
        if (lead) {
          lead.proposalStatus = event.newProposalStatus;
          break;
        }
      }
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
        const response = await APIRequests.getLeadInformation($q, {
          id: lead.id.toString(),
        });
        leadData.value = response;
        isLeadDialogOpen.value = true;
      } catch (error) {
        console.error("Failed to fetch lead details:", error);
        $q.notify({
          color: "negative",
          message: "Failed to load lead details",
          icon: "report_problem",
        });
      }
    };

    const deleteLead = async (lead: Lead) => {
      try {
        await $q
          .dialog({
            title: "Delete Lead",
            message: `Are you sure you want to delete "${lead.name}"?`,
            cancel: true,
            persistent: true,
          })
          .onOk(async () => {
            await APIRequests.deleteLead($q, lead.id.toString());

            // Remove from UI
            const column = boardColumns.value.find((col) =>
              col.boardProjects?.some((l) => l.id === lead.id)
            );
            if (column) {
              column.boardProjects =
                column.boardProjects?.filter((l) => l.id !== lead.id) || [];
            }

            $q.notify({
              color: "positive",
              message: "Lead deleted successfully",
              icon: "check",
            });
          });
      } catch (error) {
        console.error("Failed to delete lead:", error);
        $q.notify({
          color: "negative",
          message: "Failed to delete lead",
          icon: "report_problem",
        });
      }
    };

    const formatColumnTotal = (projects?: Lead[]) => {
      if (!projects || projects.length === 0) {
        return "₱0.00";
      }

      const total = projects.reduce((sum, lead) => {
        // Use the raw value directly
        const numericValue = lead.budget?.raw || 0;
        return sum + numericValue;
      }, 0);

      // Format as currency
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(total);
    };

    const calculateGrandTotal = () => {
      const allLeads = boardColumns.value.flatMap(
        (col) => col.boardProjects || []
      );
      return formatColumnTotal(allLeads);
    };

    const getTotalLeadsCount = () => {
      return boardColumns.value.reduce(
        (count, col) => count + (col.boardProjects?.length || 0),
        0
      );
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

    const openLeadCreateDialog = (boardKey: string) => {
      leadData.value = {
        leadBoardStage: boardKey,
      } as LeadDataResponse;
      isLeadDialogOpen.value = true;
    };

    const calculateTimeInStage = (lead: Lead) => {
      if (!lead.updatedAt?.raw) {
        return "Recently added";
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
        return "Just now";
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}min${diffInMinutes === 1 ? "" : "s"} ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours}hr${diffInHours === 1 ? "" : "s"} ago`;
      } else if (diffInDays < 7) {
        return `${diffInDays} ${diffInDays === 1 ? "day" : "days"}`;
      } else if (diffInWeeks < 4) {
        return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"}`;
      } else {
        return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"}`;
      }
    };

    const getProbabilityClass = (lead: Lead) => {
      // Extract numeric value from label (e.g., "50%" -> 50)
      const label = lead.winProbability?.label;
      if (!label) {
        return "probability-unknown";
      }

      // Parse percentage from label (remove "%" and convert to number)
      const probability = parseInt(label.replace("%", ""));

      // Return unknown if parsing failed or probability is 0/null
      if (isNaN(probability) || probability === 0) {
        return "probability-unknown";
      }

      // Map to probability ranges matching Sales Probability Widget
      if (probability >= 90 && probability <= 100) {
        return "probability-a"; // A: 90-100%
      } else if (probability >= 70 && probability <= 89) {
        return "probability-b"; // B: 70-89%
      } else if (probability >= 50 && probability <= 69) {
        return "probability-c"; // C: 50-69%
      } else if (probability >= 30 && probability <= 49) {
        return "probability-d"; // D: 30-49%
      } else if (probability >= 10 && probability <= 29) {
        return "probability-e"; // E: 10-29%
      } else if (probability >= 0 && probability <= 9) {
        return "probability-f"; // F: 0-9%
      }

      return "probability-unknown";
    };

    const getProbabilityLetter = (lead: Lead) => {
      // Extract numeric value from label (e.g., "50%" -> 50)
      const label = lead.winProbability?.label;
      if (!label) {
        return "Unknown";
      }

      // Parse percentage from label (remove "%" and convert to number)
      const probability = parseInt(label.replace("%", ""));

      // Return unknown if parsing failed or probability is 0/null
      if (isNaN(probability) || probability === 0) {
        return "Unknown";
      }

      // Map to letter grades matching Sales Probability Widget
      if (probability >= 90 && probability <= 100) {
        return "A"; // A: 90-100%
      } else if (probability >= 70 && probability <= 89) {
        return "B"; // B: 70-89%
      } else if (probability >= 50 && probability <= 69) {
        return "C"; // C: 50-69%
      } else if (probability >= 30 && probability <= 49) {
        return "D"; // D: 30-49%
      } else if (probability >= 10 && probability <= 29) {
        return "E"; // E: 10-29%
      } else if (probability >= 0 && probability <= 9) {
        return "F"; // F: 0-9%
      }

      return "Unknown";
    };

    const getProposalStatusClass = (status?: string): string => {
      if (!status) return "proposal-status-preparing"; // Default: Preparing

      const classMap: Record<string, string> = {
        PREPARING: "proposal-status-preparing",
        READY: "proposal-status-ready",
        SENT: "proposal-status-sent",
        FOR_REVISION: "proposal-status-for-revision",
        FINALIZED: "proposal-status-finalized",
      };

      return classMap[status] || "proposal-status-preparing";
    };

    const getProposalStatusLabel = (status?: string): string => {
      if (!status) return "Preparing";

      const labelMap: Record<string, string> = {
        PREPARING: "Preparing",
        READY: "Ready",
        SENT: "Sent",
        FOR_REVISION: "For Revision",
        FINALIZED: "Finalized",
      };

      return labelMap[status] || "Preparing";
    };

    // Watch for filter changes
    watch(
      () => [props.filterRelationshipOwner, props.filterDealType],
      () => {
        fetchBoardData();
      }
    );

    onMounted(() => {
      fetchBoardData();

      // Update current time every 30 seconds for real-time time stage updates
      timeUpdateInterval = setInterval(() => {
        currentTime.value = new Date();
      }, 30000); // 30 seconds
    });

    onBeforeUnmount(() => {
      // Clean up interval to prevent memory leaks
      if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
      }
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
      isDragging,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleCloseDialog,
      handleStageChanged,
      handleProposalStatusChanged,
      openLead,
      editLead,
      deleteLead,
      formatColumnTotal,
      calculateGrandTotal,
      getTotalLeadsCount,
      handleLeadSaved,
      addLead,
      openLeadCreateDialog,
      toggleDropdown,
      formatWord,
      calculateTimeInStage,
      getProbabilityClass,
      getProbabilityLetter,
      getProposalStatusClass,
      getProposalStatusLabel,
    };
  },
});
</script>

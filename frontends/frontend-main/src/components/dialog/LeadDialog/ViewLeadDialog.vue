<template>
  <q-dialog ref="dialog" :model-value="modelValue" @before-show="fetchData" @hide="onHide">
    <q-card class="view-lead-card">
      <q-card-section class="q-pa-lg">
        <div class="row items-center justify-between q-pb-xs">
          <span class="text-dark text-title-large-f-[18px]">{{ leadInformation.name }}</span>
          <div class="row q-gutter-x-md">
            <q-btn class="edit-btn" dense rounded unelevated icon="edit" />
            <q-btn class="close-btn" dense rounded unelevated icon="close" @click="onHide" />
          </div>
        </div>

        <div class="row items-center q-gutter-x-sm q-mb-md">
          <q-badge class="StageBadge" text-color="white">Current Stage <q-icon name="keyboard_arrow_down" /></q-badge>
          <q-badge class="ProposalBadge" text-color="white"
            >Proposal Status <q-icon name="keyboard_arrow_down"
          /></q-badge>
          <q-badge class="BiddingBadge" text-color="white"
            >Bidding Status <q-icon name="keyboard_arrow_down"
          /></q-badge>
        </div>

        <div class="row items-start justify-start">
          <div class="col-8">
            <div class="details-container q-pr-sm">
              <div class="row justify-between q-pb-lg">
                <div class="detail-three-card column items-center justify-center">
                  <div class="icon-div q-pa-sm">
                    <q-icon name="payments" :style="{ color: 'var(--q-secondary)' }" size="18px" />
                  </div>
                  <span class="title">&#x20B1;{{ "0.00" }}(Static)</span>
                  <span class="subtitle">ABC</span>
                </div>
                <div class="detail-three-card column items-center justify-center">
                  <div class="icon-div q-pa-sm">
                    <q-icon name="event" :style="{ color: 'var(--q-secondary)' }" size="18px" />
                  </div>
                  <span class="title">{{ leadInformation.endDate?.dateFull || "N/A" }}</span>
                  <span class="subtitle">Closing Date</span>
                </div>
                <div class="detail-three-card column items-center justify-center">
                  <div class="icon-div q-pa-sm">
                    <q-icon name="pin_drop" :style="{ color: 'var(--q-secondary)' }" size="18px" />
                  </div>
                  <span class="title">{{ leadInformation.location?.name || "No Location" }}</span>
                  <span class="subtitle">Location</span>
                </div>
              </div>

              <!-- Lead Details -->
              <div class="details-title"><q-icon name="o_info" size="20px" />Lead Details</div>
              <div class="details-card q-pa-md q-mt-sm q-mb-lg">
                <div class="row">
                  <q-icon name="card_travel" size="16px" :style="{ color: 'var(--q-text-light-grey)' }" />
                  <div class="column q-ml-sm">
                    <span class="subtitle">Deal Type:</span>
                    <span class="details-value">{{
                      typeof leadInformation.leadType === "object"
                        ? leadInformation.leadType?.label
                        : leadInformation.leadType || "N/A"
                    }}</span>
                  </div>
                </div>

                <div class="row">
                  <q-icon name="my_location" size="16px" :style="{ color: 'var(--q-text-light-grey)' }" />
                  <div class="column q-ml-sm">
                    <span class="subtitle">Probability:</span>
                    <span class="details-value">{{ winProbabilityLabel }}</span>
                  </div>
                </div>

                <div class="row">
                  <q-icon name="o_account_circle" size="16px" :style="{ color: 'var(--q-text-light-grey)' }" />
                  <div class="column q-ml-sm">
                    <span class="subtitle">Contact Person:</span>
                    <span class="details-value">{{ leadInformation.client?.name }}</span>
                  </div>
                </div>

                <div class="row">
                  <q-icon name="o_group" size="16px" :style="{ color: 'var(--q-text-light-grey)' }" />
                  <div class="column q-ml-sm">
                    <span class="subtitle">Relationship Owner:</span>
                    <span class="details-value">{{
                      leadInformation.personInCharge?.firstName
                        ? formatWord(leadInformation.personInCharge?.firstName) +
                          " " +
                          formatWord(leadInformation.personInCharge?.lastName)
                        : "N/A"
                    }}</span>
                  </div>
                </div>

                <div class="row">
                  <q-icon name="o_topic" size="16px" :style="{ color: 'var(--q-text-light-grey)' }" />
                  <div class="column q-ml-sm">
                    <span class="subtitle">Source:</span>
                    <span class="details-value">Online (Static)</span>
                  </div>
                </div>

                <div class="row">
                  <q-icon name="o_request_quote" size="16px" :style="{ color: 'var(--q-text-light-grey)' }" />
                  <div class="column q-ml-sm">
                    <span class="subtitle">Initial Costing:</span>
                    <span class="details-value">&#x20B1;80,000.00 (Static)</span>
                  </div>
                </div>

                <div class="row">
                  <q-icon name="o_payments" size="16px" :style="{ color: 'var(--q-text-light-grey)' }" />
                  <div class="column q-ml-sm">
                    <span class="subtitle">Payment Terms:</span>
                    <span class="details-value">Down Payment: 20% Retention: 10% (Static)</span>
                  </div>
                </div>

                <div class="row justify-between q-gutter-x-md">
                  <div class="col row justify-center q-pa-sm" style="background-color: #f6f8fb; border-radius: 8px">
                    <q-icon name="event" size="18px" :style="{ color: 'var(--q-text-light-grey)' }" />
                    <div class="column q-ml-sm">
                      <span class="subtitle">Stage Change:</span>
                      <span class="details-value">July 16, 2025 (Static)</span>
                    </div>
                  </div>

                  <div class="col row justify-center q-pa-sm" style="background-color: #f6f8fb; border-radius: 8px">
                    <q-icon name="schedule" size="18px" :style="{ color: 'var(--q-text-light-grey)' }" />
                    <div class="column q-ml-sm">
                      <span class="subtitle">Days in current stage:</span>
                      <span class="details-value">28 (Static)</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Lead Tasks -->
              <div class="details-title"><q-icon name="o_task" size="20px" />Tasks</div>
              <div class="lead-card q-pa-md q-mt-sm q-mb-lg">
                <GlobalWidgetCardBox class="task-card-item">
                  <div class="row q-pb-xs">
                    <span class="details-value"><span class="text-grey-light">#033</span> Sample Task A (Static)</span>
                  </div>
                  <div class="row justify-between items-center">
                    <div class="row q-gutter-x-sm">
                      <div class="priorityBadge">
                        <q-icon name="o_assignment_returned" size="16px" />
                        <span>Task</span>
                      </div>
                      <div class="levelBadge">Very Easy</div>
                      <div class="statusBadge">Pending</div>
                    </div>
                    <div class="text-italic">Time Ago (static)</div>
                  </div>
                </GlobalWidgetCardBox>

                <GlobalWidgetCardBox class="task-card-item">
                  <div class="row q-pb-xs">
                    <span class="details-value"
                      ><span class="text-grey-light">#034</span> Interior Design Attachment (Static)</span
                    >
                  </div>
                  <div class="row justify-between items-center">
                    <div class="row q-gutter-x-sm">
                      <div class="priorityBadge">
                        <q-icon name="o_assignment_returned" size="16px" />
                        <span>Task</span>
                      </div>
                      <div class="levelBadge">Very Easy</div>
                      <div class="statusBadge">Pending</div>
                    </div>
                    <div class="text-italic">Time Ago (static)</div>
                  </div>
                </GlobalWidgetCardBox>

                <GlobalWidgetCardBox class="task-card-item">
                  <div class="row q-pb-xs">
                    <span class="details-value"
                      ><span class="text-grey-light">#035</span> Exterior Design Attachment (Static)</span
                    >
                  </div>
                  <div class="row justify-between items-center">
                    <div class="row q-gutter-x-sm">
                      <div class="priorityBadge">
                        <q-icon name="o_assignment_returned" size="16px" />
                        <span>Task</span>
                      </div>
                      <div class="levelBadge">Very Easy</div>
                      <div class="statusBadge">Pending</div>
                    </div>
                    <div class="text-italic">Time Ago (static)</div>
                  </div>
                </GlobalWidgetCardBox>
              </div>

              <!-- Calendar Events -->
              <div class="details-title"><q-icon name="event" size="20px" />Calendar Events</div>
              <div class="lead-card q-pa-md q-mt-sm q-mb-lg">
                <GlobalWidgetCardBox class="events-card-item q-pa-md">
                  <div class="column q-pb-xs">
                    <span class="details-value">
                      <q-icon name="o_today" size="16px" style="color: #00897b" />
                      Site Inspection (Static)
                    </span>
                  </div>
                  <div class="row justify-between items-center">
                    <div class="subtitle">July 16, 2025 (Static)</div>
                    <div class="text-italic">Time Ago (static)</div>
                  </div>
                </GlobalWidgetCardBox>

                <GlobalWidgetCardBox class="events-card-item q-pa-md">
                  <div class="column q-pb-xs">
                    <span class="details-value">
                      <q-icon name="card_travel" size="16px" style="color: #1e88e5" />
                      Meeting with Investor (Static)
                    </span>
                  </div>
                  <div class="row justify-between items-center">
                    <div class="subtitle">July 16, 2025 (Static)</div>
                    <div class="text-italic">Time Ago (static)</div>
                  </div>
                </GlobalWidgetCardBox>
              </div>

              <!-- Notes/ Next Actions -->
              <div class="details-title"><q-icon name="o_note_add" size="20px" />Notes/ Next Actions</div>
              <div class="lead-card q-pa-md q-mt-sm q-mb-lg">
                <div class="notes-card-item row justify-between q-px-md q-py-sm">
                  <div class="col">
                    <div>
                      <q-badge class="noteBadge" :class="{ pinned: true }" text-color="white">
                        <q-icon name="my_location" class="text-dark" />
                        <div class="text-dark text-label-large">Pinned</div>
                      </q-badge>
                    </div>
                    <div class="text-grey text-label-medium q-pt-xs">Notes:</div>
                    <div class="text-dark text-label-large q-pb-xs">Lorem ipsum dolor katarata.</div>
                    <div class="row items-center">
                      <q-avatar size="md">
                        <img src="/lead-avatar.png" />
                      </q-avatar>
                      <div class="text-grey text-label-large q-ml-sm">{{ leadInformation.client?.name }}</div>
                    </div>
                  </div>
                  <div class="menu-time column items-end justify-between">
                    <q-btn color="grey-7" dense round flat icon="more_vert" class="q-mb-sm">
                      <q-menu auto-close anchor="bottom end" self="top end">
                        <div class="q-pa-sm">
                          <div clickable class="row q-py-xs q-gutter-x-sm cursor-pointer">
                            <div class="row items-center text-dark"><q-icon name="my_location" size="20px" /></div>
                            <div class="text-dark text-label-medium q-pa-xs">Unpin</div>
                          </div>
                          <div clickable class="row q-py-xs q-gutter-x-sm item-center cursor-pointer">
                            <div class="row items-center text-dark"><q-icon name="edit" size="20px" /></div>
                            <div class="text-dark text-label-medium q-pa-xs">Edit</div>
                          </div>
                          <div clickable class="row q-py-xs q-gutter-x-sm cursor-pointer">
                            <div class="row items-center text-dark"><q-icon name="delete" size="20px" /></div>
                            <div class="text-dark text-label-medium">Delete</div>
                          </div>
                        </div>
                      </q-menu>
                    </q-btn>
                    <div class="text-grey text-label-medium">Time ago (static)</div>
                  </div>
                </div>

                <div class="notes-card-item row justify-between q-px-md q-py-sm">
                  <div class="col">
                    <div>
                      <!-- <q-badge class="noteBadge" :class="{ pinned: true }" text-color="white">
                        <q-icon name="my_location" class="text-dark" />
                        <div class="text-dark text-label-large">Pinned</div>
                      </q-badge> -->
                    </div>
                    <div class="text-grey text-label-medium q-pt-xs">Notes:</div>
                    <div class="text-dark text-label-large q-pb-xs">
                      {{
                        truncateFormat(
                          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore."
                        )
                      }}
                    </div>
                    <div class="row items-center">
                      <q-avatar size="md">
                        <img src="/lead-avatar.png" />
                      </q-avatar>
                      <div class="text-grey text-label-large q-ml-sm">{{ leadInformation.client?.name }}</div>
                    </div>
                  </div>
                  <div class="menu-time column items-end justify-between">
                    <q-btn color="grey-7" dense round flat icon="more_vert" class="q-mb-sm">
                      <q-menu auto-close anchor="bottom end" self="top end">
                        <div class="q-pa-sm">
                          <div clickable class="row q-py-xs q-gutter-x-sm cursor-pointer">
                            <div class="row items-center text-dark"><q-icon name="my_location" size="20px" /></div>
                            <div class="text-dark text-label-medium q-pa-xs">Unpin</div>
                          </div>
                          <div clickable class="row q-py-xs q-gutter-x-sm item-center cursor-pointer">
                            <div class="row items-center text-dark"><q-icon name="edit" size="20px" /></div>
                            <div class="text-dark text-label-medium q-pa-xs">Edit</div>
                          </div>
                          <div clickable class="row q-py-xs q-gutter-x-sm cursor-pointer">
                            <div class="row items-center text-dark"><q-icon name="delete" size="20px" /></div>
                            <div class="text-dark text-label-medium">Delete</div>
                          </div>
                        </div>
                      </q-menu>
                    </q-btn>
                    <div class="text-grey text-label-medium">Time ago (static)</div>
                  </div>
                </div>
              </div>

              <!-- Attachments -->
              <div class="details-title"><q-icon name="attach_file" size="20px" />Attachments</div>
              <div class="lead-card q-pa-md q-mt-sm q-mb-lg">
                <div class="attachments-card-item">
                  <div class="text-label-medium row items-center">
                    <span class="q-mr-sm">sample_file.pdf (Static)</span>
                    <q-icon name="o_delete" size="14px" />
                  </div>
                </div>
              </div>

              <!-- Activities Timeline -->
              <div class="details-title"><q-icon name="event_note" size="20px" />Activities Timeline</div>
              <div class="activities-card q-pa-md q-mt-sm q-mb-lg">
                <div class="activities-card-item row">
                  <q-icon name="o_bookmark_add" size="18px" :style="{ color: 'var(--q-text-light-grey)' }" />
                  <div class="column q-ml-sm">
                    <span class="subtitle">january 29, 2025</span>
                    <span class="details-value">Lead was created and added to the pipeline. (Static)</span>
                    <div>
                      <span class="subtitle">Note/ Next Actions:</span>
                      <span class="subtitle text-dark">Note/ Next Actions (Static)</span>
                    </div>
                  </div>
                </div>

                <div class="activities-card-item row">
                  <q-icon name="content_paste_go" size="18px" :style="{ color: 'var(--q-text-light-grey)' }" />
                  <div class="column q-ml-sm">
                    <span class="subtitle">February 1, 2025</span>
                    <span class="details-value">Lead was moved from Opportunity to Initial Meeting. (Static)</span>
                    <div>
                      <span class="subtitle">Note/ Next Actions:</span>
                      <span class="subtitle text-dark">Note/ Next Actions (Static)</span>
                    </div>
                  </div>
                </div>

                <div class="activities-card-item row">
                  <q-icon name="content_paste_go" size="18px" :style="{ color: 'var(--q-text-light-grey)' }" />
                  <div class="column q-ml-sm">
                    <span class="subtitle">February 15, 2025</span>
                    <span class="details-value">Lead was moved from Initial Meeting to Proposal. (Static)</span>
                    <div>
                      <span class="subtitle">Note/ Next Actions:</span>
                      <span class="subtitle text-dark">Note/ Next Actions (Static)</span>
                    </div>
                  </div>
                </div>

                <div class="activities-card-item row">
                  <q-icon name="o_border_color" size="18px" :style="{ color: 'var(--q-text-light-grey)' }" />
                  <div class="column q-ml-sm">
                    <span class="subtitle">March 1, 2025 </span>
                    <span class="details-value">Lead note was updated. (Static)</span>
                    <div>
                      <span class="subtitle">Note/ Next Actions:</span>
                      <span class="subtitle text-dark">Note/ Next Actions (Static)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-4 column q-pl-md">
            <div class="text-title-small q-mb-sm" :style="{ color: 'var(--q-text-light-grey)' }">Main Actions</div>
            <div class="more-actions column items-center justify-center q-mb-lg">
              <GButton
                variant="outline"
                no-caps
                color="primary"
                icon="swap_horiz"
                label="Convert To Project"
                class="full-width row items-start"
              />
              <GButton
                variant="outline"
                no-caps
                color="primary"
                icon="o_collections_bookmark"
                label="Bill Of Quantity"
                class="full-width row items-start"
              >
                <q-menu
                  auto-close
                  anchor="bottom middle"
                  self="top middle"
                  transition-show="jump-down"
                  transition-hide="jump-up"
                  style="border-radius: 12px;"
                >
                  <div class="menu">
                    <div clickable class="menu-item row q-gutter-x-sm cursor-pointer" @click="openBillOfQuantityDialog">
                      <div class="row items-center text-dark"><q-icon name="visibility" size="20px" /></div>
                      <div class="text-dark text-label-medium q-pa-xs">View Bill Of Quality</div>
                    </div>
                    <div clickable class="menu-item row q-gutter-x-sm cursor-pointer">
                      <div class="row items-center text-dark"><q-icon name="add" size="20px" /></div>
                      <div class="text-dark text-label-medium q-pa-xs">Add New Version</div>
                    </div>
                  </div>
                </q-menu>
              </GButton>

              <GButton
                variant="outline"
                no-caps
                color="primary"
                icon="o_folder_copy"
                label="Proposal"
                class="full-width row items-start"
              >
                <q-menu
                  auto-close
                  anchor="bottom middle"
                  self="top middle"
                  transition-show="jump-down"
                  transition-hide="jump-up"
                  style="border-radius: 12px;"
                >
                  <div class="menu">
                    <div clickable class="menu-item row q-gutter-x-sm cursor-pointer">
                      <div class="row items-center text-dark"><q-icon name="visibility" size="20px" /></div>
                      <div class="text-dark text-label-medium q-pa-xs">View Proposal</div>
                    </div>
                    <div clickable class="menu-item row q-gutte-x-sm cursor-pointer">
                      <div class="row items-center text-dark"><q-icon name="upload" size="20px" /></div>
                      <div class="text-dark text-label-medium q-pa-xs">Upload Proposal</div>
                    </div>
                    <div clickable class="menu-item row q-gutter-x-sm cursor-pointer" @click="openManageVersionDialog()">
                      <div class="row items-center text-dark"><q-icon name="history" size="20px" /></div>
                      <div class="text-dark text-label-medium q-pa-xs">Manage Versions</div>
                    </div>
                  </div>
                </q-menu>
              </GButton>
            </div>

            <div class="text-title-small q-mb-sm" :style="{ color: 'var(--q-text-light-grey)' }">Quick Actions</div>
            <div class="quick-actions column items-center justify-center">
              <GButton
                unelevated
                no-caps
                color="primary"
                variant="tonal"
                icon="edit_document"
                label="Create Task"
                class="full-width row items-start"
              />
              <GButton
                unelevated
                no-caps
                color="primary"
                variant="tonal"
                icon="o_edit_calendar"
                label="Schedule Meeting"
                class="full-width row items-start"
              />
              <GButton
                unelevated
                no-caps
                color="primary"
                variant="tonal"
                icon="forward_to_inbox"
                label="Send Email"
                class="full-width row items-start"
                @click="openEmailCompose"
              />
              <GButton
                unelevated
                no-caps
                color="primary"
                variant="tonal"
                icon="attachment"
                label="Attachment"
                class="full-width row items-start"
              />
              <GButton
                unelevated
                no-caps
                color="primary"
                variant="tonal"
                icon="o_note_add"
                label="Add Note"
                class="full-width row items-start"
                @click="openAddNoteDialog"
              />
            </div>

            <!-- <div class="text-subtitle2" :style="{ color: 'var(--q-text-light-grey)' }">Notes/ Next Actions:</div>
            <div class="notes column items-end justify-end q-pa-sm">
              <q-input
                type="textarea"
                v-model="notesText"
                autogrow
                outlined
                stack-label
                placeholder="What needs to be done on this stage..."
                class="note-field full-width"
              />
              <div class="text-right">
                <q-btn unelevated no-caps color="secondary" class="full-width row items-start">Save Notes</q-btn>
              </div>
            </div> -->
          </div>
        </div>
      </q-card-section>

      <!-- Bill of Quantity Dialog -->
      <bill-of-quantity-dialog
        v-if="isBillOfQuantityDialogOpen"
        v-model="isBillOfQuantityDialogOpen"
        :projectId="leadInformation.id"
      />

      <!-- Email Compose Dialog -->
      <email-compose-dialog
        v-model="isEmailComposeDialogOpen"
        :defaultTo="leadInformation.client?.email || ''"
        :defaultSubject="` ${leadInformation.name}`"
        @sent="handleEmailSent"
      />

      <!-- Proposal Manage Version Dialog -->
      <ProposalManageVersionDialog v-model="isManageVersionDialogOpen" />

      <!-- Add Note Dialog -->
      <AddNoteDialog 
        v-model="isAddNoteDialogOpen" 
        :noteData="editingNote"
        @saveDone="handleNoteSaved"
        @close="isAddNoteDialogOpen = false"
      />
    </q-card>
  </q-dialog>
</template>

<style scoped src="./LeadDialog.scss"></style>

<script lang="ts">
import GButton from "src/components/shared/buttons/GButton.vue";
import GlobalWidgetCardBox from "src/components/shared/global/GlobalWidgetCardBox.vue";
import { APIRequests } from "src/utility/api.handler";
import { LeadDataResponse } from "@shared/response";
import { useQuasar } from "quasar";
import { ref, computed } from "vue";
import { formatWord } from "src/utility/formatter";
import BillOfQuantityDialog from "../BillOfQuantity/BillOfQuantityDialog.vue";
import EmailComposeDialog from "../EmailComposeDialog.vue";
import ProposalManageVersionDialog from "./ProposalManageVersionDialog.vue";
import AddNoteDialog from "./AddNoteDialog.vue";

export default {
  name: "ViewLeadDialog",
  components: {
    GButton,
    GlobalWidgetCardBox,
    BillOfQuantityDialog,
    EmailComposeDialog,
    ProposalManageVersionDialog,
    AddNoteDialog,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    leadViewId: {
      type: Number,
      required: true,
    },
  },
  emits: ['update:modelValue', 'close'],

  setup(props, { emit }) {
    const $q = useQuasar();
    const notesText = ref("");
    const leadInformation = ref({} as LeadDataResponse);
    const isBillOfQuantityDialogOpen = ref(false);
    const isManageVersionDialogOpen = ref(false);
    const projectId = ref<number>(0);
    const isEmailComposeDialogOpen = ref(false);
    const isAddNoteDialogOpen = ref(false);
    const editingNote = ref(null);

    const winProbabilityLabel = computed(() => {
      const prob = leadInformation.value?.winProbability;
      return typeof prob === "string" ? prob : prob?.label;
    });

    const openBillOfQuantityDialog = () => {
      isBillOfQuantityDialogOpen.value = true;
    };

    const openManageVersionDialog = () => {
      isManageVersionDialogOpen.value = true;
    };

    const fetchData = async () => {
      try {
        $q.loading.show();
        const id = props.leadViewId.toString();
        const response = await APIRequests.getLeadInformation($q, { id });
        leadInformation.value = response;
      } catch (error) {
        console.error("Failed to fetch lead data:", error);
        $q.notify({
          color: "negative",
          message: "Failed to load lead data",
          icon: "report_problem",
        });
      } finally {
        $q.loading.hide();
      }
    };

    const openEmailCompose = () => {
      isEmailComposeDialogOpen.value = true;
    };

    const handleEmailSent = () => {
      $q.notify({
        color: "positive",
        message: "Email sent successfully",
        icon: "check",
      });
    };

    const truncateFormat = (text: string, maxLength: number = 60): string => {
      if (!text) return "";
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + "...";
    };

    const openAddNoteDialog = () => {
      editingNote.value = null; // For creating new note
      isAddNoteDialogOpen.value = true;
    };

    const handleNoteSaved = () => {
      $q.notify({
        color: "positive",
        message: "Note saved successfully",
        icon: "check",
        position: "top",
      });
      // Here you could refresh the notes list or update the UI
      // For now, we'll just close the dialog
      isAddNoteDialogOpen.value = false;
    };

    const onHide = () => {
      emit('update:modelValue', false);
      emit('close');
    };

    return {
      notesText,
      leadInformation,
      winProbabilityLabel,
      isBillOfQuantityDialogOpen,
      isManageVersionDialogOpen,
      projectId,
      isEmailComposeDialogOpen,
      isAddNoteDialogOpen,
      editingNote,
      formatWord,
      truncateFormat,
      fetchData,
      openBillOfQuantityDialog,
      openEmailCompose,
      handleEmailSent,
      openManageVersionDialog,
      openAddNoteDialog,
      handleNoteSaved,
      onHide,
    };
  },
};
</script>

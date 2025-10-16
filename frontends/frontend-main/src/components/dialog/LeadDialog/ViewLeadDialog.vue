<template>
  <q-dialog ref="dialog" :model-value="modelValue" @before-show="fetchData" @hide="onHide">
    <q-card class="view-lead-card">
      <q-card-section class="q-pa-lg">
        <div class="row items-center justify-between q-pb-xs">
          <span class="text-dark text-title-large-f-[18px]">{{
            leadInformation.name
            }}</span>
          <div class="row q-gutter-x-md">
            <q-btn class="edit-btn" dense rounded unelevated icon="edit" @click="openEditDialog" />
            <q-btn class="close-btn" dense rounded unelevated icon="close" @click="onHide" />
          </div>
        </div>

        <div class="row items-center q-gutter-x-sm q-mb-md">
          <!-- Current Stage Badge - Dynamic and Changeable -->
          <q-badge class="StageBadge cursor-pointer" text-color="white" :style="{ backgroundColor: currentStageColor }">
            {{ currentStageDisplay }}
            <q-icon name="keyboard_arrow_down" class="q-ml-xs stage-arrow"
              :class="{ 'rotate-arrow': isStageMenuOpen }" />
            <q-menu auto-close @before-show="isStageMenuOpen = true" @before-hide="isStageMenuOpen = false">
              <q-list style="min-width: 200px">
                <q-item v-for="stage in stageOptions" :key="stage.key" clickable @click="handleStageChange(stage.key)"
                  :active="leadInformation.leadBoardStage === stage.key">
                  <q-item-section avatar>
                    <q-icon name="fiber_manual_record" :style="{ color: stage.color }" size="12px" />
                  </q-item-section>
                  <q-item-section>{{ stage.label }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-badge>

          <!-- Proposal Status Badge - Dynamic -->
          <q-badge v-if="showProposalBadge" class="ProposalBadge cursor-pointer" text-color="white"
            :style="{ backgroundColor: currentProposalColor }">
            {{ currentProposalDisplay }}
            <q-icon name="keyboard_arrow_down" class="q-ml-xs stage-arrow"
              :class="{ 'rotate-arrow': isProposalMenuOpen }" />
            <q-menu auto-close @before-show="isProposalMenuOpen = true" @before-hide="isProposalMenuOpen = false">
              <q-list style="min-width: 200px">
                <q-item v-for="status in proposalStatusOptions" :key="status.key" clickable
                  @click="handleProposalStatusChange(status.key)"
                  :active="leadInformation.proposalStatus === status.key">
                  <q-item-section avatar>
                    <q-icon name="fiber_manual_record" :style="{ color: status.color }" size="12px" />
                  </q-item-section>
                  <q-item-section>{{ status.label }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-badge>

          <!-- Bidding Status Badge - Under Development -->
          <!-- <q-badge class="BiddingBadge cursor-pointer" text-color="white">
            Bidding Status <q-icon name="keyboard_arrow_down" />
            <q-tooltip>Under Development</q-tooltip>
          </q-badge> -->
        </div>
        <div class="row items-start justify-start">
          <div class="col-8">
            <div class="details-container q-pr-sm">
              <div class="detail-three-card-container q-pb-lg">
                <!-- Total Contract -->
                <div class="detail-three-card column items-center justify-center">
                  <div class="icon-div q-pa-sm">
                    <q-icon name="o_payments" :style="{ color: 'var(--q-secondary)' }" size="18px" />
                  </div>
                  <span class="title">{{
                    leadInformation.initialCosting?.formatCurrency || "₱0.00"
                    }}</span>
                  <span class="subtitle">Total Contract</span>
                </div>
                <!-- Win Probability -->
                <div class="detail-three-card column items-center justify-center">
                  <div class="icon-div q-pa-sm">
                    <q-icon name="o_beenhere" :style="{ color: 'var(--q-secondary)' }" size="18px" />
                  </div>
                  <span class="title">{{
                    leadInformation.winProbability?.label || "0%"
                    }}</span>
                  <span class="subtitle">Win Probability</span>
                </div>
                <!-- Company -->
                <div class="detail-three-card column items-center justify-center">
                  <div class="icon-div q-pa-sm">
                    <q-icon name="business" :style="{ color: 'var(--q-secondary)' }" size="18px" />
                  </div>
                  <span class="title">{{
                    leadInformation.client?.company?.name || "No Company"
                    }}</span>
                  <span class="subtitle">Company</span>
                </div>
                <!-- Relationship Owner -->
                <div class="detail-three-card column items-center justify-center">
                  <div class="icon-div q-pa-sm">
                    <q-icon name="o_account_circle" :style="{ color: 'var(--q-secondary)' }" size="18px" />
                  </div>
                  <span class="title">{{
                    formatWord(leadInformation.personInCharge?.firstName) +
                    " " +
                    formatWord(leadInformation.personInCharge?.lastName) ||
                    "No Relationship Owner"
                  }}</span>
                  <span class="subtitle">Relationship Owner</span>
                </div>
              </div>

              <!-- Lead Details -->
              <div class="details-title">
                <q-icon name="o_info" size="20px" />Lead Details
              </div>
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

                <div v-if="leadInformation.abc?.raw !== 0" class="row">
                  <q-icon name="my_location" size="16px" :style="{ color: 'var(--q-text-light-grey)' }" />
                  <div class="column q-ml-sm">
                    <span class="subtitle">Approved Budget Contract (ABC):</span>
                    <span class="details-value">{{ leadInformation.abc?.formatCurrency || "₱0.00" }}</span>
                  </div>
                </div>

                <div class="row">
                  <q-icon name="today" size="16px" :style="{ color: 'var(--q-text-light-grey)' }" />
                  <div class="column q-ml-sm">
                    <span class="subtitle">Monthly Recurring Revenue (MRR):</span>
                    <span class="details-value">{{
                      leadInformation.mmr?.formatCurrency || "₱0.00"
                      }}</span>
                  </div>
                </div>

                <div class="row">
                  <q-icon name="o_flag" size="16px" :style="{ color: 'var(--q-text-light-grey)' }" />
                  <div class="column q-ml-sm">
                    <span class="subtitle">Implementation Fee:</span>
                    <span class="details-value">{{
                      leadInformation.implementationFee?.formatCurrency ||
                      "₱0.00"
                      }}</span>
                  </div>
                </div>

                <div class="row">
                  <q-icon name="o_group" size="16px" :style="{ color: 'var(--q-text-light-grey)' }" />
                  <div class="column q-ml-sm">
                    <span class="subtitle">Point of Contact:</span>
                    <span class="details-value">{{
                      leadInformation.client?.name
                      }}</span>
                  </div>
                </div>

                <div class="row">
                  <q-icon name="o_topic" size="16px" :style="{ color: 'var(--q-text-light-grey)' }" />
                  <div class="column q-ml-sm">
                    <span class="subtitle">Deal Source:</span>
                    <span class="details-value">{{
                      leadInformation.dealSource?.label || "N/A"
                      }}</span>
                  </div>
                </div>

                <div class="row justify-between q-gutter-x-md">
                  <div class="col row items-center q-pa-sm" style="background-color: #f6f8fb; border-radius: 8px">
                    <div class="column q-ml-sm">
                      <span class="subtitle">Close Date:</span>
                      <div class="row items-center">
                        <q-icon name="event" size="18px" :style="{ color: 'var(--q-text-light-grey)' }" />
                        <span class="details-value q-ml-xs">{{
                          closeDate
                          }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="col row items-center q-pa-sm" style="background-color: #f6f8fb; border-radius: 8px">
                    <div class="column q-ml-sm">
                      <span class="subtitle">Days in current stage:</span>
                      <div class="row items-center">
                        <q-icon name="schedule" size="18px" :style="{ color: 'var(--q-text-light-grey)' }" />
                        <span class="details-value q-ml-xs">{{
                          daysInCurrentStage
                          }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Lead Tasks -->
              <div class="details-title">
                <q-icon name="o_task" size="20px" />Tasks
              </div>
              <div class="lead-card q-pa-md q-mt-sm q-mb-lg">
                <GlobalWidgetCardBox class="task-card-item">
                  <div class="row q-pb-xs">
                    <span class="details-value"><span class="text-grey-light">#033</span> Sample Task A
                      (Static)</span>
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
                    <span class="details-value"><span class="text-grey-light">#034</span> Interior Design
                      Attachment (Static)</span>
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
                    <span class="details-value"><span class="text-grey-light">#035</span> Exterior Design
                      Attachment (Static)</span>
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
              <div class="details-title">
                <q-icon name="event" size="20px" />Calendar Events
              </div>
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
              <div class="details-title">
                <q-icon name="o_note_add" size="20px" />Notes/ Next Actions
              </div>
              <div class="lead-card q-pa-md q-mt-sm q-mb-lg">
                <div class="notes-card-item row justify-between q-px-md q-py-sm">
                  <div class="col">
                    <div>
                      <q-badge class="noteBadge" :class="{ pinned: true }" text-color="white">
                        <q-icon name="my_location" class="text-dark" />
                        <div class="text-dark text-label-large">Pinned</div>
                      </q-badge>
                    </div>
                    <div class="text-grey text-label-medium q-pt-xs">
                      Notes:
                    </div>
                    <div class="text-dark text-label-large q-pb-xs">
                      Lorem ipsum dolor katarata.
                    </div>
                    <div class="row items-center">
                      <q-avatar size="md">
                        <img src="/lead-avatar.png" />
                      </q-avatar>
                      <div class="text-grey text-label-large q-ml-sm">
                        {{ leadInformation.client?.name }}
                      </div>
                    </div>
                  </div>
                  <div class="menu-time column items-end justify-between">
                    <q-btn color="grey-7" dense round flat icon="more_vert" class="q-mb-sm">
                      <q-menu auto-close anchor="bottom end" self="top end">
                        <div class="q-pa-sm">
                          <div clickable class="row q-py-xs q-gutter-x-sm cursor-pointer">
                            <div class="row items-center text-dark">
                              <q-icon name="my_location" size="20px" />
                            </div>
                            <div class="text-dark text-label-medium q-pa-xs">
                              Unpin
                            </div>
                          </div>
                          <div clickable class="row q-py-xs q-gutter-x-sm item-center cursor-pointer">
                            <div class="row items-center text-dark">
                              <q-icon name="edit" size="20px" />
                            </div>
                            <div class="text-dark text-label-medium q-pa-xs">
                              Edit
                            </div>
                          </div>
                          <div clickable class="row q-py-xs q-gutter-x-sm cursor-pointer">
                            <div class="row items-center text-dark">
                              <q-icon name="delete" size="20px" />
                            </div>
                            <div class="text-dark text-label-medium">
                              Delete
                            </div>
                          </div>
                        </div>
                      </q-menu>
                    </q-btn>
                    <div class="text-grey text-label-medium">
                      Time ago (static)
                    </div>
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
                    <div class="text-grey text-label-medium q-pt-xs">
                      Notes:
                    </div>
                    <div class="text-dark text-label-large q-pb-xs">
                      {{
                        truncateFormat(
                          "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                        )
                      }}
                    </div>
                    <div class="row items-center">
                      <q-avatar size="md">
                        <img src="/lead-avatar.png" />
                      </q-avatar>
                      <div class="text-grey text-label-large q-ml-sm">
                        {{ leadInformation.client?.name }}
                      </div>
                    </div>
                  </div>
                  <div class="menu-time column items-end justify-between">
                    <q-btn color="grey-7" dense round flat icon="more_vert" class="q-mb-sm">
                      <q-menu auto-close anchor="bottom end" self="top end">
                        <div class="q-pa-sm">
                          <div clickable class="row q-py-xs q-gutter-x-sm cursor-pointer">
                            <div class="row items-center text-dark">
                              <q-icon name="my_location" size="20px" />
                            </div>
                            <div class="text-dark text-label-medium q-pa-xs">
                              Unpin
                            </div>
                          </div>
                          <div clickable class="row q-py-xs q-gutter-x-sm item-center cursor-pointer">
                            <div class="row items-center text-dark">
                              <q-icon name="edit" size="20px" />
                            </div>
                            <div class="text-dark text-label-medium q-pa-xs">
                              Edit
                            </div>
                          </div>
                          <div clickable class="row q-py-xs q-gutter-x-sm cursor-pointer">
                            <div class="row items-center text-dark">
                              <q-icon name="delete" size="20px" />
                            </div>
                            <div class="text-dark text-label-medium">
                              Delete
                            </div>
                          </div>
                        </div>
                      </q-menu>
                    </q-btn>
                    <div class="text-grey text-label-medium">
                      Time ago (static)
                    </div>
                  </div>
                </div>
              </div>

              <!-- Attachments -->
              <div class="details-title">
                <q-icon name="attach_file" size="20px" />Attachments
              </div>
              <div class="lead-card q-pa-md q-mt-sm q-mb-lg">
                <!-- Loading State -->
                <div v-if="isLoadingAttachments" class="text-center q-pa-md">
                  <q-spinner color="primary" size="40px" />
                  <div class="text-grey q-mt-sm">Loading attachments...</div>
                </div>

                <!-- Empty State -->
                <div v-else-if="!attachments.length" class="text-center q-pa-md">
                  <q-icon name="attach_file" size="48px" color="grey-5" />
                  <div class="text-grey q-mt-sm">No attachments yet</div>
                </div>

                <!-- Attachments List -->
                <div v-else class="column q-gutter-y-sm">
                  <div v-for="attachment in attachments" :key="attachment.id" class="attachments-card-item">
                    <div class="row items-center justify-between">
                      <div class="col">
                        <div class="row items-center">
                          <q-icon name="description" size="20px" class="q-mr-sm" color="primary" />
                          <div class="column">
                            <span class="text-label-medium text-weight-medium">{{ attachment.fileName }}</span>
                            <div class="text-caption text-grey">
                              {{ formatFileSize(attachment.fileSize) }} • Uploaded {{
                                formatUploadDate(attachment.uploadedAt) }}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="row items-center q-gutter-x-xs q-ml-md">
                        <g-button flat round dense size="sm" icon-size="sm" icon="download" color="primary"
                          @click="downloadAttachment(attachment)">
                          <q-tooltip>Download</q-tooltip>
                        </g-button>
                        <g-button flat round dense icon-size="sm" size="sm" icon="delete" color="negative"
                          @click="handleAttachmentDelete(attachment)">
                          <q-tooltip>Delete</q-tooltip>
                        </g-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Activities Timeline -->
              <div class="details-title">
                <q-icon name="event_note" size="20px" />Activities Timeline
              </div>
              <div class="activities-card q-pa-md q-mt-sm q-mb-lg">
                <div class="activities-card-item row">
                  <q-icon name="o_bookmark_add" size="18px" :style="{ color: 'var(--q-text-light-grey)' }" />
                  <div class="column q-ml-sm">
                    <span class="subtitle">january 29, 2025</span>
                    <span class="details-value">Lead was created and added to the pipeline.
                      (Static)</span>
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
                    <span class="details-value">Lead was moved from Opportunity to Initial Meeting.
                      (Static)</span>
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
                    <span class="details-value">Lead was moved from Initial Meeting to Proposal.
                      (Static)</span>
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
            <div class="text-title-small q-mb-sm" :style="{ color: 'var(--q-text-light-grey)' }">
              Main Actions
            </div>
            <div class="more-actions column items-center justify-center q-mb-lg">
              <GButton variant="outline" no-caps color="primary" icon="swap_horiz" label="Convert To Project"
                class="full-width row items-start" @click="handleConvertToProject" />

              <GButton variant="outline" no-caps color="primary" icon="o_collections_bookmark"
                @click="openBillOfQuantityDialog" label="Bill Of Quantity" class="full-width row items-start" />
            </div>

            <div class="text-title-small q-mb-sm" :style="{ color: 'var(--q-text-light-grey)' }">
              Quick Actions
            </div>
            <div class="quick-actions column items-center justify-center">
              <GButton unelevated no-caps color="primary" variant="tonal" icon="attachment" label="Attachment"
                class="full-width row items-start" @click="handleAttachmentClick" />
              <GButton unelevated no-caps color="primary" variant="tonal" icon="o_note_add" label="Add Note"
                class="full-width row items-start" @click="openAddNoteDialog" />
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
      <bill-of-quantity-dialog v-if="isBillOfQuantityDialogOpen" v-model="isBillOfQuantityDialogOpen"
        :projectId="leadInformation.id" />

      <!-- Add Note Dialog -->
      <AddNoteDialog v-model="isAddNoteDialogOpen" :noteData="editingNote" @saveDone="handleNoteSaved"
        @close="isAddNoteDialogOpen = false" />

      <!-- Lead Edit Dialog -->
      <lead-create-dialog v-model="isLeadEditDialogOpen" :leadData="leadInformation" @close="handleLeadEdited"
        @saveDone="handleLeadEdited" />

      <!-- Attachment Upload Dialog -->
      <LeadAttachmentUploadDialog v-if="isAttachmentUploadDialogOpen" ref="attachmentUploadDialogRef"
        :leadId="leadViewId" @uploaded="handleAttachmentsUploaded" @close="isAttachmentUploadDialogOpen = false" />
    </q-card>
  </q-dialog>
</template>

<style scoped src="./LeadDialog.scss"></style>

<script lang="ts">
import GButton from "src/components/shared/buttons/GButton.vue";
import GlobalWidgetCardBox from "src/components/shared/global/GlobalWidgetCardBox.vue";
import { APIRequests } from "src/utility/api.handler";
import { LeadDataResponse } from "@shared/response";
import { useQuasar, Dialog, QBtn, date } from "quasar";
import { ref, computed, defineAsyncComponent } from "vue";
import { formatWord } from "src/utility/formatter";
import { useRouter } from "vue-router";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const BillOfQuantityDialog = defineAsyncComponent(
  () => import("../BillOfQuantity/BillOfQuantityDialog.vue")
);
const EmailComposeDialog = defineAsyncComponent(
  () => import("../EmailComposeDialog.vue")
);

const AddNoteDialog = defineAsyncComponent(() => import("./AddNoteDialog.vue"));

const LeadCreateDialog = defineAsyncComponent(
  () => import("./LeadCreateDialog.vue")
);

const LeadAttachmentUploadDialog = defineAsyncComponent(
  () => import("./LeadAttachmentUploadDialog.vue")
);

export default {
  name: "ViewLeadDialog",
  components: {
    GButton,
    GlobalWidgetCardBox,
    BillOfQuantityDialog,
    EmailComposeDialog,
    AddNoteDialog,
    LeadCreateDialog,
    LeadAttachmentUploadDialog,
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
  emits: ["update:modelValue", "close", "stageChanged", "proposalStatusChanged"],

  setup(props, { emit }) {
    const $q = useQuasar();
    const router = useRouter();
    const notesText = ref("");
    const leadInformation = ref({} as LeadDataResponse);
    const isBillOfQuantityDialogOpen = ref(false);
    const isManageVersionDialogOpen = ref(false);
    const projectId = ref<number>(0);
    const isAddNoteDialogOpen = ref(false);
    const editingNote = ref(null);
    const isLeadEditDialogOpen = ref(false);
    const isStageMenuOpen = ref(false);
    const isProposalMenuOpen = ref(false);

    // Attachment state
    const attachments = ref<any[]>([]);
    const isLoadingAttachments = ref(false);
    const isAttachmentUploadDialogOpen = ref(false);
    const attachmentUploadDialogRef = ref<any>(null);

    const winProbabilityLabel = computed(() => {
      const prob = leadInformation.value?.winProbability;
      return typeof prob === "string" ? prob : prob?.label;
    });

    // Computed property for current stage display
    const currentStageDisplay = computed(() => {
      if (!leadInformation.value?.leadBoardStage) {
        return "Prospect";
      }
      return getStageDisplayName(leadInformation.value.leadBoardStage);
    });

    // Computed property for current stage color
    const currentStageColor = computed(() => {
      const stageColors = {
        prospect: "#9C27B0",
        initial_meeting: "#2196F3",
        technical_meeting: "#00BCD4",
        proposal: "#FF9800",
        in_negotiation: "#FFC107",
        won: "#4CAF50",
        loss: "#F44336",
      };
      return stageColors[leadInformation.value?.leadBoardStage] || "#9C27B0";
    });

    // Stage options for dropdown
    const stageOptions = [
      { key: "prospect", label: "Prospect", color: "#9C27B0" },
      { key: "initial_meeting", label: "Initial Meeting", color: "#2196F3" },
      {
        key: "technical_meeting",
        label: "Technical Meeting",
        color: "#00BCD4",
      },
      { key: "proposal", label: "Proposal", color: "#FF9800" },
      { key: "in_negotiation", label: "In Negotiation", color: "#FFC107" },
      { key: "won", label: "Won", color: "#4CAF50" },
      { key: "loss", label: "Lost", color: "#F44336" },
    ];

    // Proposal status options with colors
    const proposalStatusOptions = [
      { key: "PREPARING", label: "Preparing", color: "#00ACC1" },
      { key: "READY", label: "Ready", color: "#FB8C00" },
      { key: "SENT", label: "Sent", color: "#673AB7" },
      { key: "FOR_REVISION", label: "For Revision", color: "#F44336" },
      { key: "FINALIZED", label: "Finalized", color: "#2196F3" },
    ];

    // Show proposal badge only when lead is in proposal stage
    const showProposalBadge = computed(() => {
      return leadInformation.value?.leadBoardStage === 'proposal';
    });

    // Computed property for current proposal status display
    const currentProposalDisplay = computed(() => {
      if (!leadInformation.value?.proposalStatus) {
        return "Preparing"; // Default to Preparing if no status set
      }
      const status = proposalStatusOptions.find(
        (s) => s.key === leadInformation.value.proposalStatus
      );
      return status ? status.label : "Preparing";
    });

    // Computed property for current proposal status color
    const currentProposalColor = computed(() => {
      if (!leadInformation.value?.proposalStatus) {
        return "#00ACC1"; // Default to Preparing color
      }
      const status = proposalStatusOptions.find(
        (s) => s.key === leadInformation.value.proposalStatus
      );
      return status ? status.color : "#00ACC1";
    });

    // Computed property for close date - format as "Month YYYY"
    const closeDate = computed(() => {
      if (!leadInformation.value?.endDate?.raw) {
        return "N/A";
      }
      const date = new Date(leadInformation.value.endDate.raw);
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${month} ${year}`;
    });

    // Computed property for days in current stage (same as lead card time-stage)
    const daysInCurrentStage = computed(() => {
      if (!leadInformation.value?.updatedAt?.raw) {
        return "0 days";
      }
      const updatedAt = new Date(leadInformation.value.updatedAt.raw);
      const now = new Date();
      const diffMs = now.getTime() - updatedAt.getTime();
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
    });

    const openBillOfQuantityDialog = () => {
      isBillOfQuantityDialogOpen.value = true;
    };

    const fetchData = async () => {
      try {
        $q.loading.show();
        const id = props.leadViewId.toString();
        const response = await APIRequests.getLeadInformation($q, { id });
        leadInformation.value = response;
        // Also fetch attachments
        await fetchAttachments();
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
      emit("update:modelValue", false);
      emit("close");
    };

    const handleConvertToProject = async () => {
      // Check if lead is in "won" stage
      if (leadInformation.value?.leadBoardStage !== "won") {
        // Show warning dialog
        const currentStage = getStageDisplayName(
          leadInformation.value?.leadBoardStage || "prospect"
        );
        Dialog.create({
          title: "Cannot Convert Lead",
          message: `Lead must be in "Won" stage to convert to project. Current stage: ${currentStage}`,
          ok: true,
          persistent: true,
        });
        return;
      }

      // Show confirmation dialog
      Dialog.create({
        title: "Convert to Project",
        message: "Are you sure you want to convert this lead to a project?",
        cancel: {
          label: "Cancel",
          color: "grey",
        },
        persistent: true,
        ok: {
          label: "Convert",
          color: "primary",
        },
      }).onOk(async () => {
        try {
          $q.loading.show({
            message: "Converting lead to project...",
          });

          const projectData = await APIRequests.convertLeadToProject(
            $q,
            props.leadViewId.toString()
          );

          $q.loading.hide();

          // Show success notification
          $q.notify({
            color: "positive",
            message: "Lead successfully converted to project!",
            icon: "check",
            position: "top",
          });

          // Close the dialog
          onHide();

          // Navigate to the new project
          router
            .push({
              name: "member_project_page",
              params: { id: projectData.id.toString() },
            })
            .catch(() => {
              // If navigation fails, at least go to projects list
              router.push({ name: "member_project" });
            });
        } catch (error: any) {
          $q.loading.hide();

          // Check if the error is from backend validation
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            "Failed to convert lead to project";

          $q.notify({
            color: "negative",
            message: errorMessage,
            icon: "report_problem",
            position: "top",
          });
        }
      });
    };

    const getStageDisplayName = (stage: string): string => {
      const stageMap: Record<string, string> = {
        prospect: "Prospect",
        initial_meeting: "Initial Meeting",
        technical_meeting: "Technical Meeting",
        proposal: "Proposal",
        in_negotiation: "In Negotiation",
        won: "Won",
        loss: "Lost",
      };
      return stageMap[stage] || stage;
    };

    const openEditDialog = () => {
      isLeadEditDialogOpen.value = true;
    };

    const handleLeadEdited = async () => {
      await fetchData();
      isLeadEditDialogOpen.value = false;
    };

    const handleStageChange = async (newStage: string) => {
      // Don't allow changing if already in the same stage
      if (leadInformation.value.leadBoardStage === newStage) {
        return;
      }

      try {
        $q.loading.show({
          message: "Updating stage...",
        });

        // Call the API to move the lead
        await APIRequests.moveLead($q, props.leadViewId.toString(), newStage);

        // Update local state immediately for smooth UX
        leadInformation.value.leadBoardStage = newStage;

        // Emit event to parent components to refresh board/grid/list
        emit("stageChanged", {
          leadId: props.leadViewId,
          newStage: newStage,
        });

        $q.notify({
          color: "positive",
          message: `Stage updated to ${getStageDisplayName(newStage)}`,
          icon: "check",
          position: "top",
        });
      } catch (error: any) {
        console.error("Failed to update stage:", error);
        $q.notify({
          color: "negative",
          message: "Failed to update stage",
          icon: "report_problem",
          position: "top",
        });
      } finally {
        $q.loading.hide();
      }
    };

    const handleProposalStatusChange = async (newStatus: string) => {
      // Don't allow changing if already the same status
      if (leadInformation.value.proposalStatus === newStatus) {
        return;
      }

      try {
        $q.loading.show({
          message: "Updating proposal status...",
        });

        // Call the API to update proposal status
        await APIRequests.updateProposalStatus(
          $q,
          props.leadViewId.toString(),
          newStatus
        );

        // Update local state immediately for smooth UX
        leadInformation.value.proposalStatus = newStatus;

        // Emit event to parent components to refresh board/grid/list
        emit("proposalStatusChanged", {
          leadId: props.leadViewId,
          newProposalStatus: newStatus,
        });

        // Get the status label for notification
        const statusLabel = proposalStatusOptions.find((s) => s.key === newStatus)?.label || newStatus;

        $q.notify({
          color: "positive",
          message: `Proposal status updated to ${statusLabel}`,
          icon: "check",
          position: "top",
        });
      } catch (error: any) {
        console.error("Failed to update proposal status:", error);
        $q.notify({
          color: "negative",
          message: "Failed to update proposal status",
          icon: "report_problem",
          position: "top",
        });
      } finally {
        $q.loading.hide();
      }
    };

    // Attachment Methods
    const fetchAttachments = async () => {
      try {
        isLoadingAttachments.value = true;
        const response = await APIRequests.getLeadAttachments($q, props.leadViewId.toString());
        attachments.value = response;
      } catch (error) {
        console.error("Failed to fetch attachments:", error);
      } finally {
        isLoadingAttachments.value = false;
      }
    };

    const handleAttachmentClick = () => {
      isAttachmentUploadDialogOpen.value = true;
      // Use nextTick to ensure dialog is mounted before calling show()
      setTimeout(() => {
        attachmentUploadDialogRef.value?.show();
      }, 100);
    };

    const handleAttachmentsUploaded = async () => {
      // Refresh attachments list after successful upload
      await fetchAttachments();
    };

    const handleAttachmentDelete = (attachment: any) => {
      Dialog.create({
        title: "Delete Attachment",
        message: `Are you sure you want to delete "${attachment.fileName}"?`,
        cancel: {
          label: "Cancel",
          color: "grey",
        },
        ok: {
          label: "Delete",
          color: "negative",
        },
        persistent: true,
      }).onOk(async () => {
        try {
          await APIRequests.deleteLeadAttachment($q, attachment.id.toString());

          $q.notify({
            color: "positive",
            message: "Attachment deleted successfully",
            icon: "check",
            position: "top",
          });

          // Refresh attachments list
          await fetchAttachments();
        } catch (error) {
          console.error("Failed to delete attachment:", error);
          $q.notify({
            color: "negative",
            message: "Failed to delete attachment",
            icon: "report_problem",
            position: "top",
          });
        }
      });
    };

    const downloadAttachment = (attachment: any) => {
      window.open(attachment.fileUrl, "_blank");
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    const formatUploadDate = (uploadedAt: string): string => {
      return date.formatDate(new Date(uploadedAt), "MMM D, YYYY");
    };

    return {
      notesText,
      leadInformation,
      winProbabilityLabel,
      currentStageDisplay,
      currentStageColor,
      stageOptions,
      proposalStatusOptions,
      showProposalBadge,
      currentProposalDisplay,
      currentProposalColor,
      closeDate,
      daysInCurrentStage,
      isBillOfQuantityDialogOpen,
      isManageVersionDialogOpen,
      projectId,
      isAddNoteDialogOpen,
      editingNote,
      isLeadEditDialogOpen,
      isStageMenuOpen,
      isProposalMenuOpen,
      formatWord,
      truncateFormat,
      fetchData,
      openBillOfQuantityDialog,
      handleEmailSent,
      openAddNoteDialog,
      handleNoteSaved,
      onHide,
      handleConvertToProject,
      getStageDisplayName,
      openEditDialog,
      handleLeadEdited,
      handleStageChange,
      handleProposalStatusChange,
      // Attachment state and methods
      attachments,
      isLoadingAttachments,
      isAttachmentUploadDialogOpen,
      attachmentUploadDialogRef,
      fetchAttachments,
      handleAttachmentClick,
      handleAttachmentsUploaded,
      handleAttachmentDelete,
      downloadAttachment,
      formatFileSize,
      formatUploadDate,
    };
  },
};
</script>

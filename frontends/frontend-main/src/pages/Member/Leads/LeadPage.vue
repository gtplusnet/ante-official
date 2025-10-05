<template>
  <template v-if="!isLoading">
    <div class="page-head">
      <div class="title-section">
        <div class="title text-headline-small">{{ leadInformation.name }}</div>
        <q-badge :color="getStageColor(leadInformation.leadBoardStage || 'opportunity')" class="q-ml-md">
          {{ formatStageName(leadInformation.leadBoardStage || 'opportunity') }}
        </q-badge>
      </div>
      <div class="actions">
        <q-btn @click="editLead()" class="action text-label-large" outline color="primary" no-caps>
          <q-icon class="icon" name="edit"></q-icon>
          Edit Lead
        </q-btn>
        <q-btn @click="convertToProject" class="action text-label-large" unelevated color="primary" no-caps>
          <q-icon class="icon" name="upgrade"></q-icon>
          Convert to Project
        </q-btn>
      </div>
    </div>
    <div class="bread-crumbs text-body-medium">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
        <q-breadcrumbs-el label="Lead List" :to="{ name: 'member_leads' }" />
        <q-breadcrumbs-el :label="leadInformation.name" />
      </q-breadcrumbs>
    </div>

    <div class="page-content q-mt-lg">
      <!-- Key Metrics Row -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="metric-card">
            <q-card-section>
              <div class="metric-icon">
                <q-icon name="paid" size="24px" />
              </div>
              <div class="metric-value text-title-large-f-[20px]">{{ leadInformation.budget?.formatCurrency || '₱0.00' }}</div>
              <div class="metric-label text-label-large">Budget</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="metric-card">
            <q-card-section>
              <div class="metric-icon">
                <q-icon name="event" size="24px" />
              </div>
              <div class="metric-value text-title-large-f-[20px]">{{ getDaysRemaining() }}</div>
              <div class="metric-label text-label-large">Days Remaining</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="metric-card">
            <q-card-section>
              <div class="metric-icon">
                <q-icon name="person" size="24px" />
              </div>
              <div class="metric-value text-title-large-f-[20px]">{{ leadInformation.client?.name || 'No Client' }}</div>
              <div class="metric-label text-label-large">Client</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <q-card class="metric-card">
            <q-card-section>
              <div class="metric-icon">
                <q-icon name="location_on" size="24px" />
              </div>
              <div class="metric-value text-title-large-f-[20px]">{{ leadInformation.location?.name || 'No Location' }}</div>
              <div class="metric-label text-label-large">Location</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Main Content Row -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-8">
          <!-- Lead Details Card -->
          <q-card class="lead-details-card q-mb-md">
            <q-card-section>
              <div class="section-header">
                <q-icon name="info" size="20px" class="q-mr-sm" />
                <span class="text-title-large">Lead Details</span>
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <div class="detail-item">
                <div class="detail-label text-title-medium">
                  <q-icon name="description" size="18px" class="q-mr-sm" />
                  Description
                </div>
                <div class="detail-value text-body-medium">{{ leadInformation.description || 'No description provided' }}</div>
              </div>

              <div class="detail-item">
                <div class="detail-label text-title-medium">
                  <q-icon name="calendar_today" size="18px" class="q-mr-sm" />
                  Timeline
                </div>
                <div class="detail-value text-body-medium">
                  <div class="timeline-dates">
                    <span>{{ formatDate(leadInformation.startDate) }}</span>
                    <q-icon name="arrow_forward" class="q-mx-sm" />
                    <span>{{ formatDate(leadInformation.endDate) }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-item" v-if="leadInformation.downpaymentAmount">
                <div class="detail-label text-title-medium">
                  <q-icon name="savings" size="18px" class="q-mr-sm" />
                  Payment Terms
                </div>
                <div class="detail-value text-body-medium">Down Payment: {{ leadInformation.downpaymentAmount?.raw || 0 }}% • Retention: {{ leadInformation.retentionAmount?.raw || 0 }}%</div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Activity Timeline -->
          <q-card class="activity-card">
            <q-card-section>
              <div class="section-header">
                <q-icon name="timeline" size="20px" class="q-mr-sm" />
                <span class="text-title-large">Activity Timeline</span>
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <q-timeline color="primary">
                <q-timeline-entry title="Lead Created" :subtitle="formatDate(leadInformation.createdAt)" icon="add_circle" class="text-body-small"> Lead was created and added to the pipeline </q-timeline-entry>
                <q-timeline-entry title="Current Stage" subtitle="Now" icon="flag" color="accent" class="text-body-small"> Lead is in {{ formatStageName(leadInformation.leadBoardStage || 'opportunity') }} stage </q-timeline-entry>
              </q-timeline>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <!-- Quick Actions Card -->
          <q-card class="quick-actions-card">
            <q-card-section>
              <div class="section-header">
                <q-icon name="flash_on" size="20px" class="q-mr-sm" />
                <span class="text-title-large">Quick Actions</span>
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <q-btn outline color="primary" label="Send Email" icon="email" no-caps class="full-width q-mb-sm text-label-large" @click="openEmailCompose" />
              <q-btn outline color="primary" label="Schedule Meeting" icon="event" no-caps class="full-width q-mb-sm text-label-large" />
              <q-btn outline color="primary" label="Create Task" icon="task_alt" no-caps class="full-width q-mb-sm text-label-large" />
              <q-btn outline color="primary" label="Bill of Quantity" icon="receipt_long" no-caps class="full-width text-label-large" @click="openBillOfQuantity" />
            </q-card-section>
          </q-card>

          <!-- Lead Notes Card -->
          <q-card class="lead-notes-card q-mt-md">
            <q-card-section>
              <div class="section-header">
                <q-icon name="note" size="20px" class="q-mr-sm" />
                <span class="text-title-large">Notes</span>
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <q-input v-model="leadNotes" type="textarea" outlined placeholder="Add notes about this lead..." rows="8" class="q-mb-md text-body-medium" />
              <q-btn color="primary" label="Save Notes" no-caps unelevated class="full-width text-label-large" @click="saveNotes" />
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </template>

  <template v-else>
    <div class="flex flex-center" style="height: 400px">
      <q-spinner-dots color="primary" size="40px" />
    </div>
  </template>

  <!-- Lead Dialog for Edit -->
  <lead-create-dialog v-model="isLeadEditDialogOpen" :leadData="leadInformation" @close="handleLeadSaved" />

  <!-- Bill of Quantity Dialog -->
  <bill-of-quantity-dialog v-if="isBillOfQuantityDialogOpen" v-model="isBillOfQuantityDialogOpen" :projectId="leadInformation.id" />

  <!-- Email Compose Dialog -->
  <email-compose-dialog v-model="isEmailComposeDialogOpen" :defaultTo="leadInformation.client?.email || ''" :defaultSubject="`Regarding: ${leadInformation.name}`" @sent="handleEmailSent" />
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { APIRequests } from '../../../utility/api.handler';
import { LeadDataResponse, DateFormat } from '@shared/response';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const LeadCreateDialog = defineAsyncComponent(() =>
  import('../../../components/dialog/LeadDialog/LeadCreateDialog.vue')
);
const BillOfQuantityDialog = defineAsyncComponent(() =>
  import('../../../components/dialog/BillOfQuantity/BillOfQuantityDialog.vue')
);
const EmailComposeDialog = defineAsyncComponent(() =>
  import('../../../components/dialog/EmailComposeDialog.vue')
);

export default defineComponent({
  name: 'MemberLeadPage',
  components: {
    LeadCreateDialog,
    BillOfQuantityDialog,
    EmailComposeDialog,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const $q = useQuasar();

    const isLoading = ref(true);
    const leadInformation = ref({} as LeadDataResponse);
    const leadNotes = ref('');
    const isLeadEditDialogOpen = ref(false);
    const isBillOfQuantityDialogOpen = ref(false);
    const isEmailComposeDialogOpen = ref(false);

    const fetchData = async () => {
      try {
        isLoading.value = true;
        const id = route.params.id as string;
        const response = await APIRequests.getLeadInformation($q, { id });
        leadInformation.value = response;
      } catch (error) {
        console.error('Failed to fetch lead information:', error);
        $q.notify({
          color: 'negative',
          message: 'Failed to load lead information',
          icon: 'report_problem',
        });
      } finally {
        isLoading.value = false;
      }
    };

    const editLead = () => {
      isLeadEditDialogOpen.value = true;
    };

    const convertToProject = async () => {
      $q.dialog({
        title: 'Convert to Project',
        message: 'Are you sure you want to convert this lead to a project?',
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          const id = route.params.id as string;
          const response = await APIRequests.convertLeadToProject($q, id);

          $q.notify({
            color: 'positive',
            message: 'Lead successfully converted to project',
            icon: 'check',
          });

          // Navigate to the project page
          router.push({
            name: 'member_project_page',
            params: { id: response.id },
          });
        } catch (error) {
          console.error('Failed to convert lead:', error);
          $q.notify({
            color: 'negative',
            message: 'Failed to convert lead to project',
            icon: 'report_problem',
          });
        }
      });
    };

    const handleLeadSaved = () => {
      isLeadEditDialogOpen.value = false;
      // Refresh the lead data
      fetchData();
    };

    const getStageColor = (stage: string) => {
      const colors: Record<string, string> = {
        opportunity: 'blue',
        qualified: 'teal',
        proposal: 'orange',
        contacted: 'purple',
        'in-negotiation': 'deep-orange',
        'closed-won': 'green',
        'closed-lost': 'red',
      };
      return colors[stage] || 'grey';
    };

    const formatStageName = (stage: string) => {
      const names: Record<string, string> = {
        opportunity: 'Opportunity',
        qualified: 'Qualified',
        proposal: 'Proposal',
        contacted: 'Contacted',
        'in-negotiation': 'In Negotiation',
        'closed-won': 'Closed Won',
        'closed-lost': 'Closed Lost',
      };
      return names[stage] || stage;
    };

    const getDaysRemaining = () => {
      if (!leadInformation.value.endDate) return 'N/A';
      const endDate = leadInformation.value.endDate;
      const end = new Date(endDate.raw);
      const now = new Date();
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? `${diff} days` : 'Overdue';
    };

    const formatDate = (dateObj: DateFormat | undefined) => {
      if (!dateObj) return 'N/A';
      return dateObj.dateFull || dateObj.dateStandard || 'N/A';
    };

    const saveNotes = () => {
      $q.notify({
        color: 'positive',
        message: 'Notes saved successfully',
        icon: 'check',
      });
    };

    const openBillOfQuantity = () => {
      isBillOfQuantityDialogOpen.value = true;
    };

    const openEmailCompose = () => {
      isEmailComposeDialogOpen.value = true;
    };

    const handleEmailSent = () => {
      $q.notify({
        color: 'positive',
        message: 'Email sent successfully',
        icon: 'check',
      });
    };

    onMounted(() => {
      fetchData();
    });

    return {
      isLoading,
      leadInformation,
      leadNotes,
      isLeadEditDialogOpen,
      editLead,
      convertToProject,
      handleLeadSaved,
      getStageColor,
      formatStageName,
      getDaysRemaining,
      formatDate,
      saveNotes,
      isBillOfQuantityDialogOpen,
      openBillOfQuantity,
      isEmailComposeDialogOpen,
      openEmailCompose,
      handleEmailSent,
    };
  },
});
</script>

<style lang="scss" scoped>
.page-head {
  .title-section {
    display: flex;
    align-items: center;
  }
}

.metric-card {
  text-align: center;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  .metric-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background-color: #f0f7ff;
    color: #1976d2;
    margin-bottom: 12px;
  }

  .metric-value {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .metric-label {
    font-size: 14px;
    color: #666;
  }
}

.section-header {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: #333;
}

.lead-details-card {
  .detail-item {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .detail-label {
      display: flex;
      align-items: center;
      font-weight: 500;
      color: #666;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .detail-value {
      color: #333;
      font-size: 15px;
      line-height: 1.6;

      .timeline-dates {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        background-color: #f5f5f5;
        border-radius: 6px;
        width: fit-content;
      }
    }
  }
}

.activity-card {
  :deep(.q-timeline) {
    padding-left: 20px;
  }
}

.lead-notes-card {
  :deep(.q-field__control) {
    background-color: #f8f9fa;
  }
}

.quick-actions-card {
  .q-btn {
    justify-content: flex-start;
    text-align: left;
  }
}

.full-width {
  width: 100%;
}
</style>

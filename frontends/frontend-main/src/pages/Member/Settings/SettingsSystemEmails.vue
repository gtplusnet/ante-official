<template>
  <div>
    <div class="page-head q-pb-md">
      <div class="row items-center justify-between full-width">
        <div>
          <div class="title text-title-large">System Sent Emails</div>
          <div>
            <q-breadcrumbs class="text-body-small">
              <q-breadcrumbs-el label="Settings" :to="{ name: 'member_settings' }" />
              <q-breadcrumbs-el label="System" />
              <q-breadcrumbs-el label="Sent Emails" />
            </q-breadcrumbs>
          </div>
        </div>
        <div class="actions">
          <q-btn class="text-label-large" @click="refreshData()" color="primary" outline rounded>
            <q-icon size="14px" class="q-mr-xs" name="refresh"></q-icon>
            Refresh
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="row q-col-gutter-md q-mb-md" v-if="emailStats">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-body-small text-grey-6">Total Emails</div>
            <div class="text-h5 text-weight-bold">{{ emailStats.totalEmails }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-body-small text-grey-6">Successful</div>
            <div class="text-h5 text-weight-bold text-positive">{{ emailStats.successfulEmails }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-body-small text-grey-6">Failed</div>
            <div class="text-h5 text-weight-bold text-negative">{{ emailStats.failedEmails }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-body-small text-grey-6">Pending</div>
            <div class="text-h5 text-weight-bold text-warning">{{ emailStats.pendingEmails }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Filters -->
    <q-card flat bordered class="q-mb-md">
      <div class="row q-col-gutter-md items-end">
        <div class="col-12 col-md-3">
          <q-select
            v-model="filters.module"
            :options="moduleOptions"
            label="Module"
            outlined
            dense
            clearable
            emit-value
            map-options
            @update:model-value="fetchEmails"
          />
        </div>
        <div class="col-12 col-md-3">
          <q-select
            v-model="filters.status"
            :options="statusOptions"
            label="Status"
            outlined
            dense
            clearable
            emit-value
            map-options
            @update:model-value="fetchEmails"
          />
        </div>
        <div class="col-12 col-md-3">
          <q-input
            v-model="filters.search"
            label="Search (recipient/subject)"
            outlined
            dense
            clearable
            @keyup.enter="fetchEmails"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-md-3">
          <q-btn
            @click="fetchEmails"
            color="primary"
            label="Search"
            icon="search"
            outline
            rounded
            class="full-width"
          />
        </div>
      </div>
    </q-card>

    <!-- Email Table -->
    <q-card flat bordered>
      <q-table
        :rows="emails"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        @request="onRequest"
        binary-state-sort
        flat
      >
        <template v-slot:body-cell-sentAt="props">
          <q-td :props="props">
            {{ formatDateTime(props.row.sentAt) }}
          </q-td>
        </template>
        <template v-slot:body-cell-module="props">
          <q-td :props="props">
            <q-chip dense size="sm" color="primary" text-color="white">
              {{ getModuleLabel(props.row.module) }}
            </q-chip>
          </q-td>
        </template>
        <template v-slot:body-cell-to="props">
          <q-td :props="props">
            <div class="text-caption">
              {{ formatRecipients(props.row.to) }}
            </div>
          </q-td>
        </template>
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-chip
              dense
              size="sm"
              :color="getStatusColor(props.row.status)"
              text-color="white"
            >
              {{ props.row.status }}
            </q-chip>
          </q-td>
        </template>
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              dense
              flat
              icon="visibility"
              @click="viewEmail(props.row)"
              color="primary"
            >
              <q-tooltip>View Details</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Email Details Dialog -->
    <q-dialog v-model="showEmailDialog" maximized>
      <q-card class="full-width">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Email Details</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedEmail">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div class="q-mb-md">
                <div class="text-caption text-grey-6">Module</div>
                <div class="text-weight-medium">{{ getModuleLabel(selectedEmail.module) }}</div>
              </div>
              <div class="q-mb-md">
                <div class="text-caption text-grey-6">Status</div>
                <q-chip
                  dense
                  size="sm"
                  :color="getStatusColor(selectedEmail.status)"
                  text-color="white"
                >
                  {{ selectedEmail.status }}
                </q-chip>
              </div>
              <div class="q-mb-md">
                <div class="text-caption text-grey-6">Sent At</div>
                <div>{{ formatDateTime(selectedEmail.sentAt) }}</div>
              </div>
              <div class="q-mb-md" v-if="selectedEmail.sentByAccount">
                <div class="text-caption text-grey-6">Sent By</div>
                <div>
                  {{ selectedEmail.sentByAccount.firstName }} {{ selectedEmail.sentByAccount.lastName }}
                  ({{ selectedEmail.sentByAccount.email }})
                </div>
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="q-mb-md">
                <div class="text-caption text-grey-6">To</div>
                <div>{{ formatRecipients(selectedEmail.to) }}</div>
              </div>
              <div class="q-mb-md" v-if="selectedEmail.cc && selectedEmail.cc.length">
                <div class="text-caption text-grey-6">CC</div>
                <div>{{ formatRecipients(selectedEmail.cc) }}</div>
              </div>
              <div class="q-mb-md" v-if="selectedEmail.bcc && selectedEmail.bcc.length">
                <div class="text-caption text-grey-6">BCC</div>
                <div>{{ formatRecipients(selectedEmail.bcc) }}</div>
              </div>
              <div class="q-mb-md" v-if="selectedEmail.errorMessage">
                <div class="text-caption text-grey-6">Error</div>
                <div class="text-negative">{{ selectedEmail.errorMessage }}</div>
              </div>
            </div>
          </div>

          <q-separator class="q-my-md" />

          <div class="q-mb-md">
            <div class="text-caption text-grey-6 q-mb-sm">Subject</div>
            <div class="text-h6">{{ selectedEmail.subject }}</div>
          </div>

          <div class="q-mb-md" v-if="selectedEmail.metadata">
            <div class="text-caption text-grey-6 q-mb-sm">Metadata</div>
            <q-card flat bordered>
              <q-card-section>
                <pre class="text-body-small">{{ JSON.stringify(selectedEmail.metadata, null, 2) }}</pre>
              </q-card-section>
            </q-card>
          </div>

          <div>
            <div class="text-caption text-grey-6 q-mb-sm">Email Content</div>
            <q-card flat bordered>
              <q-card-section>
                <q-tabs v-model="contentTab" dense class="text-grey" active-color="primary">
                  <q-tab name="html" label="HTML" />
                  <q-tab name="text" label="Text" v-if="selectedEmail.textContent" />
                </q-tabs>
                <q-separator />
                <q-tab-panels v-model="contentTab" animated>
                  <q-tab-panel name="html">
                    <div v-html="selectedEmail.htmlContent" class="email-content"></div>
                  </q-tab-panel>
                  <q-tab-panel name="text" v-if="selectedEmail.textContent">
                    <pre class="text-body-small">{{ selectedEmail.textContent }}</pre>
                  </q-tab-panel>
                </q-tab-panels>
              </q-card-section>
            </q-card>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { date } from 'quasar';

const EMAIL_MODULES = {
  PAYROLL: 'Payroll',
  HR_FILING: 'HR Filing',
  PURCHASE_ORDER: 'Purchase Order',
  SYSTEM: 'System',
  USER_MANAGEMENT: 'User Management',
  NOTIFICATIONS: 'Notifications',
  APPROVAL: 'Approval',
};

export default {
  name: 'SettingsSystemEmails',
  data() {
    return {
      loading: false,
      emails: [],
      emailStats: null,
      filters: {
        module: null,
        status: null,
        search: '',
      },
      pagination: {
        page: 1,
        rowsPerPage: 20,
        rowsNumber: 0,
      },
      columns: [
        {
          name: 'sentAt',
          label: 'Sent At',
          field: 'sentAt',
          align: 'left',
          sortable: true,
        },
        {
          name: 'module',
          label: 'Module',
          field: 'module',
          align: 'left',
          sortable: true,
        },
        {
          name: 'to',
          label: 'To',
          field: 'to',
          align: 'left',
        },
        {
          name: 'subject',
          label: 'Subject',
          field: 'subject',
          align: 'left',
        },
        {
          name: 'status',
          label: 'Status',
          field: 'status',
          align: 'center',
          sortable: true,
        },
        {
          name: 'actions',
          label: 'Actions',
          align: 'center',
        },
      ],
      moduleOptions: Object.entries(EMAIL_MODULES).map(([value, label]) => ({
        value,
        label,
      })),
      statusOptions: [
        { value: 'SENT', label: 'Sent' },
        { value: 'FAILED', label: 'Failed' },
        { value: 'PENDING', label: 'Pending' },
      ],
      showEmailDialog: false,
      selectedEmail: null,
      contentTab: 'html',
    };
  },
  mounted() {
    this.fetchEmails();
    this.fetchStats();
  },
  methods: {
    async fetchEmails() {
      this.loading = true;
      try {
        const params = new URLSearchParams({
          page: this.pagination.page,
          limit: this.pagination.rowsPerPage,
          sortBy: this.pagination.sortBy || 'sentAt',
          sortOrder: this.pagination.descending ? 'desc' : 'asc',
        });

        if (this.filters.module) params.append('module', this.filters.module);
        if (this.filters.status) params.append('status', this.filters.status);
        if (this.filters.search) params.append('search', this.filters.search);

        const response = await this.$api.get(`/api/sent-emails?${params.toString()}`);
        this.emails = response.data.emails;
        this.pagination.rowsNumber = response.data.total;
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: 'Failed to fetch emails',
        });
      } finally {
        this.loading = false;
      }
    },
    async fetchStats() {
      try {
        const response = await this.$api.get('/api/sent-emails/stats');
        this.emailStats = response.data;
      } catch (error) {
        console.error('Failed to fetch email stats:', error);
      }
    },
    onRequest(props) {
      const { page, rowsPerPage, sortBy, descending } = props.pagination;
      this.pagination.page = page;
      this.pagination.rowsPerPage = rowsPerPage;
      this.pagination.sortBy = sortBy;
      this.pagination.descending = descending;
      this.fetchEmails();
    },
    viewEmail(email) {
      this.selectedEmail = email;
      this.contentTab = 'html';
      this.showEmailDialog = true;
    },
    refreshData() {
      this.fetchEmails();
      this.fetchStats();
    },
    formatDateTime(dateTime) {
      return date.formatDate(dateTime, 'MMM DD, YYYY HH:mm:ss');
    },
    formatRecipients(recipients) {
      if (!recipients || !recipients.length) return '';
      return recipients.join(', ');
    },
    getModuleLabel(module) {
      return EMAIL_MODULES[module] || module;
    },
    getStatusColor(status) {
      switch (status) {
        case 'SENT':
          return 'positive';
        case 'FAILED':
          return 'negative';
        case 'PENDING':
          return 'warning';
        default:
          return 'grey';
      }
    },
  },
};
</script>

<style scoped>
.email-content {
  max-height: 600px;
  overflow-y: auto;
}
</style>
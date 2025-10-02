<template>
  <expanded-nav-page-container>
    <div class="page-head">
      <div class="text-title-large">Client Management</div>
      <div class="q-gutter-sm">
        <q-btn
          outline
          color="primary"
          no-caps
          icon="add"
          label="Add Client"
          @click="openAddClientDialog"
        />
      </div>
    </div>

    <div class="bread-crumbs text-body-small">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Dashboard" :to="{ name: 'member_dashboard' }" />
        <q-breadcrumbs-el label="Projects" :to="{ name: 'member_project_dashboard' }" />
        <q-breadcrumbs-el label="Client Management" />
      </q-breadcrumbs>
    </div>

    <div class="page-content q-mt-lg">
      <!-- Search and Filter Bar -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="searchQuery"
                outlined
                placeholder="Search clients..."
                dense
                clearable
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-3">
              <q-select
                v-model="filterStatus"
                outlined
                dense
                options-dense
                emit-value
                map-options
                :options="statusOptions"
                label="Status"
                clearable
              />
            </div>
            <div class="col-12 col-md-3">
              <q-btn
                outline
                color="primary"
                icon="filter_list"
                label="More Filters"
                no-caps
                class="full-width"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Clients Table -->
      <q-card>
        <q-card-section>
          <q-table
            :rows="filteredClients"
            :columns="columns"
            row-key="id"
            flat
            :pagination="pagination"
            :loading="isLoading"
          >
            <template v-slot:body-cell-name="props">
              <q-td :props="props">
                <div class="client-name">
                  <q-avatar size="32px" class="q-mr-sm">
                    <img :src="props.row.avatar || 'https://cdn.quasar.dev/img/avatar.png'" />
                  </q-avatar>
                  <div>
                    <div class="text-weight-medium">{{ props.value }}</div>
                    <div class="text-caption text-grey">{{ props.row.email }}</div>
                  </div>
                </div>
              </q-td>
            </template>
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-badge :color="props.value === 'Active' ? 'green' : 'grey'">
                  {{ props.value }}
                </q-badge>
              </q-td>
            </template>
            <template v-slot:body-cell-projects="props">
              <q-td :props="props">
                <q-chip dense color="primary" text-color="white">
                  {{ props.value }} projects
                </q-chip>
              </q-td>
            </template>
            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  flat
                  round
                  dense
                  icon="edit"
                  @click="editClient(props.row)"
                >
                  <q-tooltip>Edit Client</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  icon="visibility"
                  @click="viewClient(props.row)"
                >
                  <q-tooltip>View Details</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  @click="deleteClient(props.row)"
                >
                  <q-tooltip>Delete Client</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>
  </expanded-nav-page-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import ExpandedNavPageContainer from '../../../components/shared/ExpandedNavPageContainer.vue';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  projects: number;
  avatar?: string;
  createdAt: string;
}

export default defineComponent({
  name: 'ClientManagement',
  components: {
    ExpandedNavPageContainer,
  },
  setup() {
    const $q = useQuasar();

    const searchQuery = ref('');
    const filterStatus = ref('');
    const isLoading = ref(false);

    // Dummy data for demonstration
    const clients = ref<Client[]>([
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 234 567 890',
        company: 'Acme Corp',
        status: 'Active',
        projects: 3,
        createdAt: '2024-01-15',
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1 234 567 891',
        company: 'Tech Solutions',
        status: 'Active',
        projects: 5,
        createdAt: '2024-02-20',
      },
      {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        phone: '+1 234 567 892',
        company: 'Global Industries',
        status: 'Inactive',
        projects: 1,
        createdAt: '2024-03-10',
      },
      {
        id: 4,
        name: 'Alice Brown',
        email: 'alice.brown@example.com',
        phone: '+1 234 567 893',
        company: 'Creative Agency',
        status: 'Active',
        projects: 7,
        createdAt: '2024-01-25',
      },
      {
        id: 5,
        name: 'Charlie Wilson',
        email: 'charlie.wilson@example.com',
        phone: '+1 234 567 894',
        company: 'Startup Inc',
        status: 'Active',
        projects: 2,
        createdAt: '2024-04-05',
      },
    ]);

    const columns = [
      {
        name: 'name',
        required: true,
        label: 'Client',
        align: 'left',
        field: 'name',
        sortable: true,
      },
      {
        name: 'company',
        label: 'Company',
        align: 'left',
        field: 'company',
        sortable: true,
      },
      {
        name: 'phone',
        label: 'Phone',
        align: 'left',
        field: 'phone',
      },
      {
        name: 'status',
        label: 'Status',
        align: 'center',
        field: 'status',
        sortable: true,
      },
      {
        name: 'projects',
        label: 'Projects',
        align: 'center',
        field: 'projects',
        sortable: true,
      },
      {
        name: 'createdAt',
        label: 'Created',
        align: 'center',
        field: 'createdAt',
        sortable: true,
      },
      {
        name: 'actions',
        label: 'Actions',
        align: 'center',
        field: 'actions',
      },
    ];

    const statusOptions = [
      { label: 'All', value: '' },
      { label: 'Active', value: 'Active' },
      { label: 'Inactive', value: 'Inactive' },
    ];

    const pagination = ref({
      sortBy: 'name',
      descending: false,
      page: 1,
      rowsPerPage: 10,
    });

    const filteredClients = computed(() => {
      let result = clients.value;

      // Apply search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(client =>
          client.name.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query) ||
          client.company.toLowerCase().includes(query)
        );
      }

      // Apply status filter
      if (filterStatus.value) {
        result = result.filter(client => client.status === filterStatus.value);
      }

      return result;
    });

    const openAddClientDialog = () => {
      $q.notify({
        message: 'Add Client dialog would open',
        color: 'info',
      });
    };

    const editClient = (client: Client) => {
      $q.notify({
        message: `Edit client: ${client.name}`,
        color: 'info',
      });
    };

    const viewClient = (client: Client) => {
      $q.notify({
        message: `View client details: ${client.name}`,
        color: 'info',
      });
    };

    const deleteClient = (client: Client) => {
      $q.dialog({
        title: 'Confirm',
        message: `Are you sure you want to delete client "${client.name}"?`,
        cancel: true,
        persistent: true,
      }).onOk(() => {
        $q.notify({
          message: `Client "${client.name}" deleted`,
          color: 'negative',
        });
      });
    };

    onMounted(() => {
      // In a real app, fetch clients from API here
    });

    return {
      searchQuery,
      filterStatus,
      isLoading,
      clients,
      filteredClients,
      columns,
      statusOptions,
      pagination,
      openAddClientDialog,
      editClient,
      viewClient,
      deleteClient,
    };
  },
});
</script>

<style lang="scss" scoped>
.client-name {
  display: flex;
  align-items: center;
}

.full-width {
  width: 100%;
}

.page-content {
  :deep(.q-table__top) {
    padding: 16px 0;
  }
}
</style>
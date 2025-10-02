<template>
  <div>
    <div class="page-head">
      <div class="title text-title-large">Company Seed Tracking</div>
    </div>
    <div class="q-pa-md">
      <!-- Company Table -->
      <q-card>
        <q-card-section>
          <div class="row items-center q-mb-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="searchFilter"
                label="Search companies"
                outlined
                dense
                clearable
                debounce="300"
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>
            <q-space />
            <q-btn
              color="secondary"
              label="Refresh All"
              @click="loadAllCompaniesStatus"
              :loading="loadingCompanies"
              icon="refresh"
              flat
            />
          </div>

          <!-- Companies Table -->
          <q-table
            :rows="filteredCompanies"
            :columns="companyColumns"
            row-key="id"
            :pagination="pagination"
            :loading="loadingCompanies"
            flat
            bordered
            @row-click="(evt, row) => openSeedDialog(row)"
            class="cursor-pointer"
          >
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-chip
                  :color="props.row.completedCount === props.row.totalCount ? 'positive' : 'warning'"
                  text-color="white"
                  size="sm"
                  dense
                >
                  {{ props.row.completedCount }} of {{ props.row.totalCount }} seeded
                </q-chip>
              </q-td>
            </template>

            <template v-slot:body-cell-pendingCount="props">
              <q-td :props="props">
                <span v-if="props.row.completedCount === props.row.totalCount" class="text-positive">
                  All complete
                </span>
                <span v-else-if="props.row.pendingCount && props.row.pendingCount > 0" class="text-orange">
                  {{ props.row.pendingCount }} pending
                </span>
                <span v-else class="text-grey">
                  Not seedable
                </span>
              </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
              <q-td :props="props" @click.stop>
                <q-btn
                  flat
                  round
                  dense
                  color="primary"
                  icon="visibility"
                  @click="openSeedDialog(props.row)"
                >
                  <q-tooltip>View Details</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>

    <!-- Seed Details Dialog -->
    <q-dialog v-model="showSeedDialog" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedCompany?.companyName }} - Seed Status</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="row items-center q-mb-md">
            <q-space />
            <q-btn
              color="primary"
              label="Run All Pending"
              @click="runAllPendingSeeders"
              :loading="runningAll"
              :disable="!hasPendingSeeders"
              icon="play_arrow"
              class="q-mr-sm"
            />
            <q-btn
              color="secondary"
              label="Refresh"
              @click="loadSeederStatus"
              :loading="loadingStatus"
              icon="refresh"
              flat
            />
          </div>

          <!-- Status Table -->
          <q-table
            :rows="seederStatuses"
            :columns="columns"
            row-key="type"
            flat
            bordered
            :loading="loadingStatus"
          >
            <template v-slot:body-cell-status="props">
              <q-td :props="props">
                <q-chip
                  :color="getStatusColor(props.row.status)"
                  text-color="white"
                  size="sm"
                >
                  <q-icon
                    :name="getStatusIcon(props.row.status)"
                    size="16px"
                    class="q-mr-xs"
                  />
                  {{ props.row.status === 'manual' ? 'Manually Seeded' : props.row.status }}
                </q-chip>
              </q-td>
            </template>

            <template v-slot:body-cell-seedDate="props">
              <q-td :props="props">
                {{ formatDate(props.row.seedDate) }}
              </q-td>
            </template>

            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  flat
                  round
                  dense
                  color="primary"
                  icon="play_arrow"
                  @click="runSingleSeeder(props.row)"
                  :loading="props.row._loading"
                  :disable="!props.row.canSeed"
                >
                  <q-tooltip v-if="props.row.canSeed">Run Seeder</q-tooltip>
                  <q-tooltip v-else-if="props.row.status === 'manual'">Data was created manually</q-tooltip>
                  <q-tooltip v-else-if="props.row.status === 'completed'">Already seeded</q-tooltip>
                  <q-tooltip v-else>Cannot seed - data already exists</q-tooltip>
                </q-btn>
              </q-td>
            </template>

            <template v-slot:body-cell-errorMessage="props">
              <q-td :props="props">
                <div v-if="props.row.errorMessage" class="text-negative">
                  {{ props.row.errorMessage }}
                </div>
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, getCurrentInstance, computed } from 'vue';
import { useQuasar } from 'quasar';

interface SeederStatus {
  type: string;
  name: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'manual';
  canSeed: boolean;
  seedDate?: string;
  errorMessage?: string;
  metadata?: any;
  _loading?: boolean;
}

interface Company {
  id: number;
  companyName: string;
  isActive?: boolean;
  completedCount?: number;
  pendingCount?: number;
  totalCount?: number;
}

export default defineComponent({
  name: 'SeedTracking',
  setup() {
    const $q = useQuasar();
    const instance = getCurrentInstance();
    const $api = instance?.proxy?.$api;

    const selectedCompany = ref<Company | null>(null);
    const companies = ref<Company[]>([]);
    const companiesWithStatus = ref<Company[]>([]);
    const seederStatuses = ref<SeederStatus[]>([]);
    const loadingCompanies = ref(false);
    const loadingStatus = ref(false);
    const runningAll = ref(false);
    const showSeedDialog = ref(false);
    const searchFilter = ref('');
    
    const pagination = ref({
      sortBy: 'companyName',
      descending: false,
      page: 1,
      rowsPerPage: 10,
    });

    const companyColumns = [
      {
        name: 'companyName',
        label: 'Company Name',
        field: 'companyName',
        align: 'left' as const,
        sortable: true,
      },
      {
        name: 'status',
        label: 'Seed Status',
        field: 'status',
        align: 'center' as const,
      },
      {
        name: 'pendingCount',
        label: 'Pending',
        field: 'pendingCount',
        align: 'center' as const,
        sortable: true,
      },
      {
        name: 'actions',
        label: 'Actions',
        field: 'actions',
        align: 'center' as const,
      },
    ];

    const columns = [
      {
        name: 'name',
        label: 'Seeder Name',
        field: 'name',
        align: 'left' as const,
        sortable: true,
      },
      {
        name: 'description',
        label: 'Description',
        field: 'description',
        align: 'left' as const,
      },
      {
        name: 'status',
        label: 'Status',
        field: 'status',
        align: 'center' as const,
        sortable: true,
      },
      {
        name: 'seedDate',
        label: 'Last Run',
        field: 'seedDate',
        align: 'center' as const,
        sortable: true,
      },
      {
        name: 'errorMessage',
        label: 'Error',
        field: 'errorMessage',
        align: 'left' as const,
      },
      {
        name: 'actions',
        label: 'Actions',
        field: 'actions',
        align: 'center' as const,
      },
    ];

    const hasPendingSeeders = computed(() => {
      return seederStatuses.value.some(s => s.canSeed);
    });

    const filteredCompanies = computed(() => {
      let filtered = companiesWithStatus.value.filter(company => company.isActive !== false);
      
      if (searchFilter.value) {
        const search = searchFilter.value.toLowerCase();
        filtered = filtered.filter(company => 
          company.companyName.toLowerCase().includes(search)
        );
      }
      
      return filtered;
    });

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed':
          return 'positive';
        case 'manual':
          return 'info';
        case 'failed':
          return 'negative';
        case 'pending':
          return 'grey';
        default:
          return 'grey';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'completed':
          return 'check_circle';
        case 'manual':
          return 'handyman';
        case 'failed':
          return 'error';
        case 'pending':
          return 'pending';
        default:
          return 'help';
      }
    };

    const formatDate = (date?: string) => {
      if (!date) return '-';
      const d = new Date(date);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const day = d.getDate().toString().padStart(2, '0');
      const year = d.getFullYear();
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${month} ${day}, ${year} ${hours}:${minutes}`;
    };

    const loadCompanies = async () => {
      if (!$api) return;
      try {
        const response = await $api.get('/company/companies');
        companies.value = response.data;
        await loadAllCompaniesStatus();
      } catch (error) {
        console.error('Failed to load companies:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load companies',
        });
      }
    };

    const loadAllCompaniesStatus = async () => {
      if (!$api) return;
      loadingCompanies.value = true;
      
      try {
        const companiesWithCounts = await Promise.all(
          companies.value.map(async (company) => {
            try {
              const response = await $api.get(`/seeder/status/${company.id}`);
              const statuses = response.data as SeederStatus[];
              
              const completedCount = statuses.filter(s => s.status === 'completed' || s.status === 'manual').length;
              const pendingCount = statuses.filter(s => s.status === 'pending').length;
              const totalCount = statuses.length;
              
              return {
                ...company,
                completedCount,
                pendingCount,
                totalCount,
              };
            } catch (error) {
              console.error(`Failed to load status for company ${company.id}:`, error);
              return {
                ...company,
                completedCount: 0,
                pendingCount: 0,
                totalCount: 0,
              };
            }
          })
        );
        
        companiesWithStatus.value = companiesWithCounts;
      } finally {
        loadingCompanies.value = false;
      }
    };

    const loadSeederStatus = async () => {
      if (!selectedCompany.value || !$api) return;
      
      loadingStatus.value = true;
      try {
        const response = await $api.get(`/seeder/status/${selectedCompany.value.id}`);
        seederStatuses.value = response.data.map((status: SeederStatus) => ({
          ...status,
          _loading: false,
        }));
      } catch (error) {
        console.error('Failed to load seeder status:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load seeder status',
        });
      } finally {
        loadingStatus.value = false;
      }
    };

    const runSingleSeeder = async (seeder: SeederStatus) => {
      if (!$api || !selectedCompany.value) return;
      seeder._loading = true;
      try {
        await $api.post(`/seeder/execute/${selectedCompany.value.id}/${seeder.type}`);
        $q.notify({
          type: 'positive',
          message: `Successfully ran ${seeder.name}`,
        });
        await loadSeederStatus();
        await loadAllCompaniesStatus();
      } catch (error: any) {
        console.error('Failed to run seeder:', error);
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to run seeder',
        });
      } finally {
        seeder._loading = false;
      }
    };

    const runAllPendingSeeders = async () => {
      if (!$api || !selectedCompany.value) return;
      runningAll.value = true;
      try {
        const response = await $api.post(`/seeder/execute-all/${selectedCompany.value.id}`);
        const results = response.data;
        const successCount = results.filter((r: any) => r.status === 'completed').length;
        const failureCount = results.filter((r: any) => r.status === 'failed').length;
        
        $q.notify({
          type: successCount > 0 && failureCount === 0 ? 'positive' : 'warning',
          message: `Seeding completed: ${successCount} successful, ${failureCount} failed`,
        });
        
        await loadSeederStatus();
        await loadAllCompaniesStatus();
      } catch (error) {
        console.error('Failed to run all seeders:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to run seeders',
        });
      } finally {
        runningAll.value = false;
      }
    };

    const openSeedDialog = (company: Company) => {
      selectedCompany.value = company;
      showSeedDialog.value = true;
      loadSeederStatus();
    };

    onMounted(() => {
      loadCompanies();
    });

    return {
      selectedCompany,
      companiesWithStatus,
      filteredCompanies,
      seederStatuses,
      loadingCompanies,
      loadingStatus,
      runningAll,
      showSeedDialog,
      searchFilter,
      pagination,
      companyColumns,
      columns,
      hasPendingSeeders,
      getStatusColor,
      getStatusIcon,
      formatDate,
      loadSeederStatus,
      loadAllCompaniesStatus,
      runSingleSeeder,
      runAllPendingSeeders,
      openSeedDialog,
    };
  },
});
</script>

<style scoped>
.q-chip {
  font-size: 12px;
}
</style>
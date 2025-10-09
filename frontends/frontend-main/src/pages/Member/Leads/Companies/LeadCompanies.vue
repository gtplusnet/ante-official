<template>
  <div class="companies-page">
    <!-- Header Section -->
    <div class="row justify-between items-center">
      <div class="text-dark text-title-medium-f-[18px] col-2">
        All Companies
      </div>
      <!-- Filter Section -->
      <div class="row items-center justify-end q-gutter-x-md col-10">
        <div class="col-4">
          <q-input v-model="searchQuery" outlined dense placeholder="Search">
            <template v-slot:prepend>
              <q-icon name="search" color="grey-6" />
            </template>
          </q-input>
        </div>
        <div class="col-4">
          <q-select
            v-model="sortBy"
            :options="sortOptions"
            label="Sort By"
            outlined
            dense
          />
        </div>
        <GButton
          unelevated
          no-caps
          icon="add"
          icon-size="md"
          label="New Company"
          @click="addNewCompany"
        />
      </div>
    </div>

    <!-- Data Table -->
    <div class="table-container q-mt-lg">
      <table class="company-table">
        <thead>
          <tr class="table-header">
            <th class="text-left">Company Name</th>
            <th class="text-left">Employees</th>
            <th class="text-left">Deals</th>
            <th class="text-left">Date Created</th>
            <th class="text-left">Created By</th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="company in filteredCompanies"
            :key="company.id"
            class="table-row"
          >
            <td>{{ company.name }}</td>
            <td>{{ company.employees }}</td>
            <td>{{ company.deals }}</td>
            <td>{{ company.dateCreated }}</td>
            <td>{{ company.createdBy }}</td>
            <td>
              <div class="actions-container">
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="o_edit"
                  color="grey-6"
                  @click="editCompany(company)"
                  class="action-btn"
                />
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="o_delete"
                  color="grey-6"
                  @click="archiveCompany(company)"
                  class="action-btn"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Company Dialog -->
    <LeadCompanyDialog
      v-model="isDialogOpen"
      :company="editingCompany"
      :loading="loading"
      @submit="handleCompanySubmit"
    />
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  computed,
  onMounted,
  getCurrentInstance,
  watch,
  defineAsyncComponent,
} from "vue";
import { useQuasar } from "quasar";
import GButton from "src/components/shared/buttons/GButton.vue";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const LeadCompanyDialog = defineAsyncComponent(
  () => import("./LeadCompanyDialog.vue")
);

defineOptions({
  name: "LeadCompanies",
});

const $q = useQuasar();
const instance = getCurrentInstance();
const $api = instance?.appContext.config.globalProperties.$api;

// Reactive data
const searchQuery = ref("");
const sortBy = ref("");
const loading = ref(false);
const isDialogOpen = ref(false);
const editingCompany = ref<Company | null>(null);

// Sort options
const sortOptions = ["Date Created", "Company Name", "Employees", "Deals"];

// Company interface
interface Company {
  id: number;
  name: string;
  employees: number;
  deals: number;
  dateCreated: string;
  createdBy: string;
}

const companies = ref<Company[]>([]);

// Fetch companies from API
const fetchCompanies = async () => {
  if (!$api) return;

  loading.value = true;
  try {
    const params: any = {};

    if (searchQuery.value) {
      params.search = searchQuery.value;
    }

    // Map sort options to backend format
    if (sortBy.value === "Company Name") {
      params.sortBy = "name";
    } else if (sortBy.value === "Employees") {
      params.sortBy = "employees";
    } else if (sortBy.value === "Deals") {
      params.sortBy = "deals";
    } else {
      params.sortBy = "dateCreated";
    }

    const response = await $api.get("/lead-company/list", { params });
    companies.value = response.data || [];
  } catch (error) {
    console.error("Error fetching companies:", error);
    $q.notify({
      color: "negative",
      message: "Failed to load companies",
      icon: "error",
    });
  } finally {
    loading.value = false;
  }
};

// No need for computed filteredCompanies since backend handles filtering
const filteredCompanies = computed(() => companies.value);

// Methods
const addNewCompany = () => {
  editingCompany.value = null;
  isDialogOpen.value = true;
};

const editCompany = (company: Company) => {
  editingCompany.value = company;
  isDialogOpen.value = true;
};

const archiveCompany = async (company: Company) => {
  if (!$api) return;

  $q.dialog({
    title: "Archive Company",
    message: `Are you sure you want to archive "${company.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      loading.value = true;

      await $api.delete(`/lead-company/${company.id}`);

      $q.notify({
        color: "positive",
        message: "Company archived successfully",
        icon: "check_circle",
      });

      // Refresh the list
      await fetchCompanies();
    } catch (error) {
      console.error("Error archiving company:", error);
      $q.notify({
        color: "negative",
        message: "Failed to archive company",
        icon: "error",
      });
    } finally {
      loading.value = false;
    }
  });
};

const handleCompanySubmit = async (companyData: {
  name: string;
  employees: number;
  deals: number;
}) => {
  if (!$api) return;

  try {
    loading.value = true;

    if (editingCompany.value) {
      // Update existing company
      await $api.put(`/lead-company/${editingCompany.value.id}`, companyData);
      $q.notify({
        color: "positive",
        message: "Company updated successfully",
        icon: "check_circle",
      });
    } else {
      // Create new company
      await $api.post("/lead-company", companyData);
      $q.notify({
        color: "positive",
        message: "Company created successfully",
        icon: "check_circle",
      });
    }

    // Refresh the list and close dialog
    await fetchCompanies();
    isDialogOpen.value = false;
    editingCompany.value = null;
  } catch (error: any) {
    console.error("Error saving company:", error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to save company";
    $q.notify({
      color: "negative",
      message: errorMessage,
      icon: "error",
    });
  } finally {
    loading.value = false;
  }
};

// Debounce timer for search
let debounceTimer: NodeJS.Timeout | null = null;

// Watch for search and sort changes
watch([searchQuery, sortBy], () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    fetchCompanies();
  }, 300);
});

// Load data when component mounts
onMounted(() => {
  fetchCompanies();
});
</script>

<style scoped lang="scss">
.companies-page {
  background-color: #fff;
  border-radius: 24px;
  min-height: calc(100vh - 95px);
  padding: 24px;
  position: relative;
}

.table-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.company-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  border: 1px solid #ddd;
  overflow: hidden;
  border-radius: 8px;

  thead {
    tr {
      th {
        padding: 10px;
        border-bottom: 1px solid #ddd;
        font-weight: bold;
        color: #333 !important;
      }
    }
  }
  tbody {
    &.loading {
      opacity: 0.5;
    }
    tr {
      td {
        padding: 10px;
        border-bottom: 1px solid #ddd;
        text-align: left;
      }
    }
  }
}

.actions-container {
  display: flex;
  gap: 4px;
  justify-content: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .filters-container {
    flex-direction: column;
    gap: 12px;
  }

  .search-container {
    min-width: auto;
  }

  .companies-table {
    font-size: 12px;
  }

  .table-header th,
  .table-row td {
    padding: 12px 8px;
  }
}
</style>

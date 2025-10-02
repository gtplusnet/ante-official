<template>
  <div class="companies-page">
    <!-- Header Section -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title text-h5 text-dark q-mt-sm">All Companies</div>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="filter-section q-mt-lg">
      <div class="filter-row">
        <div class="filters-container">
          <div class="search-container">
            <q-input
              v-model="searchQuery"
              outlined
              dense
              placeholder="Search"
              class="search-input"
            >
              <template v-slot:prepend>
                <q-icon name="search" color="grey-6" />
              </template>
            </q-input>
          </div>
          <div class="sort-container">
            <label class="sort-label">Sort By</label>
            <q-select
              v-model="sortBy"
              :options="sortOptions"
              outlined
              dense
              class="sort-select"
            />
          </div>
        </div>
        <div class="action-button-container">
          <q-btn
            color="primary"
            unelevated
            no-caps
            icon="add"
            label="New Company"
            class="new-company-btn"
            @click="addNewCompany"
          />
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="table-container q-mt-lg">
      <div class="table-wrapper">
        <table class="companies-table">
          <thead>
            <tr class="table-header">
              <th class="company-name-header">Company Name</th>
              <th class="employees-header">Employees</th>
              <th class="deals-header">Deals</th>
              <th class="date-header">Date Created</th>
              <th class="created-by-header">Created By</th>
              <th class="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="company in filteredCompanies"
              :key="company.id"
              class="table-row"
            >
              <td class="company-name-cell">{{ company.name }}</td>
              <td class="employees-cell">{{ company.employees }}</td>
              <td class="deals-cell">{{ company.deals }}</td>
              <td class="date-cell">{{ company.dateCreated }}</td>
              <td class="created-by-cell">{{ company.createdBy }}</td>
              <td class="actions-cell">
                <div class="actions-container">
                  <q-btn 
                    flat 
                    round 
                    dense 
                    size="sm" 
                    icon="edit" 
                    color="grey-6"
                    @click="editCompany(company)"
                    class="action-btn"
                  />
                  <q-btn 
                    flat 
                    round 
                    dense 
                    size="sm" 
                    icon="archive" 
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
    </div>

    <!-- Company Dialog -->
    <LeadCompanyDialog
      v-model="isDialogOpen"
      :company="editingCompany"
      :loading="loading"
      @submit="handleCompanySubmit"
    />

    <!-- Footer -->
    <div class="footer">
      <div class="footer-content">
        <q-icon name="code" size="16px" color="grey-6" />
        <span class="footer-text">Devs</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, getCurrentInstance, watch } from 'vue';
import { useQuasar } from 'quasar';
import LeadCompanyDialog from './LeadCompanyDialog.vue';

defineOptions({
  name: 'LeadCompanies',
});

const $q = useQuasar();
const instance = getCurrentInstance();
const $api = instance?.appContext.config.globalProperties.$api;

// Reactive data
const searchQuery = ref('');
const sortBy = ref('Date Created');
const loading = ref(false);
const isDialogOpen = ref(false);
const editingCompany = ref<Company | null>(null);

// Sort options
const sortOptions = [
  'Date Created',
  'Company Name',
  'Employees',
  'Deals'
];

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
    if (sortBy.value === 'Company Name') {
      params.sortBy = 'name';
    } else if (sortBy.value === 'Employees') {
      params.sortBy = 'employees';
    } else if (sortBy.value === 'Deals') {
      params.sortBy = 'deals';
    } else {
      params.sortBy = 'dateCreated';
    }
    
    const response = await $api.get('/lead-company/list', { params });
    companies.value = response.data || [];
  } catch (error) {
    console.error('Error fetching companies:', error);
    $q.notify({
      color: 'negative',
      message: 'Failed to load companies',
      icon: 'error'
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
    title: 'Archive Company',
    message: `Are you sure you want to archive "${company.name}"?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      loading.value = true;
      
      await $api.delete(`/lead-company/${company.id}`);
      
      $q.notify({
        color: 'positive',
        message: 'Company archived successfully',
        icon: 'check_circle'
      });
      
      // Refresh the list
      await fetchCompanies();
    } catch (error) {
      console.error('Error archiving company:', error);
      $q.notify({
        color: 'negative',
        message: 'Failed to archive company',
        icon: 'error'
      });
    } finally {
      loading.value = false;
    }
  });
};

const handleCompanySubmit = async (companyData: { name: string; employees: number; deals: number }) => {
  if (!$api) return;
  
  try {
    loading.value = true;
    
    if (editingCompany.value) {
      // Update existing company
      await $api.put(`/lead-company/${editingCompany.value.id}`, companyData);
      $q.notify({
        color: 'positive',
        message: 'Company updated successfully',
        icon: 'check_circle'
      });
    } else {
      // Create new company
      await $api.post('/lead-company', companyData);
      $q.notify({
        color: 'positive',
        message: 'Company created successfully',
        icon: 'check_circle'
      });
    }
    
    // Refresh the list and close dialog
    await fetchCompanies();
    isDialogOpen.value = false;
    editingCompany.value = null;
  } catch (error: any) {
    console.error('Error saving company:', error);
    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save company';
    $q.notify({
      color: 'negative',
      message: errorMessage,
      icon: 'error'
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

<style scoped>
.companies-page {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 24px;
  position: relative;
}

.page-header {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  background-color: transparent;
}

.page-title {
  font-weight: 600;
  color: #1a1a1a;
}

.filter-section {
  background-color: transparent;
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters-container {
  display: flex;
  align-items: flex-end;
  gap: 24px;
}

.search-container {
  min-width: 300px;
}

.search-input {
  background-color: white;
}

.search-input :deep(.q-field__control) {
  height: 40px;
}

.sort-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sort-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.sort-select {
  min-width: 150px;
  background-color: white;
}

.sort-select :deep(.q-field__control) {
  height: 40px;
}

.new-company-btn {
  height: 40px;
  padding: 0 16px;
  font-weight: 500;
  border-radius: 6px;
}

.table-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.companies-table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.table-header th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
  border-right: 1px solid #e9ecef;
}

.table-header th:last-child {
  border-right: none;
}

.table-row {
  border-bottom: 1px solid #e9ecef;
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: #f8f9fa;
}

.table-row td {
  padding: 16px;
  color: #495057;
  font-size: 14px;
  border-right: 1px solid #e9ecef;
}

.table-row td:last-child {
  border-right: none;
}

.company-name-cell {
  font-weight: 500;
  color: #212529;
}

.employees-cell,
.deals-cell {
  text-align: center;
}

.actions-container {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.action-btn {
  width: 32px;
  height: 32px;
}

.action-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #6c757d;
  padding: 8px 16px;
  z-index: 1000;
}

.footer-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
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
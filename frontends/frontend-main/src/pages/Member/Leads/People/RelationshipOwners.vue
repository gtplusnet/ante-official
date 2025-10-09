<template>
  <div class="relationship-owners-page">
    <!-- Header Section -->
    <div class="page-header">
      <div class="header-left">

        <div class="page-title text-h5 text-dark q-mt-sm">Relationship Owners</div>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="filter-section q-mt-lg">
      <div class="filter-row">
        <div class="filters-container">
          <div class="filter-item">
            <label class="filter-label">Filter By Branch</label>
            <q-select
              v-model="selectedBranch"
              :options="branchOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              outlined
              dense
              class="filter-select"
            />
          </div>
          <div class="filter-item">
            <label class="filter-label">Filter By Company</label>
            <q-select
              v-model="selectedCompany"
              :options="companyOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              outlined
              dense
              class="filter-select"
            />
          </div>
          <div class="filter-item">
            <label class="filter-label">Sort By</label>
            <q-select
              v-model="sortBy"
              :options="sortOptions"
              outlined
              dense
              class="filter-select"
            />
          </div>
        </div>
        <div class="action-button-container">
          <q-btn
            color="primary"
            unelevated
            no-caps
            icon="add"
            label="New Record"
            class="new-record-btn"
            @click="addNewRecord"
          />
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="table-container q-mt-lg">
      <div class="table-wrapper">
        <!-- Loading Skeleton -->
        <table v-if="loading" class="owners-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Branch</th>
              <th>Job Title</th>
              <th>Phone</th>
              <th>Date Created</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="n in 5" :key="`skeleton-${n}`">
              <td><q-skeleton type="text" /></td>
              <td><q-skeleton type="text" /></td>
              <td><q-skeleton type="text" /></td>
              <td><q-skeleton type="text" /></td>
              <td><q-skeleton type="text" /></td>
              <td><q-skeleton type="text" /></td>
              <td><q-skeleton type="text" /></td>
              <td class="actions-cell">
                <q-skeleton type="QBtn" />
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div v-else-if="ownersList.length === 0" class="text-center q-pa-lg">
          <q-icon name="people_alt" size="64px" color="grey-4" />
          <div class="q-mt-sm text-h6 text-grey-6">No relationship owners found</div>
          <div class="text-body-small text-grey-5 q-mt-xs">
            Click "New Record" to add relationship owners
          </div>
        </div>

        <!-- Actual Data Table -->
        <table v-else class="owners-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Branch</th>
              <th>Job Title</th>
              <th>Phone</th>
              <th>Date Created</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="owner in ownersList" 
              :key="owner.id"
              class="table-row"
            >
              <td class="name-cell">{{ owner.fullName }}</td>
              <td class="email-cell">{{ owner.email }}</td>
              <td class="branch-cell">{{ owner.branch }}</td>
              <td class="job-title-cell">{{ owner.jobTitle }}</td>
              <td class="phone-cell">{{ owner.phone }}</td>
              <td class="date-cell">{{ owner.dateCreated }}</td>
              <td class="created-by-cell">{{ owner.createdBy }}</td>
              <td class="actions-cell">
                <q-btn 
                  flat 
                  round 
                  dense 
                  size="sm" 
                  icon="more_vert" 
                  @click.stop
                  class="action-btn"
                >
                  <q-menu anchor="bottom right" self="top right" auto-close>
                    <div class="q-pa-sm">
                      <div clickable @click="deleteOwner(owner)" class="row q-pa-xs cursor-pointer">
                        <div><q-icon name="delete" color="grey" size="20px" /></div>
                        <div class="text-blue q-pa-xs text-label-medium">Archive</div>
                      </div>
                    </div>
                  </q-menu>
                </q-btn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination-section" v-if="ownersList.length > 0">
        <div class="pagination-info">
          <span class="text-body-small text-grey-7">
            {{ ownersList.length > 0 ? '1' : '0' }} - {{ ownersList.length }} of {{ totalCount }}
          </span>
        </div>
        <div class="pagination-controls">
          <q-btn
            flat
            round
            icon="chevron_left"
            size="sm"
            color="grey-6"
            disabled
          />
          <q-btn
            flat
            round
            icon="chevron_right"
            size="sm"
            color="grey-6"
            disabled
          />
        </div>
      </div>
    </div>

    <!-- Select Multiple Employee Dialog -->
    <ManpowerSelectMultipleEmployeeDialog
      v-model="isChooseUserDialogOpen"
      :selectMultipleEmployee="selectMultipleEmployee"
      @add-selected-employees="handleSelectedEmployees"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, getCurrentInstance, watch, defineAsyncComponent } from 'vue';
import { useQuasar, date } from 'quasar';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const ManpowerSelectMultipleEmployeeDialog = defineAsyncComponent(() =>
  import('src/pages/Member/Manpower/dialogs/configuration/ManpowerSelectMultipleEmployeeDialog.vue')
);

defineOptions({
  name: 'RelationshipOwners',
});

const $q = useQuasar();
const instance = getCurrentInstance();
const $api = instance?.appContext.config.globalProperties.$api;

// Dialog state management
const isChooseUserDialogOpen = ref(false);
const selectMultipleEmployee = ref({
  url: '/lead/employee/select-list'
});

// Loading state
const loading = ref(false);
const totalCount = ref(0);

// Filter options
const selectedBranch = ref('all'); // Backend returns 'all' for All Branches
const selectedCompany = ref('All');
const sortBy = ref('Date Created');

interface FilterOption {
  label: string;
  value: string | number;
}

const branchOptions = ref<FilterOption[]>([{ label: 'All', value: 'All' }]);
const companyOptions = ref<FilterOption[]>([{ label: 'All', value: 'All' }]);

const sortOptions = [
  'Date Created',
  'Name (A-Z)',
  'Name (Z-A)',
  'Job Title',
  'Branch',
  'Recent Activity'
];

// Type definitions
interface RelationshipOwner {
  id: number;
  fullName: string;
  email: string;
  branch: string;
  jobTitle: string;
  phone: string;
  dateCreated: string;
  createdBy: string;
  isActive: boolean;
}

// Relationship owners data
const ownersList = ref<RelationshipOwner[]>([]);


const fetchBranchOptions = async () => {
  if (!$api) return;
  
  try {
    const response = await $api.get('/select-box/branch-list');
    const list = response.data?.list || response.data || [];
    if (Array.isArray(list)) {
      const mappedBranches = list.map((branch: any) => ({
        label: branch.label || branch.name || branch,
        value: branch.key || branch.id || branch.label || branch.name || branch
      }));
      branchOptions.value = mappedBranches;
    }
  } catch (error) {
    console.error('Error fetching branch options:', error);
  }
};

const fetchCompanyOptions = async () => {
  if (!$api) return;
  
  try {
    const response = await $api.get('/select-box/company-list');
    const list = response.data?.list || response.data || [];
    if (Array.isArray(list)) {
      const mappedCompanies = list.map((company: any) => ({
        label: company.label || company.companyName || company.name || company,
        value: company.value || company.id || company.label || company.companyName || company.name || company
      }));
      companyOptions.value = [{ label: 'All', value: 'All' }, ...mappedCompanies];
    }
  } catch (error) {
    console.error('Error fetching company options:', error);
  }
};

const fetchRelationshipOwners = async () => {
  if (!$api) return;
  
  loading.value = true;
  try {
    const params = new URLSearchParams();
    
    // Add branch filter if not "All"
    if (selectedBranch.value && selectedBranch.value !== 'All' && selectedBranch.value !== 'all') {
      params.append('branch', selectedBranch.value.toString());
    }
    
    // Add company filter if not "All"
    if (selectedCompany.value && selectedCompany.value !== 'All' && selectedCompany.value !== 'all') {
      params.append('company', selectedCompany.value.toString());
    }
    
    // Only show active (non-archived) owners
    params.append('showArchived', 'false');
    
    const response = await $api.get(`/lead-relationship-owner/list?${params.toString()}`);
    
    // Format the dates for display
    ownersList.value = response.data.map((owner: any) => ({
      ...owner,
      dateCreated: date.formatDate(owner.dateCreated, 'MMM DD, YYYY')
    }));
    
    totalCount.value = response.data.length;
  } catch (error) {
    console.error('Error fetching relationship owners:', error);
    $q.notify({
      color: 'negative',
      message: 'Failed to load relationship owners',
      icon: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const addNewRecord = () => {
  isChooseUserDialogOpen.value = true;
};


const deleteOwner = async (owner: RelationshipOwner) => {
  if (!$api) return;
  
  $q.dialog({
    title: 'Archive Relationship Owner',
    message: `Are you sure you want to archive ${owner.fullName}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      loading.value = true;
      
      await $api.patch(`/lead-relationship-owner/${owner.id}/archive`);
      
      $q.notify({
        color: 'positive',
        message: 'Relationship owner archived successfully',
        icon: 'check_circle'
      });
      
      // Refresh the list
      await fetchRelationshipOwners();
    } catch (error) {
      console.error('Error archiving owner:', error);
      $q.notify({
        color: 'negative',
        message: 'Failed to archive relationship owner',
        icon: 'error'
      });
    } finally {
      loading.value = false;
    }
  });
};

const handleSelectedEmployees = async (selectedEmployeeIds: string[]) => {
  if (!$api) return;
  
  try {
    loading.value = true;
    
    const response = await $api.post('/lead-relationship-owner/multiple', {
      accountIds: selectedEmployeeIds
    });
    
    $q.notify({
      color: 'positive',
      message: `Successfully added ${response.data.count} relationship owner(s)`,
      icon: 'check_circle'
    });
    
    // Refresh the list
    await fetchRelationshipOwners();
    
    // Close the dialog
    isChooseUserDialogOpen.value = false;
  } catch (error) {
    console.error('Error adding relationship owners:', error);
    $q.notify({
      color: 'negative',
      message: 'Failed to add relationship owners',
      icon: 'error'
    });
  } finally {
    loading.value = false;
  }
};

// Load data when component mounts
onMounted(async () => {
  // Fetch all initial data in parallel
  await Promise.all([
    fetchBranchOptions(),
    fetchCompanyOptions(),
    fetchRelationshipOwners()
  ]);
});

// Watch for filter changes
watch([selectedBranch, selectedCompany], () => {
  fetchRelationshipOwners();
});
</script>

<style scoped>
.relationship-owners-page {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  background-color: transparent;
}

.header-left .welcome-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
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
  align-items: end;
  gap: 24px;
}

.filters-container {
  display: flex;
  gap: 24px;
  align-items: end;
}

.action-button-container {
  display: flex;
  align-items: end;
}

.new-record-btn {
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 6px;
  height: 38px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.filter-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.filter-select {
  width: 200px;
}

.filter-select :deep(.q-field__control) {
  height: 38px;
  background-color: white;
  border-radius: 4px;
}

.filter-select :deep(.q-field__native) {
  font-size: 13px;
  color: #333;
  padding: 0 12px;
}

.table-container {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
}

.table-wrapper {
  overflow-x: auto;
}

.owners-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
}

.owners-table thead {
  background-color: #fafafa;
  border-bottom: 1px solid #e0e0e0;
}

.owners-table th {
  padding: 16px 20px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #555;
  border-right: 1px solid #f0f0f0;
}

.owners-table th:last-child {
  border-right: none;
}

.table-row {
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: #f8f9fa;
}

.table-row:last-child {
  border-bottom: none;
}

.owners-table td {
  padding: 16px 20px;
  font-size: 13px;
  color: #333;
  border-right: 1px solid #f5f5f5;
}

.owners-table td:last-child {
  border-right: none;
}

.name-cell {
  font-weight: 500;
  color: #1a1a1a;
}

.email-cell {
  color: #666;
}

.branch-cell {
  color: #333;
  font-weight: 500;
}

.job-title-cell {
  color: #555;
}

.phone-cell {
  color: #666;
}

.date-cell {
  color: #666;
  font-size: 13px;
}

.created-by-cell {
  color: #555;
}

.actions-cell {
  text-align: center;
}

.action-btn {
  color: #666;
}

.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: white;
  border-top: 1px solid #f0f0f0;
}

.pagination-info {
  color: #666;
}

.pagination-controls {
  display: flex;
  gap: 4px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .relationship-owners-page {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filter-row {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .filters-container {
    flex-direction: column;
    gap: 16px;
  }
  
  .action-button-container {
    align-items: stretch;
  }
  
  .filter-item {
    min-width: auto;
  }
  
  .filter-select {
    width: 100%;
  }
  
  .owners-table {
    font-size: 12px;
  }
  
  .owners-table th,
  .owners-table td {
    padding: 12px 8px;
  }
}
</style>
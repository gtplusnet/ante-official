<template>
  <div class="point-of-contact-page">
    <!-- Header Section -->
    <div class="page-header">
      <div class="header-left">
        <div class="welcome-message">
          <q-icon name="star" color="primary" size="sm" />
          <span class="text-body-large text-grey-8">Welcome, {{ userName }}!</span>
        </div>
        <div class="page-title text-h5 text-dark q-mt-sm">Point Of Contact</div>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="filter-section q-mt-lg">
      <div class="filter-row">
        <div class="filters-container">
          <div class="filter-item">
            <label class="filter-label">Filter By Company</label>
            <q-select
              v-model="selectedCompany"
              :options="companyOptions"
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
        <!-- Loading State -->
        <div v-if="loading" class="text-center q-pa-lg">
          <q-spinner size="50px" color="primary" />
          <div class="q-mt-sm text-body-small text-grey-7">Loading point of contacts...</div>
        </div>
        
        <!-- Empty State -->
        <div v-else-if="contactsList.length === 0" class="text-center q-pa-lg">
          <q-icon name="contacts" size="64px" color="grey-4" />
          <div class="q-mt-sm text-h6 text-grey-6">No point of contacts found</div>
          <div class="text-body-small text-grey-5 q-mt-xs">
            Click "New Record" to add point of contacts
          </div>
        </div>
        
        <!-- Data Table -->
        <table v-else class="contact-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Job Title</th>
              <th>Phone</th>
              <th>Date Created</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="contact in contactsList" 
              :key="contact.id"
              class="table-row"
            >
              <td class="name-cell">{{ contact.fullName }}</td>
              <td class="email-cell">{{ contact.email }}</td>
              <td class="company-cell">{{ contact.company }}</td>
              <td class="job-title-cell">{{ contact.jobTitle }}</td>
              <td class="phone-cell">{{ contact.phone }}</td>
              <td class="date-cell">{{ contact.dateCreated }}</td>
              <td class="created-by-cell">{{ contact.createdBy }}</td>
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
                      <div clickable @click="editContact(contact)" class="row q-pa-xs cursor-pointer">
                        <div><q-icon name="edit" color="grey" size="20px" /></div>
                        <div class="text-blue q-pa-xs text-label-medium">Edit</div>
                      </div>
                      <div clickable @click="deleteContact(contact)" class="row q-pa-xs cursor-pointer">
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
      <div class="pagination-section" v-if="contactsList.length > 0">
        <div class="pagination-info">
          <span class="text-body-small text-grey-7">
            {{ contactsList.length > 0 ? '1' : '0' }} - {{ contactsList.length }} of {{ totalCount }}
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

    <!-- Add/Edit Point of Contact Dialog -->
    <AddEditPointOfContactDialog
      ref="addEditDialog"
      :contact-id="editingContactId"
      @created="handleContactCreated"
      @updated="handleContactUpdated"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, getCurrentInstance, watch, defineAsyncComponent } from 'vue';
import { useQuasar, date } from 'quasar';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditPointOfContactDialog = defineAsyncComponent(() =>
  import('./dialogs/AddEditPointOfContactDialog.vue')
);

defineOptions({
  name: 'PointOfContact',
});

const $q = useQuasar();
const instance = getCurrentInstance();
const $api = instance?.appContext.config.globalProperties.$api;

// Loading state
const loading = ref(false);
const totalCount = ref(0);

// User data
const userName = ref('Mark Figues');

// Filter options
const selectedCompany = ref('All');
const sortBy = ref('Date Created');

interface FilterOption {
  label: string;
  value: string | number;
}

interface PointOfContact {
  id: number;
  fullName: string;
  email: string;
  company: string;
  jobTitle: string;
  phone: string;
  dateCreated: string;
  createdBy: string;
  isActive: boolean;
}

const companyOptions = ref<FilterOption[]>([{ label: 'All', value: 'All' }]);

const sortOptions = [
  'Date Created',
  'Name (A-Z)',
  'Name (Z-A)',
  'Company',
  'Recent Activity'
];

// Point of contacts data
const contactsList = ref<PointOfContact[]>([]);

// Dialog reference and state
const addEditDialog = ref();
const editingContactId = ref<number | undefined>();

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

const fetchPointOfContacts = async () => {
  if (!$api) return;
  
  loading.value = true;
  try {
    const params = new URLSearchParams();
    
    // Add company filter if not "All"
    if (selectedCompany.value && selectedCompany.value !== 'All' && selectedCompany.value !== 'all') {
      params.append('companyId', selectedCompany.value.toString());
    }
    
    // Add sort parameter
    if (sortBy.value) {
      params.append('sortBy', sortBy.value);
    }
    
    // Only show active (non-archived) contacts
    params.append('showArchived', 'false');
    
    const response = await $api.get(`/point-of-contact/list?${params.toString()}`);
    
    // Format the dates for display
    contactsList.value = response.data.data.map((contact: any) => ({
      ...contact,
      dateCreated: date.formatDate(contact.dateCreated, 'MMM DD, YYYY')
    }));
    
    totalCount.value = response.data.pagination?.total || response.data.data.length;
  } catch (error) {
    console.error('Error fetching point of contacts:', error);
    $q.notify({
      color: 'negative',
      message: 'Failed to load point of contacts',
      icon: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const addNewRecord = () => {
  editingContactId.value = undefined;
  if (addEditDialog.value) {
    addEditDialog.value.show();
  }
};

const editContact = (contact: PointOfContact) => {
  editingContactId.value = contact.id;
  if (addEditDialog.value) {
    addEditDialog.value.show();
  }
};

const handleContactCreated = async () => {
  // Refresh the contact list to show the new contact
  await fetchPointOfContacts();
};

const handleContactUpdated = async () => {
  // Refresh the contact list to show the updated contact
  await fetchPointOfContacts();
};

const deleteContact = async (contact: PointOfContact) => {
  if (!$api) return;
  
  $q.dialog({
    title: 'Archive Point of Contact',
    message: `Are you sure you want to archive ${contact.fullName}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      loading.value = true;
      
      await $api.patch(`/point-of-contact/${contact.id}/archive`);
      
      $q.notify({
        color: 'positive',
        message: 'Point of contact archived successfully',
        icon: 'check_circle'
      });
      
      // Refresh the list
      await fetchPointOfContacts();
    } catch (error) {
      console.error('Error archiving contact:', error);
      $q.notify({
        color: 'negative',
        message: 'Failed to archive point of contact',
        icon: 'error'
      });
    } finally {
      loading.value = false;
    }
  });
};

// Load data when component mounts
onMounted(async () => {
  // Fetch all initial data in parallel
  await Promise.all([
    fetchCompanyOptions(),
    fetchPointOfContacts()
  ]);
});

// Watch for filter changes
watch([selectedCompany, sortBy], () => {
  fetchPointOfContacts();
});
</script>

<style scoped>
.point-of-contact-page {
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

.contact-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
}

.contact-table thead {
  background-color: #fafafa;
  border-bottom: 1px solid #e0e0e0;
}

.contact-table th {
  padding: 16px 20px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: #555;
  border-right: 1px solid #f0f0f0;
}

.contact-table th:last-child {
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

.contact-table td {
  padding: 16px 20px;
  font-size: 13px;
  color: #333;
  border-right: 1px solid #f5f5f5;
}

.contact-table td:last-child {
  border-right: none;
}

.name-cell {
  font-weight: 500;
  color: #1a1a1a;
}

.email-cell {
  color: #666;
}

.company-cell {
  color: #333;
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
  .point-of-contact-page {
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
  
  .contact-table {
    font-size: 12px;
  }
  
  .contact-table th,
  .contact-table td {
    padding: 12px 8px;
  }
}
</style>
<template>
  <div class="relationship-owners-page">
    <!-- Header Section -->
    <div class="row justify-between items-center">
      <div class="text-dark text-title-medium-f-[18px] col-2">
        Relationship Owners
      </div>

      <!-- Filter Section -->
      <div class="row items-center justify-end q-gutter-x-md col-10">
        <div class="col-4">
          <q-select v-model="selectedBranch" :options="branchOptions" option-label="label" option-value="value"
            emit-value map-options outlined rounded dense label="Select by Branch" />
        </div>
        <div class="col-4">
          <q-select v-model="sortBy" :options="sortOptions" rounded outlined dense label="Sort By" />
        </div>
        <g-button icon-size="md" icon="add" label="New Record" @click="addNewRecord" />
      </div>
    </div>

    <!-- Data Table -->
    <div class="table-container q-mt-lg">
      <!-- Loading Skeleton -->
      <table v-if="loading" class="owners-table">
        <thead>
          <tr>
            <th class="text-left">Full Name</th>
            <th class="text-left">Email</th>
            <th class="text-left">Branch</th>
            <th class="text-left">Job Title</th>
            <th class="text-left">Phone</th>
            <th class="text-left">Date Created</th>
            <th class="text-left">Created By</th>
            <th class="text-center">Actions</th>
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
            <td>
              <div class="actions-container">
                <q-skeleton type="QBtn" />
              </div>
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
            <th class="text-left">Full Name</th>
            <th class="text-left">Email</th>
            <th class="text-left">Branch</th>
            <th class="text-left">Job Title</th>
            <th class="text-left">Phone</th>
            <th class="text-left">Date Created</th>
            <th class="text-left">Created By</th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="owner in ownersList" :key="owner.id">
            <td>{{ owner.fullName }}</td>
            <td>{{ owner.email }}</td>
            <td>{{ owner.branch }}</td>
            <td>{{ owner.jobTitle }}</td>
            <td>{{ owner.phone }}</td>
            <td>{{ owner.dateCreated }}</td>
            <td>{{ owner.createdBy }}</td>
            <td>
              <div class="actions-container">
                <q-btn flat round dense size="sm" icon="o_delete" color="grey-6" @click="deleteOwner(owner)"
                  class="action-btn" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Select Multiple Account Dialog -->
    <SelectMultipleAccountDialog v-model="isChooseUserDialogOpen" :exclude-account-ids="existingOwnerAccountIds"
      @account-selected="handleSelectedAccounts" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, getCurrentInstance, watch, computed, defineAsyncComponent } from 'vue';
import { useQuasar, date } from 'quasar';
import GButton from 'src/components/shared/buttons/GButton.vue';

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const SelectMultipleAccountDialog = defineAsyncComponent(() =>
  import('src/pages/Member/Treasury/dialogs/SelectMultipleAccountDialog.vue')
);

defineOptions({
  name: 'RelationshipOwners',
});

const $q = useQuasar();
const instance = getCurrentInstance();
const $api = instance?.appContext.config.globalProperties.$api;

// Dialog state management
const isChooseUserDialogOpen = ref(false);

// Loading state
const loading = ref(false);

// Filter options
const selectedBranch = ref('all'); // Backend returns 'all' for All Branches
const sortBy = ref('Date Created');

interface FilterOption {
  label: string;
  value: string | number;
}

const branchOptions = ref<FilterOption[]>([{ label: 'All', value: 'All' }]);

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
  accountId: string;
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

// Computed property to extract existing owner account IDs for exclusion
const existingOwnerAccountIds = computed(() => {
  // Extract accountId from each owner to exclude them from selection dialog
  return ownersList.value
    .map((owner: RelationshipOwner) => owner.accountId?.toString() || '')
    .filter(Boolean);
});

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

const fetchRelationshipOwners = async () => {
  if (!$api) return;

  loading.value = true;
  try {
    const params = new URLSearchParams();

    // Add branch filter if not "All"
    if (selectedBranch.value && selectedBranch.value !== 'All' && selectedBranch.value !== 'all') {
      params.append('branch', selectedBranch.value.toString());
    }

    // Add sort parameter
    if (sortBy.value) {
      params.append('sortBy', sortBy.value);
    }

    // Only show active (non-archived) owners
    params.append('showArchived', 'false');

    const response = await $api.get(`/lead-relationship-owner/list?${params.toString()}`);

    // Format the dates for display
    ownersList.value = response.data.map((owner: any) => ({
      ...owner,
      dateCreated: date.formatDate(owner.dateCreated, 'MMM DD, YYYY')
    }));
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
    title: 'Delete Relationship Owner',
    message: `Are you sure you want to Delete ${owner.fullName}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      loading.value = true;

      await $api.patch(`/lead-relationship-owner/${owner.id}/archive`);

      $q.notify({
        color: 'positive',
        message: 'Relationship owner deleted successfully',
        icon: 'check_circle'
      });

      // Refresh the list
      await fetchRelationshipOwners();
    } catch (error) {
      console.error('Error deleting owner:', error);
      $q.notify({
        color: 'negative',
        message: 'Failed to delete relationship owner',
        icon: 'error'
      });
    } finally {
      loading.value = false;
    }
  });
};

const handleSelectedAccounts = async (selectedAccountIds: string[]) => {
  if (!$api) return;

  try {
    loading.value = true;

    const response = await $api.post('/lead-relationship-owner/multiple', {
      accountIds: selectedAccountIds
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
    fetchRelationshipOwners()
  ]);
});

// Watch for filter changes
watch([selectedBranch, sortBy], () => {
  fetchRelationshipOwners();
});
</script>

<style scoped>
.relationship-owners-page {
  background-color: #fff;
  border-radius: 24px;
  min-height: calc(100vh - 95px);
  padding: 24px;
}

.table-container {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  max-height: calc(100vh - 210px);
  overflow: auto;

  &::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #d9d9d9;
    border-radius: 50px;
  }

  &::-webkit-scrollbar-track {
    background-color: #f4f4f4;
    border-radius: 50px;
  }
}

.owners-table {
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

.actions-cell {
  text-align: center;
}

.actions-container {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.action-btn {
  color: #666;
}

/* Responsive Design */
@media (max-width: 768px) {
  .relationship-owners-page {
    padding: 16px;
  }
}
</style>
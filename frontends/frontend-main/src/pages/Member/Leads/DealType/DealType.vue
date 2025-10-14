<template>
  <div class="deal-type-page">
    <!-- Header Section -->
    <div class="row justify-between items-center">
      <div class="text-dark text-title-medium-f-[18px] col-2">
        Deal Types
      </div>
      <!-- Filter Section -->
      <div class="row items-center justify-end q-gutter-x-md col-10">
        <div class="col-4">
          <q-input v-model="searchQuery" outlined rounded dense placeholder="Search">
            <template v-slot:prepend>
              <q-icon name="search" color="grey-6" />
            </template>
          </q-input>
        </div>
        <GButton unelevated no-caps icon="add" icon-size="md" label="Add Deal Type" @click="addNewDealType" />
      </div>
    </div>

    <!-- Data Table -->
    <div class="table-container q-mt-lg">
      <!-- Loading Skeleton -->
      <table v-if="loading" class="deal-type-table">
        <thead>
          <tr class="table-header">
            <th class="text-left">Deal Type Name</th>
            <th class="text-left">Date Created</th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in 5" :key="`skeleton-${n}`">
            <td><q-skeleton type="text" /></td>
            <td><q-skeleton type="text" /></td>
            <td><q-skeleton type="text" /></td>
            <td>
              <div class="actions-container">
                <q-skeleton type="QBtn" />
                <q-skeleton type="QBtn" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-else-if="filteredDealTypes.length === 0" class="text-center q-pa-lg">
        <q-icon name="o_category" size="64px" color="grey-4" />
        <div class="q-mt-sm text-h6 text-grey-6">No deal types found</div>
        <div class="text-body-small text-grey-5 q-mt-xs">
          Click "Add Deal Type" to create new deal types
        </div>
      </div>

      <!-- Actual Data Table -->
      <table v-else class="deal-type-table">
        <thead>
          <tr class="table-header">
            <th class="text-left">Deal Type Name</th>
            <th class="text-left">Date Created</th>
            <th class="text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="dealType in filteredDealTypes" :key="dealType.id" class="table-row">
            <td>{{ dealType.typeName }}</td>
            <td>{{ formatLongDate(dealType.dateCreated) }}</td>
            <td>
              <div class="actions-container">
                <q-btn flat round dense size="sm" icon="o_edit" color="grey-6" @click="editDealType(dealType)"
                  class="action-btn" />
                <q-btn flat round dense size="sm" icon="o_delete" color="grey-6" @click="archiveDealType(dealType)"
                  class="action-btn" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Deal Type Dialog -->
    <AddEditDealTypeDialog
      v-model="isDialogOpen"
      :dealTypeData="editingDealType"
      @close="handleDialogClose"
      @created="handleDealTypeCreated"
      @updated="handleDealTypeUpdated"
    />
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  computed,
  onMounted,
  getCurrentInstance,
  defineAsyncComponent,
} from "vue";
import { useQuasar } from "quasar";
import GButton from "src/components/shared/buttons/GButton.vue";
import { formatLongDate } from "src/utility/formatter";

// Lazy-loaded dialogs (ALL dialogs must be lazy loaded - CLAUDE.md)
const AddEditDealTypeDialog = defineAsyncComponent(
  () => import("src/components/dialog/AddEditDealTypeDialog.vue")
);

defineOptions({
  name: "DealType",
});

const $q = useQuasar();
const instance = getCurrentInstance();
const $api = instance?.appContext.config.globalProperties.$api;

// Reactive data
const searchQuery = ref("");
const loading = ref(false);
const isDialogOpen = ref(false);
const editingDealType = ref<DealType | null>(null);

// DealType interface
interface DealType {
  id: number;
  typeName: string;
  dateCreated: string;
  createdBy: string;
}

const dealTypes = ref<DealType[]>([]);

// Fetch deal types from API
const fetchDealTypes = async () => {
  if (!$api) return;

  loading.value = true;
  try {
    const response = await $api.get("/deal-type");

    // Check for the wrapped response structure
    if (response.data && response.data.data) {
      dealTypes.value = response.data.data || [];
    } else {
      dealTypes.value = response.data || [];
    }
  } catch (error) {
    console.error("Error fetching deal types:", error);
    $q.notify({
      color: "negative",
      message: "Failed to load deal types",
      icon: "error",
    });
  } finally {
    loading.value = false;
  }
};

// Filter deal types based on search query
const filteredDealTypes = computed(() => {
  if (!searchQuery.value) {
    return dealTypes.value;
  }
  const query = searchQuery.value.toLowerCase();
  return dealTypes.value.filter((dealType) =>
    dealType.typeName.toLowerCase().includes(query)
  );
});

// Methods
const addNewDealType = () => {
  editingDealType.value = null;
  isDialogOpen.value = true;
};

const editDealType = (dealType: DealType) => {
  editingDealType.value = dealType;
  isDialogOpen.value = true;
};

const archiveDealType = async (dealType: DealType) => {
  if (!$api) return;

  $q.dialog({
    title: "Delete Deal Type",
    message: `Are you sure you want to delete "${dealType.typeName}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      loading.value = true;

      await $api.delete(`/deal-type/${dealType.id}`);

      $q.notify({
        color: "positive",
        message: "Deal type deleted successfully",
        icon: "check_circle",
      });

      // Refresh the list
      await fetchDealTypes();
    } catch (error) {
      console.error("Error deleting deal type:", error);
      $q.notify({
        color: "negative",
        message: "Failed to delete deal type",
        icon: "error",
      });
    } finally {
      loading.value = false;
    }
  });
};

const handleDialogClose = () => {
  isDialogOpen.value = false;
  editingDealType.value = null;
};

const handleDealTypeCreated = async () => {
  await fetchDealTypes();
  handleDialogClose();
};

const handleDealTypeUpdated = async () => {
  await fetchDealTypes();
  handleDialogClose();
};

// Load data when component mounts
onMounted(() => {
  fetchDealTypes();
});
</script>

<style scoped lang="scss">
.deal-type-page {
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

.deal-type-table {
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

  .deal-type-table {
    font-size: 12px;
  }

  .table-header th,
  .table-row td {
    padding: 12px 8px;
  }
}
</style>

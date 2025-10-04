<template>
  <GlobalWidgetCard>
    <!-- Title -->
    <template #title>Action Center</template>

    <!-- Actions -->
    <template #actions>
      <div class="row items-center q-gutter-sm">
        <div class="row items-center">
          <GButton 
            variant="text" 
            icon="search" 
            @click="toggleSearch" 
            class="q-mr-sm" 
            round 
            dense
          />
          <q-slide-transition>
            <q-input v-if="showSearch" v-model="searchQuery" dense outlined rounded placeholder="Search..." class="search-input q-mr-sm" @keyup.esc="showSearch = false">
              <template v-slot:append>
                <GButton 
                  variant="text" 
                  icon="close" 
                  @click="clearSearch" 
                  class="cursor-pointer" 
                  dense
                />
              </template>
            </q-input>
          </q-slide-transition>
        </div>
        <global-widget-filtering :options="filterOptions" :model-value="filter" @update:model-value="filter = $event; handleFilterChange()" />
      </div>
    </template>

    <!-- Content -->
    <template #content>
      <div class="table-wrapper">
        <div v-if="loading" class="row justify-center q-pa-lg">
          <q-spinner color="primary" size="3em" />
        </div>
        <div v-else-if="filteredData.length === 0" class="text-center q-pa-lg text-grey">
          No action items found
        </div>
        <table v-else class="action-table">
          <thead>
            <tr>
              <th class="text-left">Employees</th>
              <th class="text-left">Description</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredData" :key="row.id">
              <td>
                <div class="column">
                  <span class="text-dark text-label-large text-capitalize">{{ row.employee }}</span>
                  <span class="text-grey text-body-medium">{{ row.employeeId }}</span>
                </div>
              </td>
              <td>
                <div class="text-body-medium text-grey">{{ row.description }}</div>
              </td>
              <td>
                <div class="action-buttons">
                  <GButton 
                    label="Resolve" 
                    @click.stop.prevent="handleResolve(row)" 
                    :loading="resolveLoading" 
                    type="button"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Footer -->
    <template #footer>
      <global-widget-pagination
        :pagination="{
          currentPage: currentPage,
          totalItems: totalItems,
          itemsPerPage: pageSize,
        }"
        @update:page="handlePageChange"
      />
    </template>
  </GlobalWidgetCard>

  <!-- Employee Edit Dialog -->
  <EditCreateEmployee 
    v-model="showEditEmployeeDialog"
    :employee-id="selectedEmployeeData?.data?.accountDetails?.id"
    :initial-tab="initialTabForDialog"
    @save-done="handleEmployeeSaved"
    @close="showEditEmployeeDialog = false"
  />
  
  <!-- Activation Dialog (Create Employee) -->
  <ManpowerAddEditHRISEmployeeDialog
    ref="activationDialog"
    :isActivation="true"
    @employee-saved="handleEmployeeActivated"
  />
</template>

<script lang="ts">
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import GlobalWidgetCard from 'src/components/shared/global/GlobalWidgetCard.vue';
import GlobalWidgetPagination from 'src/components/shared/global/GlobalWidgetPagination.vue';
import { defineAsyncComponent } from 'vue';
import GlobalWidgetFiltering from 'src/components/shared/global/GlobalWidgetFiltering.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';
import actionCenterService from 'src/services/action-center.service';
import type { ActionCenterItem } from 'src/services/action-center.service';
import EditCreateEmployee from 'src/pages/Member/Manpower/HRIS/Tab/dialog/EditCreateEmployee.vue';

// Lazy-loaded heavy dialog (TASK-008: Extended - Reduce initial bundle)
const ManpowerAddEditHRISEmployeeDialog = defineAsyncComponent(() =>
  import('src/pages/Member/Manpower/dialogs/hris/ManpowerAddEditHRISEmployeeDialog.vue')
);

export default {
  name: 'ManpowerActionCenter',
  components: {
    GlobalWidgetCard,
    GlobalWidgetFiltering,
    GlobalWidgetPagination,
    EditCreateEmployee,
    GButton,
    ManpowerAddEditHRISEmployeeDialog,
  },
  setup() {
    const $q = useQuasar();
    const showSearch = ref(false);
    const searchQuery = ref('');
    const filter = ref('All');
    const filterOptions = ['All', 'Resolved'];
    const loading = ref(false);
    const resolveLoading = ref(false);
    const data = ref<ActionCenterItem[]>([]);
    const totalItems = ref(0);
    const showEditEmployeeDialog = ref(false);
    const selectedEmployeeData = ref<any>(null);
    const activationDialog = ref<any>(null);
    const initialTabForDialog = ref('employee_Details');
    
    // Debug: watch dialog state
    watch(showEditEmployeeDialog, (newVal) => {
      console.log('showEditEmployeeDialog changed to:', newVal);
    });

    const currentPage = ref(1);
    const pageSize = 6;

    const fetchData = async () => {
      loading.value = true;
      try {
        const params: any = {
          page: currentPage.value,
          limit: pageSize,
        };

        if (searchQuery.value) {
          params.search = searchQuery.value;
        }

        if (filter.value === 'Resolved') {
          params.resolved = true;
        } else {
          // 'All' - show only unresolved items
          params.resolved = false;
        }

        const response = await actionCenterService.getItems(params);
        data.value = response.data;
        totalItems.value = response.total;
      } catch (error) {
        console.error('Failed to fetch action center items:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load action center items',
        });
      } finally {
        loading.value = false;
      }
    };

    const filteredData = computed(() => {
      return data.value.map(item => ({
        id: item.id,
        accountId: item.accountId,
        employee: item.employeeName,
        employeeId: item.employeeCode || 'N/A',
        description: item.description,
        priority: item.priority,
        checkType: item.checkType,
        issueType: item.issueType,
        metadata: item.metadata,
      }));
    });

    const toggleSearch = () => {
      showSearch.value = !showSearch.value;
      if (!showSearch.value) {
        searchQuery.value = '';
        fetchData();
      }
    };

    const clearSearch = () => {
      searchQuery.value = '';
      showSearch.value = false;
      fetchData();
    };

    const handlePageChange = (newPage: number) => {
      currentPage.value = newPage;
      fetchData();
    };


    const handleResolve = async (row: any) => {
      try {
        resolveLoading.value = true;
        
        // Check if this is a "no employee data" issue
        if (row.issueType === 'NO_EMPLOYEE_DATA') {
          // Show the activation dialog
          if (activationDialog.value) {
            activationDialog.value.show();
            
            // Wait for the dialog to be ready and then set the account data
            nextTick(async () => {
              const dialog = activationDialog.value;
              if (dialog && dialog.setAccountData) {
                try {
                  // Fetch account data first
                  const response = await api.get('/hris/employee/info', {
                    params: { accountId: row.accountId }
                  });
                  dialog.setAccountData(response.data || { accountDetails: { id: row.accountId } });
                } catch (err) {
                  // If no employee data found (which is expected), just pass the account ID
                  dialog.setAccountData({ accountDetails: { id: row.accountId } });
                }
              }
            });
          }
        } else {
          // Get the account ID from the action item
          const accountId = row.accountId;
          
          // Fetch complete employee information
          const response = await api.get('/hris/employee/info', {
            params: { accountId: accountId }
          });
          
          if (response.data) {
            // Format data for the EditCreateEmployee dialog
            selectedEmployeeData.value = {
              data: response.data
            };
            // Set initial tab to contract details when opening from Resolve button
            initialTabForDialog.value = 'contract_Datails';
            showEditEmployeeDialog.value = true;
          } else {
            $q.notify({
              type: 'negative',
              message: 'Employee information not found',
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch employee information:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load employee information',
        });
      } finally {
        resolveLoading.value = false;
      }
    };

    // Watch for filter changes
    const handleFilterChange = () => {
      currentPage.value = 1;
      fetchData();
    };

    // Priority helpers
    const getPriorityLabel = (priority: number): string => {
      return actionCenterService.getPriorityLabel(priority);
    };

    const getPriorityColor = (priority: number): string => {
      return actionCenterService.getPriorityColor(priority);
    };

    // Handle employee dialog save
    const handleEmployeeSaved = async () => {
      showEditEmployeeDialog.value = false;
      // Find and resolve the action item for this account
      const accountId = selectedEmployeeData.value?.data?.accountDetails?.id;
      const actionItem = data.value.find(item => item.accountId === accountId);
      if (actionItem) {
        try {
          await actionCenterService.resolveItem(actionItem.id);
          $q.notify({
            type: 'positive',
            message: 'Employee updated and action item resolved successfully',
          });
          await fetchData();
        } catch (error) {
          console.error('Failed to resolve action item:', error);
          $q.notify({
            type: 'negative',
            message: 'Employee updated but failed to resolve action item',
          });
        }
      }
    };
    
    // Handle employee activation
    const handleEmployeeActivated = async () => {
      // Refresh the table after successful activation
      await fetchData();
      $q.notify({
        type: 'positive',
        message: 'Employee activated successfully!',
      });
    };

    // Load data on mount
    onMounted(() => {
      fetchData();
    });
    
    onUnmounted(() => {
    });

    return {
      showSearch,
      searchQuery,
      filter,
      filterOptions,
      currentPage,
      pageSize,
      filteredData,
      totalItems,
      loading,
      resolveLoading,
      toggleSearch,
      clearSearch,
      handlePageChange,
      handleResolve,
      handleFilterChange,
      fetchData,
      getPriorityLabel,
      getPriorityColor,
      showEditEmployeeDialog,
      selectedEmployeeData,
      handleEmployeeSaved,
      activationDialog,
      handleEmployeeActivated,
      initialTabForDialog,
    };
  },
};
</script>

<style scoped lang="scss">
.action-controls {
  display: flex;
  align-items: center;
}

.search-input {
  width: 200px;
  transition: all 0.3s ease;
}

.table-wrapper {
  min-height: calc(500px - 79px);
}

.action-table {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;

  thead {
    tr {
      th {
        font-weight: 500;
        color: var(--q-text-dark);
        border-bottom: 1px solid #e0e0e0;
        padding: 12px 10px;
        text-align: left;

        &.text-center {
          text-align: center;
        }
      }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid #f0f0f0;

      td {
        padding: 10px;
      }
    }
  }
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.text-capitalize {
  text-transform: capitalize;
}
</style>

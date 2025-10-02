<template>
  <GlobalWidgetCard>
    <!-- Title -->
    <template #title>Attendance Conflicts</template>
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
        <global-widget-date-picker 
          v-model="startDate" 
          label="From" 
          class="q-mr-sm" 
        />
        <global-widget-date-picker 
          v-model="endDate" 
          label="To" 
        />
      </div>
    </template>

    <!-- Content -->
    <template #content>
      <div class="table-wrapper">
        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <q-spinner-dots size="40px" color="primary" />
          <div class="q-mt-sm text-grey">Loading attendance conflicts...</div>
        </div>

        <!-- No Data State -->
        <div v-else-if="filteredData.length === 0" class="no-data-container">
          <q-icon name="check_circle" size="48px" color="positive" />
          <div class="q-mt-sm text-grey">No attendance conflicts found</div>
          <div class="text-caption text-grey">All employees have proper attendance records</div>
        </div>

        <!-- Data Table -->
        <table v-else class="conflicts-table">
          <thead>
            <tr>
              <th class="text-left">Employee</th>
              <th class="text-left">Date</th>
              <th class="text-left">Description</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredData" :key="row.id">
              <td>
                <div class="column">
                  <span class="text-dark text-label-large">{{ row.employee }}</span>
                </div>
              </td>
              <td>
                <div class="text-body-medium text-grey">{{ formatConflictDate(row.conflictDate) }}</div>
              </td>
              <td>
                <div class="conflict-description">
                  <div class="text-body-medium text-grey">{{ row.description }}</div>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <GButton 
                    variant="outline"
                    label="Ignore" 
                    color="primary" 
                    @click="handleIgnore(row)"
                    :loading="loading"
                    class="q-mr-sm"
                  />
                  <GButton 
                    v-if="isCurrentUserEmployee(row.accountId)"
                    label="Resolve" 
                    color="primary" 
                    @click="handleResolve(row)"
                    :loading="loading"
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
</template>

<script lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import GlobalWidgetCard from 'src/components/shared/global/GlobalWidgetCard.vue';
import GlobalWidgetPagination from 'src/components/shared/global/GlobalWidgetPagination.vue';
import GlobalWidgetDatePicker from 'src/components/shared/global/GlobalWidgetDatePicker.vue';
import GButton from 'src/components/shared/buttons/GButton.vue';
import { useTimekeepingStore } from 'src/stores/timekeeping.store';
import { useAuthStore } from 'src/stores/auth';
import { 
  AttendanceConflictsService, 
  type AttendanceConflict,
  type AttendanceConflictFilters,
  AttendanceConflictAction
} from 'src/services/attendance-conflicts.service';
import { Notify, Dialog } from 'quasar';
import { date } from 'quasar';

interface ConflictItem {
  id: number;
  employee: string;
  employeeId: string;
  description: string;
  type: 'MISSING_LOG' | 'MISSING_TIME_OUT';
  severity: string;
  isResolved: boolean;
  conflictDate: string;
  accountId: string;
}

export default {
  name: 'ManpowerAttendanceConflicts',
  components: {
    GlobalWidgetCard,
    GlobalWidgetPagination,
    GlobalWidgetDatePicker,
    GButton,
  },
  setup() {
    const showSearch = ref(false);
    const searchQuery = ref('');
    const timekeepingStore = useTimekeepingStore();
    const authStore = useAuthStore();
    const startDate = ref<string>('');
    const endDate = ref<string>('');
    const loading = ref(false);
    const conflicts = ref<AttendanceConflict[]>([]);
    const totalConflicts = ref(0);
    const lastPage = ref(1);

    // Transform API data to UI format
    const transformConflictData = (conflict: AttendanceConflict): ConflictItem => {
      // Capitalize first letter of each name part
      const capitalizeFirstLetter = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      };
      
      const firstName = capitalizeFirstLetter(conflict.account.firstName || '');
      const lastName = capitalizeFirstLetter(conflict.account.lastName || '');
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Handle both array and single object response for EmployeeData
      const employeeData = Array.isArray(conflict.account.EmployeeData) 
        ? conflict.account.EmployeeData[0] 
        : conflict.account.EmployeeData;
      const employeeCode = employeeData?.employeeCode || conflict.account.email || 'N/A';
      
      // Simplify description for missing timekeeping
      let description = conflict.description;
      if (description.includes('No timekeeping record found')) {
        description = 'No Timekeeping';
      }
      
      return {
        id: conflict.id,
        employee: fullName,
        employeeId: employeeCode,
        description: description,
        type: conflict.conflictType,
        severity: conflict.conflictType === 'MISSING_LOG' ? 'Critical' : 'Warning',
        isResolved: conflict.isResolved,
        conflictDate: conflict.dateString,
        accountId: conflict.accountId,
      };
    };

    const data = computed(() => 
      conflicts.value.map(transformConflictData)
    );

    // Computed property to get date range bounds from current cutoff periods only
    const dateRangeBounds = computed(() => {
      const allPeriods = timekeepingStore.timekeepingDateRange;
      
      // Filter to get only current periods
      const currentPeriods = allPeriods.filter(period => period.dateRangeStatus === 'Current');
      
      if (!currentPeriods || currentPeriods.length === 0) {
        return { earliest: '', latest: '' };
      }

      // Find earliest start date among current periods
      let earliestDate = currentPeriods[0].startDate?.dateStandard || '';
      let latestDate = currentPeriods[0].endDate?.dateStandard || '';

      currentPeriods.forEach(period => {
        if (period.startDate?.dateStandard && period.startDate.dateStandard < earliestDate) {
          earliestDate = period.startDate.dateStandard;
        }
        if (period.endDate?.dateStandard && period.endDate.dateStandard > latestDate) {
          latestDate = period.endDate.dateStandard;
        }
      });

      return { earliest: earliestDate, latest: latestDate };
    });

    const columns = [
      {
        name: 'employee',
        label: 'Employee',
        align: 'left' as const,
        field: 'employee',
        sortable: true,
      },
      {
        name: 'description',
        label: 'Description',
        align: 'left' as const,
        field: 'description',
        sortable: true,
      },
      {
        name: 'actions',
        label: 'Actions',
        align: 'center' as const,
        field: 'actions',
      },
    ];

    const currentPage = ref(1);
    const pageSize = 6;

    // Load conflicts from API
    const loadConflicts = async () => {
      try {
        loading.value = true;
        
        const filters: AttendanceConflictFilters = {
          page: currentPage.value,
          limit: pageSize,
          isResolved: false, // Only show unresolved conflicts
        };

        if (startDate.value) {
          filters.dateFrom = startDate.value;
        }
        if (endDate.value) {
          filters.dateTo = endDate.value;
        }

        const response = await AttendanceConflictsService.getConflicts(filters);
        
        conflicts.value = response.data;
        totalConflicts.value = response.total;
        lastPage.value = response.lastPage;
        
        // Debug logging to check employee data structure
        if (conflicts.value.length > 0) {
          console.log('First conflict data:', conflicts.value[0]);
          console.log('Account data:', conflicts.value[0].account);
          console.log('EmployeeData:', conflicts.value[0].account.EmployeeData);
        }
      } catch (error) {
        console.error('Failed to load attendance conflicts:', error);
        Notify.create({
          type: 'negative',
          message: 'Failed to load attendance conflicts',
          position: 'top',
        });
      } finally {
        loading.value = false;
      }
    };

    const getConflictIcon = (type: string) => 
      AttendanceConflictsService.getConflictTypeIcon(type);

    const getConflictColor = (type: string) => 
      AttendanceConflictsService.getConflictTypeColor(type);

    const filteredData = computed(() => {
      let filtered = data.value;

      // Apply search filter
      if (searchQuery.value) {
        filtered = filtered.filter(
          (item) => item.employee.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                   item.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                   item.employeeId.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
      }

      return filtered;
    });

    const totalItems = computed(() => {
      // If searching, use filtered data count, otherwise use API total
      if (searchQuery.value) {
        return filteredData.value.length;
      }
      return totalConflicts.value;
    });

    const toggleSearch = () => {
      showSearch.value = !showSearch.value;
      if (!showSearch.value) {
        searchQuery.value = '';
      }
    };

    const clearSearch = () => {
      searchQuery.value = '';
      showSearch.value = false;
    };

    const handlePageChange = (newPage: number) => {
      currentPage.value = newPage;
      if (!searchQuery.value) {
        loadConflicts(); // Reload data for new page if not searching
      }
    };

    const isCurrentUserEmployee = (accountId: string): boolean => {
      return authStore.accountInformation?.id === accountId;
    };

    const handleIgnore = async (row: ConflictItem) => {
      // Show material design confirmation dialog
      Dialog.create({
        title: 'Ignore Conflict?',
        message: `This will permanently hide the conflict for ${row.employee} from your view. Other users will still see this conflict.`,
        persistent: true,
        color: 'primary',
        ok: {
          label: 'Ignore',
          color: 'primary',
          unelevated: true,
          rounded: true,
        },
        cancel: {
          label: 'Cancel',
          color: 'primary',
          flat: true,
          rounded: true,
        },
        class: 'q-dialog--material',
      }).onOk(async () => {
        try {
          loading.value = true;
          
          // Use the new ignore API
          await AttendanceConflictsService.ignoreConflict(row.id, AttendanceConflictAction.IGNORED);
          
          // Optimistically remove from UI
          const index = conflicts.value.findIndex(c => c.id === row.id);
          if (index > -1) {
            conflicts.value.splice(index, 1);
            totalConflicts.value--;
          }
          
          Notify.create({
            type: 'positive',
            message: `Conflict ignored for ${row.employee}`,
            position: 'top',
          });
          
          // Reload conflicts to ensure consistency
          await loadConflicts();
        } catch (error) {
          console.error('Failed to ignore conflict:', error);
          Notify.create({
            type: 'negative',
            message: 'Failed to ignore conflict',
            position: 'top',
          });
          // Reload on error to restore correct state
          await loadConflicts();
        } finally {
          loading.value = false;
        }
      });
    };

    const handleResolve = async (row: ConflictItem) => {
      try {
        loading.value = true;
        
        // Use the new ignore API with RESOLVED action
        await AttendanceConflictsService.ignoreConflict(row.id, AttendanceConflictAction.RESOLVED);
        
        // Optimistically remove from UI
        const index = conflicts.value.findIndex(c => c.id === row.id);
        if (index > -1) {
          conflicts.value.splice(index, 1);
          totalConflicts.value--;
        }
        
        Notify.create({
          type: 'positive',
          message: 'Conflict resolved successfully',
          position: 'top',
        });
        
        // Reload conflicts to ensure consistency
        await loadConflicts();
      } catch (error) {
        console.error('Failed to resolve conflict:', error);
        Notify.create({
          type: 'negative',
          message: 'Failed to resolve conflict',
          position: 'top',
        });
        // Reload on error to restore correct state
        await loadConflicts();
      } finally {
        loading.value = false;
      }
    };


    // Watch for date changes to reload conflicts
    watch([startDate, endDate], () => {
      currentPage.value = 1; // Reset to first page
      loadConflicts();
    });

    // Watch for search query changes
    watch(searchQuery, () => {
      // When searching, we don't need to call API since we filter locally
      // Reset to first page when searching
      currentPage.value = 1;
    });

    // Load payroll periods on mount
    onMounted(async () => {
      if (!timekeepingStore.isTimekeepingDateRangeLoaded) {
        await timekeepingStore.loadTimekeepingDateRange();
      }
      
      // Set default date range
      if (dateRangeBounds.value.earliest) {
        startDate.value = dateRangeBounds.value.earliest;
      }
      
      // Set end date to yesterday (using local date)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      endDate.value = date.formatDate(yesterday, 'YYYY-MM-DD');
      
      // Load initial conflicts
      await loadConflicts();
    });

    const formatConflictDate = (dateString: string): string => {
      return date.formatDate(dateString, 'MMM DD, YYYY');
    };

    return {
      showSearch,
      searchQuery,
      startDate,
      endDate,
      columns,
      currentPage,
      pageSize,
      filteredData,
      totalItems,
      loading,
      getConflictIcon,
      getConflictColor,
      toggleSearch,
      clearSearch,
      handlePageChange,
      handleIgnore,
      handleResolve,
      isCurrentUserEmployee,
      loadConflicts,
      AttendanceConflictsService,
      formatConflictDate,
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

  .loading-container,
  .no-data-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    text-align: center;
  }

  .conflicts-table {
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
          vertical-align: middle;
        }
      }
    }
  }
}

.conflict-description {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.conflict-type {
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}
</style>
